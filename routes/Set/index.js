const express = require('express');
const querySql = require("../../mysql");
const router = express.Router();

// /black_list
router.post("/black_list", async (req, res) => {
    let {id} = req.body;
    id = Number(id) || 0;
    const [{"count(id)": n}] = await querySql(`
        SELECT count(id) from basic_info WHERE id = ${id}
    `);
    !n && (id = 0);
    if(!id) {
        res.send({
            code: 400,
            message: "请输入存在的id"
        });
        return;
    };
    const [{"count(id)": len}] = await querySql(`
        SELECT count(id) from black_list_movie WHERE id=${id}
    `);
    if(len) {
        res.send({
            code: 400,
            message: "此资源已被添加至黑名单。"
        });
        return;
    } else {
        querySql(`
            INSERT INTO black_list_movie (id) VALUES (${id})
        `).then(() => res.send({
            code: 200,
            message: `已将id:${id}列入黑名单。`
        })).catch(err => res.send({
            code: 400,
            message: "发生未知错误，请稍后重试。"
        }));
    }
});

// /updata_info
router.post("/updata_info", async (req, res) => {
    const {id, key, newvalue, type} = req.body;
    let tableName;
    if(Number(type) === 1) {
        tableName = "basic_info"
    } else if(Number(type) === 2) {
        tableName = "specific_info"
    } else {
        tableName = "basic_info"
    };
    try {
        await querySql(`UPDATE ${tableName} SET ${key} = ${newvalue} WHERE id = ${id}`);
        res.send({code: 200, message: `${tableName}表：${id}的${key}字段已更新为${newvalue}`});
    } catch (err) {
        res.send({code: 400, message: "请检查参数是否正确"});
    }
});


module.exports = router;