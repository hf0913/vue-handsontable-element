<template>
    <el-select
        class="maple-select"
        v-if="selectAbled"
        ref="selectRef"
        v-model="value"
        size="mini"
        :loading="loading"
        clearable
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
            isOK: true
        };
    },
    mounted() {
        this.$body = document.body;
        this.$body.appendChild(this.$el);
    },
    methods: {
        blur() {
            this.show = true;
            if (!this.isOK) {
                const { row, col } = this.coords;
                this.core.setDataAtCell(row, col, null, "changeCells");
            }
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
                    selectVals: this.selectVals
                });
                this.core.setDataAtCell(row, col, value, "changeCells");
            }
        },
        controlOpen({
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
                    mnemonicCode = []
                } = columns[col];
                this.isOK = true;
                this.columns = columns;
                if (subType === "select" && !type) {
                    this.key = data || key;
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
                        this.debounceAjax = utils.debounce(
                            this.search,
                            debounceTime
                        );
                        this.prop.remoteMethod = this.remoteMethod;
                        if (!itemData) {
                            this.value = null;
                            this.options = [];
                            this.search.call(this, v);
                        }
                    } else {
                        if (!itemData) {
                            this.value = null;
                            this.options = [];
                        }
                        for (let [, w] of orgColumns.entries()) {
                            if (w.key === this.key || w.data === this.key) {
                                const wOptions = w.options || w.source || [];
                                const opts =
                                    wOptions instanceof Function
                                        ? wOptions()
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
            this.debounceAjax.call(this, v);
        },
        search(query) {
            if (query) {
                this.loading = true;
                let ajaxConfig = this.ajaxConfig;
                let { queryField, data, param } = ajaxConfig;
                const fn = (k, v) => {
                    if (v && Reflect.has(v, queryField)) {
                        ajaxConfig = {
                            ...ajaxConfig,
                            [k]: {
                                ...v,
                                [queryField]: query.replace(/\s+/g, "")
                            }
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
                        this.isOK = false;
                    }
                    this.loading = false;
                });
            } else {
                this.options = [];
                this.isOK = false;
            }
        }
    },
    beforeDestroy() {
        Object.assign(this.$data, this.$options.data());
    }
};
</script>