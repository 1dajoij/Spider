var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require("./pubsub/processing"); // 订阅到下一个文件爬取完毕后(需要先执行)
require("./pubsub/index"); // 订阅各种消息进行处理
const spider = require("./spider/pages");
const {serverObj} = require("./spider/constant");

/**
 * 测试数据格式
 */
// const querySql = require("./mysql");

// const select = `SELECT (id) FROM basic_info WHERE id=714`
// querySql(select).then((res) => {
//     console.log(res[0])
// })

const interval = 1000 * 60 * 60 * 18; // 每18小时更新一次数据

setInterval(() => {
  spider(); // 爬取到樱花动漫主页里所有分页的数据
}, interval);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use((req, res, next) => { // 当数据没有爬取完成时，路由不可用
  if(!serverObj.get("isServer_Over")) {
    res.send("数据还在爬取中,请稍后再试!!!");
  }
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
