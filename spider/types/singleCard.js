const cheerio = require("cheerio");
const Pubsub = require("pubsub-js");
const querySql = require("../../mysql");
const {autoRun} = require("../pages/until");
const {wait, updata_sql} = require("../../untils");

function getPageInfo(id, html) { // 用来获取尾页共多少页 和当前页信息
    const $ = cheerio.load(html);
    const pages = $(".myui-page").find("li:last-child a").attr("href").match(/page=(.*?)&/)[1];
    autoRun(id, pages, getCardInfo);
}

/**
 * **** 用来爬取按热度排名的列表
 * 都为必穿，第三个参数主要为了爬取时有具体信息
 * @param {html} html 
 * @param {页数} page 
 * @param {类别信息: movie... } info 
 */
function getCardInfo(html, page, info) {
    const $ = cheerio.load(html);
    // 樱花动漫每个 card 爬取有用信息
    const last_id = $(".myui-vodlist").find("li:last-child a").attr("href").match(/view\/(.*?)\.html/)[1];
    $(".myui-vodlist").find(".myui-vodlist__box").each(async (index, item) => {
        const id = $(item).find(".myui-vodlist__thumb").attr("href").match(/view\/(.*?)\.html/)[1];
        const name = $(item).find(".myui-vodlist__thumb").attr("title");
        const picUrl = $(item).find(".myui-vodlist__thumb").attr("data-original");
        const score = parseFloat($(item).find(".tag:first").text());
        const release_data = $(item).find(".tag:last").text();
        const finish_state = $(item).find(".pic-text").text();
        const starring = $(item).find(".myui-vodlist__detail p").text().match(/：(.*)/)[1].split(",").join("&");
        const hot = (index + 1) + (page * 30);
        const select = `SELECT finish_state FROM basic_info WHERE id=${id}`
        const res = await querySql(select);
        if(!res.length) {
            const queryStr = "insert into basic_info (id,name,picUrl,score,release_data,finish_state,starring,hot,type) values (?,?,?,?,?,?,?,?,?)"
            await querySql(queryStr, [id,name,picUrl,score,release_data,finish_state,starring,hot,info]);
            console.log(`${name}数据存储成功！！---当前已完成${hot}个---${info}`);
        } else {
            if(!res[0].finish_state === finish_state) {
                updata_sql(id);
            };
            const queryStr = `update basic_info set hot=?,name=?,picUrl=?,score=?,release_data=?,finish_state=?,starring=? where id=${id}`;
            await querySql(queryStr,[hot,name,picUrl,score,release_data,finish_state,starring]);
            console.log(`${id}的数据修改成功！！---${hot}`);
        };
        if(id === last_id) {
            // 每请求一次间隔 1 ~ 3 s
            await wait(parseFloat(Math.random() * 2 + 1) * 1000);
            Pubsub.publish("sql_end");
        };
    });
}

module.exports = {
    getPageInfo,
    getCardInfo
}