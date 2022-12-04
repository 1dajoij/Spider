const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
// require("./pubsub/processing"); // 订阅到下一个文件爬取完毕后(需要先执行)
require("./pubsub/index"); // 订阅各种消息进行处理
const spider = require("./spider/pages");

const interval = 1000 * 60 * 60 * 18; // 每18小时更新一次数据

setInterval(() => {
  spider(); // 爬取到樱花动漫主页里所有分页的数据
}, interval);

const GetRouter = require('./routes/Get');
const SetRouter = require('./routes/Set');
const DeleteRouter = require('./routes/Delete');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/get', GetRouter);
app.use('/api/set', SetRouter);
app.use('/api/delete', DeleteRouter);


app.use(function(req, res, next) {
  next(createError(404));
});
app.use(function(err, req, res, next) {
  res.send({...err, code: err.status});
});

module.exports = app;
