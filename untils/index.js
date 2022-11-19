const fs = require("fs");
const querySql = require("../mysql");

const card_href = (id) => {
    return `/view/${id}.html`
};

const skip_href = (id, page) => {
    return `/so.asp?id=${id}&page=${page}&pl=hit`
};

const Readfs = (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, {
            encoding: "utf-8",
            flag: 'r'
        }, (err, data) => {
            if (err) { // 失败
                reject(err)
            } else { // 成功
                resolve(data)
            }
        })
    })
};

const wait = time => {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res();
        }, time)
    })
};

// 从播放页面获取播放链接信息
const get_movie_url = (html) => {
    return html.match(/\},"url":"(.*?)","url_next"/)[1].replace(/\\/g,"");
}

/**
 * 未匹配到字符串类型的 true|false 默认返回false
 * @param {接受字符串类型的 true|false} str 
 * @returns Boolean
 */
const str_invertBool = (str) => {
    switch (str) {
        case "true":
            return true;
        case "false":
            return false;
        default:
            return false;
    }    
}

/**
 * 对 请求页面错误时的处理
 * @param {分类 只能传入(0, 1, 2)} classify 
 * @param {与classify相关({page,type},{pageId},{pageId, episodes})} errInfo 
 * @returns Promise err 信息需要打印
 */
const err_handling = (classify, errInfo) => {
    return new Promise((resolve, reject) => {
        let queryStr;
        switch (classify) {
            case 0:
                const {page, type} = errInfo;
                queryStr = `insert into error_pages_list (page,type) values (?,?)`;
                querySql(queryStr, [Number(page), type]).then(res => {
                    console.log(`${type}类型的${page}页爬取出现问题,请及时修复!!!`);
                    resolve();
                }).catch(err => {
                    reject("mysql发生未知错误!!!");
                });
                break;
            case 1:
                const {pageId} = errInfo;
                queryStr = `insert into error_singlepage_list (pageId) values (?)`;
                querySql(queryStr, [Number(pageId)]).then(res => {
                    console.log(`id为${pageId}的详情页爬取出现问题,请及时修复!!!`);
                    resolve();
                }).catch(err => {
                    reject("mysql发生未知错误!!!");
                });
                break;
            case 2:
                const {id, episodes} = errInfo;
                queryStr = `select (episodes) from error_episodes_list where pageId=${id}`;
                querySql(queryStr).then(res => {
                    // 此页面已经有过错误数据了
                    if(res.length) {
                        let str = `${res[0].episodes}&${episodes}`;
                        queryStr = `update error_episodes_list set episodes=? where pageId=${id}`;
                        querySql(queryStr,[str]).then(res => {
                            console.log(`更新: id为${id}的第${episodes}集爬取出现问题,请及时修复!!!`);
                            resolve();
                        })
                    } else {
                        queryStr = `insert into error_episodes_list (pageId, episodes) values (?,?)`;
                        querySql(queryStr, [id, episodes]).then(res => {
                            console.log(`新增: id为${id}的第${episodes}集爬取出现问题,请及时修复!!!`);
                            resolve();
                        })
                    }
                }).catch(err => {
                    reject("mysql发生未知错误!!!");
                });
                break;
            default :
                reject("请将第一个参数改为[0,1,2]其中一个");
                break;
        }
    });
}

module.exports = {
    card_href,
    skip_href,
    Readfs,
    wait,
    err_handling,
    str_invertBool,
    get_movie_url
}