const express = require('express');
const mysql = require('mysql');
const uuid = require('uuid/v1');
const dayjs = require('dayjs');
const qr = require('qr-image');
const { DEADLINE_TIME, INVALIDATION_TIME } = require('./config');

const router = express.Router();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'booking'
});

connection.connect();

router.get('/', function (req, res) {
    res.send('this is router')
});

/*
* POST 登陆API
* */
router.post('/login', function (req, res) {
    const {userNum, password} = req.body;
    connection.query(`select * from t_users where num = ? and password = ?`, [userNum, password], function (err, data) {
        if (err) { res.status(500) }
        if (data && data.length) {
          res.json(data[0]);
        } else {
          res.send('');
        }
    })
});

/*
* GET  获取车票列表
* */
router.get('/carList', function (req, res) {
  const { date } = req.query;
  // 订票截止时间 （发车前10分钟）
  const deadlineTime = dayjs().isBefore(dayjs(date))
    ? '00:00:00'
    : dayjs().add(DEADLINE_TIME, 'minute').format('HH:mm:ss');
  connection.query(`select * from t_ticket where depart_date = ? and depart_time > ? order by depart_time`,
    [date, deadlineTime], function (err, data) {
    if (err) { res.status(500) }
    if (data && data.length) {
      for (const item of data){
        // 处理班车日期和时间的格式
        item.depart_time = item.depart_time.slice(0, 5);
        item.depart_date = new Date(item.depart_date).toLocaleDateString();
      }
      res.json(data);
    } else {
      res.send(null);
    }
  })
});

/*
* POST 订票/预留票接口
* */
router.post('/booking', function (req, res) {
  const { id, num, userId } = req.body;
  const authCode = req.get('auth-code');
  connection.beginTransaction(function (err) {
    if (err) { res.status(500) }
    const bookingTicket = () => {
      // 减少数据库中的剩余票数
      connection.query(`update t_ticket set rest_ticket = rest_ticket - ? where id = ?`,
        [num, id], function (err, data) {
          if (err) {
            connection.rollback(function () {
              res.status(500);
            })
          }
          if (data) {
            // 在订单表中新增订单记录
            const orderId = uuid();
            connection.query(`insert into t_order (id, user_id, car_id, order_time, ticket_num, order_status) values(?,?,?,?,?,?)`,
              [orderId, userId, id, new Date(), num, 0], function (err, insertData) {
                if (err) {
                  connection.rollback(function () {
                    res.status(500);
                  })
                }
                if (insertData) {
                  connection.commit(function (e) {
                    if (e) {
                      connection.rollback(function (err) {
                        res.status(500);
                      })
                    }
                    res.send(orderId);
                  })
                }
              });
          }
        })
    };
    if (authCode === '3') {
      // 管理员预留票
      bookingTicket();
    } else {
      // 查询订票合法性（是否已订过此班次）
      connection.query(`SELECT * FROM t_order WHERE user_id = ? AND car_id = ? AND order_status = 0`,
        [userId, id], function (err, data) {
          if (err) { res.status(500) }
          data.length ? res.send('') : bookingTicket();
        })
    }
  });
});

/*
* GET 获取订票二维码
* */
router.get('/qr/:id', function (req, res) {
  const orderId = req.params.id;
  var qrCode = qr.image('https://www.baidu.com');
  res.setHeader('Content-type', 'image/png');  //sent qr image to client side
  qrCode.pipe(res);
});

/*
* GET 获取指定用户的订单
* */
router.get('/order/list/:userId', function (req, res) {
  const userId = req.params.userId;
  const { type } = req.query;
  // 更新 待出行 订单的状态（是否过期）
  const date = dayjs().format('YYYY-MM-DD');
  const time = dayjs().add(INVALIDATION_TIME, 'minute').format('HH:mm:ss');
  const updateStatusSql = `UPDATE t_order SET order_status = 3 WHERE id IN (SELECT tmp.id FROM (SELECT o.id AS id FROM t_ticket t INNER JOIN t_order o ON o.car_id = t.id WHERE user_id = ? AND order_status = 0 AND t.depart_date < ? OR user_id = ? AND order_status = 0 AND t.depart_date = ? AND t.depart_time < ?)tmp)`;
  connection.query(updateStatusSql, [userId, date, userId, date, time], () => {});

  // 获取用户的订单列表
  const sql = type ? `SELECT * FROM t_ticket t INNER JOIN t_order o ON o.car_id = t.id WHERE user_id = ? AND order_status = ? ORDER BY order_time DESC` :
    `SELECT * FROM t_ticket t INNER JOIN t_order o ON o.car_id = t.id WHERE user_id = ? ORDER BY order_time DESC`;
  const paramsArr = type ? [userId, +type] : [userId];
  connection.query(sql, paramsArr, function (err, data) {
    if (err) res.status(500);
    for (const item of data){
      // 处理班车日期和时间的格式
      item.depart_time = item.depart_time.slice(0, 5);
      item.depart_date = new Date(item.depart_date).toLocaleDateString();
      item.order_time = new Date(item.order_time).toLocaleDateString() + ' ' + new Date(item.order_time).toTimeString().slice(0,5);
    }
    res.json(data);
  })
});

/*
* POST 退票接口
* */
router.post('/order/return', function (req, res) {
  const { orderId } = req.body;
  connection.query(`SELECT car_id, ticket_num FROM t_order WHERE id = ?`, [orderId], function (err, data1) {
    if (err) res.status(500);
    if (data1) {
      const { car_id, ticket_num } = data1[0];
      connection.query(`UPDATE t_order SET order_status = 2 WHERE id = ?`, [orderId], function (err, data2) {
        if (err) res.status(500);
        if (data2) {
          connection.query(`UPDATE t_ticket SET rest_ticket = rest_ticket + ? WHERE id = ?`,
            [ticket_num, car_id], function (err, data3) {
              if (err) res.status(500);
              if (data3) res.json(data3);
            });
        }
      })
    }
  });
});

/**
 * POST 更改密码接口
 */
router.post('/modify/password/:userId', function (req, res) {
  const userId = req.params.userId;
  const { originPassword, newPassword } = req.body;
  connection.query(`select * from t_users where id = ? and password = ?`,
    [userId, originPassword], function (err, data) {
      if (err) res.status(500);
      if (!data.length){
        // 原密码错误
        res.json('')
      } else {
        connection.query(`UPDATE t_users SET password = ? WHERE id = ?`,
          [newPassword, userId], function (err, data) {
            if (err) res.status(500);
            res.json('success');
          })
      }
    })
});

module.exports = router;
