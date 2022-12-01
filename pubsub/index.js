const {publishList, serverObj} = require("../spider/constant");
const {autoFsRun, autoIdRun} = require("./processing");
const {getHomePageInfo} = require("../spider/types/homeSpider");
const querySql = require("../mysql");
const Pubsub = require("pubsub-js");
const path = require("path");
const fs = require("fs");
const { Readfs } = require("../untils");


// 爬取动画详细信息
Pubsub.subscribe("start_specific", () => {
    // id 为 1716 建议重爬 详情见 specific.js 的 Compare 函数
    const queryStr = `SELECT id,name FROM basic_info where id>9741`;
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

// 将主页的 推荐列表 最新列表 最热列表 获取并存储在 serverObj
Pubsub.subscribe("home-start", async () => {
    const html = await Readfs(path.join(__dirname, "./data/Home-html.txt"));
    const obj = await getHomePageInfo(html);
    for(let key in obj) {
        serverObj.set(key, obj[key]);
    };
    console.log("接口已可用！！")
    // Pubsub.publish("start_Spider", publishList);
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
                    Pubsub.publish("home-start");
                }
            }
        });
    })
});