<template>
    <div id="maple-table">
        <hot-table
            :settings="mySettings"
            :data="data"
            :columns="myColumns"
            ref="mapleTable"
        />
        <MapleDatePicker ref="datePickerRef" />
        <MapleCascader ref="cascaderRef" />
        <div
            class="empty"
            v-show="!data.length && !mySettings.minRows"
            :style="{ height: `${mySettings.height - 30}px` }"
        >
            暂无数据
        </div>
    </div>
</template>

<script>
import { HotTable } from "@handsontable/vue";
import maple from "handsontable";
import _ from "./utils";
import MapleCascader from "./components/MapleCascader";
import MapleDatePicker from "./components/MapleDatePicker";

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
        }
    },
    computed: {
        mySettings() {
            const defaultOpts = {
                manualColumnMove: true,
                height: "auto",
                filters: true,
                rowHeaders: true,
                dropdownMenu: [
                    "filter_by_condition",
                    "filter_operators",
                    "filter_by_condition2",
                    "filter_by_value",
                    "filter_action_bar"
                ],
                contextMenu: {
                    items: {
                        row_above: {},
                        row_below: {},
                        remove_row: {},
                        clear_column: {},
                        undo: {},
                        redo: {},
                        copy: {},
                        hidden_columns_hide: {
                            name: "隐藏列"
                        },
                        hidden_columns_show: {
                            name: "展示列"
                        }
                    }
                },
                className: "htCenter htMiddle",
                manualColumnResize: true,
                manualRowResize: true,
                language: "zh-CN",
                licenseKey: "non-commercial-and-evaluation",
                readOnlyCellClassName: "maple-readOnly",
                openEmptyValid: true,
                colHeaders: col => this.customHeader(col)
            };
            const eventOpts = {
                afterOnCellMouseDown: this.afterOnCellMouseDown,
                afterChange: this.afterChange,
                afterRemoveRow: this.afterRemoveRow,
                afterCreateRow: this.afterCreateRow,
                afterValidate: this.afterValidate,
                beforeChange: this.beforeChange,
                afterScrollHorizontally: this.afterScrollHorizontally,
                afterScrollVertically: this.afterScrollVertically
            };
            return {
                ...defaultOpts,
                ...this.options,
                ...eventOpts
            };
        },
        myColumns() {
            return this.collageColumns().map(item => {
                if (item.subType === "handle" && this.data.length) {
                    item = {
                        ...item,
                        renderer: (
                            instance,
                            td,
                            row,
                            col,
                            prop,
                            value,
                            // eslint-disable-next-line no-unused-vars
                            cellProperties
                        ) => {
                            cellProperties = Object.assign(cellProperties, {
                                readOnly: true,
                                editor: true
                            });

                            let $el = document.createElement("DIV");
                            $el.style.height = "100%";
                            $el.style.display = "flex";
                            $el.style.justifyContent = "space-around";
                            $el.style.alignItems = "center";

                            const hasColumnSummary =
                                this.options &&
                                this.options.columnSummary &&
                                this.options.columnSummary.length;
                            if (
                                hasColumnSummary &&
                                row === instance.countRows() - 1
                            ) {
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
                                    event.stopPropagation &&
                                        event.stopPropagation();
                                    event.cancelBubble = true;
                                });
                            });

                            maple.dom.empty(td);
                            td.appendChild($el);

                            return td;
                        }
                    };
                }
                return item;
            });
        }
    },
    data() {
        return {
            core: {},
            checkAllabled: false,
            mapleHeaderCheckboxCol: -1208,
            width: 0,
            height: 0,
            getDataDoubled: false,
            hasColumnSummary: false
        };
    },
    components: { HotTable, MapleCascader, MapleDatePicker },
    destroyed() {
        this.$el.removeEventListener("dblclick", this.cellDblClick);
    },
    mounted() {
        this.$emit("getCore", this.$refs.mapleTable.hotInstance);
        this.$el.style = "border: 1px solid #ccc;";
        this.core = this.$refs.mapleTable.hotInstance;
        this.$el.addEventListener("dblclick", this.cellDblClick);
    },
    activated() {
        this.fixView();
    },
    methods: {
        cellDblClick(mouseEvent) {
            const $el = mouseEvent.target;
            const [[row, col]] = this.core.getSelected() || [[]];
            const { width, top, left, height } = $el.getBoundingClientRect();
            if (this.myColumns[col] == null) return;
            let { subType, readOnly = false, editor = true } = this.myColumns[
                col
            ];

            if (subType === "address") subType = "cascader";
            if (
                this.$refs[`${subType}Ref`] &&
                row >= 0 &&
                !readOnly &&
                editor &&
                ((this.hasColumnSummary && row !== this.core.countRows() - 1) ||
                    !this.hasColumnSummary)
            ) {
                const customCellDblClick = this.mySettings.customCellDblClick;
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
                    columns: this.columns
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
        customHeader(col) {
            const item = this.columns[col];

            if (item.subType === "selection" && item.type === "checkbox") {
                this.mapleHeaderCheckboxCol = col;
                return `<input type='checkbox' ${
                    this.checkAllabled ? "checked" : ""
                } id="maple-header-checkbox" style="margin-right: 6px" ${
                    this.data.length ? "" : "disabled"
                }/>`;
            } else {
                return `
                    <div id="maple-fliter">
                        <span id="${
                            item.allowEmpty === false
                                ? "maple-required-title"
                                : "maple-common-title"
                        }">${item.title}</span>
                        <a style="display: ${
                            item.openCustomFiter ? "inline" : "none"
                        };margin-left: 4px;" href="javascript:;" class="el-icon-s-operation cursor" id="maple-fliter"></a>
                    </div>
                    `;
            }
        },
        afterOnCellMouseDown(event, coords, $el) {
            const { row, col } = coords;

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
        beforeChange: change => {
            if (
                change.length &&
                change[0] &&
                change[0].length &&
                change[0].filter(value => Number.isNaN(value)).length
            ) {
                return false;
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
        collageColumns() {
            const c = [];
            const vm = this;
            const debounceOptimize = _.debounce(
                ({
                    query,
                    options = [],
                    maxMatchLen,
                    labelName,
                    index,
                    process,
                    key
                }) => {
                    let opts = [];

                    query = query.replace(/(^\s*)|(\s*$)/g, "");
                    if (options instanceof Function) {
                        options = options() || [];
                    }
                    if (query === "") {
                        opts = options.slice(0, maxMatchLen);
                        process(opts.map(m => m[labelName]));
                        vm.$emit("getSelectOpts", {
                            index,
                            query,
                            key,
                            options: opts
                        });
                    } else {
                        let i = 0;

                        for (let m of options.values()) {
                            let v = m[labelName];

                            if (v.includes(query)) {
                                opts.push(m);
                                i++;
                                if (i >= maxMatchLen) {
                                    break;
                                }
                            }
                        }
                        process(opts.map(m => m[labelName]));
                        vm.$emit("getSelectOpts", {
                            index,
                            query,
                            key,
                            options: opts
                        });
                    }
                }
            );
            const debounceAjax = _.debounce(
                ({ ajaxConfig, query, labelName, index, process, key }) => {
                    let { queryField, data, param } = ajaxConfig;
                    const fn = (k, v) => {
                        if (v && Reflect.has(v, queryField)) {
                            ajaxConfig = {
                                ...ajaxConfig,
                                [k]: {
                                    ...v,
                                    [queryField]: query
                                }
                            };
                        }
                    };

                    fn("data", data);
                    fn("param", param);
                    _.ajax(ajaxConfig).then(v => {
                        process(v.map(m => m[labelName]));
                        vm.$emit("getSelectOpts", {
                            index,
                            query,
                            key,
                            options: v
                        });
                    });
                }
            );

            this.columns.map((item, index) => {
                const options = item.options || item.source;
                const labelName = item.labelName || "label";
                const maxMatchLen = item.maxMatchLen || 8;
                const allowEmpty = item.allowEmpty == false ? false : true;
                const field = item.key || item.data;
                let ajaxConfig = item.ajaxConfig;

                item = {
                    ...item,
                    title: null
                };
                switch (true) {
                    case item.type === "autocomplete":
                        c.push({
                            validator: (value, callback) => {
                                callback(
                                    _.checkType({
                                        type: "autocomplete",
                                        value,
                                        labelName,
                                        allowEmpty,
                                        item,
                                        vm,
                                        field,
                                        index,
                                        options
                                    })
                                );
                            },
                            ...item,
                            options,
                            data: field
                        });
                        break;
                    case item.subType === "optimize" &&
                        item.type === "dropdown":
                        c.push({
                            validator: (value, callback) => {
                                callback(
                                    _.checkType({
                                        type: "autocomplete",
                                        value,
                                        labelName,
                                        allowEmpty,
                                        item,
                                        vm,
                                        field,
                                        index,
                                        options
                                    })
                                );
                            },
                            ...item,
                            data: field,
                            type: "autocomplete",
                            options,
                            source: function (query, process) {
                                debounceOptimize({
                                    query,
                                    options,
                                    maxMatchLen,
                                    labelName,
                                    index,
                                    process,
                                    key: field
                                });
                            }
                        });
                        break;
                    case item.subType === "ajax" && item.type === "dropdown":
                        c.push({
                            validator: (value, callback) => {
                                callback(
                                    _.checkType({
                                        type: "autocomplete",
                                        value,
                                        labelName,
                                        allowEmpty,
                                        item,
                                        vm,
                                        field,
                                        index,
                                        options
                                    })
                                );
                            },
                            ...item,
                            type: "autocomplete",
                            data: field,
                            options,
                            source: function (query, process) {
                                debounceAjax({
                                    ajaxConfig,
                                    query,
                                    labelName,
                                    index,
                                    process,
                                    key: field
                                });
                            }
                        });
                        break;
                    case item.type === "dropdown":
                        c.push({
                            validator: (value, callback) => {
                                callback(
                                    _.checkType({
                                        type: "dropdown",
                                        value,
                                        labelName,
                                        allowEmpty,
                                        item,
                                        vm,
                                        field,
                                        index,
                                        options
                                    })
                                );
                            },
                            ...item,
                            source: options
                                ? options.map(ele => ele[labelName])
                                : undefined,
                            data: field,
                            options
                        });
                        break;
                    case item.type === "numeric":
                        c.push({
                            validator: (value, callback) => {
                                callback(
                                    _.checkType({
                                        type: "numeric",
                                        value,
                                        allowEmpty,
                                        dateFormat: item.dateFormat,
                                        timeFormat: item.timeFormat,
                                        item,
                                        vm,
                                        field,
                                        index,
                                        options
                                    })
                                );
                            },
                            ...item,
                            data: field,
                            options
                        });
                        break;
                    case item.type === "checkbox":
                        c.push({
                            validator: (value, callback) => {
                                callback(
                                    _.checkType({
                                        type: "checkbox",
                                        value,
                                        allowEmpty,
                                        item,
                                        vm,
                                        field,
                                        index
                                    })
                                );
                            },
                            ...item,
                            data: field
                        });
                        break;
                    case item.subType === "datePicker":
                        c.push({
                            validator: (value, callback) => {
                                callback(
                                    _.checkType({
                                        type: "datePicker",
                                        value,
                                        allowEmpty,
                                        item,
                                        vm,
                                        field,
                                        index
                                    })
                                );
                            },
                            ...item,
                            data: field
                        });
                        break;
                    case item.subType === "address":
                        c.push({
                            validator: (value, callback) => {
                                callback(
                                    _.checkType({
                                        type: "address",
                                        value,
                                        labelName,
                                        allowEmpty,
                                        item,
                                        vm,
                                        field,
                                        index,
                                        options
                                    })
                                );
                            },
                            ...item,
                            options,
                            data: field
                        });
                        break;
                    case item.subType === "cascader":
                        c.push({
                            validator: (value, callback) => {
                                callback(
                                    _.checkType({
                                        type: "cascader",
                                        value,
                                        labelName,
                                        allowEmpty,
                                        item,
                                        vm,
                                        field,
                                        index,
                                        options
                                    })
                                );
                            },
                            ...item,
                            options,
                            data: field
                        });
                        break;
                    case item.type == null || item.type == "text":
                        c.push({
                            validator: (value, callback) => {
                                callback(
                                    _.checkType({
                                        type: "text",
                                        value,
                                        allowEmpty,
                                        item,
                                        vm,
                                        field,
                                        index
                                    })
                                );
                            },
                            ...item,
                            data: field
                        });
                        break;
                    default:
                        c.push({
                            ...item,
                            data: field,
                            options
                        });
                }
            });
            return c;
        },
        getData(callback = () => {}) {
            if (this.getDataDoubled) return;
            this.getDataDoubled = true;
            return new Promise(resolve => {
                const { getData, getSourceDataAtRow } = this.core;
                const d = getData();
                const m = this.core.getPlugin("trimRows").trimmedRows;
                const data = [];
                let columns = [];
                let addressOtps = [];
                m.map(i => d.splice(i, 0, getSourceDataAtRow(i)));
                d.map((ele, i) => {
                    let o = this.data[i] || {};
                    const dItem = d[i];
                    const keys = this.myColumns;

                    for (let [
                        j,
                        {
                            data: k,
                            options: opts,
                            valueType,
                            labelName = "label",
                            valueName = "value",
                            extraField = "maple_extra_field",
                            subType,
                            type
                        }
                    ] of keys.entries()) {
                        const v = dItem[j];

                        columns[j] = {
                            ...this.columns[j],
                            width: this.core.getColWidth(j)
                        };
                        if (opts instanceof Function) {
                            opts = opts() || [];
                        }
                        if (
                            (type === "dropdown" || type === "autocomplete") &&
                            opts &&
                            opts.length &&
                            k
                        ) {
                            valueType = valueType || valueName;

                            if (valueType === valueName) {
                                o = {
                                    ...o,
                                    [k]: _.exchange({
                                        data: opts,
                                        currentValue: v,
                                        currentKey: labelName
                                    })[valueName],
                                    [extraField]: v
                                };
                            } else {
                                o = {
                                    ...o,
                                    [k]: v,
                                    [extraField]: _.exchange({
                                        data: opts,
                                        currentValue: v,
                                        currentKey: labelName
                                    })[valueName]
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
                            const res = _.getCascaderLabelValue({
                                data:
                                    subType === "address" ? addressOtps : opts,
                                value: (v + "").split("/"),
                                matchFieldName: "label"
                            });
                            if (valueType === "label") {
                                o = {
                                    ...o,
                                    [k]: res.map(({ label }) => label),
                                    [extraField]: res.map(({ value }) => value)
                                };
                            } else {
                                o = {
                                    ...o,
                                    [k]: res.map(({ value }) => value),
                                    [extraField]: res.map(({ label }) => label)
                                };
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
                    if (!o.notAddabled && o.mapleTotal !== "合计") data.push(o);
                });
                this.core.validateCells(valid => {
                    resolve({
                        value: data,
                        valid: valid,
                        columns
                    });
                    this.getDataDoubled = false;
                });
            });
        },
        checkAllBox(event, coords, $el) {
            const { row, col } = coords;
            const { countRows, setDataAtCell } = this.core;
            let type = "checkbox";

            if (
                event.realTarget &&
                event.realTarget.id === "maple-header-checkbox"
            ) {
                const checkAllableds = [];

                this.checkAllabled = !this.checkAllabled;
                for (let i = 0; i < countRows(); i++) {
                    if (this.hasColumnSummary && i === countRows() - 1) {
                        continue;
                    }
                    checkAllableds.push([i, col, this.checkAllabled]);
                }
                if (checkAllableds.length) setDataAtCell(checkAllableds);
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
                name: event.realTarget.type,
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
                    if (this.mySettings.fixViewComplete instanceof Function) {
                        this.mySettings.fixViewComplete();
                    }
                }, t);
            });
        },
        afterValidate(isValid, value, row, prop) {
            const customValidate = this.mySettings.customValidate;

            if (this.getDataDoubled && this.mySettings.openEmptyValid) {
                const hasDefaultValFileds =
                    this.mySettings.hasDefaultValFileds || [];
                const index = hasDefaultValFileds.indexOf(prop);

                if (
                    this.hasColumnSummary &&
                    row + 1 === this.core.countRows()
                ) {
                    return true;
                }

                const isEmptyRow = this.core.isEmptyRow(row);

                if (isEmptyRow) {
                    isValid = true;
                } else if (
                    !isValid &&
                    prop !== hasDefaultValFileds[index] &&
                    (value == null || value === "")
                ) {
                    const rowData = this.core.getDataAtRow(row);
                    let count = 0;

                    for (let [
                        j,
                        { data: k = "maple" }
                    ] of this.myColumns.entries()) {
                        const i = hasDefaultValFileds.indexOf(k);
                        const key = hasDefaultValFileds[i];
                        const v = rowData[j];

                        if (k !== key && v) {
                            isValid = false;
                            break;
                        }
                        if (k !== key && (v == null || v === "")) {
                            count++;
                        }
                    }
                    if (
                        count + hasDefaultValFileds.length ===
                        this.core.countCols()
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
        }
    },
    beforeDestroy() {
        Object.assign(this.$data, {});
    }
};
</script>

<style scoped>
@import url("./scoped.css");
</style>
