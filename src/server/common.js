const dayjs = require('dayjs');
const { INVALID_INTEGRAL, INVALIDATION_TIME } = require('./config');

// 更新 订单状态 和 积分
exports.updateIntegral = (connection, userId, res) => {
  return new Promise((resolve, reject) => {
    const date = dayjs().format('YYYY-MM-DD');
    const time = dayjs().subtract(INVALIDATION_TIME, 'minute').format('HH:mm:ss');
    const invalidOrderNumSql = `SELECT COUNT(o.id) AS invalidNum FROM t_ticket t INNER JOIN t_order o ON o.car_id = t.id WHERE user_id = ? AND order_status = 0 AND t.depart_date < ? OR user_id = ? AND order_status = 0 AND t.depart_date = ? AND t.depart_time < ?`;
    // 获取 积分
    connection.query(`SELECT integral FROM t_users WHERE id = ?`, [userId], (err, data) => {
      if (err) {res.status(500); reject();}
      if (data.length){
        const { integral } = data[0];
        connection.query(invalidOrderNumSql, [userId, date, userId, date, time], (err, data) => {
          if (err) {
            res.status(500);
            reject();
          }
          let invalidNum = 0;
          if (data.length && data[0].invalidNum) invalidNum = data[0].invalidNum;
          const punishIntegral = invalidNum * INVALID_INTEGRAL;
          if (punishIntegral >= integral) {
            connection.query(`UPDATE t_users SET integral = 0 WHERE id = ?`, [userId], (err) => {
              if (err) res.status(500);
              reject(true);
            });
          } else {
            connection.query(`UPDATE t_users SET integral = integral - ? WHERE id = ?`, [punishIntegral, userId], err => {
              if (err) res.status(500);
              resolve(integral - punishIntegral);
            })
          }
        })
      }
    })
  });
};
