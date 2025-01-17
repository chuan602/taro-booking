const express = require('express');
const mysql = require('mysql');
const uuid = require('uuid/v1');
const dayjs = require('dayjs');
const qr = require('qr-image');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const schedule = require('node-schedule');
const { SocketMap } = require('./config');
const { updateIntegral } = require('./common');

let DEADLINE = 10;
let FULL = 10;
let DELAY = 10;
let ADVANCE = 30;
let PUNISH = 4;

const router = express.Router();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123',
    database: 'booking'
});

connection.connect();

// 定时任务 （新年第一天积分还原）
schedule.scheduleJob('0 0 0 1 1 *', () => {
  connection.query('UPDATE t_users SET integral = ?', [FULL])
});

router.get('/', function (req, res) {

  res.render('index');
});

/*
* POST 登陆API
* */
router.post('/login', function (req, res) {
    function updateStatus(id) {
      return new Promise((resolve, reject) => {
        const updateStatusSql = `UPDATE t_order SET order_status = 3 WHERE id IN (SELECT tmp.id FROM (SELECT o.id AS id FROM t_ticket t INNER JOIN t_order o ON o.car_id = t.id WHERE user_id = ? AND order_status = 0 AND t.depart_date < ? OR user_id = ? AND order_status = 0 AND t.depart_date = ? AND t.depart_time < ?)tmp)`;
        const date = dayjs().format('YYYY-MM-DD');
        const time = dayjs().subtract(DELAY, 'minute').format('HH:mm:ss');
        connection.query(updateStatusSql, [id, date, id, date, time], (err) => {
          if (err) {res.status(500); reject()}
          resolve()
        });
      })
    }
    function controller() {
      const {userNum, password, isScanEnd} = req.body;
      const sql = isScanEnd
        ? 'select * from t_users where num = ? and password = ? and authority = 4'
        : 'select * from t_users where num = ? and password = ? and authority != 4';
      connection.query(sql, [userNum, password], function (err, data) {
        if (err) { res.status(500) }
        if (data && data.length) {

          // 账号密码验证成功
          if (!isScanEnd){
            // 乘客端
            const { id, authority } = data[0];
            // 管理员跳过积分判断
            if (authority === 3) {
              res.json({status: 200, data: data[0]});
              return;
            }
            updateIntegral(connection, id, res, DELAY, PUNISH)
              .then((integral) => {
                return updateStatus(id)
              })
              .then(() => {
                res.json({status: 200, data: data[0]});
              })
              .catch((isIntegral) => {
                if (isIntegral) {
                  updateStatus(id)
                    .then(() => {
                      res.json({status: 400})
                    })
                }
              });
          } else {
            res.json({status: 200, data: data[0]});
          }
        } else {

          //密码验证失败
          res.json({status: 401});
        }
      })
    }
    const xmlParser = new xml2js.Parser();
    const readFileSync = fs.readFileSync(path.resolve(__dirname, './config.xml'));
    xmlParser.parseStringPromise(readFileSync)
      .then(result => {
        const { deadline, delay, punish, full, advance } = result.config;
        DEADLINE = +deadline[0];
        DELAY = +delay[0];
        PUNISH = +punish[0];
        FULL = +full[0];
        ADVANCE = +advance[0];
        controller();
      })
      .catch(() => res.status(500));
});

router.post('/manager/login', function (req, res) {
  const {username, password} = req.body;
  const sql = 'select * from t_users where num = ? and password = ? and authority = 3';
  connection.query(sql, [username, password], function (err, data) {
    if (err) { res.json({ status: 500 }) }
    if (data && data.length) {
      res.json({status: 200, data: data[0]});
    } else {
      //密码验证失败
      res.json({status: 401});
    }
  })
});

