const {skip_href, err_handling, get_movie_url, wait} = require("../../untils");
const {publishList} = require("../constant");
const axios = require("../index");
const Pubsub = require("pubsub-js");


function *gen(id, len) {
    for(let i = 0;i < len;i++) {
        yield axios.get(skip_href(id, i+1));
    };
};

// 用来爬取每个动漫的播放链接资源
function *UrlGen(list) {
    for(let i = 0;i < list.length;i++) {
        yield axios.get(list[i]);
    }
};

/**
 * 
 * @param {对应各种分类的id} id 
 * @param {page页数} len 
 * @param {回调函数} callback 
 */
function autoRun(id, len, callback) {
    const g = gen(id, len);
    let counter = 0;
    run(callback);
    const pubsub = Pubsub.subscribe("sql_end", (_, data) => {
        counter++;
        run(callback)
    });
    function run(callback) {
        const _next = g.next();
        if(!_next.done) {
            _next.value.then(res => {
                callback(res, counter, publishList[id]);
            }).catch(err => {
                // 如果请求出错将 出现错误的页面缓存到sql表中之后在进行集中更改
                err_handling(0, {page:counter, type: publishList[id]}).catch(err => {
                    console.log(err);
                });
                Pubsub.publish("sql_end", "yes");
            });
        } else {
            // 停止订阅
            Pubsub.unsubscribe(pubsub);
            Pubsub.publish("pages_end", publishList[id])
        }
    }
}

/**
 * 
 * @param {分集链接列表} list 
 * @param {存放链接列表的数组} episodes 
 * @param {当前爬取的动漫id} id 
 */
function UrlAuto(list, episodes, {id, name}) {
    const g = UrlGen(list);
    // counter --- 仅用来记录集数;
    let counter = 1;
    const pub = Pubsub.subscribe("movie_url_end", async () => {
        console.log(`${name}---${counter}集已完成`);
        counter++;
        // 保证在 1~2 秒内爬取一次
        await wait(parseFloat(Math.random() + 1) * 1000);
        Run(g);
    });

    Run(g);
    function Run(g) {
        const _next = g.next();
        if(!_next.done) {
            _next.value.then(res => {
                const url = get_movie_url(res);
                episodes = [...episodes, url];
                Pubsub.publish("movie_url_end");
            }).catch(() => {
                err_handling(2, {id, episodes: counter}).catch(err => {
                    console.log(err);
                });
                Pubsub.publish("movie_url_end");
            })
        } else {
            Pubsub.unsubscribe(pub);
            Pubsub.publish("movie_sql_start", episodes)
        }
    }
}

module.exports = {
    autoRun,
    UrlAuto
}