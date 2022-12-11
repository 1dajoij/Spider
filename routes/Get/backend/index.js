const express = require('express');
const querySql = require("../../../mysql");
const router = express.Router();
// 最后对这里的数据再加一层验证

// /info_list
router.post("/info_list", async (req, res) => {
  const {limit = "30", offset = "0"} = req.query;
  let {type} = req.query;
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
});

// /id_search
router.post("/id_search", async(req, res) => {
  const {id} = req.query;
  if(!id) {
    res.send({
      code: 400,
      message: "请传入id！"
    });
    return;
  }
  let {type} = req.query;
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
  `;
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
});

// /black_list
router.post("/black_list", async (_, res) => {
  const blackList = await querySql(`
    SELECT (id) from black_list_movie
  `);
  res.send({
    code: 200,
    blackList
  })
});

// /errorinfo_id_list
router.post("/errorinfo_id_list", async (_, res) => {
  const [{"count(id)": len}] = await querySql(`
    SELECT count(id) from error_singlepage_list
  `);
  const queryStr = `
    SELECT * from error_singlepage_list
  `;
  const res = await querySql(queryStr);
  res.send({
    code: 200,
    res,
    length: len
  });
});

// /error_episodes_list
router.post("/error_episodes_list", async (_, res) => {
  const [{"count(id)": len}] = await querySql(`
    SELECT count(id) from error_episodes_list
  `);
  const queryStr = `
    SELECT * from error_episodes_list
  `;
  const res = await querySql(queryStr);
  res.send({
    code: 200,
    res,
    length: len
  });
});

module.exports = router;