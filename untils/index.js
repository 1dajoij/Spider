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

// 根据 len 数量返回 "(?,?,?...)" 这种格式
const sqlVarsStr = len => {
    let str = "(?"
    for(let i = 1;i < len;i++) {
        str += ",?"
    };
    str += ")";
    return str;
}

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
 * @param {分类 只能传入(0, 1, 2, 3)} classify 
 * @param {与classify相关({page,type},{pageId},{pageId, episodes},{id})} errInfo 
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
                    reject(err);
                });
                break;
            case 1:
                const {pageId} = errInfo;
                queryStr = `insert into error_singlepage_list (pageId) values (?)`;
                querySql(queryStr, [Number(pageId)]).then(res => {
                    console.log(`id为${pageId}的详情页爬取出现问题,请及时修复!!!`);
                    resolve();
                }).catch(err => {
                    reject(err);
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
                    reject(err);
                });
                break;
            case 3: 
                const {id:_id} = errInfo;
                queryStr = `select * from black_list_movie where id=${_id}`;
                querySql(queryStr).then(res => {
                    // 将此动漫拉入黑名单
                    if(!res.length) {
                        queryStr = `insert into black_list_movie (id) values (?)`;
                        querySql(queryStr, [_id]).then(res => {
                            console.log(`${_id}已被拉入黑名单`);
                            resolve();
                        })
                    }
                }).catch(err => {
                    reject(err);
                });
                break;
            default :
                reject("请将第一个参数改为[0,1,2]其中一个");
                break;
        }
    });
}

// 对黑名单的过滤
const blacklist_filtering = arr => {
    return new Promise((resolve, reject) => {
        if(!arr.length) {
            resolve(arr);
        };
        const sqlStr = `SELECT id from black_list_movie where id in ${sqlVarsStr(arr.length)}`;
        querySql(sqlStr, arr).then(res => {
            if(res.length) {
                res = res.map(item => {
                    return item.id
                });
                arr = arr.filter((item, index) => {
                    if(!res.includes(item)) {
                        return item
                    }
                });
            };
            resolve(arr);
        }).catch(err => {
            console.log("sql发生未知错误");
            resolve(arr);
        });
    })
};

// 根据id取出sql中的基础信息
/**
 * 
 * @param {Array[number],Number} data 
 * @returns Array[Object]
 */
const getSqlBasicInfo = data => {
    return new Promise((resolve, reject) => {
        let sqlStr, arrData;
        if(data instanceof Number) {
            sqlStr = `Select * FROM basic_info WHERE id = ?`;
            arrData = [data];
        } else if(data instanceof Array) {
            sqlStr = `Select * FROM basic_info WHERE id in ${sqlVarsStr(data.length)}`;
            arrData = [...data];
        } else {
            resolve([]);
        };
        querySql(sqlStr, arrData).then(res => {
            resolve(res);
        }).catch(err => {
            resolve([]);
        });
    });
}


/**
 * 
 * @param {任意的生成器} g 
 * @param {回调函数,有两个参数需要接收,生成器的值和调用生成器继续进行的函数} callback 
 * @param {生成器结束时调用的函数, 可以不穿} lastFn
 */
const commonAutoGun = (g, callback, lastFn) => {
    run();
    function run() {
        const _next = g.next();
        if(!_next.done) {
            callback(_next.value, run);
        } else {
            lastFn && lastFn();
        }
    }
};

module.exports = {
    card_href,
    skip_href,
    Readfs,
    wait,
    sqlVarsStr,
    err_handling,
    str_invertBool,
    get_movie_url,
    blacklist_filtering,
    getSqlBasicInfo,
    commonAutoGun
}