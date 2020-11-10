<template>
    <el-cascader
        v-if="cascaderAbled"
        ref="cascaderRef"
        v-model="value"
        :options="options"
        :loading="loading"
        filterable
        size="mini"
        :style="{
            position: 'fixed',
            zIndex: 1208,
            width: `${width}px`,
            top: `${top}px`,
            left: `${left}px`
        }"
        :class="{ 'maple-hidden': show && neddInput }"
        v-bind="prop"
        @change="change"
        @visible-change="visible"
    />
</template>

<script>
import utils from "../utils/index";
import { Cascader } from "element-ui";

export default {
    name: "MapleCascader",
    props: {
        neddInput: {
            type: Boolean,
            default: true
        }
    },
    components: { "el-cascader": Cascader },
    data() {
        return {
            options: [],
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
            cascaderAbled: false,
            address: [],
            cascaderVals: {},
            loading: false,
            timer: null
        };
    },
    mounted() {
        this.$body = document.body;
        this.$body.appendChild(this.$el);
    },
    methods: {
        visible(v) {
            this.show = !v;
            this.$emit("change", v);
        },
        change(v) {
            const { row, col } = this.coords;
            const { subType, valueName, labelName } = this.columns[col];
            const key = this.columns[col].key || this.columns[col].data;
            const value = v;

            if (subType === "address" || subType === "cascader") {
                if (this.cascaderVals[`key-${key}-value-${value}`]) {
                    v = this.cascaderVals[`key-${key}-value-${value}`].label;
                } else {
                    v = utils
                        .getCascaderLabelValue({
                            data: this.options,
                            value: v,
                            valueName,
                            labelName
                        })
                        .map(({ label }) => label)
                        .join("/");
                }
                this.cascaderVals = {
                    ...this.cascaderVals,
                    [`key-${key}-value-${v}`]: {
                        value,
                        label: v
                    },
                    [`key-${key}-value-${value}`]: {
                        value,
                        label: v
                    }
                };
                this.$emit("getCascaderVals", {
                    data: this.cascaderVals,
                    row,
                    col
                });
            }
            this.controlPickerPanel(false);
            this.changeCascader(v);
        },
        changeCascader(v) {
            const { row, col } = this.coords;

            if (col !== -1208 && row !== -1208 && col != null && row != null) {
                this.core.setDataAtCell(row, col, v, "changeCascader");
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
                return (this.cascaderAbled = false);
            }
            this.core = core;
            this.coords = {
                col,
                row
            };
            if (col !== -1208 && row !== -1208 && col != null && row != null) {
                let list = [];
                const key = columns[col].key || columns[col].data,
                    { subType = "", props = {}, type } = columns[col];
                if (type) return;
                this.controlPickerPanel(open);
                this.show = !open;
                this.width = width;
                this.top = top;
                this.left = left;
                this.prop = Object.assign({}, props);
                this.value = null;
                for (let [, w] of orgColumns.entries()) {
                    if (w.key === key || w.data === key) {
                        let wOptions = w.options || w.source || [];
                        if (w.asyncOpts && w.asyncOpts instanceof Function) {
                            this.loading = true;
                            wOptions = await w.asyncOpts({ row, col });
                            this.loading = false;
                        }
                        list =
                            (await wOptions) instanceof Function
                                ? wOptions({ row, col }) || []
                                : wOptions;
                        break;
                    }
                }

                let opts = list;
                this.columns = columns;
                if (subType === "address") {
                    if (this.address.length) {
                        opts = this.address;
                    } else {
                        opts = utils.collageAddress(utils.address);
                        this.address = opts;
                    }
                }

                if (subType === "address" || subType === "cascader") {
                    const value = this.core.getDataAtCell(row, col);
                    if (value) {
                        if (this.cascaderVals[`key-${key}-value-${value}`]) {
                            this.value = this.cascaderVals[
                                `key-${key}-value-${value}`
                            ].value;
                        } else {
                            this.value = utils
                                .getCascaderLabelValue({
                                    data: opts,
                                    value: (value || "").split("/"),
                                    matchFieldName: "label"
                                })
                                .map(({ value }) => value);
                        }

                        if (!this.value.length) {
                            this.core.setDataAtCell(
                                row,
                                col,
                                "",
                                "changeCascader"
                            );
                        }
                    }
                }
                this.options = opts;
                if (opts.length) {
                    clearTimeout(this.timer);
                    this.$refs.cascaderRef.$refs.panel.activePath = [];
                    this.$el.click();
                    this.$el.querySelector("input").focus();
                } else {
                    clearTimeout(this.timer);
                    this.$el.click();
                    this.changeEmptyText("暂无数据");
                }
            }
        },
        changeEmptyText(innerHTML = "加载中") {
            let $empty = document.querySelector(
                ".el-cascader-menu__empty-text"
            );
            $empty
                ? ($empty.innerHTML = innerHTML)
                : this.$nextTick(() => {
                      $empty = document.querySelector(
                          ".el-cascader-menu__empty-text"
                      );
                      if ($empty) $empty.innerHTML = innerHTML;
                  });
        },
        controlPickerPanel(bl) {
            this.$emit("change", bl);
            this.cascaderAbled = false;
            if (bl) {
                this.cascaderAbled = true;
                this.timer = setTimeout(() => {
                    this.options = [];
                    this.$refs.cascaderRef.$refs.panel.activePath = [];
                    this.$el.click();
                    this.$el.querySelector("input").focus();
                    this.changeEmptyText();
                    clearTimeout(this.timer);
                }, 60);
            } else {
                clearTimeout(this.timer);
                this.changeEmptyText("加载中");
                this.$nextTick(() => {
                    const $pop = document.querySelector(
                        ".el-cascader__dropdown"
                    );
                    $pop && $pop.remove();
                });
            }
        }
    },
    beforeDestroy() {
        Object.assign(this.$data, this.$options.data());
    }
};
</script>
