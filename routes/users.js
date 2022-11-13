const express = require('express');
const axios = require("../spider");
const cheerio = require("cheerio");
const { json } = require('express');
const router = express.Router();


/* GET users listing. */
router.get('/', async function(req, res, next) {
  const html = await axios.get("/");
  const $ = cheerio.load(html);
  let basic_info = [];
  // 樱花动漫每个 card 爬取有用信息
  const len = $(".myui-vodlist").find(".myui-vodlist__box").toString();
  // $(".myui-vodlist").find(".myui-vodlist__box").each((index, item) => {
  //   const obj = {};
  //   obj.id = uuid.v4();
  //   obj.href = $(item).find(".myui-vodlist__thumb").attr("href");
  //   obj.title = $(item).find(".myui-vodlist__thumb").attr("title");
  //   obj.picUrl = $(item).find(".myui-vodlist__thumb").attr("data-original");
  //   obj.score = $(item).find(".tag:first").text();
  //   obj.releaseDate = $(item).find(".tag:last").text();
  //   obj.updateStatus = $(item).find(".pic-text").text();
  //   obj.starring = $(item).find(".myui-vodlist__detail p").text().match(/：(.*)/)[1].split(",");
  //   basic_info = [...basic_info, obj]
  // });
  res.send(len)
});

module.exports = router;
