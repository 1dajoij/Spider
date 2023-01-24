const express = require('express');
const { serverObj, publishList } = require('../../../spider/constant');
const { commonAutoGun, getSqlBasicInfo } = require("../../../untils");
const querySql = require("../../../mysql");
const router = express.Router();

const questErr = {
  code: 400,
  message: "请稍后重试"
};

//  /home
router.get('/home', async function (_, res) {
  const obj = {};
  const recommendList = serverObj.get("recommendList");
  if (!recommendList) { // 基本上不可能没有
    res.send("请稍后重试,或联系管理员。");
    return;
  };
  let i = parseInt(Math.random() * recommendList.length);
  // Math.random() 为 0~1 还是有可能随机到 length的
  i >= recommendList.length ? i = recommendList.length - 1 : i = i;

  // 使用过滤黑名单方法 先过滤一遍 再返回
  try {
    obj["recommendList"] = await getSqlBasicInfo(recommendList[i]);

    const MovieInfo = serverObj.get("MovieInfo");
    obj["MovieInfo"] = MovieInfo;

    res.send({ ...obj, code: 200 });
  } catch(err) {
    res.send(questErr);
  }
});

// /classify
router.post("/classify", async (req, res) => {
  const { limit = "30", offset = "0" } = req.body;
  let { type, classify_name } = req.body;
  let sort = "ASC";
  // 保证type的可行性
  switch (type) {
    case "hot":
      break;
    case "release_data":
      sort = "DESC"
      break;
    default:
      type = "hot"
  };
  // 保证classify_name的可行性
  switch (String(classify_name)) {
    case "1":
      classify_name = publishList[1];
      break;
    case "2":
      classify_name = publishList[2];
      break;
    case "3":
      classify_name = publishList[3];
      break;
    case "4":
      classify_name = publishList[4];
      break;
    default:
      classify_name = null;
  };
  let obj = {};
  try {
    // 不穿classify_name会将所有分类的数据都返回
    if (!classify_name) {
      function* gen() {
        for (let i = 1; i < publishList.length; i++) {
          yield publishList[i];
        }
      };
      commonAutoGun(gen(), async (value, run) => {
        const [{ "count(id)": len }] = await querySql(`
          SELECT count(id) from basic_info
          WHERE type="${value}" 
          AND basic_info.id 
          NOT IN (SELECT id from black_list_movie)
        `);
        const arr = await querySql(`
          SELECT * from basic_info
          WHERE type="${value}" 
          AND basic_info.id 
          NOT IN (SELECT id from black_list_movie)
          ORDER BY ${type} ${sort}
          limit ${limit} offset ${offset}
        `);
        obj[value] = {
          renderList: arr,
          allListLen: len
        };
        run();
      }, () => res.send({
        ...obj,
        code: 200
      }));
    } else {
      const [{ "count(id)": len }] = await querySql(`
        SELECT count(id) from basic_info
        WHERE type="${classify_name}" 
        AND basic_info.id 
        NOT IN (SELECT id from black_list_movie)
      `);
      const arr = await querySql(`
        SELECT * from basic_info
        WHERE type="${classify_name}" 
        AND basic_info.id 
        NOT IN (SELECT id from black_list_movie)
        ORDER BY ${type} ${sort}
        limit ${limit} offset ${offset}
      `);
      obj[classify_name] = {
        renderList: arr,
        allListLen: len
      };
      res.send({
        ...obj,
        code: 200
      })
    };
  } catch(err) {
    res.send(questErr)
  }
});

// /specific
router.post("/specific", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.send({
      code: 400,
      message: "请检查id是否传入"
    });
    return;
  }
  const sqlStr = `
  SELECT * FROM specific_info where id=?
  AND id NOT IN
  (SELECT id from black_list_movie)
  `;
  try{ 
    const res = await querySql(sqlStr, [Number(id)])
    res.send({
      code: 200,
      res 
    });
  } catch(err) {
    res.send({
      code: 400,
      message: "请检查id是否可用"
    })
  }
});

// /search
router.post("/search", async (req, res) => {
  const { name = "", limit = "30", offset = "0" } = req.body;
  try {
    const [{ "count(id)": len }] = await querySql(`
      SELECT count(id) from basic_info
      WHERE name like '%${name}%'
      AND id NOT IN
      (SELECT id from black_list_movie)
    `);
    const sqlStr = `
      SELECT * from basic_info
      WHERE name like '%${name}%'
      AND id NOT IN
      (SELECT id from black_list_movie)
      ORDER BY hot ASC
      limit ${limit} offset ${offset}
    `;
    const arr = await querySql(sqlStr);
    res.send({
      renderList: arr,
      allListLen: len,
      code: 200
    })
  } catch(err) {
    res.send(questErr)
  }
})

// /search_lenovo
router.post("/search_lenovo", async (req, res) => {
  const { name = "" } = req.body;
  try {
    const wordList = await querySql(`
      SELECT name,id from basic_info
      WHERE name LIKE "%${name}%"
      AND id NOT IN
      (SELECT id from black_list_movie)
      ORDER BY hot ASC LIMIT 8
    `);
    res.send({
      wordList,
      code: 200
    })
  } catch(err) {
    res.send(questErr)
  }
});

module.exports = router;