const express = require('express');
const querySql = require("../../../mysql");
const router = express.Router();
// 最后对这里的数据再加一层验证

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
router.post("/black_list", async (_, res) => {
  try {
    const blackList = await querySql(`
      SELECT (id) from black_list_movie
    `);
    res.send({
      code: 200,
      blackList
    })
  } catch(err) {
    res.send({
      code: 400,
      message: "请检查参数是否正确"
    })
  }
});

// /errorinfo_id_list
router.post("/errorinfo_id_list", async (_, res) => {
  try {
    const [{"count(id)": len}] = await querySql(`
      SELECT count(id) from error_singlepage_list
    `);
    const queryStr = `
      SELECT * from error_singlepage_list
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
      message: "请检查参数是否正确"
    })
  }
});

// /error_episodes_list
router.post("/error_episodes_list", async (_, res) => {
  try {
    const [{"count(id)": len}] = await querySql(`
      SELECT count(id) from error_episodes_list
    `);
    const queryStr = `
      SELECT * from error_episodes_list
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
      message: "请检查参数是否正确"
    })
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
  // 保证在 tableName表中有 key字段
  try {
    const [{[key]: k}] = await querySql(`SELECT ${key} from ${tableName} WHERE id = ${id}`);
    console.log(k)
    await querySql(`UPDATE ${tableName} SET ${key} = ${newvalue} WHERE id = ${id}`);
    res.send({code: 200, message: `${tableName}表：${id}的${key}字段已更新为${newvalue}`});
  } catch (err) {
    res.send({code: 400, message: "请检查参数是否正确"});
  }
});

module.exports = router;