/*
* GET  获取车票列表
* */
router.get('/carList', function (req, res) {
  const { date, isSixHour } = req.query;
  // 订票截止时间 （发车前10分钟）
  const deadlineTime = dayjs().isBefore(dayjs(date))
    ? '00:00:00'
    : dayjs().add(DEADLINE, 'minute').format('HH:mm:ss');
  const sixHourdeadlineTime = dayjs().add(6, 'hour').isBefore(dayjs().endOf('day'))
    ? dayjs().add(6, 'hour').format('HH:mm:ss')
    : '23:59:59';
  const sql = isSixHour === 'true'
    ? `SELECT * FROM t_ticket WHERE depart_date = ? AND depart_time > ? AND depart_time < ? order by depart_time`
    : `select * from t_ticket where depart_date = ? and depart_time > ? order by depart_time`;
  const dataArr = isSixHour === 'true'
    ? [date, deadlineTime, sixHourdeadlineTime]
    : [date, deadlineTime];
  connection.query(sql, dataArr, function (err, data) {
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
  var qrCode = qr.image(orderId);
  res.setHeader('Content-type', 'image/png');  //sent qr image to client side
  qrCode.pipe(res);
});

/*
* GET 获取指定用户的订单
* */
router.get('/order/list/:userId', function (req, res) {
  const userId = req.params.userId;
  const { type } = req.query;
  const authCode = req.get('auth_code');
  const isManage = authCode === '3';
  const updateOrderStatus = () => {
    // 更新 待出行 订单的状态（是否过期）
    return new Promise((resolve) => {
      const updateStatusSql = `UPDATE t_order SET order_status = 3 WHERE id IN (SELECT tmp.id FROM (SELECT o.id AS id FROM t_ticket t INNER JOIN t_order o ON o.car_id = t.id WHERE user_id = ? AND order_status = 0 AND t.depart_date < ? OR user_id = ? AND order_status = 0 AND t.depart_date = ? AND t.depart_time < ?)tmp)`;
      const date = dayjs().format('YYYY-MM-DD');
      const time = dayjs().subtract(DELAY, 'minute').format('HH:mm:ss');
      connection.query(updateStatusSql, [userId, date, userId, date, time], (err) => {
        if (err) res.status(500);
        resolve()
      });
    })
  };
  const queryOrderList = () => {
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
      res.json({status: 200, data});
    })
  };
  // 更新 积分 和 状态
  isManage
    ? updateOrderStatus() // 更新车票状态(是否过期)
      .then(() => {
        queryOrderList();
      })
    : updateIntegral(connection, userId, res, DELAY, PUNISH) // 更新积分
      .then((currentIntegral) => {
        return updateOrderStatus();
      })
      .then(() => {
        queryOrderList();
      })
      .catch((isIntegral) => {
        updateOrderStatus()
          .then(() => {
            isIntegral && res.json({status: 400})
          })
      });
});

