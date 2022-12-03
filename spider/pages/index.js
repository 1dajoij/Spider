const axios = require("../index.js");
const Pubsub = require("pubsub-js");
const {requestlist:list, publishList} = require("../constant");

function * request(list) {
    for(let i = 0;i < list.length;i++) {
        yield axios.get(list[i]);
    };
};

let gen = request(list);

function Run(gen, counter=0) {
    const _next = gen.next();
    if(!_next.done) {
        const str = publishList[counter];
        _next.value.then(res => {
            Pubsub.publish(str, res);
            counter++;
            Run(gen, counter);
        })
    };
};

const autoRun = () => {
    Run(gen);
}
autoRun();
module.exports = autoRun;