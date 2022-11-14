const {skip_href} = require("../../untils");
const {publishList} = require("../constant");
const axios = require("../index");
const Pubsub = require("pubsub-js");


function *gen(id, len) {
    for(let i = 0;i < len;i++) {
        yield axios.get(skip_href(id, i+1));
    };
};


/**
 * 
 * @param {对应各种分类的id} id 
 * @param {page页数} len 
 * @param {回调函数} callback 
 */
function autoRun(id, len, callback) {
    const g = gen(id, len);
    let counter = 0;
    run(callback);
    const pubsub = Pubsub.subscribe("sql_end", (_, data) => {
        counter++;
        run(callback)
    });
    function run(callback) {
        const _next = g.next();
        if(!_next.done) {
            _next.value.then(res => {
                callback(res, counter, publishList[id]);
            });
        } else {
            // 停止订阅
            Pubsub.unsubscribe(pubsub);
            Pubsub.publish("pages_end", publishList[id])
        }
    }
}

module.exports = autoRun