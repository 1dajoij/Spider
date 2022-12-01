const cheerio = require("cheerio");
const {UrlAuto} = require("../pages/until");
const Pubsub = require("pubsub-js");
const querySql = require("../../mysql");
const {err_handling} = require("../../untils")

/**
 * needList 需要爬取 那一部分的链接
 * 一般只有第二个和第四个是比较清晰的，第二个最优
 */
async function getSpecific(html, obj, needList=1) {
    const $ = cheerio.load(html);
    // 导演
    let director = [];
    if($(".myui-content__detail [class=data]:last").find("a").length) {
        $(".myui-content__detail [class=data]:last").find("a").each((index, item) => {
            director = [...director, $(item).text()]
        });
    } else {
        director = [...director, "未知"];
    }
    
    director = director.join("&");

    // 简介
    const brief_introduction = $("div#desc").find(".data").text().replace(/🄬/g, "");
    
    // 相同类型动漫id
    let same_type_list = [];
    $(".myui-vodlist__box").find(".myui-vodlist__thumb").each((_,item) => {
        same_type_list = [...same_type_list, $(item).attr("href").match(/view\/(.*?)\.html/)[1]]
    });
    same_type_list = same_type_list.join("&");

    // 最后更新时间
    let last_updata_time = $(".myui-content__detail").find(".text-red").text().match(/\/(.*)/);
    last_updata_time = last_updata_time ? last_updata_time[1] : ""

    // 地区
    const region = $("#rating + .data").find(".split-line + .text-muted").text();

    // 是否更新完成
    str = $(".myui-content__detail").find(".text-red").text().match(/(.*?)\//);
    str = str ? str[1] : "";
    const isUpdate = String(Boolean(str.match(/(完|全)/)));

    /**
     * 默认爬取百度高清,有其他需求传入 needList 字段
     */
    // 视频链接信息
    function Compare(len) {
        // 默认选择页面高亮的链接  有飞速高速时选 飞速高速链接  --- id 为 8185 之前都不是
        const list = new Array(len+1).fill(new Array());
        if(!len) {
            return list[0];
        }
        needList = Number($(`li.active [href*=playlist]`).attr("href").match(/(\d+)/)[1]);
        for(let i = 1;i <= len;i++) {
            const reg = /飞速高速/;
            if(reg.test($(`[href*=playlist${i}]`).text())) {
                needList = i;
            };
            $(`div#playlist${i}`).find("a").each((_, item) => {
                list[i] = [...list[i], $(item).attr("href")];
            });
        };
        // 当list的子数组长度不同时,获取长度最长的作为返回
        // lens 为最大的, 且当list的子数组长度相同时, 返回索引为needList的数组
        let index = 0, lens = 0;
        for(let i = 1;i <= len;i++) {
            if(lens < list[i].length) {
                lens = list[i].length;
                index = i;
            } else {
                if(list[needList]) {
                    lens === list[needList].length ? index = needList : null;
                }
            }
        };
        return list[index];
    };
    const {id, name} = obj;
    const urlList = Compare($(".myui-panel_hd:has(a.more) ul").find("a").length);
    const pub = Pubsub.subscribe("movie_sql_start", (_,{episodes,id}) => {
        episodes = episodes.join("&");
        const select = `SELECT * FROM specific_info WHERE id=${id}`
        querySql(select).then(async (res) => {
            if(!res.length) {
                const queryStr = "insert into specific_info (id,director,brief_introduction,same_type_list,last_updata_time,region,isUpdate,episodes) values (?,?,?,?,?,?,?,?)"
                querySql(queryStr, [id,director,brief_introduction,same_type_list,last_updata_time,region,isUpdate,episodes]).then(() => {
                    console.log(`${obj.name}-存储成功！！！`);
                    Pubsub.unsubscribe(pub);
                    Pubsub.publish("pages_id_end", obj.name);
                });
            } else {
                const queryStr = `update specific_info set director=?,brief_introduction=?,same_type_list=?,last_updata_time=?,region=?,isUpdate=?,episodes=? where id=${id}`;
                querySql(queryStr,[director,brief_introduction,same_type_list,last_updata_time,region,isUpdate,episodes]).then(() => {
                    console.log(`${id}的数据更新成功！！！`);
                    Pubsub.unsubscribe(pub);
                    Pubsub.publish("pages_id_end", obj.name);
                });
            };
        })
    });
    UrlAuto(urlList, [], obj);
};


module.exports = {
    getSpecific
}