<template>
    <hot-table
        id="maple-table"
        :settings="settings"
        language="zh-CN"
        ref="hotTableRef"
        v-loading="options.loading || $store.state.MapleStore.loading"
    >
        <hot-column
            v-for="(item, index) in columns"
            :key="index"
            read-only="true"
        >
            <MapleCheckbox
                v-if="item.type === 'selection'"
                hot-editor
                hot-renderer
            />
            <MapleRadioGroup
                v-else-if="item.type === 'radio'"
                hot-editor
                hot-renderer
            />
            <MapleInput
                v-else-if="item.type === 'input'"
                hot-editor
                hot-renderer
            />
            <MapleInputNumber
                v-else-if="item.type === 'inputNumber'"
                hot-editor
                hot-renderer
            />
            <MapleSelect
                v-else-if="item.type === 'select'"
                hot-editor
                hot-renderer
            />
            <MapleSwitch
                v-else-if="item.type === 'switch'"
                hot-editor
                hot-renderer
            />
            <MapleDateTimePicker
                v-else-if="item.type === 'date'"
                hot-editor
                hot-renderer
            />
            <MapleCascader
                v-else-if="item.type === 'cascader'"
                hot-editor
                hot-renderer
            />
            <MapleReadOnlyText
                v-else-if="
                    item.type === 'readOnlyText' || item.type === 'index'
                "
                hot-editor
                hot-renderer
            />
            <MapleButton
                v-else-if="item.type === 'handle'"
                hot-editor
                hot-renderer
            />
            <MapleText v-else hot-editor hot-renderer />
        </hot-column>
    </hot-table>
</template>

<script>
import { HotTable, HotColumn } from "@handsontable/vue";
import {
    MapleCheckbox,
    MapleRadioGroup,
    MapleInput,
    MapleInputNumber,
    MapleSelect,
    MapleSwitch,
    MapleDateTimePicker,
    MapleText,
    MapleButton,
    MapleCascader,
    MapleReadOnlyText
} from "./components";
import Handsontable from "handsontable";
import "handsontable/languages/zh-CN";

