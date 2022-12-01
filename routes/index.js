var express = require('express');
const { serverObj, publishList } = require('../spider/constant');
const {commonAutoGun} = require("../untils");
const querySql = require("../mysql");
var router = express.Router();

//   /home
router.get('/home', function(req, res) {
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
  obj["recommendList"] = recommendList[i];

  const MovieInfo = serverObj.get("MovieInfo");
  obj["MovieInfo"] = MovieInfo;

  res.send(obj);
});

// /classify
router.get("/classify", async (req, res) => {
  const {limit = "30", offset = "0", type = "hot"} = req.query;
  let obj = {};
  function *gen() {
    for(let i = 1;i < publishList.length;i++) {
      yield publishList[i];
    }
  };
  try{
    commonAutoGun(gen(), async (value, run) => {
      const arr = await querySql(`
        SELECT * from black_list_movie AS b, basic_info AS a
        WHERE type="${value}" AND b.id != a.id ORDER BY ${type} ASC
        limit ${limit} offset ${offset};
      `);
      obj[value] = arr;
      run();
    }, () => res.send(obj));
  } catch(err) {
    res.send("请传入正确的参数重试！！！");
  }
})

module.exports = router;