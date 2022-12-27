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