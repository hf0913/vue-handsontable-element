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

function exchangeSort(key, n) {
    if (!this.options.openSort) return "";
    const { type: sortType, direction } = this.sort[key] || {};
    switch (true) {
        case sortType === 0:
            return direction === n ? `maple-${n}-arrow-default` : "";
        case sortType === 1:
            return direction === n ? `maple-${n}-arrow-select` : "";
        case sortType === -1:
            return direction === n ? `maple-${n}-arrow-select` : "";
    }
}

function colHeaders(col) {
    const item = this.myColumns[col];
    const key = item.key || item.data;
    const { openSort } = this.options || {};

    if (item.subType === "selection" && item.type === "checkbox") {
        this.checkboxAllIndex = col;
        return `<input type="checkbox" id="maple-all-checkbox" index=${col}CDC ${
            this.checkAllabled ? "checked" : ""
        }/>`;
    }
    return `
        <div style="display: flex" class="${
            item.subType !== "handle" && !item.noSort ? "maple-sort" : ""
        }">
            <div index=${col}CDC class="${
        item.subType !== "handle" ? "maple-sort" : ""
    } ${
        item.allowEmpty === false
            ? `maple-required-title maple-required-title-${key}`
            : `maple-title maple-title-${key}`
    } ${
        item.subType !== "handle" && !item.noSort && openSort
            ? "maple-public-title"
            : ""
    }">
                    ${item.title}
                </div>
            <div class="maple-arrow" style="display: ${
                item.subType !== "handle" && !item.noSort && openSort
                    ? ""
                    : "none"
            }">
                <div class="maple-up-arrow ${exchangeSort.call(
                    this,
                    key,
                    "up"
                )}"></div>
                <div class="maple-down-arrow ${exchangeSort.call(
                    this,
                    key,
                    "down"
                )}"></div>
            </div>
            <div class="maple-no-arrow" style="display: ${
                item.subType !== "handle" && !item.noSort && openSort
                    ? "none"
                    : ""
            }"></div>
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
            const sourceFn = (query, process, item, k) => {
                const optionsTotal = item.optionsTotal || 12,
                    labelName = item.labelName || "label";
                let mnemonicCode = item.mnemonicCode || [];
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
                        mnemonicCode = w.mnemonicCode || [];
                        break;
                    }
                }
                if (list.length) {
                    options = list;
                }
                for (let [, v] of options.entries()) {
                    const val = v[labelName] || "";
                    if (!query) {
                        processOpts.push(val);
                        opts.push(v);
                        if (optionsTotal === j) break;
                        j++;
                    }
                    if (query) {
                        let addAbled = val.includes(query);
                        let allow = false;
                        if (mnemonicCode instanceof Array) {
                            mnemonicCode.map(code => {
                                if (v[code] && v[code].includes(query)) {
                                    allow = true;
                                }
                            });
                        }
                        if (addAbled || allow) {
                            processOpts.push(val);
                            opts.push(v);
                            if (optionsTotal === j) break;
                            j++;
                        }
                    }
                    if (query === val) {
                        this.selectVals[`key-${k}-value-${val}`] = v;
                    }
                }
                this.keyOpts[k] = {
                    opts,
                    processOpts
                };
                this.$emit("getSelectOpts", {
                    keyOpts: this.keyOpts,
                    selectVals: this.selectVals,
                    orgSelect: true
                });
                process(processOpts);
            };
            // 下拉框静态优化模式
            item.source = (query, process) => {
                if (
                    query &&
                    this.keyOpts[k] &&
                    this.keyOpts[k].query === query &&
                    this.keyOpts[k].key === k
                ) {
                    process(this.keyOpts[k].processOpts);
                } else {
                    sourceFn(query, process, item, k);
                }
            };
        }
        if (
            item.subType === "datePicker" ||
            item.subType === "cascader" ||
            item.subType === "address" ||
            item.subType === "select"
        ) {
            item.validator = (value, callback) => {
                callback(
                    utils.checkType.call(this, {
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
            item.subType !== "handle" &&
            item.subType !== "select"
        ) {
            item.validator = (value, callback) => {
                const vaild = item.allowEmpty === false ? !!value : true;
                if (vaild && item.maxLength) {
                    value = value + "";
                    return callback(value.length <= item.maxLength);
                }
                callback(vaild);
            };
        }
        if (item.type === "numeric" && item.subType !== "text") {
            item.validator = (value, callback) => {
                callback(
                    utils.checkType.call(this, {
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

        item = {
            ...item,
            data: item.key || item.data,
            width: this.widthAuto ? item._width : item.width,
            myTitle: item.title,
            title: null,
            visibleRows: item.visibleRows || 6
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
    afterOnCellMouseDown,
    getColumns
};
