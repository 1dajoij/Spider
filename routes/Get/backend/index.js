const express = require('express');
const querySql = require("../../../mysql");
const router = express.Router();

// /info_list
router.post("/info_list", async (req, res) => {
  const {limit = "30", offset = "0"} = req.body;
  let {type} = req.body;
  switch(Number(type)) {
    case 1: 
      type = "basic_info";
      break;
    case 2:
      type = "specific_info";
      break;
    default:
      type = "basic_info";
  }
  try {
    const queryStr = `
      SELECT * from ${type}
      WHERE id NOT IN
      (SELECT id from black_list_movie)
      ORDER BY id DESC
      limit ${limit} offset ${offset}
    `;
    const [{"count(id)": len}] = await querySql(`
      SELECT count(id) from ${type}
    `)
    const infoList = await querySql(queryStr);
    res.send({
      code: 200,
      infoList,
      allLength: len
    })
  } catch(err) {
    res.send({
      code: 400,
      message: "请检查参数是否正确"
    })
  }
});

// /id_search
router.post("/id_search", async(req, res) => {
  const {id} = req.body;
  if(!id) {
    res.send({
      code: 400,
      message: "请传入id！"
    });
    return;
  }
  let {type} = req.body;
  switch(Number(type)) {
    case 1: 
      type = "basic_info";
      break;
    case 2:
      type = "specific_info";
      break;
    default:
      type = "basic_info";
  }
  const queryStr = `
    SELECT * from ${type}
    WHERE id = ${id}
    AND id NOT IN
    (SELECT id from black_list_movie)
  `;
  try {
    const list = await querySql(queryStr);
    if(!list.length) {
      res.send({
        code: 400,
        message: "请检查传入id是否正确!"
      });
      return;
    }
    res.send({
      code: 200,
      list
    })
  } catch(err) {
    res.send({
      code: 400,
      message: "请检查参数是否正确"
    })
  }
});

// /black_list
router.post("/black_list", async (req, res) => {
  try {
    const {limit = 30, offset = 0} = req.body;
    const [{"count(id)": allLength}] = await querySql(`
      SELECT count(id) FROM black_list_movie
    `);
    const infoList = await querySql(`
      SELECT * from basic_info
      WHERE id IN
      (
        SELECT id from black_list_movie
        WHERE isShow = true
      )
      ORDER BY id DESC
      limit ${limit} offset ${offset}
    `);
    res.send({
      code: 200,
      infoList,
      allLength
    })
  } catch(err) {
    res.send({
      code: 400,
      message: "请检查参数是否正确"
    })
  }
});

// /filter
router.post("/filter", async (req, res) => {
  const {key, word, offset = 0, limit = 30, type = 1} = req.body;
  let tableName;
  if(Number(type) === 1) {
    tableName = "basic_info"
  } else if(Number(type) === 2) {
    tableName = "specific_info"
  } else {
    tableName = "basic_info"
  };
  try {
    const queryStr = `
      SELECT * from ${tableName}
      WHERE ${key} LIKE '%${word}%'
      AND id NOT IN
      (SELECT id from black_list_movie)
      ORDER BY id DESC
      limit ${limit} offset ${offset}
    `;
    const [{"count(id)": allLength}] = await querySql(`
      SELECT count(id) from ${tableName}
      WHERE ${key} LIKE '%${word}%'
      AND id NOT IN
      (SELECT id from black_list_movie)
    `
    );
    const infoList = await querySql(queryStr);
    res.send({
      code: 200,
      infoList,
      allLength
    })
  } catch(err) {
    res.send({code: 400, message: "请检查参数是否正确"});
  }
});

// /error_episodes_list
router.post("/error_episodes_list", async (req, res) => {
  const {limit = 30, offset = 0} = req.body;
  try {
    const [{"count(id)": len}] = await querySql(`
      SELECT count(id) from error_episodes_list
    `);
    const queryStr = `
      SELECT * from error_episodes_list
      ORDER BY id DESC
      limit ${limit} offset ${offset}
    `;
    const list = await querySql(queryStr);
    res.send({
      code: 200,
      list,
      length: len
    });
  } catch(err) {
    res.send({
      code: 400,
      message: "网络出现问题，请稍后重试"
    })
  }
});

// /feedback_list
// SELECT FROM_UNIXTIME(1673415010) 时间戳转日期
router.post("/feedback_list", async (req, res) => {
    const {limit = 30, offset = 0} = req.body;
    try {
      const [{"count(id)": len}] = await querySql(
        `SELECT count(id) FROM feedback_list`
      );
      let list = await querySql(`
        SELECT * FROM feedback_list
        ORDER BY id DESC
        limit ${limit} offset ${offset}
        `
      );
      res.send({
        code: 200,
        list,
        length: len
      });
    } catch(err) {
      res.send({
        code: 400,
        message: "网络出现问题，请稍后重试"
      });
    }
});

module.exports = router;