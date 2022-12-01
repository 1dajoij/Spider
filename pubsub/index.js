const {publishList} = require("../spider/constant");
const {autoFsRun, autoIdRun} = require("./processing");
const querySql = require("../mysql");
const Pubsub = require("pubsub-js");
const path = require("path");
const fs = require("fs");


// 爬取动画详细信息
Pubsub.subscribe("start_specific", () => {
    // id 为 1716 建议重爬 详情见 specific.js 的 Compare 函数
    const queryStr = `SELECT id,name FROM basic_info where id>7882`;
    querySql(queryStr).then(res => {
        console.log("开始爬取所有动漫详细信息！！！");
        autoIdRun(res);
    });
});


// 爬取基础信息
Pubsub.subscribe("start_Spider",(name, data) => {
    const list = data.slice(1);
    console.log("开始爬取类型页面数据！");
    autoFsRun(list);
});


publishList.forEach(item => {
    Pubsub.subscribe(item, (_, data) => {
        fs.writeFile(path.join(__dirname, `./data/${item}.txt`), data, err => {
            if(err) {
                throw (err)
            } else {
                console.log(`${item}存储成功！！！`);
                // 当5个类型页面结束爬取时
                if(item === publishList[publishList.length-1]) {
                    /**
                     * 节省时间先用  start_specific
                     */
                    // Pubsub.publish("start_Spider", publishList);
                    Pubsub.publish("start_specific");
                }
            }
        });
    })
});