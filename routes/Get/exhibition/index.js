const express = require('express');
const { serverObj, publishList } = require('../../../spider/constant');
const {commonAutoGun, getSqlBasicInfo} = require("../../../untils");
const querySql = require("../../../mysql");
const router = express.Router();


//  /home
router.get('/home', async function(_, res) {
  const obj = {};
  const recommendList =  serverObj.get("recommendList");
  if(!recommendList){ // 基本上不可能没有
    // 重新获取一遍
    Pubsub.publish("home-start");
    res.send("请稍后重试!!!");
  };
  let i = parseInt(Math.random()*recommendList.length);
  // Math.random() 为 0~1 还是有可能随机到 length的
  i >= recommendList.length ? i = recommendList.length-1 : i = i;
  
  // 使用过滤黑名单方法 先过滤一遍 再返回
  obj["recommendList"] = await getSqlBasicInfo(recommendList[i]);

  const MovieInfo = serverObj.get("MovieInfo");
  obj["MovieInfo"] = MovieInfo;

  res.send({...obj, code:200});
});

// /classify
router.post("/classify", async (req, res) => {
  const {limit = "30", offset = "0"} = req.body;
  let {type, classify_name} = req.body;
  let sort = "ASC";
  // 保证type的可行性
  switch(type) {
    case "hot":
      break;
    case "release_data":
      sort = "DESC"
      break;
    default:
      type = "hot"
  };
  // 保证classify_name的可行性
  switch(classify_name) {
    case "4":
      classify_name = publishList[4];
      break;
    case "1":
      classify_name = publishList[1];
      break;
    case "2":
      classify_name = publishList[2];
      break;
    case "3":
      classify_name = publishList[3];
      break;
    default:
      classify_name = null;
  };
  let obj = {};
  // 不穿classify_name会将所有分类的数据都返回
  if(!classify_name) {
    function *gen() {
      for(let i = 1;i < publishList.length;i++) {
        yield publishList[i];
      }
    };
    commonAutoGun(gen(), async (value, run) => {
      const [{"count(id)": len}] = await querySql(`
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
    const [{"count(id)": len}] = await querySql(`
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
});

// /specific
router.post("/specific", async (req, res) => {
  const {id} = req.body;
  if(!id) res.send({code: 400});
  const sqlStr = `
  SELECT * FROM specific_info where id=?
  `;
  res.send({
    code: 200,
    res: await querySql(sqlStr, [Number(id)])
  })
});

// /search
router.post("/search", async (req, res) => {
  const {name="",limit = "30", offset = "0"} = req.body;
  const [{"count(id)": len}] = await querySql(`
    SELECT count(id) from basic_info
    WHERE name like '%${name}%'
  `);
  const sqlStr = `
    SELECT * from basic_info
    WHERE name like '%${name}%'
    ORDER BY hot ASC
    limit ${limit} offset ${offset}
  `;
  const arr = await querySql(sqlStr);
  res.send({
    renderList: arr,
    allListLen: len,
    code: 200
  })
})

// /search_lenovo
router.post("/search_lenovo", async (req, res) => {
  const {name=""} = req.body;
  const wordList = await querySql(`
    SELECT name,id from basic_info
    WHERE name LIKE "%${name}%"
    ORDER BY hot ASC LIMIT 8
  `);
  res.send({
    wordList,
    code: 200
  })
});

module.exports = router;