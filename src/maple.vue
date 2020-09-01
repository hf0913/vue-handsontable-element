<template>
    <div id="maple-table">
        <hot-table :settings="settings" ref="mapleTable" />
        <MapleDatePicker ref="datePickerRef" />
        <MapleCascader
            ref="cascaderRef"
            @getCascaderVals="o => (cascaderVals = o)"
        />
        <div
            class="empty"
            v-show="showEmpty"
            :style="{ height: `${settings.height - 30}px` }"
        >
            暂无数据
        </div>
    </div>
</template>

<script>
import { HotTable } from "@handsontable/vue";
import _ from "./utils";
import MapleCascader from "./components/MapleCascader";
import MapleDatePicker from "./components/MapleDatePicker";
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
        checkBox: {
            type: Object,
            default: () => ({ key: "checked", col: 0 })
        },
        fixViewTime: {
            type: Number,
            default: 128
        },
        widthAuto: {
            type: Boolean
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
            mapleHeaderCheckboxCol: 0,
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
            sortabled: false
        };
    },
    components: { HotTable, MapleCascader, MapleDatePicker },
    mounted() {
        this.$el.style = "border: 1px solid #ccc;";
        this.$emit("getCore", this.$refs.mapleTable.hotInstance);
        this.core = this.$refs.mapleTable.hotInstance;
        this.$el.addEventListener("dblclick", this.cellDblClick);
        this.init();
    },
    activated() {
        this.fixView();
    },
    methods: {
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
                    columns
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
                afterColumnMove: this.afterColumnMove
            });
            this.hasColumnSummary =
                this.settings.columnSummary &&
                this.settings.columnSummary.length > 0;
            this.core.updateSettings(this.settings);
        },
        afterOnCellMouseDown(event, coords, $el) {
            if (coords) {
                const { row, col } = coords;
                if (event.target.className.includes("maple-sort")) {
                    this.changeSort({
                        col,
                        row,
                        $el,
                        core: this.core,
                        name: "titleCells",
                        event,
                        type: "sort"
                    });
                }
                if (event.target.id === "maple-fliter") {
                    this.$emit("controlCustomFilter", {
                        event,
                        coords,
                        $el
                    });
                }
                if (col === this.mapleHeaderCheckboxCol) {
                    this.checkAllBox(event, coords, $el);
                } else {
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
            }
        },
        afterScrollVertically() {
            this.$refs.datePickerRef.controlOpen();
            this.$refs.cascaderRef.controlOpen();
            this.$emit("afterScrollVertically");
        },
        afterScrollHorizontally() {
            this.$refs.datePickerRef.controlOpen();
            this.$refs.cascaderRef.controlOpen();
            this.$emit("afterScrollHorizontally");
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
            const { key = "checked", col = 0 } = this.checkBox || {};
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
                checked
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
                            extraField,
                            subType,
                            type,
                            exchange
                        } = newItem;

                        if (exchange === false) {
                            o = {
                                ...o,
                                [k]: v
                            };
                        } else {
                            let opts = newItem.options || newItem.source;
                            if (opts instanceof Function) {
                                opts = opts() || [];
                            }
                            if (
                                (type === "dropdown" ||
                                    type === "autocomplete") &&
                                opts &&
                                opts.length &&
                                k
                            ) {
                                let currentValue,
                                    selectVals = this.selectVals[
                                        `key-${k}value-${v}`
                                    ];
                                valueType = valueType || valueName;
                                if (selectVals) {
                                    currentValue = selectVals[valueName];
                                } else {
                                    currentValue = _.exchange({
                                        data: opts,
                                        currentValue: v,
                                        currentKey: labelName
                                    })[valueName];
                                }

                                if (valueType === valueName) {
                                    o = {
                                        ...o,
                                        [k]: currentValue,
                                        [extraField]: v
                                    };
                                } else {
                                    o = {
                                        ...o,
                                        [k]: v,
                                        [extraField]: currentValue
                                    };
                                }
                            } else if (
                                subType === "cascader" ||
                                subType === "address"
                            ) {
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
                                            [k]: cascaderVals.label,
                                            [extraField]: cascaderVals.value
                                        };
                                    } else {
                                        o = {
                                            ...o,
                                            [k]: cascaderVals.value,
                                            [extraField]: cascaderVals.label
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
                                    if (valueType === "label") {
                                        o = {
                                            ...o,
                                            [k]: res.map(({ label }) => label),
                                            [extraField]: res.map(
                                                ({ value }) => value
                                            )
                                        };
                                    } else {
                                        o = {
                                            ...o,
                                            [k]: res.map(({ value }) => value),
                                            [extraField]: res.map(
                                                ({ label }) => label
                                            )
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
                    }
                    let extraItem = callback(o, i) || {};

                    o = {
                        ...o,
                        ...extraItem
                    };
                    // 根据callback返回的notAddabled字段，判断是否添加数据
                    if (!o.notAddabled && o.mapleTotal !== "合计")
                        data.push({
                            ...o,
                            notAddabled: undefined
                        });
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
                    filterKeysChanges: this.filterKeysChanges
                });
            }
            this.$emit("click", {
                col,
                row,
                $el,
                core: this.core,
                name: event.target.type,
                event,
                type
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
            const fixedColumnsLeft = this.settings.fixedColumnsLeft;

            this.settings = Object.assign({}, this.settings, {
                fixedColumnsLeft: 0
            });
            t1 = setTimeout(() => {
                this.core.scrollViewportTo(
                    this.core.countRows() - 1,
                    this.core.countCols() - 1
                );
                t2 = setTimeout(() => {
                    this.core.scrollViewportTo(0, 0);
                    clearTimeout(t1);
                    clearTimeout(t2);
                    t1 = t2 = null;
                    if (this.settings.fixViewComplete instanceof Function) {
                        this.settings.fixViewComplete();
                    } else {
                        this.settings = Object.assign({}, this.settings, {
                            fixedColumnsLeft
                        });
                    }
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
                            (v === "" || v == null || v === false)
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
            const { col } = o;
            let sortType = 0,
                v = this.sort[col] || {};
            if (!v.type) {
                sortType = 1;
            }
            if (v.type === 1) {
                sortType = -1;
            }
            if (v.type === -1) {
                sortType = 0;
            }
            this.$emit("changeSort", {
                data: {
                    ...o,
                    currentData: {
                        type: sortType,
                        t: new Date().valueOf(),
                        key:
                            this.myColumns[col].key || this.myColumns[col].data,
                        sort: this.sort
                    }
                },
                callback: () => {
                    this.sort[col] = {
                        type: sortType,
                        t: new Date().valueOf()
                    };
                    this.core.render();
                    this.sortabled = false;
                }
            });
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
