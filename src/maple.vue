<template>
    <div id="maple-table">
        <hot-table :settings="settings" ref="mapleTable"> </hot-table>
        <div
            v-show="showEmpty"
            :style="{
                width: `${width}px`,
                height: `${height}px`
            }"
            class="empty"
        >
            暂无数据
        </div>
        <div
            v-show="loading || myLoading"
            :style="{
                width: `${width}px`,
                height: `${height}px`
            }"
            class="loading"
        >
            <svg viewBox="25 25 50 50" class="circular">
                <circle
                    cx="50"
                    cy="50"
                    r="20"
                    fill="none"
                    class="path"
                ></circle>
            </svg>
        </div>
    </div>
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
        },
        loading: {
            type: Boolean
        }
    },
    data() {
        return {
            settings: {
                data: [],
                columns: [],
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
                height: 1208
            },
            core: {},
            checkAllabled: false,
            mapleHeaderCheckboxCol: 0,
            showEmpty: false,
            width: 0,
            height: 0,
            myLoading: false
        };
    },
    components: { HotTable },
    mounted() {
        this.$emit("getCore", this.$refs.mapleTable.hotInstance);
        this.core = this.$refs.mapleTable.hotInstance;
        this.init();
        this.changeWidth();
    },
    methods: {
        init() {
            const vm = this;
            const columns = this.collageColumns();
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

            this.settings = Object.assign(this.settings, this.options, {
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
                                cellProperties = Object.assign(cellProperties, {
                                    readOnly: true,
                                    editor: true
                                });

                                let $el = document.createElement("DIV");
                                $el.style.height = "100%";
                                $el.style.display = "flex";
                                $el.style.justifyContent = "space-around";
                                $el.style.alignItems = "center";

                                item.options.map(({ name, color }, index) => {
                                    let $btn = document.createElement("DIV");
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
                                });

                                maple.dom.empty(td);
                                td.appendChild($el);

                                return td;
                            }
                        };
                    }
                    return item;
                }),
                data: this.data,
                colWidths: columns.map(({ width = 200 }) => width),
                colHeaders
            });

            maple.dom.addEvent(this.$el, "mousedown", this.eventListener);
            this.changeCheckAllabled();
        },
        changeWidth() {
            this.$nextTick(() => {
                const $el = this.$el.querySelector(".wtHider");

                this.width = $el.clientWidth;
                this.height = this.settings.height || $el.clientHeight;
                this.showEmpty = this.core.countRows() === 0;
                if (this.showEmpty) {
                    this.clearFilters();
                }
            });
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
                this.$emit("change", {
                    source,
                    changes: [item],
                    datas: [
                        {
                            row: item[0],
                            key: item[1],
                            oldVal: item[2],
                            newVal: item[3],
                            core: this.core,
                            type: "change"
                        }
                    ]
                });
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
        beforeColumnResize() {
            this.changeWidth();
        },
        afterRemoveRow() {
            this.changeWidth();
        },
        beforeCreateRow() {
            this.changeWidth();
        },
        collageColumns() {
            const c = [];

            this.columns.map(item => {
                const options = item.options || item.source;
                const labelName = item.labelName || "label";

                c.push({
                    ...item,
                    source: options
                        ? options.map(ele => ele[labelName])
                        : undefined,
                    data: item.key || item.data,
                    options
                });
            });

            return c;
        },
        getData(callback = () => {}, openValidate = true) {
            return new Promise(resolve => {
                this.myLoading = true;
                setTimeout(() => {
                    const { countRows } = this.core;
                    const rows = [];
                    let o = {
                        value: this.collageData(callback),
                        valid: false
                    };

                    if (openValidate) {
                        for (let i = 0; i < countRows(); i++) {
                            rows.push(i);
                        }
                        this.core.validateRows(rows, valid => {
                            resolve({
                                ...o,
                                valid
                            });
                        });
                    } else resolve(o);
                    this.myLoading = false;
                });
            });
        },
        collageData(callback) {
            const { getData, getSourceDataAtRow } = this.core;
            const d = getData();
            const m = this.core.getPlugin("trimRows").trimmedRows;
            const data = [];

            m.map(i => d.splice(i, 0, getSourceDataAtRow(i)));
            d.map((ele, i) => {
                let o = this.data[i] || {};
                const dItem = d[i];
                const keys = this.settings.columns.map(
                    ({
                        data,
                        options,
                        valueType,
                        subType,
                        labelName,
                        valueName,
                        extraField
                    }) => ({
                        data,
                        options,
                        valueType,
                        subType,
                        labelName,
                        valueName,
                        extraField
                    })
                );

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
                    const extraItem =
                        callback({
                            key: k,
                            row: i,
                            col: j,
                            value: v
                        }) || {};
                    o = {
                        ...o,
                        notAddabled: extraItem.notAddabled
                    };
                    if (extraItem.notAddabled) break;
                    if (subType !== "handle" && opts && opts.length) {
                        if (!valueType) valueType = valueName;
                        if (valueType === valueName) {
                            o = {
                                ...o,
                                [k]: _.exchange({
                                    data: opts,
                                    currentValue: v,
                                    currentKey: labelName
                                })[valueName],
                                [extraField]: v,
                                ...extraItem
                            };
                        } else {
                            o = {
                                ...o,
                                [k]: v,
                                [extraField]: _.exchange({
                                    data: opts,
                                    currentValue: v,
                                    currentKey: valueName
                                })[labelName],
                                ...extraItem
                            };
                        }
                    } else {
                        o = {
                            ...o,
                            [k]: v,
                            ...extraItem
                        };
                    }
                }
                if (!o.notAddabled) data.push(o);
            });

            return data;
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
                    checkAllabled: this.checkAllabled
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
                const bl =
                    !!this.data.length && colCounts.length === countRows();

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
            }, 60);
        },
        clearFilters() {
            this.core.getPlugin("filters").clearConditions();
            this.core.getPlugin("filters").filter();
        },
        worker() {
            if (window.Worker) {
                const myWorker = new Worker("worker.js");
                myWorker.postMessage("maple love"); // 发送数据
                myWorker.onmessage = function(e) {
                    console.log("Message received from worker", e.data);
                };
            }
        }
    },
    watch: {
        columns() {
            console.log("watch columns .......................");
            this.init();
        },
        data() {
            console.log("watch data .......................");
            this.init();
        },
        options() {
            console.log("watch options .......................");
            this.init();
        }
    }
};
</script>

<style scoped>
@import url("./scoped.css");
</style>
