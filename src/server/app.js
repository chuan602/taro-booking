const express = require('express');
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const websocket = require('ws');
const router = require('./router');
const app = express();

const {isHttps, SocketMap} = require('./config');

const options = {
  pfx: fs.readFileSync(path.resolve(__dirname, './certificate/www.chuan602.top.pfx')),
  passphrase: fs.readFileSync(path.resolve(__dirname, './certificate/keystorePass.txt'))
};
const server = isHttps ? https.createServer(options, app) : http.createServer(app);

// 重定向 http 根路由到 https
const httpApp = express();
httpApp.get('/', (req, res) => {
  res.redirect(302, 'https://chuan602.top/');
});
httpApp.listen(80, () => {
  console.log('80server is running');
});

/**
 * WebSocket start
 * @type {Server}
 */
const ws = new websocket.Server({
  server,
  path: '/wss',
});

ws.on('connection', (socket, req) => {
  const { url } = req;
  const orderId = url.split('=')[1];
  SocketMap.set(orderId, socket);
  socket.on('close', () => {
    SocketMap.delete(orderId);
  })
});
/**
 * WebSocket end
 */

/**
 * SSR start
 */
app.set('views', path.join(__dirname, './views'));
app.engine('html', require('ejs').__express);
app.set('view engine', 'html');
/**
 * SSR end
 */

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(router);


server.listen('443', function () {
    console.log('server has started...');
});
