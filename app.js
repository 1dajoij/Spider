const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cron = require("node-cron");
const GetRouter = require('./routes/Get');
const SetRouter = require('./routes/Set');
const DeleteRouter = require('./routes/Delete');
const {Readfs} = require("./untils");
const {serverObj} = require("./spider/constant");
const {getHomePageInfo} = require("./spider/types/homeSpider");

async function update() {
  const html = await Readfs(path.join(__dirname, "./pubsub/data/Home-html.txt"));
    const obj = await getHomePageInfo(html);
    for(let key in obj) {
        serverObj.set(key, obj[key]);
    };
    console.log("接口数据已更新！！！");
};

update();
// 定时爬取数据
cron.schedule("50 23 * * *", update);

const app = express();

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
