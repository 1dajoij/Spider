const express = require('express');
const querySql = require("../../mysql");
const router = express.Router();

const Err = {code: 400, message: "请稍后重试"};

// /black_list
router.post("/black_list", async (req, res) => {
    const {id, type = "evict"} = req.body;
    console.log(id)
    try{
        if(type === "delete") {
            await querySql(`
                UPDATE black_list_movie
                SET isSHOW = 'false'
                WHERE id = ${id}
            `);
            res.send({
                code: 200,
                message: `已将${id}删除。`
            });
        } else {
            await querySql(`
                DELETE FROM black_list_movie WHERE id=${id}
            `);
            res.send({
                code: 200,
                message: `已从黑名单清除id:${id}。`
            });
        }
    } catch(err) {
        res.send(Err);
    };
});

// /feedback_list
router.post("/feedback_list", async (req, res) => {
    const {id} = req.body;
    if(!id) {
        res.send(Err)
        return;
    };
    try {
        const queryStr = `
            DELETE FROM feedback_list WHERE id=${id}
        `;
        await querySql(queryStr);
        res.send({
            code: 200,
            message: "删除成功"
        });
    } catch(err) {
        res.send(Err);
    }
});


module.exports = router;