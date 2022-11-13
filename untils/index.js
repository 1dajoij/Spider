const fs = require("fs");

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

module.exports = {
    card_href,
    skip_href,
    Readfs
}