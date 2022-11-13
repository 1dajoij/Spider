const Pubsub = require("pubsub-js");
const path = require("path");
const {serverObj} = require("../spider/constant");
const {Readfs} = require("../untils");
const {getPageInfo} = require("../spider/types/singleCard");

Pubsub.subscribe("start_specific", () => {

});

function Path(p) {
    return path.join(__dirname, `./data/${p}.txt`)
}

function *fsGen(list) {
    for(let i = 0;i < list.length;i++) {
        yield Readfs(Path(list[i]))
    }
}

function autoFsRun(g) {
    let counter = 1;

    const pub = Pubsub.subscribe("pages_end", (_,data) => {
        console.log(`---- ${data}已经结束爬取！！！`);
        counter++;
        fsRun(g);
    })
    
    fsRun(g);

    function fsRun(g) {
        const _next = g.next();
        if(!_next.done) {
            _next.value.then(res => {
                getPageInfo(counter, res);
            })
        } else {
            Pubsub.unsubscribe(pub);
            Pubsub.publish("start_specific", "start");
        }
    }
}


Pubsub.subscribe("start_Spider",(name, data) => {
    const list = data.slice(1);
    console.log("开始爬取类型页面数据！");
    autoFsRun(fsGen(list));
});

Pubsub.subscribe("home_info", (name, data) => {
    // 仅爬取主页的所有分类项的id(暂时先不写)
    if(!serverObj.get("isServer_Over")) { // 仅在刚启动服务器时 发布 爬取其他页面的任务
        Pubsub.publish("start_Spider", data);// 发布爬取 电影页数据的任务
    }
})