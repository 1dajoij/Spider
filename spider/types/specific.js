const cheerio = require("cheerio");
const {UrlAuto} = require("../pages/until");
const Pubsub = require("pubsub-js");
const querySql = require("../../mysql");
const {updata_sql} = require("../../untils");

/**
 * needList 需要爬取 那一部分的链接
 * 一般只有第二个和第四个是比较清晰的，第二个最优
 */
async function getSpecific(html, obj, textReg) {
    const $ = cheerio.load(html);
    const {
        director,
        brief_introduction,
        same_type_list,
        last_updata_time,
        region,
        isUpdate
    } = textInfo($);

    /**
     * 默认爬取百度高清,有其他需求传入 needList 字段
     */
    // 视频链接信息
    function Compare(len, textReg=/飞速高速/g) {
        let needList;
        // 默认选择页面高亮的链接  有飞速高速时选 飞速高速链接  --- id 为 8185 之前都不是
        const list = new Array(len+1).fill(new Array());
        if(!len) {
            return list[0];
        }
        needList = Number($(`li.active [href*=playlist]`).attr("href").match(/(\d+)/)[1]);
        for(let i = 1;i <= len;i++) {
            const reg = textReg;
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
                    lens === list[needList].length ? (index = needList) : null;
                }
            }
        };
        return list[index];
    };
    // const {id, name} = obj;
    const urlList = Compare($(".myui-panel_hd:has(a.more) ul").find("a").length, textReg);
    const pub = Pubsub.subscribe("movie_sql_start", (_,{episodes,id}) => {
        episodes = episodes.join("&");
        const select = `SELECT * FROM specific_info WHERE id=${id}`
        querySql(select).then(async (res) => {
            if(!res.length) {
                const queryStr = "insert into specific_info (id,director,brief_introduction,same_type_list,last_updata_time,region,isUpdate,episodes) values (?,?,?,?,?,?,?,?)"
                await querySql(queryStr, [id,director,brief_introduction,same_type_list,last_updata_time,region,isUpdate,episodes]);
                console.log(`${obj.name}-存储成功！！！`);
                Pubsub.unsubscribe(pub);
                Pubsub.publish("pages_id_end", obj.name);
            } else {
                const queryStr = `update specific_info set director=?,brief_introduction=?,same_type_list=?,last_updata_time=?,region=?,isUpdate=?,episodes=? where id=${id}`;
                await querySql(queryStr,[director,brief_introduction,same_type_list,last_updata_time,region,isUpdate,episodes]);
                console.log(`${id}的数据更新成功！！！`);
                Pubsub.unsubscribe(pub);
                Pubsub.publish("pages_id_end", obj.name);
            };
        })
    });
    UrlAuto(urlList, [], obj);
};

async function updataSpecific(html, {id, name}, textReg) {
    const [{"count(id)": len}] = await querySql(`SELECT count(id) from specific_info WHERE id=${id}`);
    // 如果是未保存过的数据 采用默认爬取的方法
    if(!len) {
        getSpecific(html, {id, name}, textReg)
        return;
    };
    const $ = cheerio.load(html);
    let MovieList;
    try{
        const [{episodes}] = await querySql(`
            SELECT episodes from specific_info WHERE id=?
        `, [id]);
        MovieList = episodes.split("&");
    } catch(err) {
        getSpecific(html, {id, name}, textReg)
        return;
    };
    // 返回需要爬取的 ul的id
    const keyId = getOptimal_list($, textReg);
    if(!keyId) {
        console.log(`updataSpecific---${name}:资源更新出错`);
        Pubsub.publish("pages_id_end", name);
        return;
    };
    const newLen = $(keyId).find("a").length;
    if(newLen > MovieList.length) {
        let urlList = [];
        $(keyId).find("a").each((index, item) => {
            if(index >= MovieList.length) {
                urlList = [...urlList, $(item).attr("href")];
            }
        });
        const pub = Pubsub.subscribe("movie_sql_start", (_,{episodes,id}) => {
            MovieList = [...MovieList,...episodes].join("&");
            const {
                director,
                brief_introduction,
                same_type_list,
                last_updata_time,
                region,
                isUpdate
            } = textInfo($);
            const queryStr = `update specific_info set director=?,brief_introduction=?,same_type_list=?,last_updata_time=?,region=?,isUpdate=?,episodes=? where id=${id}`;
            querySql(queryStr, [director,brief_introduction,same_type_list,last_updata_time,region,isUpdate,MovieList]).then(async () => {
                await updata_sql(id, true);
                console.log(`${name}---数据更新成功！！！`);
                Pubsub.unsubscribe(pub);
                Pubsub.publish("pages_id_end", name);
            }).catch(err => {
                console.log(`${name}---数据更新失败！！！`);
                Pubsub.unsubscribe(pub);
                Pubsub.publish("pages_id_end", name);
            })
        });
        UrlAuto(urlList, [], {id, name});
    } else {
        // 清除此更新请求 并直接进行下一个任务
        await updata_sql(id, true);
        Pubsub.publish("pages_id_end", name)
    }
};

async function updataInfo(html, {id, name}) {
    const $ = cheerio.load(html);
    const {
        director,
        brief_introduction,
        same_type_list,
        last_updata_time,
        region,
        isUpdate
    } = textInfo($);
    const queryStr = `
    update specific_info 
    set director=?,brief_introduction=?,
    same_type_list=?,last_updata_time=?,
    region=?,isUpdate=?
    where id=${id}
    `;
    await querySql(queryStr,
        [director,brief_introduction,same_type_list,last_updata_time,region,isUpdate]
    );
    console.log(`id:${id} 信息已更新`)
    Pubsub.publish("pages_id_end", name);
};

function textInfo($) {
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
    let region = [];
    $("#rating + .data").find(".split-line + .text-muted+a").each((_, el) => {
        region.push($(el).text())
    });
    region = region.join("&");
    // 是否更新完成
    str = $(".myui-content__detail").find(".text-red").text().match(/(.*?)\//);
    str = str ? str[1] : "";
    const isUpdate = String(Boolean(str.match(/(完|全)/)));

    return {
        director,
        brief_introduction,
        same_type_list,
        last_updata_time,
        region,
        isUpdate
    }
};

function getOptimal_list($, textReg = /飞速高速/g) {
    const len = $("li [href*=playlist]").length;
    if(len < 1) return null;
    const obj = {};
    let priority = null;
    $("li [href*=playlist]").each((i, item) => {
        const id = $(item).attr("href");
        const isPriority = textReg.test($(item).text());
        isPriority && (priority = id);
        const len = $(id).find("a").length;
        obj[id] = len;
    });
    let maxKey, maxNum = 0;
    for(let key in obj) {
        (obj[key] > maxNum) && (maxKey = key);
        if(priority && obj[priority] >= maxNum) {
            maxKey = priority
        };
    };
    return maxKey;
};

module.exports = {
    getSpecific,
    updataSpecific,
    updataInfo
}