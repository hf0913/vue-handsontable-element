<template>
    <el-select
        class="maple-select"
        v-if="selectAbled"
        ref="selectRef"
        v-model="value"
        size="mini"
        :loading="loading"
        filterable
        :style="{
            background: 'white',
            position: 'fixed',
            zIndex: 1208,
            width: `${width}px`,
            top: `${top}px`,
            left: `${left}px`
        }"
        :class="{ 'maple-hidden': show && neddInput }"
        v-bind="prop"
        @change="change"
        @blur="blur"
    >
        <el-option
            v-for="item in options"
            :key="item[valueName]"
            :label="item[labelName]"
            :value="item[valueName]"
            :mnemonicCode="mnemonicCode"
            :itemData="item"
        >
        </el-option>
    </el-select>
</template>

<script>
import ElSelect from "./ElSelect";
import ElOption from "./ElOption";
import utils from "../utils";

export default {
    name: "MapleDatePicker",
    props: {
        neddInput: {
            type: Boolean,
            default: true
        }
    },
    components: { ElSelect, ElOption },
    data() {
        return {
            value: null,
            show: true,
            coords: {},
            top: 0,
            left: 0,
            width: "auto",
            core: {},
            prop: {},
            columns: [],
            $body: null,
            $input: null,
            selectAbled: true,
            options: [],
            labelName: "label",
            valueName: "value",
            debounceAjax: null,
            ajaxConfig: {},
            loading: false,
            key: null,
            keyOpts: {},
            selectVals: {},
            mnemonicCode: null,
            isOK: true,
            valueType: "value",
            extraField: null
        };
    },
    mounted() {
        this.$body = document.body;
        this.$body.appendChild(this.$el);
    },
    methods: {
        blur() {
            this.$nextTick(() => {
                this.show = true;
                if (!this.isOK) {
                    const { row, col } = this.coords;
                    this.core.setDataAtCell(row, col, null, "changeCells");
                }
            });
            this.$emit("change", false);
        },
        change(v) {
            this.controlPickerPanel(false);
            this.changeCells(v);
        },
        changeCells(v) {
            const { row, col } = this.coords;

            if (col !== -1208 && row !== -1208 && col != null && row != null) {
                let value;
                const { valueName, options, key, labelName } = this;
                for (let [, item] of options.entries()) {
                    if (item[valueName] === v) {
                        this.keyOpts[key] = {
                            opts: [item]
                        };
                        value = item[labelName];
                        this.selectVals[`key-${key}-value-${value}`] = item;
                        break;
                    }
                }
                this.$emit("getSelectOpts", {
                    keyOpts: this.keyOpts,
                    selectVals: this.selectVals,
                    row,
                    col,
                    valueName,
                    labelName,
                    key: this.key,
                    extraField: this.extraField,
                    valueType: this.valueType,
                    source: "select"
                });
                let t = setTimeout(() => {
                    this.core.setDataAtCell(row, col, value, "changeCells");
                    clearTimeout(t);
                    t = null;
                }, 128);
            }
        },
        async controlOpen({
            open = false,
            col = 0,
            row = 0,
            width = "auto",
            top = 0,
            left = 0,
            core = {},
            columns = [],
            orgColumns = []
        } = {}) {
            if (!open) {
                this.$emit("change", false);
                return (this.selectAbled = false);
            }
            this.selectAbled = true;
            this.coords = {
                col,
                row
            };
            if (col !== -1208 && row !== -1208 && col != null && row != null) {
                const {
                    subType = "",
                    props = {},
                    type,
                    debounceTime = 666,
                    ajaxConfig = {},
                    labelName = "label",
                    valueName = "value",
                    key,
                    data,
                    mnemonicCode = [],
                    extraField,
                    valueType
                } = columns[col];
                this.isOK = true;
                this.columns = columns;
                if (subType === "select" && !type) {
                    this.key = data || key;
                    this.extraField = extraField;
                    this.valueType = valueType;
                    let v = core.getDataAtCell(row, col);
                    const itemData = this.selectVals[
                        `key-${this.key}-value-${v}`
                    ];

                    this.core = core;
                    this.show = !open;
                    this.controlPickerPanel(open);
                    this.core = core;
                    this.width = width;
                    this.top = top;
                    this.left = left;
                    this.labelName = labelName;
                    this.valueName = valueName;
                    this.mnemonicCode = mnemonicCode;
                    this.prop = Object.assign({}, props);

                    if (itemData) {
                        this.value = itemData[labelName];
                        this.options = [itemData];
                    }
                    if (this.prop.remote && ajaxConfig && ajaxConfig.url) {
                        this.ajaxConfig = ajaxConfig;
                        for (let [, w] of orgColumns.entries()) {
                            if (w.key === this.key || w.data === this.key) {
                                this.ajaxConfig = w.ajaxConfig;
                                break;
                            }
                        }
                        this.debounceAjax = utils.debounce(
                            this.search,
                            debounceTime
                        );
                        this.prop.remoteMethod = this.remoteMethod;
                        if (!itemData) {
                            this.value = null;
                            this.options = [];
                            this.search(v);
                        }
                    } else {
                        if (!itemData) {
                            this.value = null;
                            this.options = [];
                        }
                        for (let [, w] of orgColumns.entries()) {
                            if (w.key === this.key || w.data === this.key) {
                                let wOptions = w.options || w.source || [];
                                if (
                                    w.asyncOpts &&
                                    w.asyncOpts instanceof Function
                                ) {
                                    this.loading = true;
                                    wOptions = await w.asyncOpts({ row, col });
                                    this.loading = false;
                                }
                                const opts =
                                    wOptions instanceof Function
                                        ? wOptions({ row, col }) || []
                                        : wOptions;
                                this.options = opts;
                                for (let [i, item] of opts.entries()) {
                                    if (item[labelName] === v) {
                                        this.value = item[this.labelName];
                                        break;
                                    }
                                    if (i === opts.length - 1) {
                                        this.isOK = false;
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }
        },
        controlPickerPanel(bl) {
            this.$emit("change", bl);
            if (bl) {
                let t = setTimeout(() => {
                    this.$refs.selectRef.focus();
                    clearTimeout(t);
                    t = null;
                }, 333);
            } else {
                this.selectAbled = false;
            }
        },
        remoteMethod(v) {
            if (v) {
                this.loading = true;
                this.debounceAjax.call(this, v, "remoteMethod");
            } else {
                this.options = [];
                this.isOK = false;
                this.loading = false;
            }
        },
        search(query, source) {
            if (query) {
                let { coords, ajaxConfig } = this,
                    { queryField, data, param, header } = ajaxConfig || {};
                ajaxConfig.data =
                    data instanceof Function ? data(coords) : data;
                ajaxConfig.param =
                    param instanceof Function ? param(coords) : param;
                ajaxConfig.header =
                    header instanceof Function ? header(coords) : header;
                const fn = (k, v) => {
                    if (queryField && v && Reflect.has(v, queryField)) {
                        ajaxConfig[k] = {
                            ...v,
                            [queryField]: query.replace(/\s+/g, "")
                        };
                    }
                };

                fn("data", data);
                fn("param", param);
                utils.ajax(ajaxConfig).then(v => {
                    this.options = v;
                    if (
                        v.length === 1 &&
                        v[0] &&
                        v[0][this.labelName] === query
                    ) {
                        this.value = v[0][this.labelName];
                    } else {
                        for (let [i, item] of v.entries()) {
                            if (item[this.labelName] === query) {
                                if (source !== "remoteMethod")
                                    this.value = item[this.labelName];
                                break;
                            }
                            if (i === v.length - 1) {
                                this.isOK = false;
                            }
                        }
                    }
                    this.loading = false;
                });
            }
        }
    },
    beforeDestroy() {
        Object.assign(this.$data, this.$options.data());
    }
};
</script>
