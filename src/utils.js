/**
 * @description 根据键名和键值，在数组中查询并返回item
 * @param {Array} data 查询数据集合
 * @param {Any} currentValue 当前键值
 * @param {String} currentKey 当前键名
 * @returns {Object} 返回符合条件的item
 */
function exchange({ data, currentValue, currentKey }) {
    let o = {};

    for (let item of data.values()) {
        if (item[currentKey] == currentValue) {
            o = item;
            break;
        }
    }

    return o;
}

const maple = {
    exchange
};

export default maple;
