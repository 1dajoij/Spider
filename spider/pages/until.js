const {skip_href, err_handling, get_movie_url, wait} = require("../../untils");
const {publishList} = require("../constant");
const axios = require("../index");
const Pubsub = require("pubsub-js");


function *gen(id, len) {
    for(let i = 0;i < len;i++) {
        yield {
            counter: i,
            p: axios.get(skip_href(id, i+1))
        };
    };
};

// 用来爬取每个动漫的播放链接资源
function *UrlGen(list) {
    for(let i = 0;i < list.length;i++) {
        yield {
            R: axios.get(list[i]),
            counter: i+1
        };
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
    run(callback);
    const pubsub = Pubsub.subscribe("sql_end", () => {
        run(callback)
    });
    function run(callback) {
        const _next = g.next();
        if(!_next.done) {
            const {counter, p} = _next.value;
            p.then(res => {
                callback(res, counter, publishList[id]);
            }).catch(err => {
                // 如果请求出错将 出现错误的页面缓存到sql表中之后在进行集中更改
                err_handling(0, {page:counter, type: publishList[id]}).catch(err => {
                    console.log(err);
                });
                Pubsub.publish("sql_end");
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
async function UrlAuto(list, episodes, {id, name}) {
    if(!list.length) {
        await err_handling(2, {id, episodes:"暂无资源"});
        Pubsub.publish("movie_sql_start", {episodes,id});
        return;
    }
    const g = UrlGen(list);
    // counter --- 仅用来记录集数;
    const pub = Pubsub.subscribe("movie_url_end", async () => {
        // 保证在 1~2 秒内爬取一次
        await wait(parseFloat(Math.random() + 1) * 1000);
        Run(g);
    });

    Run(g);
    function Run(g) {
        const _next = g.next();
        if(!_next.done) {
            const {R, counter} = _next.value;
            R.then(res => {
                const url = get_movie_url(res);
                const reg = /(\.m3u8)$/;
                if(reg.test(url)) {
                    episodes = [...episodes, url];
                    console.log(`${name}---${counter}集已完成`);
                    Pubsub.publish("movie_url_end");
                } else {
                    console.log("此动漫暂无资源！！！");
                    // 直接拉入黑名单,且结束爬取后续集数
                    err_handling(3, {id}).catch(err => {
                        console.log(err);
                    });
                    Pubsub.unsubscribe(pub);
                    Pubsub.publish("movie_sql_start", {episodes,id});
                }
            }).catch(() => {
                // 错误时用空字符串占位
                episodes = [...episodes, ""];
                err_handling(2, {id, episodes: counter}).catch(err => {
                    console.log(err);
                });
                Pubsub.publish("movie_url_end");
            })
        } else {
            Pubsub.unsubscribe(pub);
            Pubsub.publish("movie_sql_start", {episodes,id})
        }
    }
}

module.exports = {
    autoRun,
    UrlAuto
}