/*
* POST 退票接口
* */
router.post('/order/return', function (req, res) {
  const { orderId, punishIntegral, userId } = req.body;
  const authCode = req.get('auth-code');
  connection.query(`SELECT car_id, ticket_num FROM t_order WHERE id = ?`, [orderId], function (err, data1) {
    if (err) res.status(500);
    if (data1.length) {
      const { car_id, ticket_num } = data1[0];
      connection.query(`UPDATE t_order SET order_status = 2 WHERE id = ?`, [orderId], function (err, data2) {
        if (err) res.status(500);
        if (data2) {
          connection.query(`UPDATE t_ticket SET rest_ticket = rest_ticket + ? WHERE id = ?`,
            [ticket_num, car_id], function (err, data3) {
              if (err) res.status(500);
              if (authCode === '3') {res.json({status: 200}); return;}
              if (data3) {
                // 扣除积分
                connection.query(`SELECT integral FROM t_users WHERE id = ?`,
                  [userId], (err, data) => {
                    if (err) res.status(500);
                    if (data.length){
                      const { integral } = data[0];
                      if (punishIntegral >= integral) {
                        connection.query(`UPDATE t_users SET integral = 0 WHERE id = ?`,
                          [userId], (err, data) => {
                            if (err) res.status(500);
                            res.json({ status: 200 });
                          });
                      } else {
                        connection.query(`UPDATE t_users SET integral = integral - ? WHERE id = ?`,
                          [punishIntegral, userId], (err, data) => {
                            if (err) res.status(500);
                            res.json({ status: 200 });
                          });
                      }
                    } else {
                      res.status(501);
                    }
                  });
              }
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

/**
 * GET 获取用户积分
 */
router.get('/integral/:userId', function (req, res) {
  const { userId } = req.params;
  connection.query(`SELECT integral FROM t_users WHERE id = ?`,
    [userId], function (err, data) {
      if (err) res.status(500);
      if (data.length) {
        const { integral=0 } = data[0];
        res.json(integral);
      }
    })
});

/**
 * 扫码端小程序服务
 * @type {Router}
 */
/*
* GET  获取班车列表
* */
router.get('/scan/carList', function (req, res) {
  const { date } = req.query;
  // 订票截止时间 （发车前10分钟）
  const deadlineTime = dayjs().isBefore(dayjs(date))
    ? '00:00:00'
    : dayjs().subtract(ADVANCE, 'minute').format('HH:mm:ss');
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

/**
 * POST 扫码请求API
 * @type {Router}
 */
router.post('/scan/qr', function (req, res) {
  const { orderId, carId } = req.body;
  connection.query(`SELECT * FROM t_order WHERE id = ? AND car_id = ? AND order_status = 0`,
    [orderId, carId], function (err, data) {
      if (err) res.status(500);
      if (!data.length){
        // 二维码订单 与 当前班车信息不符
        res.json('')
      } else {
        // 更改车票订单状态 待出行(0) --> 已出行(1)
        connection.query(`UPDATE t_order SET order_status = 1 WHERE id = ?`,
          [orderId], function (err, data1) {
            if (err) res.status(500);
            connection.query(`SELECT * FROM t_users u INNER JOIN t_order o ON o.user_id = u.id WHERE o.id = ?`,
              [orderId], function (err, data2) {
                if (err) res.status(500);
                if (data2.length){
                  // socket 通知乘客扫码成功
                  const socket = SocketMap.get(orderId);
                  if (socket){
                    socket.send('ok');
                    SocketMap.delete(orderId);
                  }

                  // response 通知乘务员扫码成功
                  res.json(data2[0]);
                }
              })
          });
      }
    })
});

/**
 * GET 获取配置
 * @type {Router}
 */
router.get('/manager/config', function (req, res) {
  const xmlParser = new xml2js.Parser();
  fs.readFile(path.resolve(__dirname, './config.xml'), function (err, file) {
    xmlParser.parseStringPromise(file)
      .then((parserResult) => {
        res.json({
          status: 200,
          data: parserResult
        });
      })
      .catch(err => {
        res.json({
          status: 500
        })
      })
  })
});

/**
 * POST 设置配置
 * @type {Router}
 */
router.post('/manager/config', function (req, res) {
  const config = req.body;
  const xmlBuilder = new xml2js.Builder();
  const data = {
    "config": config
  };
  const builderData = xmlBuilder.buildObject(data);
  fs.writeFile(path.resolve(__dirname, './config.xml'), builderData, {}, (err, result) => {
    if (err) { res.json({ status: 500 }) }
    res.json({
      status: 200
    })
  });
});

/**
 * POST 班车数据导入
 * @type {Router}
 */
router.post('/manager/excel/ticket', function (req, res) {
  const ticketData = req.body;
  console.log('ticketData', ticketData)
  const result = ticketData.map(item => {
    // return Object.assign(item, {id: uuid()})
    return [uuid(), item.depart_time, item.depart_place, item.rest_ticket, item.car_num, item.campus, item.depart_date]
  });
  console.log('result', result);
  const sql = `INSERT INTO t_ticket (id, depart_time, depart_place, rest_ticket, car_num, campus, depart_date) VALUES ?`;
  connection.query(sql, [result], function (err, data) {
    if (err) res.json({ status: 500 });
    if (data) res.json({ status: 200 });
  })
});

/**
 * POST 用户数据导入
 * @type {Router}
 */
router.post('/manager/excel/user', function (req, res) {
  const userData = req.body;
  console.log('userData', userData)
  const result = userData.map(item => {
    // return Object.assign(item, {id: uuid()})
    return [uuid(), item.password, item.authority, item.num, FULL]
  });
  console.log('result', result);
  const sql = `INSERT INTO t_users (id, password, authority, num, integral) VALUES ?`;
  connection.query(sql, [result], function (err, data) {
    if (err) res.json({ status: 500 });
    if (data) res.json({ status: 200 });
  })
});

module.exports = router;