export default {
    name: "MapleHandsontable",
    props: {
        columns: {
            required: true,
            type: Array
        },
        value: {
            required: true,
            type: Array
        },
        options: {
            type: Object
        }
    },
    data() {
        return {
            $maple: Object,
            initCellsAttributeFn: Function
        };
    },
    computed: {
        settings() {
            const options = {
                persistentState: true,
                dragToScroll: false,
                fillHandle: {
                    autoInsertRow: false,
                    direction: "vertical"
                },
                contextMenu: [],
                licenseKey: "non-commercial-and-evaluation",
                rowHeaders: false,
                manualColumnResize: true,
                manualRowResize: true,
                rowHeights: [],
                autoRowSize: false,
                autoColumnSize: false,
                renderAllRows: true,
                viewportRowRenderingOffset: 1208, // 缓存row最大数
                viewportColumnRenderingOffset: this.columns.length + 12 // 缓存column最大数
            };
            let o = {};

            o = {
                ...options,
                ...this.options,
                colHeaders: col => {
                    // 自定义表头事件
                    if (col === 0 && this.columns[col].type === "selection") {
                        return `<input type='checkbox' class='checker' id='maple-checkbox' ${
                            this.$store.state.MapleStore.checkAllabled
                                ? "checked"
                                : ""
                        }/>`;
                    } else return this.columns[col] && this.columns[col].title;
                },
                afterOnCellCornerMouseDown: this.afterOnCellCornerMouseDown,
                beforePaste: this.beforePaste,
                afterScrollHorizontally: this.afterScrollHorizontally,
                beforeAutofill: this.beforeAutofill,
                afterColumnResize: this.afterColumnResize
            };
            this.initTableData(o);
            return this.$store.state.MapleStore.hotSettings;
        }
    },
    components: {
        HotTable,
        HotColumn,
        MapleCheckbox,
        MapleRadioGroup,
        MapleInput,
        MapleInputNumber,
        MapleSelect,
        MapleSwitch,
        MapleDateTimePicker,
        MapleText,
        MapleButton,
        MapleCascader,
        MapleReadOnlyText
    },
    mounted() {
        this.$store.commit(
            "setInitCellsAttribute",
            this.$store.state.MapleStore.debounce.call(
                this,
                this.initCellsAttribute
            )
        );
        this.$store.commit("setCommit", this.commit);
        this.$maple = this.$refs.hotTableRef;
        Handsontable.dom.addEvent(this.$el, "mousedown", this.eventListener);
        this.$store.state.MapleStore.validate(undefined, this);
        this.initCellsAttribute();
    },
    methods: {
        eventListener(o) {
            const {
                target: { nodeName, id, className, checked }
            } = o;
            if (nodeName === "DIV" && className === "wtHolder") {
                this.$store.state.MapleStore.$input.blur &&
                    this.$store.state.MapleStore.$input.blur();
            }
            if (nodeName == "INPUT" && id === "maple-checkbox") {
                for (let index of this.$store.state.MapleStore.hotSettings.data.keys()) {
                    this.$store.dispatch("disUpdateData", {
                        row: index,
                        col: 0,
                        td: this.TD,
                        value: !checked,
                        own: this
                    });
                }

                this.$store.commit("setCheckAllabled", !checked);
                this.$store.dispatch("disSelectionChange", {
                    subType: "allSelection"
                });

                for (let [key, fn] of Object.entries(
                    this.$store.state.MapleStore.changeValues
                )) {
                    if (key.includes("selection")) fn(!checked);
                }
            }
        },
        commit(methods, payload) {
            this.$emit(methods, payload);
        },
        validate(callback = () => {}) {
            this.$nextTick(() => {
                this.$store.state.MapleStore.validate(callback, this);
            });
        },
        handleOptionEvent(type, ...res) {
            if (Reflect.has(this.options, type)) {
                this.options[type](...res);
            }
        },
        afterOnCellCornerMouseDown(event) {
            // 点击单元格边角事件
            this.$store.state.MapleStore.$input.blur &&
                this.$store.state.MapleStore.$input.blur();
            this.handleOptionEvent("afterOnCellCornerMouseDown", event);
        },
        beforePaste(data, coords) {
            // 粘贴后事件
            this.handleOptionEvent("beforePaste", data, coords);
            this.$nextTick(() => {
                this.$store.state.MapleStore.validate(undefined, this);
            });
        },
        beforeCut(data, coords) {
            // 剪切后事件
            this.handleOptionEvent("beforeCut", data, coords);
            this.$nextTick(() => {
                this.$store.state.MapleStore.validate(undefined, this);
            });
        },
        afterScrollHorizontally() {
            // 水平方向滚动事件
            this.handleOptionEvent("afterScrollHorizontally");
        },
        afterScrollVertically() {
            // 垂直方向滚动事件
            this.handleOptionEvent("afterScrollVertically");
        },
        beforeAutofill(start, end, data) {
            // 自动填充后事件
            this.$nextTick(() => {
                this.$store.state.MapleStore.validate(undefined, this);
            });
            this.handleOptionEvent("beforeAutofill", start, end, data);
        },
        afterColumnResize(currentColumn, newSize, isDoubleClick) {
            // 手动改变column的width事件触发
            this.$store.state.MapleStore.validate(undefined, this);
            this.handleOptionEvent(
                "afterColumnResize",
                currentColumn,
                newSize,
                isDoubleClick
            );
        },
        initTableData(o = {}) {
            let outerArr = [];
            let colWidths = [];
            let { colWidths: w } = o;
            let hasWidths =
                !(w instanceof Array) || (w instanceof Array && w.length === 0);
            if (w instanceof Array) colWidths = w;
            for (let [index, v] of this.value.entries()) {
                let innerArr = [];
                for (let [, item] of this.columns.entries()) {
                    if (hasWidths) {
                        colWidths.push(item.width || 200);
                    }
                    if (
                        Reflect.has(v, item.key) ||
                        item.type === "selection" ||
                        item.type === "index"
                    ) {
                        switch (true) {
                            case item.type === "date" ||
                                item.type === "cascader":
                                innerArr.push(
                                    JSON.stringify({
                                        [item.type]: v[item.key]
                                    })
                                );
                                break;
                            case item.type === "index":
                                innerArr.push(v.mapleIndex || ++index);
                                break;
                            case item.type === "inputNumber":
                                innerArr.push(v[item.key] - 0 || 0);
                                break;
                            default:
                                innerArr.push(v[item.key]);
                        }
                    } else innerArr.push(null);
                }
                outerArr.push(innerArr);
            }
            o = { ...o, data: outerArr, colWidths };
            this.$store.commit("setTableColumn", this.columns);
            this.$store.commit("setHotSettings", o);
            this.$store.commit(
                "setTableData",
                JSON.parse(JSON.stringify(this.value))
            );
        },
        initCellsAttribute() {
            // 初始化单元格属性
            this.$nextTick(() => {
                for (let fn of Object.values(
                    this.$store.state.MapleStore.keepCellAttribute
                )) {
                    fn();
                }
            });
        }
    },
    watch: {
        columns() {
            console.log("watch columns..........");
            this.initTableData();
            this.initCellsAttribute();
        },
        value() {
            console.log("watch value............");
            this.initTableData();
        },
        options() {
            console.log("watch options............");
            this.initTableData();
        }
    }
};
</script>
