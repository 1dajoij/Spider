const {publishList} = require("../spider/constant");
const {autoFsRun, autoIdRun} = require("./processing");
const { updata_sql } = require("../untils");
const spider = require("../spider/pages");
const cron = require("node-cron");
const querySql = require("../mysql");
const Pubsub = require("pubsub-js");
const path = require("path");
const fs = require("fs");

// 实时更新数据
Pubsub.subscribe("updata_specific", async() => {
    // 查看是否有缺失数据未更新
    const needlist = await querySql(`
        SELECT id from basic_info WHERE id NOT in (SELECT id from specific_info)
    `);
    needlist.forEach(async item => {
        await updata_sql(id);
    });
    const queryStr = `
        SELECT id,name from basic_info
        WHERE id IN 
        (SELECT id from need_updata_list)
    `;
    // 修复 信息 错误 --- (网好慢。。。)
    // const queryStr = `
    //     SELECT id,name from basic_info Where id > 2224
    // `;
    const res = await querySql(queryStr)
    console.log("开始更新数据库！！！");
    autoIdRun(res, true);
})

// 爬取基础信息
Pubsub.subscribe("start_Spider",() => {
    const list = publishList.slice(1);
    console.log("开始爬取类型页面数据！");
    autoFsRun(list);
});

// 分别爬取5个重要起始页
publishList.forEach(item => {
    Pubsub.subscribe(item, (_, data) => {
        fs.writeFile(path.join(__dirname, `./data/${item}.txt`), data, err => {
            if(err) {
                throw (err)
            } else {
                console.log(`${item}存储成功！！！`);
                // 当5个类型页面结束爬取时
                if(item === publishList[publishList.length-1]) {
                    // 对主页的数据进行收集
                    Pubsub.publish("start_Spider");
                }
            }
        });
    })
});

// 防止爬取过程中网络超时
process.on('unhandledRejection', error => {
    console.error('unhandledRejection', error);
});

// 定时爬取数据
cron.schedule("50 23 * * *", function() {
    console.log("---------------------");
    console.log("Running Spider");
    spider();
});