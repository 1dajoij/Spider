const Pubsub = require("pubsub-js");
const path = require("path");
const {Readfs, card_href, wait} = require("../untils");
const {getPageInfo} = require("../spider/types/singleCard");
const {getSpecific, updataSpecific, updataInfo} = require("../spider/types/specific");
const axios = require("../spider/index");


function Path(p) {
    return path.join(__dirname, `./data/${p}.txt`)
}

function *fsGen(list) {
    for(let i = 0;i < list.length;i++) {
        yield {
            counter: i+1,
            res: Readfs(Path(list[i]))
        }
    }
}

function *idGen(list) {
    for(let i = 0;i < list.length;i++) {
        const {id} = list[i];
        yield {
            cout: i,
            R: axios.get(card_href(id))
        };
    }
}

/**
 * 
 * @param {页面的分类页} list 
 */
function autoFsRun(list) {
    const g = fsGen(list);

    const pub = Pubsub.subscribe("pages_end", (_,data) => {
        console.log(`---- ${data}已经结束爬取！！！`);
        fsRun(g);
    });

    fsRun(g);
    
    function fsRun(g) {
        const _next = g.next();
        if(!_next.done) {
            const {counter, res: R} = _next.value;
            R.then(res => {
                getPageInfo(counter, res);
            })
        } else {
            Pubsub.unsubscribe(pub);
            Pubsub.publish("updata_specific");
        }
    }
}

function autoIdRun(list, updata = false, repair = false) {
    const g = idGen(list);

    let counter;

    const pub = Pubsub.subscribe("pages_id_end", async (_,name) => {
        console.log(`${name}已爬取结束,现已完成${counter+1}`);
        // 保证在 1~3秒内爬取一次
        await wait(parseFloat(Math.random() * 2 + 1) * 1000);
        Run(g);
    });

    Run(g);

    function Run(g) {
        const _next = g.next();
        if(!_next.done) {
            const {cout, R} = _next.value;
            counter = cout;
            R.then(res => {
                // 进行爬取操作 --- updataSpecific 在某种情况也会调用 getSpecific
                if(updata) {
                    updataSpecific(res, list[cout]);
                } else if (repair) {
                    updataInfo(res, list[cout]);
                } else {
                    getSpecific(res, list[cout]);
                }
            });
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