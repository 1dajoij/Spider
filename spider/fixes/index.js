const cheerio = require("cheerio");

/**
 * 传入详情页，获取到 某个资源的所有播放信息 --- 不应该在这。。。之后改一下
 * @param {*} html 
 * @returns null | {listKey, movielist}
 */
function fixes_movieList(html) {
    // 无播放数据 或出现错误时 返回 空
    const $ = cheerio.load(html);
    const len = $("li [href*=playlist]").length;
    if(len < 1) return null;
    const res = new Array(len).fill(null);
    const keys = new Array(len).fill(null);
    // try{
        $("li [href*=playlist]").each((index, item) => {
            const id = item.attr("href");
            keys[index] = item.text().trim();
            const len = $(id).find("a").length;
            const arr = new Array(len).fill(null);
            $(id).find("a").each((i, el) => {
                arr[i] = el.attr("href");
            });
            res[index] = arr;
        });
    // } catch(err) {
    //     return null;
    // }
    return {
        listKey: keys,
        movielist: res,
    }
};



module.exports = {
    fixes_movieList
}