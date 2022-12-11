const querySql = require("../mysql");

function k(str) {
    const arr = str.split("&");
    let tmp = [];
    arr.forEach((item, index) => {
        if(item == "" || !item) {
            tmp.push(index);
        };
    });
    return tmp;
};

(async () => {
    const list = await querySql(`
        SELECT id, episodes from specific_info 
        WHERE id IN (
            SELECT pageId from error_episodes_list
            WHERE episodes NOT like "%暂无资源%"
        )
    `);
    list.forEach(async (item, i) => {
        const str = k(item.episodes).join("&");
        if(!str || !str.length) {
            console.log(`DELETE --- ${str} --- ${item.id}`)
            await querySql(`DELETE from error_episodes_list WHERE pageId=${item.id}`)
        } else {
            console.log(`UPDATA --- ${str} --- ${item.id}`)
            await querySql(`
                update error_episodes_list set episodes=? where pageId=${item.id}
            `, [str]);
        }
        
    })
})()