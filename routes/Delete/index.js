const express = require('express');
const querySql = require("../../mysql");
const router = express.Router();

// /black_list
router.post("/black_list", async (req, res) => {
    let {id} = req.body;
    id = Number(id) || 1;
    querySql(`
        DELETE FROM black_list_movie WHERE id=${id}
    `).then(() => res.send({
        code: 200,
        message: `已从黑名单清除id:${id}。`
    })).catch(err => res.send({
        code: 400,
        message: "请检查传入id正确后重试。"
    }));
});

// 


module.exports = router;