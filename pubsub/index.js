const {publishList, serverObj} = require("../spider/constant");
const Pubsub = require("pubsub-js");
const path = require("path");
const fs = require("fs");

// 设置服务器是否可以运行
// 所有数据爬取完成后会改为  true
serverObj.set("isServer_Over", false);

publishList.forEach(item => {
    Pubsub.subscribe(item, (_, data) => {
        fs.writeFile(path.join(__dirname, `./data/${item}.txt`), data, err => {
            if(err) {
                throw (err)
            } else {
                console.log(`${item}存储成功！！！`);
                if(item === publishList[publishList.length-1]) {
                    /**
                     * 节省时间先用  start_specific
                     */
                    // Pubsub.publish("start_Spider", data);
                    Pubsub.publish("start_specific");
                }
            }
        });
    })
});