<template>
    <div id="maple-table">
        <hot-table :settings="settings" ref="mapleTable" :style="customStyle" />
        <MapleDatePicker
            ref="datePickerRef"
            @change="v => (stopKeyEvent = v)"
        />
        <MapleCascader
            ref="cascaderRef"
            @getCascaderVals="getCascaderVals"
            @change="v => (stopKeyEvent = v)"
        />
        <MapleSelect
            ref="selectRef"
            @getSelectOpts="getSelectOpts"
            @change="v => (stopKeyEvent = v)"
        />
        <div class="empty" v-show="showEmpty">暂无数据</div>
    </div>
</template>

<script>
import { HotTable } from "@handsontable/vue";
import _ from "./utils";
import MapleCascader from "./components/MapleCascader";
import MapleDatePicker from "./components/MapleDatePicker";
import MapleSelect from "./components/MapleSelect";
import { colHeaders, customColumns, getColumns } from "./utils/handsontable";

export default {
    name: "MapleHandsontable",
    props: {
        columns: {
            required: true,
            type: Array
        },
        data: {
            required: true,
            type: Array
        },
        options: {
            type: Object
        },
        selectBoxConfig: {
            type: Object,
            default: () => ({ key: "mapleChecked", col: 0 })
        },
        fixViewTime: {
            type: Number,
            default: 128
        },
        widthAuto: {
            type: Boolean
        },
        customStyle: {
            type: Object
        },
        lazyLoadAbled: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            settings: {
                data: [],
                columns: [],
                trimRows: true,
                filters: true,
                manualColumnResize: true,
                fillHandle: {
                    autoInsertRow: false,
                    direction: "vertical"
                },
                dropdownMenu: null,
                manualRowResize: false,
                renderAllRows: false,
                maxRows: 12080,
                height: 1208,
                readOnlyCellClassName: "maple-readOnly",
                openEmptyValid: true,
                hiddenColumns: true,
                viewportColumnRenderingOffset: 128,
                licenseKey: "non-commercial-and-evaluation",
                language: "zh-CN",
                className: "htCenter htMiddle",
                bindRowsWithHeaders: true,
                rowHeaders: true,
                comments: true,
                manualRowResizeboolean: true,
                contextMenu: {
                    items: {
                        row_above: {},
                        row_below: {},
                        remove_row: {},
                        clear_column: {},
                        hidden_columns_hide: {
                            name: "隐藏列"
                        },
                        hidden_columns_show: {
                            name: "展示列"
                        },
                        undo: {},
                        redo: {},
                        cut: {},
                        copy: {}
                    }
                }
            },
            core: {},
            checkAllabled: false,
            width: 0,
            height: 0,
            getDataDoubled: false,
            hasColumnSummary: false,
            showEmpty: !this.data.length,
            keyOpts: {},
            selectVals: {},
            cascaderVals: {},
            myColumns: [],
            hiddenColumns: [],
            sort: {},
            sortabled: false,
            sortKey: {},
            stopKeyEvent: false,
            autoRowSizePlugin: null
        };
    },
    components: { HotTable, MapleCascader, MapleDatePicker, MapleSelect },
    mounted() {
        this.$el.style = "border: 1px solid #ccc;";
        this.$emit("getCore", this.$refs.mapleTable.hotInstance);
        this.core = this.$refs.mapleTable.hotInstance;
        this.$el.addEventListener("dblclick", this.cellDblClick);
        this.autoRowSizePlugin = this.core.getPlugin("autoRowSize");
        this.init();
    },
    activated() {
        this.fixView();
    },
    methods: {
        getCascaderVals(o) {
            this.$emit("getCascaderVals", o);
            this.cascaderVals = o.data;
        },
        getSelectOpts(o) {
            this.$emit("getSelectOpts", o);
            this.selectVals = o.selectVals;
            this.keyOpts = o.keyOpts;
        },
        cellDblClick(mouseEvent) {
            const columns = getColumns.call(this, "no");
            const $el = mouseEvent.target;
            const [[row, col]] = this.core.getSelected() || [[]];
            const { width, top, left, height } = $el.getBoundingClientRect();
            if (columns[col] == null) return;
            let { subType, readOnly = false, editor = true } = columns[col];

            if (subType === "address") subType = "cascader";
            if (
                this.$refs[`${subType}Ref`] &&
                row >= 0 &&
                !readOnly &&
                editor &&
                !this.settings.readOnly &&
                ((this.hasColumnSummary && row !== this.core.countRows() - 1) ||
                    !this.hasColumnSummary)
            ) {
                const customCellDblClick = this.settings.customCellDblClick;
                if (customCellDblClick instanceof Function) {
                    if (
                        customCellDblClick({
                            row,
                            col,
                            $el,
                            core: this.core
                        })
                    ) {
                        return;
                    }
                }
                this.$refs[`${subType}Ref`].controlOpen({
                    col,
                    row,
                    width,
                    height,
                    top,
                    left,
                    open: true,
                    core: this.core,
                    columns,
                    orgColumns: this.columns
                });
            }
            this.$emit("cellDblClick", {
                mouseEvent,
                $el,
                coord: {
                    row,
                    col
                }
            });
        },
        init() {
            let hiddCols = [];
            if (this.options.cacheId && this.options.openCache) {
                hiddCols = JSON.parse(
                    localStorage.getItem(
                        `${this.options.cacheId}-hiddenColumns`
                    ) || "[]"
                );
            }
            if (!hiddCols.length) hiddCols = this.settings.hiddCols || [];
            this.settings = Object.assign(this.settings, this.options, {
                columns: customColumns.call(this),
                data: this.data,
                colHeaders: colHeaders.bind(this),
                hiddenColumns: {
                    columns: hiddCols,
                    indicators: true
                },
                persistentState: false,
                manualColumnMove:
                    this.options.cacheId && this.options.openCache,
                afterOnCellMouseDown: this.afterOnCellMouseDown,
                afterChange: this.afterChange,
                afterRemoveRow: this.afterRemoveRow,
                afterCreateRow: this.afterCreateRow,
                afterValidate: this.afterValidate,
                beforeChange: this.beforeChange,
                afterScrollHorizontally: this.afterScrollHorizontally,
                afterScrollVertically: this.afterScrollVertically,
                afterHideColumns: this.afterHideColumns,
                afterUnhideColumns: this.afterUnhideColumns,
                afterColumnMove: this.afterColumnMove,
                beforeKeyDown: event => {
                    if (this.stopKeyEvent) {
                        event.stopImmediatePropagation();
                    }
                }
            });
            this.hasColumnSummary =
                this.settings.columnSummary &&
                this.settings.columnSummary.length > 0;
            this.core.updateSettings(this.settings);
        },
        afterOnCellMouseDown(event, coords, $el) {
            if (coords) {
                const { row, col } = coords;
                const className = event.target.className;
                if (
                    className.includes("maple-up-arrow") ||
                    className.includes("maple-down-arrow")
                ) {
                    this.changeSort({
                        col,
                        row,
                        $el,
                        core: this.core,
                        name: "titleCells",
                        event,
                        type: "sort",
                        direction: className.includes("maple-up-arrow")
                            ? "up"
                            : "down"
                    });
                }
                if (event.target.id === "maple-fliter") {
                    this.$emit("controlCustomFilter", {
                        event,
                        coords,
                        $el
                    });
                }
                if (event.target.id === "maple-all-checkbox") {
                    this.checkAllBox(event, coords, $el);
                } else {
                    this.$emit("click", {
                        col,
                        row,
                        $el,
                        core: this.core,
                        name: "cells",
                        event,
                        type: "click",
                        columns: this.myColumns
                    });
                }
            }
        },
        hiddenPopup(type, e) {
            this.$refs.datePickerRef.controlOpen();
            this.$refs.cascaderRef.controlOpen();
            this.$refs.selectRef.controlOpen();
            this.$emit(type, e);
        },
        lazyLoadData() {
            const { autoRowSizePlugin, lazyLoadAbled } = this;
            if (lazyLoadAbled) {
                const lastIndex = autoRowSizePlugin.getLastVisibleRow();
                console.log(lastIndex, "lastIndex");
            }
        },
        afterScrollVertically() {
            this.hiddenPopup("afterScrollVertically");
            if (this.lazyLoadAbled) this.lazyLoadData();
        },
        afterScrollHorizontally() {
            this.hiddenPopup("afterScrollHorizontally");
        },
        beforeChange(change) {
            if (
                change.length &&
                change[0] &&
                change[0].length &&
                change[0].filter(value => Number.isNaN(value)).length
            ) {
                return false;
            }
            if (this.settings.changeBefore instanceof Function) {
                return this.settings.changeBefore(change);
            }
            return true;
        },
        afterChange(changes, source) {
            if (!changes) return;
            const { key = "mapleChecked", col = 0 } =
                this.selectBoxConfig || {};
            const checkBoxVal = this.getKeyChange(key, changes);
            let checked = [];

            if (checkBoxVal.length) {
                let { length: len } = this.core
                    .getDataAtCol(col)
                    .filter((bl, row) => {
                        if (bl) {
                            checked.push({
                                row,
                                checked: bl
                            });
                        }
                        return bl;
                    });
                let countRows = this.core.countRows();

                if (this.hasColumnSummary) countRows--;
                let bl = len === countRows;
                if (bl !== this.checkAllabled) {
                    this.checkAllabled = bl;
                    this.core.render();
                }
            }

            this.$emit("change", {
                source,
                changes,
                core: this.core,
                type: "change",
                getKeyChange: this.getKeyChange,
                filterKeysChanges: this.filterKeysChanges,
                checked,
                columns: this.myColumns
            });
        },
        afterRemoveRow(index, amount, physicalRows, source) {
            this.showEmpty = this.core.countRows() === 0;
            this.$emit("afterRemoveRow", {
                index,
                amount,
                physicalRows,
                source
            });
        },
        afterCreateRow(index, amount, source) {
            this.$emit("afterCreateRow", {
                index,
                amount,
                source
            });
        },
        getData(callback = () => {}) {
            if (this.getDataDoubled) {
                return Promise.resolve({
                    value: [],
                    valid: false
                });
            }
            this.getDataDoubled = true;
            return new Promise(resolve => {
                const d = this.core.getData();
                const data = [];
                let addressOtps = [];
                let keyVals = {};
                d.map((ele, i) => {
                    let o = this.data[i] || {};
                    const dItem = d[i];
                    const keys = getColumns.call(this, "no");
                    for (let [j, itemData] of keys.entries()) {
                        const v = dItem[j];
                        const k = itemData.key || itemData.data;
                        let newItem = {};
                        if (newItem[k]) {
                            newItem = keyVals[k];
                        } else {
                            for (let [, w] of this.columns.entries()) {
                                if (w.key === k || w.data === k) {
                                    newItem = w;
                                    keyVals[k] = w;
                                    break;
                                }
                            }
                        }

                        let {
                            valueType,
                            labelName = "label",
                            valueName = "value",
                            extraField = "_extraField_",
                            subType,
                            type,
                            exchange
                        } = newItem;

                        let opts = newItem.options || newItem.source;
                        if (opts instanceof Function) {
                            opts = opts() || [];
                        }
                        if (
                            (((type === "dropdown" ||
                                type === "autocomplete") &&
                                ((opts && opts.length) ||
                                    subType === "ajax")) ||
                                subType === "select") &&
                            k
                        ) {
                            let currentValue,
                                selectVals = this.selectVals[
                                    `key-${k}-value-${v}`
                                ];
                            valueType = valueType || valueName;
                            if (selectVals) {
                                currentValue = selectVals[valueName];
                            } else {
                                currentValue =
                                    _.exchange({
                                        data: opts,
                                        currentValue: v,
                                        currentKey: labelName
                                    })[valueName] || undefined;
                            }
                            const isEx =
                                exchange === false && o[k] && o[extraField];
                            if (valueType === valueName) {
                                o = {
                                    ...o,
                                    [k]: isEx ? o[k] : currentValue,
                                    [extraField]: isEx ? o[extraField] : v
                                };
                                if (extraField === "_extraField_") {
                                    o[k] = isEx ? o[k] : currentValue || v;
                                }
                            } else {
                                o = {
                                    ...o,
                                    [k]: isEx ? o[k] : v,
                                    [extraField]: isEx
                                        ? o[extraField]
                                        : currentValue
                                };
                            }
                        } else if (
                            subType === "cascader" ||
                            subType === "address"
                        ) {
                            const isExchange =
                                exchange === false && o[k] && o[extraField];
                            if (
                                addressOtps.length === 0 &&
                                subType === "address"
                            ) {
                                addressOtps = _.collageAddress(_.address);
                            }
                            if (this.cascaderVals[`key-${k}-value-${v}`]) {
                                const cascaderVals = this.cascaderVals[
                                    `key-${k}-value-${v}`
                                ];
                                if (valueType === "label") {
                                    o = {
                                        ...o,
                                        [k]: isExchange
                                            ? o[k]
                                            : cascaderVals.label,
                                        [extraField]: isExchange
                                            ? o[extraField]
                                            : cascaderVals.value
                                    };
                                } else {
                                    o = {
                                        ...o,
                                        [k]: isExchange
                                            ? o[k]
                                            : cascaderVals.value,
                                        [extraField]: isExchange
                                            ? o[extraField]
                                            : cascaderVals.label
                                    };
                                }
                            } else {
                                const res = _.getCascaderLabelValue({
                                    data:
                                        subType === "address"
                                            ? addressOtps
                                            : opts,
                                    value: (v + "").split("/"),
                                    matchFieldName: "label"
                                });
                                const isExCascader =
                                    exchange === false &&
                                    o[k] &&
                                    o[k] !== 0 &&
                                    o[extraField] &&
                                    o[extraField] !== 0;
                                if (valueType === "label") {
                                    o = {
                                        ...o,
                                        [k]: isExCascader
                                            ? o[k]
                                            : res.map(({ label }) => label),
                                        [extraField]: isExCascader
                                            ? o[extraField]
                                            : res.map(({ value }) => value)
                                    };
                                } else {
                                    o = {
                                        ...o,
                                        [k]: extraField
                                            ? o[k]
                                            : res.map(({ value }) => value),
                                        [extraField]: isExCascader
                                            ? o[extraField]
                                            : res.map(({ label }) => label)
                                    };
                                }
                            }
                        } else if (subType !== "handle" && k) {
                            o = {
                                ...o,
                                [k]: v
                            };
                        }
                    }
                    let extraItem = callback(o, i) || {};

                    o = {
                        ...o,
                        ...extraItem
                    };
                    // 根据callback返回的notAddabled字段，判断是否添加数据
                    if (!o.notAddabled && o.mapleTotal !== "合计") {
                        data.push({
                            ...o,
                            notAddabled: undefined,
                            _extraField_: undefined
                        });
                    }
                });
                this.core.validateCells(valid => {
                    resolve({
                        value: data,
                        valid: valid
                    });
                    this.getDataDoubled = false;
                });
            });
        },
        checkAllBox(event, coords, $el) {
            if (!coords) return;
            const { row, col } = coords;
            let type = "checkbox";

            if (event.target.id === "maple-all-checkbox") {
                const checkAllableds = [];

                this.checkAllabled = !this.checkAllabled;
                for (let i = 0; i < this.core.countRows(); i++) {
                    if (
                        this.hasColumnSummary &&
                        i === this.core.countRows() - 1
                    ) {
                        continue;
                    }
                    checkAllableds.push([i, col, this.checkAllabled]);
                }
                this.core.setDataAtCell(checkAllableds);
                type = "allCheckbox";
                this.$emit("change", {
                    type,
                    event,
                    core: this.core,
                    checkAllabled: this.checkAllabled,
                    getKeyChange: this.getKeyChange,
                    filterKeysChanges: this.filterKeysChanges,
                    columns: this.myColumns
                });
            }
            this.$emit("click", {
                col,
                row,
                $el,
                core: this.core,
                name: event.target.type,
                event,
                type,
                columns: this.myColumns
            });
        },
        clearFilters() {
            this.core.getPlugin("filters").clearConditions();
            this.core.getPlugin("filters").filter();
        },
        getKeyChange(key, changes, filterSummaryRow = true, precise = true) {
            let o = [];

            for (let item of changes.values()) {
                if (
                    filterSummaryRow &&
                    this.hasColumnSummary &&
                    item[0] === this.core.countRows() - 1
                ) {
                    return o;
                }
                if (precise) {
                    if (item[1] === key && item[2] !== item[3]) {
                        o.push(item);
                    }
                } else if (item[1] === key) {
                    o.push(item);
                }
            }
            return o;
        },
        filterKeysChanges({
            keys,
            changes,
            callback,
            filterSummaryRow = true,
            precise = true // 精确过滤
        }) {
            for (let [index, item] of changes.entries()) {
                const [row, key, oldVal, newVal] = item;
                const i = keys.indexOf(key);

                if (
                    filterSummaryRow &&
                    this.hasColumnSummary &&
                    row === this.core.countRows() - 1
                ) {
                    return;
                }
                if (precise) {
                    if (keys[i] === key && oldVal !== newVal) {
                        callback({
                            row,
                            key,
                            oldVal,
                            newVal,
                            changeCurrentCell: item,
                            index
                        });
                    }
                } else if (keys[i] === key) {
                    callback({
                        row,
                        key,
                        oldVal,
                        newVal,
                        changeCurrentCell: item,
                        index
                    });
                }
            }
        },
        fixView(t) {
            t = t || this.fixViewTime;
            if (t === -1208) return;
            let t1, t2;
            t1 = setTimeout(() => {
                this.core.scrollViewportTo(
                    this.core.countRows() - 1,
                    this.core.countCols() - 1
                );
                t2 = setTimeout(() => {
                    clearTimeout(t1);
                    t1 = null;
                    this.core.scrollViewportTo(0, 0);
                    clearTimeout(t2);
                    t2 = null;
                    this.core.updateSettings(this.settings);
                }, t);
            });
        },
        afterValidate(isValid, value, row, prop) {
            const customValidate = this.settings.customValidate;

            if (this.getDataDoubled && this.settings.openEmptyValid) {
                const hasDefaultValFileds =
                    this.settings.hasDefaultValFileds || [];

                if (
                    this.hasColumnSummary &&
                    row + 1 === this.core.countRows()
                ) {
                    return true;
                }

                const isEmptyRow = this.core.isEmptyRow(row);

                if (isEmptyRow) {
                    isValid = true;
                } else {
                    const rowData = this.core.getDataAtRow(row);
                    let itemData = {};
                    let emptyCount = 0;

                    for (let [j, item] of this.myColumns.entries()) {
                        const k = item.data || item.key || "maple-field";
                        const i = hasDefaultValFileds.indexOf(k);
                        const key = hasDefaultValFileds[i];
                        const v = rowData[j];

                        if (k === prop) itemData = item;
                        if (
                            k !== key &&
                            (v === "" ||
                                v == null ||
                                v === false ||
                                v === item.uncheckedTemplate)
                        ) {
                            emptyCount++;
                        }
                    }
                    if (
                        emptyCount + hasDefaultValFileds.length ===
                            this.core.countCols() &&
                        itemData.allowEmpty === false
                    ) {
                        isValid = true;
                    }
                }
            }

            if (customValidate instanceof Function) {
                return customValidate({
                    isValid,
                    value,
                    row,
                    key: prop
                });
            }
            return isValid;
        },
        afterHideColumns(currentHideConfig, destinationHideConfig) {
            this.hiddenColumns = destinationHideConfig;
            this.getColumns();
        },
        afterUnhideColumns(currentHideConfig, destinationHideConfig) {
            this.hiddenColumns = destinationHideConfig;
            this.getColumns();
        },
        afterColumnMove() {
            this.getColumns();
        },
        getColumns() {
            if (this.settings.cacheId && this.settings.openCache) {
                const t = this.core.getColHeader();
                const cols = [];
                t.map(ele => {
                    const index = ele.slice(
                        ele.indexOf("index=") + 6,
                        ele.indexOf("CDC")
                    );
                    cols.push(this.myColumns[index]);
                });
                localStorage.setItem(
                    `${this.settings.cacheId}-hiddenColumns`,
                    JSON.stringify(this.hiddenColumns)
                );
                localStorage.setItem(
                    `${this.settings.cacheId}-columns`,
                    JSON.stringify(cols)
                );
            }
        },
        changeSort(o) {
            if (this.sortabled) return;
            this.sortabled = true;
            const { col, direction } = o,
                key = this.myColumns[col].key || this.myColumns[col].data;
            let sortType = 0,
                v = this.sort[key] || {};
            if ((!v.type || v.type === -1) && direction === "up") {
                sortType = 1;
            }
            if (v.type === 1 && direction === "up") {
                sortType = 0;
            }
            if ((!v.type || v.type === 1) && direction === "down") {
                sortType = -1;
            }
            if (v.type === -1 && direction === "down") {
                sortType = 0;
            }
            this.$emit("changeSort", {
                data: {
                    ...o,
                    currentData: {
                        type: sortType,
                        t: new Date().valueOf(),
                        key,
                        sort: this.sort,
                        col
                    }
                },
                callback: (config = {}) => {
                    if (config.state) {
                        this.sort[key] = {
                            type: sortType,
                            t: new Date().valueOf(),
                            direction
                        };
                        if (config.clear) {
                            for (let [k] of Object.entries(this.sortKey)) {
                                if (key !== k) this.sort[k] = {};
                            }
                        }
                        this.sortKey[key] = key;
                    }
                    if (!sortType) {
                        this.sort[key] = {
                            type: sortType,
                            t: new Date().valueOf(),
                            direction
                        };
                    }
                    this.sortabled = false;
                    this.core.render();
                }
            });
        },
        clearSort() {
            this.sort = {};
            this.core.render();
        },
        sum(o) {
            if (this.settings.summaryColumn instanceof Array) {
                let sumKey = [];
                this.settings.summaryColumn.forEach(item => {
                    if (item.type === "sum") {
                        sumKey.push(item.key);
                    }
                });
                o.filterKeysChanges({
                    filterSummaryRow: true, // 过滤监听合计一行的数据变化，默认是true，即过滤
                    changes: o.changes,
                    keys: sumKey,
                    callback: ({ key, oldVal, newVal }) => {
                        let diff = 0,
                            lastData = this.value[this.value.length - 1];

                        newVal = newVal - 0 || 0;
                        oldVal = oldVal - 0 || 0;
                        diff = newVal - oldVal;
                        lastData[key] = (lastData[key] - 0 || 0) + diff;
                    }
                });
            }
        },
        changeCheckAllabled(bl) {
            this.checkAllabled = bl;
        }
    },
    watch: {
        columns() {
            this.init();
        },
        data(v) {
            this.showEmpty = !v.length;
            this.init();
        },
        options() {
            this.init();
        }
    },
    beforeDestroy() {
        Object.assign(this.$data, {});
        this.$el.removeEventListener("dblclick", this.cellDblClick);
    }
};
</script>

<style scoped>
@import url("./scoped.css");
</style>
