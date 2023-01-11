const express = require('express');
const querySql = require("../../mysql");
const router = express.Router();

// /black_list - evict
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
        res.send({
            code: 400,
            message: "请传入正确id后重试"
        });
    };
});


module.exports = router;