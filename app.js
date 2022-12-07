const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cron = require("node-cron");
require("./pubsub/index"); // 订阅各种消息进行处理
const spider = require("./spider/pages");
const Pubsub = require("pubsub-js");

// const querySql = require('./mysql');
// const {updata_sql} = require("./untils");

// querySql(`
//   SELECT id from basic_info WHERE id NOT in (SELECT id from specific_info)
// `).then(res => {
//   res.forEach(async ({id}) => {
//     await updata_sql(id);
//   })
// })

// 定时爬取数据
cron.schedule("50 23 * * *", function() {
  console.log("---------------------");
  console.log("Running Spider");
  spider();
});

Pubsub.publish("home-start", true);

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
