import utils from "./index";
import maple from "handsontable";

function getColumns(t) {
    let _cols = [];
    if (!t) this.myColumns = JSON.parse(JSON.stringify(this.columns));
    if (this.options.cacheId && this.options.openCache) {
        _cols = JSON.parse(
            localStorage.getItem(`${this.options.cacheId}-columns`) || "[]"
        );
        if (_cols.length && !t) this.myColumns = _cols;
    }
    if (!_cols.length) _cols = this.myColumns;
    return _cols;
}

function exchangeSort(col) {
    if (!this.options.openSort) return "";
    const { type: sortType } = this.sort[col] || {};
    switch (true) {
        case !sortType:
            return "";
        case sortType === 1:
            return "maple-up-arrow";
        case sortType === -1:
            return "maple-down-arrow";
    }
}

function colHeaders(col) {
    const item = this.myColumns[col];
    if (item.subType === "selection" && item.type === "checkbox") {
        this.checkboxAllIndex = col;
        return `<input type="checkbox" id="maple-all-checkbox" index=${col}CDC ${
            this.checkAllabled ? "checked" : ""
        }/>`;
    }
    return `
        <div style="display: flex" class="${
            item.subType !== "handle" ? "maple-sort" : ""
        }">
            <span index=${col}CDC class="${
        item.subType !== "handle" ? "maple-sort" : ""
    } ${
        item.allowEmpty === false
            ? `maple-required-title maple-required-title-${col}`
            : `maple-title maple-title-${col}`
    }">
                    ${item.title}
                </span>
            <div class="${exchangeSort.call(this, col)}">
            <div>
        </div>
    `;
}

