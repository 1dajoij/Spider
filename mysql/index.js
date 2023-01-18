let mysql = require('mysql')

let options = {
    host:"localhost",
    user:"root",
    password:"123456",
    database:"yhdm"
}

let db = null;
let pingInterval;

// 如果数据连接出错，则重新连接
function handleError(err) {
    console.error(err);
    connect();
}

// 建立数据库连接
function connect() {
    if (db !== null) {
        db.destroy();
        db = null;
    }

    db = mysql.createConnection(options);
    db.connect(function (err) {
        if (err) {
            console.error(err);
            setTimeout(connect, 2000);
        }
    });
    db.on("error", handleError);

    // 每4个小时ping一次数据库，保持数据库连接状态
    clearInterval(pingInterval);
    pingInterval = setInterval(() => {
        console.log('ping...');
        db.ping((err) => {
            if (err) {
                console.log('ping error: ' + JSON.stringify(err));
            }
        });
    }, 14400000);
}
connect();

querySql = (sqlStr, arr) => {
    return new Promise ((resolve, reject) => {
        db.query(sqlStr, arr, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res)
            }
        })
    })
}

module.exports = querySql;