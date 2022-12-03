var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// require("./pubsub/processing"); // 订阅到下一个文件爬取完毕后(需要先执行)
require("./pubsub/index"); // 订阅各种消息进行处理
const spider = require("./spider/pages");

const interval = 1000 * 60 * 60 * 18; // 每18小时更新一次数据

setInterval(() => {
  spider(); // 爬取到樱花动漫主页里所有分页的数据
}, interval);

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/get', indexRouter);

app.use(function(req, res, next) {
  next(createError(404));
});
app.use(function(err, req, res, next) {
  res.send({...err, code: err.status});
});

module.exports = app;