function customColumns() {
    const columns = [];

    getColumns.call(this);
    this.myColumns.map(item => {
        const k = item.key || item.data;
        if (
            item.subType === "optimize" &&
            (item.type === "autocomplete" || item.type === "dropdown")
        ) {
            // 下拉框静态优化模式
            item.source = (query, process) => {
                const optionsTotal = item.optionsTotal || 6,
                    labelName = item.labelName || "label";
                let options = [],
                    j = 1,
                    processOpts = [],
                    opts = [];
                let list = [];
                for (let [, w] of this.columns.entries()) {
                    if (w.key === k || w.data === k) {
                        const wOptions = w.options || w.source;
                        list =
                            wOptions instanceof Function
                                ? wOptions()
                                : wOptions;
                        break;
                    }
                }
                if (
                    query &&
                    this.keyOpts[k] &&
                    this.keyOpts[k].query === query &&
                    this.keyOpts[k].key === k
                ) {
                    return process(this.keyOpts[k].processOpts);
                }
                if (list.length) {
                    options = list;
                }
                for (let [, v] of options.entries()) {
                    const val = v[labelName];
                    if (!query) {
                        processOpts.push(val);
                        opts.push(v);
                        if (optionsTotal === j) break;
                        j++;
                    }
                    if (query && val.includes(query)) {
                        processOpts.push(val);
                        opts.push(v);
                        if (optionsTotal === j) break;
                        j++;
                    }
                    if (query === val) {
                        this.selectVals[`key-${k}value-${val}`] = v;
                    }
                }
                this.keyOpts[k] = {
                    opts,
                    processOpts,
                    query,
                    key: k
                };
                this.$emit("getSelectOpts", {
                    keyOpts: this.keyOpts,
                    selectVals: this.selectVals
                });
                process(processOpts);
            };
        }
        if (
            item.subType === "datePicker" ||
            item.subType === "cascader" ||
            item.subType === "address"
        ) {
            item.validator = (value, callback) => {
                callback(
                    utils.checkType({
                        value,
                        item
                    })
                );
            };
        }
        if (
            (item.type === "text" || !item.type || item.subType === "text") &&
            item.subType !== "datePicker" &&
            item.subType !== "cascader" &&
            item.subType !== "address" &&
            item.subType !== "handle"
        ) {
            item.type = "numeric";
            item.subType = "text";
            item.validator = (value, callback) => {
                item.allowEmpty === false ? callback(!!value) : callback(true);
            };
        }
        if (item.type === "numeric" && item.subType !== "text") {
            item.validator = (value, callback) => {
                callback(
                    utils.checkType({
                        value,
                        item
                    })
                );
            };
        }
        if (item.subType === "handle") {
            // eslint-disable-next-line no-unused-vars
            item.renderer = (instance, td, row, col, cellProperties) => {
                cellProperties = Object.assign(cellProperties, {
                    readOnly: true,
                    editor: true
                });

                let $el = document.createElement("DIV");
                $el.style.height = "100%";
                $el.style.display = "flex";
                $el.style.justifyContent = "space-around";
                $el.style.alignItems = "center";

                if (this.hasColumnSummary && row === instance.countRows() - 1) {
                    maple.dom.empty(td);
                    td.innerHTML = "合计";
                    td.setAttribute("class", "maple-table-total");
                    td.parentElement &&
                        td.parentElement.setAttribute(
                            "class",
                            "maple-table-total-tr"
                        );
                    return td;
                }
                item.options.map(({ name, color }, index) => {
                    let $btn = document.createElement("DIV");
                    $btn.innerHTML = name;
                    $btn.style.color = color;
                    $btn.style.cursor = "pointer";
                    $el.append($btn);

                    maple.dom.addEvent($btn, "mousedown", event => {
                        this.$emit("click", {
                            row,
                            col,
                            index,
                            $el: $btn,
                            event,
                            core: instance,
                            name
                        });
                        event.stopPropagation && event.stopPropagation();
                        event.cancelBubble = true;
                    });
                });

                maple.dom.empty(td);
                td.appendChild($el);

                return td;
            };
        }
        if (item.subType === "ajax" && item.type === "dropdown") {
            let opts = [];
            let processOpts = [];
            item.source = (query, process) => {
                if (
                    this.keyOpts[k] &&
                    this.keyOpts[k].query === query &&
                    this.keyOpts[k].key === k
                ) {
                    return process(this.keyOpts[k].processOpts);
                }
                let { queryField, data, param } = item.ajaxConfig;
                const fn = (k, v) => {
                    if (v && Reflect.has(v, queryField)) {
                        item.ajaxConfig = {
                            ...item.ajaxConfig,
                            [k]: {
                                ...v,
                                [queryField]: query
                            }
                        };
                    }
                };

                fn("data", data);
                fn("param", param);
                utils.ajax(item.ajaxConfig).then(v => {
                    processOpts = v.map(m => {
                        const val = m[item.labelName];
                        opts.push(m);
                        if (query === val) {
                            this.selectVals[`key-${k}value-${val}`] = v;
                        }
                        return val;
                    });
                    process(processOpts);
                    this.keyOpts[k] = {
                        opts,
                        processOpts,
                        query,
                        key: k
                    };
                    this.$emit("getSelectOpts", {
                        keyOpts: this.keyOpts,
                        selectVals: this.selectVals
                    });
                });
            };
        }

        item = {
            ...item,
            data: item.key || item.data,
            width: this.widthAuto ? item._width : item.width,
            myTitle: item.title,
            title: null
        };
        columns.push(item);
    });
    return columns;
}

function beforeChange(changes, source) {
    const o = {
        source,
        changes,
        core: this.core,
        type: "beforeChange",
        getKeyChange: this.getKeyChange,
        filterKeysChanges: this.filterKeysChanges
    };
    this.sum(o);
    this.$emit("change", o);
}

function afterValidate(isValid, value, row, prop) {
    const k = `row-${row}-key-${prop}`;
    const customValidate = this.settings.customValidate;
    let state = isValid;
    if (customValidate instanceof Function) {
        state = customValidate({
            isValid,
            value,
            row,
            key: prop
        });
    }
    if (!state) {
        this.validate[k] = false;
    }
    if (Reflect.has(this.validate, k) && state && !this.validate[k]) {
        delete this.validate[k];
    }
    return state;
}

function afterOnCellMouseDown(event, coords, $el) {
    const { row, col } = coords;

    this.$emit("click", {
        col,
        row,
        $el,
        core: this.core,
        name: "cells",
        event,
        type: "click"
    });
}

export {
    colHeaders,
    customColumns,
    beforeChange,
    afterValidate,
    afterOnCellMouseDown,
    getColumns
};
