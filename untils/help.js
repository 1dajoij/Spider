// 做一些因为某些原因导致数据库数据出现问题的补救操作
const querySql = require("../mysql");
const {autoIdRun} = require("../pubsub/processing");

(async () => {
    const queryStr = `
        SELECT id,name from basic_info WHERE id > 10034
    `;
    const res = await querySql(queryStr)
    console.log("开始更新数据库！！！");
    autoIdRun(res, false, true);
})()