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
        <div class="empty" v-show="showEmpty" :style="{ width: emptyWidth }">
            暂无数据
        </div>
    </div>
</template>

<script>
import { HotTable } from "@handsontable/vue";
import _ from "./utils";
import MapleCascader from "./components/MapleCascader";
import MapleDatePicker from "./components/MapleDatePicker";
import MapleSelect from "./components/MapleSelect";
import {
    colHeaders,
    customColumns,
    getColumns,
    beforeChange,
    afterOnCellMouseDown
} from "./utils/handsontable";

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
        widthAuto: {
            type: Boolean
        },
        customStyle: {
            type: Object
        },
        lazyLoadAbled: {
            type: Boolean,
            default: false
        },
        pageSize: {
            type: Number,
            default: 12
        },
        singleSelectConfig: {
            type: Object,
            default: () => ({})
        },
        showLastTotalText: {
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
            singleSelectIndex: -1208,
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
            autoRowSizePlugin: null,
            lastPage: null,
            copyData: [],
            stopLazyAbled: true,
            emptyWidth: "100%"
        };
    },
    components: { HotTable, MapleCascader, MapleDatePicker, MapleSelect },
    mounted() {
        this.$emit("getCore", this.$refs.mapleTable.hotInstance);
        this.core = this.$refs.mapleTable.hotInstance;
        this.$el.addEventListener("dblclick", this.cellDblClick);
        this.autoRowSizePlugin = this.core.getPlugin("autoRowSize");
        this.init();
    },
    activated() {
        this.fixView();
        this.changeEmptyWidth(this.settings.data);
    },
    methods: {
        getCascaderVals(o) {
            this.$emit("getCascaderVals", o);
            this.cascaderVals = o.data;
        },
        getSelectOpts(o) {
            if (!o.noEmit) this.$emit("getSelectOpts", o);
            this.selectVals = o.selectVals;
            this.keyOpts = o.keyOpts;
        },
        cellDblClick(mouseEvent) {
            const columns = getColumns.call(this, "no");
            const $el = mouseEvent.target;
            const [[row, col]] = this.core.getSelected() || [[]];
            const { width, top, left, height } = $el.getBoundingClientRect();
            if (columns[col] == null) return;
            const { readOnly } = this.core.getCellMeta(row, col);
            let { subType } = columns[col];

            if (subType === "address") subType = "cascader";
            if (
                this.$refs[`${subType}Ref`] &&
                row >= 0 &&
                !readOnly &&
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
            let { data, lastPage, pageSize, lazyLoadAbled } = this;
            this.copyData = data;
            this.changeEmptyWidth(data);
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
                data: lazyLoadAbled
                    ? this.copyData.slice(
                          0,
                          lazyLoadAbled ? pageSize : lastPage || undefined
                      )
                    : data,
                colHeaders: colHeaders.bind(this),
                hiddenColumns: {
                    columns: hiddCols,
                    indicators: true
                },
                persistentState: false,
                manualColumnMove:
                    this.options.cacheId && this.options.openCache,
                afterOnCellMouseDown: afterOnCellMouseDown.bind(this),
                afterChange: this.afterChange,
                afterRemoveRow: this.afterRemoveRow,
                afterCreateRow: this.afterCreateRow,
                afterValidate: this.afterValidate,
                beforeChange: beforeChange.bind(this),
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
        hiddenPopup(type, e) {
            this.$refs.datePickerRef.controlOpen();
            this.$refs.cascaderRef.controlOpen();
            this.$refs.selectRef.controlOpen();
            this.$emit(type, e);
        },
        lazyLoadData() {
            let {
                autoRowSizePlugin,
                lazyLoadAbled,
                core,
                stopLazyAbled,
                copyData,
                lastPage,
                pageSize,
                checkAllabled,
                selectBoxConfig
            } = this;
            if (lazyLoadAbled && stopLazyAbled) {
                const lastIndex = autoRowSizePlugin.getLastVisibleRow(),
                    sourceData = core.getSourceData(),
                    currentLen = sourceData.length;
                if (
                    lastIndex >= currentLen - 3 &&
                    currentLen < copyData.length
                ) {
                    this.stopLazyAbled = false;
                    lastPage = (lastPage || lastIndex) + pageSize;
                    let data = copyData.slice(0, lastPage);
                    if (checkAllabled) {
                        const { key = "mapleChecked" } = selectBoxConfig || {};
                        data.forEach(item => {
                            item[key] = true;
                        });
                    }
                    core.updateSettings({
                        data
                    });
                    this.lastPage = lastPage;

                    let t = setTimeout(() => {
                        core.scrollViewportTo(lastIndex - 2);
                        this.stopLazyAbled = true;
                        clearTimeout(t);
                        t = null;
                    }, 128);
                }
            }
        },
        afterScrollVertically() {
            this.hiddenPopup("afterScrollVertically");
            this.lazyLoadData();
        },
        afterScrollHorizontally() {
            this.hiddenPopup("afterScrollHorizontally");
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
                const judgeVals = val => {
                    let bl = true;
                    if (
                        Object.prototype.toString.call(val) ===
                            "[object Array]" &&
                        !val.length
                    ) {
                        bl = false;
                    }
                    if (val == null || val === "") bl = false;
                    return bl;
                };
                d.map((ele, i) => {
                    let o = this.data[i] || {};
                    const dItem = d[i];
                    const keys = getColumns.call(this, "no");
                    for (let [j, itemData] of keys.entries()) {
                        let v = dItem[j],
                            k = itemData.key || itemData.data;
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
                            checkedTemplate,
                            uncheckedTemplate,
                            ajaxConfig
                        } = newItem;

                        let opts = newItem.options || newItem.source;
                        if (opts instanceof Function) {
                            opts = opts() || [];
                        }
                        if (type === "checkbox") {
                            let checkboxVal = o[k];
                            if (
                                checkedTemplate != null &&
                                checkedTemplate != ""
                            ) {
                                checkboxVal = checkboxVal
                                    ? checkedTemplate
                                    : uncheckedTemplate;
                            }
                            o = {
                                ...o,
                                [k]: checkboxVal
                            };
                        } else if (
                            (((type === "dropdown" ||
                                type === "autocomplete") &&
                                ((opts && opts.length) ||
                                    subType === "ajax")) ||
                                subType === "select") &&
                            k
                        ) {
                            const { multiple } = newItem.props || {};
                            let currentValue,
                                selectVals = this.selectVals[
                                    `key-${k}-value-${v}`
                                ];
                            valueType = valueType || valueName;
                            if (multiple) v = (v || "").split(",");
                            if (selectVals) {
                                currentValue = multiple
                                    ? selectVals.map(ele => ele[valueName])
                                    : selectVals[valueName];
                            } else {
                                currentValue =
                                    _.exchange({
                                        data: opts,
                                        currentValue: v,
                                        currentKey: labelName
                                    })[valueName] || undefined;
                            }
                            if (valueType === valueName) {
                                o = {
                                    ...o,
                                    [k]: judgeVals(v) ? currentValue : o[k],
                                    [extraField]: judgeVals(v)
                                        ? v
                                        : o[extraField]
                                };
                                if (
                                    extraField === "_extraField_" &&
                                    o[k] == null &&
                                    ajaxConfig &&
                                    ajaxConfig.url
                                ) {
                                    o = {
                                        ...o,
                                        [k]: v,
                                        [extraField]: undefined
                                    };
                                }
                            } else {
                                o = {
                                    ...o,
                                    [k]: judgeVals(v) ? v : o[k],
                                    [extraField]: judgeVals(currentValue)
                                        ? currentValue
                                        : o[extraField]
                                };
                            }
                        } else if (
                            subType === "cascader" ||
                            subType === "address"
                        ) {
                            const exchangeArrary = val => {
                                return val instanceof Array
                                    ? val
                                    : (val || "").split("/");
                            };
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
                                        [k]: judgeVals(
                                            exchangeArrary(cascaderVals.label)
                                        )
                                            ? exchangeArrary(cascaderVals.label)
                                            : exchangeArrary(o[k]),
                                        [extraField]: judgeVals(
                                            exchangeArrary(cascaderVals.value)
                                        )
                                            ? exchangeArrary(cascaderVals.value)
                                            : exchangeArrary(o[extraField])
                                    };
                                } else {
                                    o = {
                                        ...o,
                                        [k]: judgeVals(
                                            exchangeArrary(cascaderVals.value)
                                        )
                                            ? exchangeArrary(cascaderVals.value)
                                            : exchangeArrary(o[k]),
                                        [extraField]: judgeVals(
                                            exchangeArrary(cascaderVals.label)
                                        )
                                            ? exchangeArrary(cascaderVals.label)
                                            : exchangeArrary(o[extraField])
                                    };
                                }
                            } else {
                                const res = _.getCascaderLabelValue({
                                    data:
                                        subType === "address"
                                            ? addressOtps
                                            : opts,
                                    value: (v && v.split("/")) || [],
                                    matchFieldName: "label"
                                });
                                if (valueType === "label") {
                                    o = {
                                        ...o,
                                        [k]: judgeVals(
                                            res.map(({ label }) => label)
                                        )
                                            ? res.map(({ label }) => label)
                                            : exchangeArrary(o[k]),
                                        [extraField]: judgeVals(
                                            res.map(({ value }) => value)
                                        )
                                            ? res.map(({ value }) => value)
                                            : exchangeArrary(o[extraField])
                                    };
                                } else {
                                    o = {
                                        ...o,
                                        [k]: judgeVals(
                                            res.map(({ value }) => value)
                                        )
                                            ? res.map(({ value }) => value)
                                            : exchangeArrary(o[k]),
                                        [extraField]: judgeVals(
                                            res.map(({ label }) => label)
                                        )
                                            ? res.map(({ label }) => label)
                                            : exchangeArrary(o[extraField])
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
                    if (
                        !o.notAddabled &&
                        !(o.mapleTotal === "合计" && i === d.length - 1)
                    ) {
                        data.push({
                            ...o,
                            notAddabled: undefined,
                            _extraField_: undefined,
                            undefined
                        });
                    }
                });
                this.core.validateCells(valid => {
                    resolve({
                        value: data.concat(this.copyData.slice(d.length)),
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
        getKeyChange(key, changes, filterSummaryRow = false, precise = true) {
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
            filterSummaryRow = false,
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
        fixView() {
            const { core } = this;
            core && core.render();
        },
        afterValidate(isValid, value, row, prop) {
            const {
                selectBoxConfig,
                settings,
                getDataDoubled,
                hasColumnSummary,
                core,
                myColumns
            } = this;
            const customValidate = settings.customValidate;

            if (getDataDoubled && settings.openEmptyValid) {
                const hasDefaultValFileds = settings.hasDefaultValFileds || [];

                if (hasColumnSummary && row + 1 === core.countRows()) {
                    return true;
                }

                const isEmptyRow = core.isEmptyRow(row);

                if (isEmptyRow) {
                    isValid = true;
                } else {
                    const rowData = core.getDataAtRow(row);
                    let itemData = {};
                    let emptyCount = 0;

                    for (let [j, item] of myColumns.entries()) {
                        const k = item.data || item.key || "maple-field";
                        const i = hasDefaultValFileds.indexOf(k);
                        const key = hasDefaultValFileds[i];
                        const v = rowData[j];
                        const emptyVal =
                            v === "" ||
                            v == null ||
                            v === false ||
                            v === item.uncheckedTemplate;

                        if (k === prop) itemData = item;
                        if (k === selectBoxConfig.key && emptyVal) {
                            return true;
                        }
                        if (k !== key && emptyVal) {
                            emptyCount++;
                        }
                    }
                    if (
                        emptyCount + hasDefaultValFileds.length ===
                            core.countCols() &&
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
                    filterSummaryRow: false, // 过滤监听合计一行的数据变化，默认是true，即过滤
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
        },
        changeEmptyWidth(d) {
            this.$nextTick(() => {
                let w = "100%";
                if (!d.length) {
                    let $w = this.$el.querySelector("table");
                    w = `${$w && $w.clientWidth}px`;
                }
                this.emptyWidth = w;
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
