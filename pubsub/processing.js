const Pubsub = require("pubsub-js");
const path = require("path");
const {Readfs, card_href, wait} = require("../untils");
const {getPageInfo} = require("../spider/types/singleCard");
const {getSpecific} = require("../spider/types/specific");
const axios = require("../spider/index");


function Path(p) {
    return path.join(__dirname, `./data/${p}.txt`)
}

function *fsGen(list) {
    for(let i = 0;i < list.length;i++) {
        yield Readfs(Path(list[i]))
    }
}

function *idGen(list) {
    for(let i = 0;i < list.length;i++) {
        const {id} = list[i]
        yield axios.get(card_href(id));
    }
}

/**
 * 
 * @param {页面的分类页} list 
 */
function autoFsRun(list) {
    const g = fsGen(list);

    let counter = 1;

    const pub = Pubsub.subscribe("pages_end", (_,data) => {
        console.log(`---- ${data}已经结束爬取！！！`);
        counter++;
        fsRun(g);
    });
    
    fsRun(g);

    function fsRun(g) {
        const _next = g.next();
        if(!_next.done) {
            _next.value.then(res => {
                getPageInfo(counter, res);
            })
        } else {
            Pubsub.unsubscribe(pub);
            // Pubsub.publish("start_specific", "start");
        }
    }
}

function autoIdRun(list) {
    const g = idGen(list);
    // counter 用来查看已完成数量
    let counter = 0;

    const pub = Pubsub.subscribe("pages_id_end", async (_,name) => {
        counter++;
        console.log(`${name}已存储数据,现已完成${counter}`);
        // 保证在 1~3秒内爬取一次
        await wait(parseFloat(Math.random() * 2 + 1) * 1000);
        Run(g);
    });

    Run(g);

    function Run(g) {
        const _next = g.next();
        if(!_next.done) {
            _next.value.then(res => {
                // 进行爬取操作
                getSpecific(res, list[counter]);
            })
        } else {
            // 关闭订阅
            Pubsub.unsubscribe(pub);
            console.log("所有信息均爬取完毕！！！");
        }
    }
}

module.exports = {
    autoFsRun,
    autoIdRun
}