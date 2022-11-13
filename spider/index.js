const axios = require("axios");

axios.defaults.baseURL = "http://www.dmh8.me";


axios.interceptors.request.use(function (config) {
  config.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36";
  config.headers["Upgrade-Insecure-Requests"] = 1;
  config.headers["Accept-Encoding"] = "gzip, deflate";
  return config;
}, function (error) {
  return Promise.reject(error);
});

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
  return response.data;
}, function (error) {
  return Promise.reject(error);
});

module.exports = axios;