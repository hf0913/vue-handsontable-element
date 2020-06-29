<template>
    <hot-table :settings="settings" ref="mapleTable" />
</template>

<script>
import { HotTable } from "@handsontable/vue";
import maple from "handsontable";
import "handsontable/languages/zh-CN";
import "handsontable/dist/handsontable.full.css";
import _ from "./utils";

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
        }
    },
    data() {
        return {
            settings: {
                data: [],
                columns: [],
                comments: true,
                rowHeaders: true,
                licenseKey: "non-commercial-and-evaluation",
                language: "zh-CN",
                filters: true,
                fillHandle: {
                    autoInsertRow: false,
                    direction: "vertical"
                },
                dropdownMenu: ["filter_by_condition", "filter_action_bar"],
                contextMenu: [
                    "row_above",
                    "row_below",
                    "remove_row",
                    "clear_column",
                    "undo",
                    "redo",
                    "copy"
                ],
                colWidths: 200,
                className: "htCenter htMiddle",
                manualColumnResize: true,
                manualRowResize: true,
                renderAllRows: false,
                afterOnCellMouseDown: this.afterOnCellMouseDown,
                beforeChange: this.beforeChange,
                beforeColumnResize: this.beforeColumnResize,
                afterRemoveRow: this.afterRemoveRow,
                beforeCreateRow: this.beforeCreateRow,
                maxRows: 12080,
                height: 1208,
                readOnlyCellClassName: "maple-readOnly"
            },
            core: {},
            checkAllabled: false,
            mapleHeaderCheckboxCol: 0,
            width: 0,
            height: 0,
            selectOpts: [],
            changes: {}
        };
    },
    components: { HotTable },
    mounted() {
        this.$emit("getCore", this.$refs.mapleTable.hotInstance);
        this.core = this.$refs.mapleTable.hotInstance;
        this.init("mounted");
    },
    activated() {
        this.fixView();
    },
    methods: {
        init(t) {
            const vm = this;
            const columns = this.collageColumns(t);
            const colHeaders = col => {
                if (this.columns[col].subType === "selection") {
                    this.mapleHeaderCheckboxCol = col;
                    return `<input type='checkbox' ${
                        vm.checkAllabled ? "checked" : ""
                    } id="maple-header-checkbox" style="margin-left: ${
                        this.settings.dropdownMenu &&
                        this.settings.dropdownMenu.length
                            ? "21px"
                            : 0
                    }" ${this.data.length ? "" : "disabled"}/>`;
                }
            };

            if (t === "mounted" || t === "columns") {
                this.settings = Object.assign(this.settings, {
                    columns: columns.map(item => {
                        if (item.subType === "handle") {
                            item = {
                                ...item,
                                renderer: function(
                                    instance,
                                    td,
                                    row,
                                    col,
                                    prop,
                                    value,
                                    // eslint-disable-next-line no-unused-vars
                                    cellProperties
                                ) {
                                    cellProperties = Object.assign(
                                        cellProperties,
                                        {
                                            readOnly: true,
                                            editor: true
                                        }
                                    );

                                    let $el = document.createElement("DIV");
                                    $el.style.height = "100%";
                                    $el.style.display = "flex";
                                    $el.style.justifyContent = "space-around";
                                    $el.style.alignItems = "center";

                                    item.options.map(
                                        ({ name, color }, index) => {
                                            let $btn = document.createElement(
                                                "DIV"
                                            );
                                            $btn.innerHTML = name;
                                            $btn.style.color = color;
                                            $btn.style.cursor = "pointer";
                                            $el.append($btn);

                                            maple.dom.addEvent(
                                                $btn,
                                                "mousedown",
                                                event => {
                                                    vm.$emit("click", {
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
                                                }
                                            );
                                        }
                                    );

                                    maple.dom.empty(td);
                                    td.appendChild($el);

                                    return td;
                                }
                            };
                        }
                        return item;
                    }),
                    colWidths: columns.map(({ width = 200 }) => width)
                });
            }
            if (t === "mounted" || t === "data") {
                this.settings = Object.assign(this.settings, {
                    data: this.data,
                    colHeaders
                });
            }
            if (t === "mounted" || t === "options") {
                this.settings = Object.assign(this.settings, this.options);
            }

            maple.dom.addEvent(this.$el, "mousedown", this.eventListener);
            this.changeCheckAllabled();
        },
        afterOnCellMouseDown(event, coords, $el) {
            const { row, col } = coords;

            if (col === this.mapleHeaderCheckboxCol) {
                this.checkBox(event, coords, $el);
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
        beforeChange(changes, source) {
            changes.map(item => {
                const [row, key, oldVal, newVal] = item;
                if (!isNaN(row)) {
                    this.changes[`${row}-${key}-${oldVal}-${newVal}`] = item;
                }
            });

            this.$emit("change", {
                source,
                changes,
                core: this.core,
                type: "change",
                getKeyChange: this.getKeyChange,
                filterKeysChanges: this.filterKeysChanges
            });
            if (
                changes.length &&
                changes[0] &&
                changes[0].length &&
                changes[0].filter(value => Number.isNaN(value)).length
            ) {
                // 解决表头自定义为checkbox click error
                return false;
            }
        },
        beforeColumnResize() {},
        afterRemoveRow(index, amount, physicalRows, source) {
            this.$emit("afterRemoveRow", {
                index,
                amount,
                physicalRows,
                source
            });
        },
        beforeCreateRow(index, amount, source) {
            this.$emit("beforeCreateRow", {
                index,
                amount,
                source
            });
        },
        collageColumns(t) {
            if (t !== "mounted" && t !== "columns") return;
            const c = [];
            const vm = this;
            const debounceOptimize = _.debounce(
                ({
                    query,
                    options = [],
                    maxMatchLen,
                    labelName,
                    index,
                    process
                }) => {
                    let opts = [];

                    query = query.replace(/(^\s*)|(\s*$)/g, "");
                    if (query === "") {
                        if (options instanceof Function) {
                            options = options();
                        }
                        opts = options.slice(0, maxMatchLen);
                        process(opts.map(m => m[labelName]));
                        vm.selectOpts[index] = opts;
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
                        vm.selectOpts[index] = opts;
                    }
                }
            );
            const debounceAjax = _.debounce(
                ({ ajaxConfig, query, labelName, index, process }) => {
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
                        vm.selectOpts[index] = v;
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
                    case item.subType === "optimize":
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
                            source: function(query, process) {
                                debounceOptimize({
                                    query,
                                    options,
                                    maxMatchLen,
                                    labelName,
                                    index,
                                    process
                                });
                            }
                        });
                        break;
                    case item.subType === "ajax":
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
                            source: function(query, process) {
                                debounceAjax({
                                    ajaxConfig,
                                    query,
                                    labelName,
                                    index,
                                    process
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
            return new Promise(resolve => {
                const { getData, getSourceDataAtRow } = this.core;
                const d = getData();
                const m = this.core.getPlugin("trimRows").trimmedRows;
                const data = [];

                m.map(i => d.splice(i, 0, getSourceDataAtRow(i)));
                d.map(async (ele, i) => {
                    let o = this.data[i] || {};
                    const dItem = d[i];
                    const keys = this.settings.columns;

                    for (let [
                        j,
                        {
                            data: k,
                            options: opts,
                            valueType,
                            labelName = "label",
                            valueName = "value",
                            extraField = "maple_extra_field",
                            subType
                        }
                    ] of keys.entries()) {
                        const v = dItem[j];

                        if (opts instanceof Function) {
                            opts = opts();
                        }
                        opts =
                            this.selectOpts[j] && this.selectOpts[j].length
                                ? this.selectOpts[j]
                                : opts;
                        if (subType !== "handle" && opts && opts.length && k) {
                            if (!valueType) valueType = labelName;
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
                    if (!o.notAddabled) data.push(o);
                });
                this.core.validateCells(valid => {
                    resolve({
                        value: data,
                        valid: valid
                    });
                });
            });
        },
        checkBox(event, coords, $el) {
            const { row, col } = coords;
            const { countRows, setDataAtCell } = this.core;
            let type = "checkbox";

            if (event.realTarget.id === "maple-header-checkbox") {
                const checkAllableds = [];

                this.checkAllabled = !this.checkAllabled;
                for (let i = 0; i < countRows(); i++) {
                    checkAllableds.push([i, col, this.checkAllabled]);
                }
                setDataAtCell(checkAllableds);
                type = "allCheckbox";
                this.$emit("change", {
                    type,
                    event,
                    core: this.core,
                    checkAllabled: this.checkAllabled,
                    getKeyChange: this.getKeyChange
                });
            } else {
                this.changeCheckAllabled(col, true);
                type = "singleCheckbox";
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
        changeCheckAllabled(col, emitChange) {
            setTimeout(() => {
                const { countRows, getDataAtCol } = this.core;
                const colCounts = getDataAtCol(col).filter(v => v);
                let rows = countRows();
                if (
                    this.options.columnSummary &&
                    this.options.columnSummary.length > 0
                ) {
                    rows = rows - 1;
                }
                const bl = !!this.data.length && colCounts.length === rows;

                if (bl !== this.checkAllabled) {
                    this.checkAllabled = bl;
                    this.core.render();
                    if (emitChange) {
                        this.$emit("change", {
                            type: "allCheckbox",
                            event,
                            core: this.core,
                            checkAllabled: this.checkAllabled
                        });
                    }
                }
            }, 128);
        },
        clearFilters() {
            this.core.getPlugin("filters").clearConditions();
            this.core.getPlugin("filters").filter();
        },
        getKeyChange(key, changes) {
            // 针对多个changes，根据要columns中data || key的字段名，返回符合条件的数据集合
            let o = [];

            for (let item of changes.values()) {
                if (item[1] === key) {
                    o.push(item);
                }
            }
            return o;
        },
        filterKeysChanges({ keys, changes, callback }) {
            for (let item of changes.values()) {
                const [row, key, oldVal, newVal] = item;
                const i = keys.indexOf(key);

                if (keys[i] === key) {
                    callback({ row, key, oldVal, newVal });
                }
            }
        },
        fixView() {
            let t1, t2;
            t1 = setTimeout(() => {
                this.core.scrollViewportTo(0, this.columns.length - 1);
                t2 = setTimeout(() => {
                    this.core.scrollViewportTo(0, 0);
                    clearTimeout(t1);
                    clearTimeout(t2);
                    t1 = t2 = null;
                });
            });
        }
    },
    watch: {
        columns() {
            this.init("columns");
        },
        data() {
            this.init("data");
        },
        options() {
            this.init("options");
        }
    }
};
</script>

<style scoped>
@import url("./scoped.css");
</style>
