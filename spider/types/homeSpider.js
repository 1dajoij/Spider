const cheerio = require("cheerio");
const { getSqlBasicInfo } = require("../../untils");

function getHomePageInfo(html) {
    return new Promise(async (resolve, reject) => {
        const $ = cheerio.load(html);
        // Array 下标代表一周中的每一天
        const recommendList = await getRecommend($);
        // Object
        const MovieInfo = await getMovieInfo($);

        resolve({
            recommendList,
            MovieInfo
        });
    })
};

// 推荐列表
function getRecommend($) {
    const recommendLen = $(".tab-content").find("[id*=week]").length;
    if(!recommendLen) {
        return [];
    };
    const arr = new Array(recommendLen).fill(new Array());
    $(".tab-content").find("[id*=week]").each((i, el) => {
        $(el).find("li a").each((_, item) => {
            let id;
            try{
                id = Number($(item).attr("href").match(/view\/(.*?)\./)[1]);
            } catch(err) {
                id = null;
            };
            id && (arr[i] = [...arr[i], id]);
        })
    });
    return arr;
};

// news & hots
function getMovieInfo($) {
    return new Promise((resolve, reject) => {
        const obj = {};
        const len = $(".myui-panel-box:has(.myui-vodlist)").length - 1;
        $(".myui-panel-box:has(.myui-vodlist)").each(async (index, el) => {
            const type = matchingStr($(el).find("h3:first").text());
            let news = [], hots = [];
            // news
            $(el).find(".myui-vodlist a").each((_, item) => {
                let id;
                try{
                    id = Number($(item).attr("href").match(/view\/(.*?)\./)[1]);
                } catch(err) {
                    id = null;
                };
                id && (news = [...news, id]);
            });
            // hots
            $(el).find(".myui-vodlist__text a").each((_, item) => {
                let id;
                try{
                    id = Number($(item).attr("href").match(/view\/(.*?)\./)[1]);
                } catch(err) {
                    id = null;
                };
                id && (hots = [...hots, id]);
            })
            news = await getSqlBasicInfo(news);
            hots = await getSqlBasicInfo(hots);
            obj[type] = {news, hots};
            if(len === index) resolve(obj);
        });
    })
};

// 根据页面的title匹配动漫类型
function matchingStr(str) {
    const regR = /日本/igs;
    const regG = /国产/igs;
    const regD = /电影/igs;
    const regM = /美国/igs;
    switch(true) {
        case regR.test(str):
            return "JP-anime";
        case regG.test(str):
            return "CH-anime";
        case regD.test(str):
            return "MV-anime";
        case regM.test(str):
            return "US-anime";
        default:
            return "";
    }
};

module.exports = {
    getHomePageInfo
}