import address from "./address";
/**
 * @desc 函数防抖
 * @param fn 目标函数
 * @param delay 延迟执行毫秒数
 */
function debounce(fn, delay = 666) {
    let timer;
    return function() {
        let ctx = this;
        let args = arguments;
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            timer = null;
            fn.apply(ctx, args);
        }, delay);
    };
}
/**
 * @description 根据key查找数组中对应的value
 * @param {Array} data 数据集合，必传
 * @param {Any} currentValue 当前值，必传
 * @param {String} currentKey 当前key
 * @param {String} returnKey 需要返回对应的key的值
 * @returns {Any | undefined} 有就返回item的returnKey，反之返回undefined
 */
function exchange({
    data,
    currentValue,
    currentKey = "label",
    returnKey = "value"
}) {
    for (let [, item] of data.entries()) {
        if (currentValue == item[currentKey]) return item[returnKey];
    }
    return undefined;
}
/**
 * @description 校验数据类型
 * @param {String} type 必传，数据类型：notNull（非空）
 * @param {Any} value 必传，需要校验的值
 * @returns {Object} state(校验状态，true校验通过，false校验失败)，value(被校验的值)
 */
function checkType(type, value) {
    let state = true;
    let res = {
        state,
        value
    };
    if (typeof value === "string") {
        value = value.replace(/(^\s*)|(\s*$)/g, "");
    }
    switch (true) {
        case type === "notNull":
            state = !(value !== 0 && !value);
            if (value instanceof Array) {
                state = !!value.length;
            }
            res = { ...res, value, state };
            break;
    }
    return res;
}
/**
 * @description 修改单元格属性
 * @param {Object} properties handsontable单元格属性,https://handsontable.com/docs/6.2.0/Options.html#editor
 * @param {Object} props element-ui组件属性 https://element.eleme.cn/#/zh-CN
 */
function changeCellProperties({
    properties = {
        editor: false,
        readOnly: false
    },
    props = {
        size: "mini"
    }
} = {}) {
    const o = this.$store.state.MapleStore.tableColumn[this.col];
    const { cellProperties = {}, cellProps = {} } =
        this.$store.state.MapleStore.tableData[this.row] || {};

    this.cellProperties = Object.assign(
        this.cellProperties,
        properties,
        o.cellProperties
    );
    this.props = { ...props, ...o.props };

    if (Reflect.has(cellProperties, o.key)) {
        this.cellProperties = Object.assign(
            this.cellProperties,
            properties,
            cellProperties[o.key]
        );
    }
    if (Reflect.has(cellProps, o.key)) {
        this.props = { ...props, ...cellProps[o.key] };
    }
    this.$store.dispatch("disComponentInit", {
        own: this
    });
}
/**
 * @description 判断元素是否在可视区域内
 * @param {Element} el
 */
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
            (window.innerHeight ||
                document.documentElement
                    .clientHeight) /*or $(window).height() */ &&
        rect.right <=
            (window.innerWidth ||
                document.documentElement.clientWidth) /*or $(window).width() */
    );
}
export {
    debounce,
    address,
    exchange,
    checkType,
    changeCellProperties,
    isElementInViewport
};
