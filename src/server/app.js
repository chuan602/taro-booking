const express = require('express');
const router = require('./router');
const bodyParser = require('body-parser');
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(router);

app.listen('3000', function () {
    console.log('server has started...');
});
