<template>
    <el-select
        class="maple-select"
        v-if="selectAbled"
        ref="selectRef"
        v-model="value"
        size="mini"
        :loading="loading"
        collapse-tags
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
        @visible-change="visibleChange"
        :popper-append-to-body="false"
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
import ElSelect from './ElSelect';
import ElOption from './ElOption';
import utils from '../utils';

export default {
    name: 'MapleDatePicker',
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
            lableOpts: [],
            show: true,
            coords: {},
            top: 0,
            left: 0,
            width: 'auto',
            core: {},
            prop: {},
            columns: [],
            $body: null,
            $input: null,
            selectAbled: true,
            options: [],
            labelName: 'label',
            valueName: 'value',
            debounceAjax: null,
            ajaxConfig: {},
            loading: false,
            key: null,
            keyOpts: {},
            selectVals: {},
            mnemonicCode: null,
            isOK: true,
            valueType: 'value',
            extraField: null,
            multiple: false
        };
    },
    mounted() {
        this.$body = document.body;
        this.$body.appendChild(this.$el);
    },
    methods: {
        visibleChange(v) {
            if (!v) {
                this.show = true;
                let items = [],
                    {
                        valueName,
                        labelName,
                        value,
                        options,
                        key,
                        coords,
                        multiple,
                        lableOpts
                    } = this,
                    cellVals = [],
                    { row, col } = coords;
                if (multiple) {
                    const opts = [...lableOpts, ...options];
                    value.map(item => {
                        for (let k of opts.values()) {
                            if (item === k[valueName]) {
                                items.push(k);
                                cellVals.push(k[labelName]);
                                break;
                            }
                        }
                    });
                    cellVals = cellVals.join(',');
                    this.keyOpts[key] = {
                        opts: items
                    };
                    this.selectVals[`key-${key}-value-${cellVals}`] = items;
                    if (cellVals.length) {
                        this.$emit('getSelectOpts', {
                            keyOpts: this.keyOpts,
                            selectVals: this.selectVals,
                            row,
                            col,
                            valueName,
                            labelName,
                            key,
                            extraField: this.extraField,
                            valueType: this.valueType,
                            source: 'select'
                        });
                    }
                    this.core.setDataAtCell(row, col, cellVals, 'changeCells');
                } else if (!this.isOK) {
                    this.core.setDataAtCell(row, col, null, 'changeCells');
                }
                this.$emit('change', false);
            }
        },
        change(v) {
            if (this.multiple) {
                const { options, valueName } = this;
                let lableOpts = this.lableOpts;
                options.map(item => {
                    if (
                        ~v.findIndex(ele => ele === item[valueName]) &&
                        !~lableOpts.findIndex(
                            ele => ele[valueName] === item[valueName]
                        )
                    ) {
                        lableOpts.push(item);
                    }
                });
            } else {
                this.controlPickerPanel(false);
                this.changeCells(v);
            }
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
                this.$emit('getSelectOpts', {
                    keyOpts: this.keyOpts,
                    selectVals: this.selectVals,
                    row,
                    col,
                    valueName,
                    labelName,
                    key: this.key,
                    extraField: this.extraField,
                    valueType: this.valueType,
                    source: 'select'
                });
                let t = setTimeout(() => {
                    this.core.setDataAtCell(row, col, value, 'changeCells');
                    clearTimeout(t);
                    t = null;
                }, 128);
            }
        },
        async controlOpen({
            open = false,
            col = 0,
            row = 0,
            width = 'auto',
            top = 0,
            left = 0,
            core = {},
            columns = [],
            orgColumns = []
        } = {}) {
            if (!open) {
                this.$emit('change', false);
                return (this.selectAbled = false);
            }
            this.selectAbled = true;
            this.coords = {
                col,
                row
            };
            if (col !== -1208 && row !== -1208 && col != null && row != null) {
                const {
                    subType = '',
                    props = {},
                    type,
                    debounceTime = 666,
                    ajaxConfig = {},
                    labelName = 'label',
                    valueName = 'value',
                    key,
                    data,
                    mnemonicCode = [],
                    extraField,
                    valueType
                } = columns[col];
                this.isOK = true;
                this.columns = columns;
                if (subType === 'select' && !type) {
                    this.key = data || key;
                    this.extraField = extraField;
                    this.valueType = valueType;
                    let v = core.getDataAtCell(row, col) || '';
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
                    const multiple = props.multiple;
                    this.multiple = multiple;

                    if (itemData) {
                        this.value = multiple
                            ? itemData.map(item => item[valueName])
                            : itemData[labelName];
                        this.options = multiple ? itemData : [itemData];
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
                            this.value = multiple ? [] : null;
                            this.options = [];
                            this.search(v, 'autoFill');
                        }
                    } else {
                        if (!itemData) {
                            this.value = multiple ? [] : null;
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
                                let cellVals = [],
                                    items = [];
                                if (multiple) {
                                    v = v.split(',');
                                    v.map(item => {
                                        for (let k of opts.values()) {
                                            if (item === k[labelName]) {
                                                items.push(k);
                                                cellVals.push(k[valueName]);
                                                break;
                                            }
                                        }
                                    });
                                    cellVals.length
                                        ? (this.value = cellVals)
                                        : (this.isOK = false);
                                    this.keyOpts[key] = {
                                        opts: items
                                    };
                                    this.selectVals[
                                        `key-${key}-value-${cellVals}`
                                    ] = items;
                                    this.$emit('getSelectOpts', {
                                        keyOpts: this.keyOpts,
                                        selectVals: this.selectVals,
                                        noEmit: true
                                    });
                                } else {
                                    for (let [i, item] of opts.entries()) {
                                        if (item[labelName] === v) {
                                            this.value = item[this.labelName];
                                            this.keyOpts[key] = {
                                                opts: [item]
                                            };
                                            this.selectVals[
                                                `key-${key}-value-${this.value}`
                                            ] = item;
                                            this.$emit('getSelectOpts', {
                                                keyOpts: this.keyOpts,
                                                selectVals: this.selectVals,
                                                noEmit: true
                                            });
                                            break;
                                        }
                                        if (i === opts.length - 1) {
                                            this.isOK = false;
                                        }
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
            this.$emit('change', bl);
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
                this.debounceAjax.call(this, v);
            } else {
                if (this.multiple) {
                    if (!this.value.length) {
                        this.options = [];
                        this.isOK = false;
                    }
                } else {
                    this.options = [];
                    this.isOK = false;
                }
                this.loading = false;
            }
        },
        search(query, source) {
            if (query) {
                let {
                        coords,
                        ajaxConfig,
                        labelName,
                        multiple,
                        valueName
                    } = this,
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
                            [queryField]: query.replace(/\s+/g, '')
                        };
                    }
                };

                fn('data', data);
                fn('param', param);
                utils.ajax(ajaxConfig).then(v => {
                    this.options = v;
                    if (multiple) {
                        let cellVals = [];
                        query = query.split(',');
                        query.map(item => {
                            for (let k of v.values()) {
                                if (item === k[labelName]) {
                                    cellVals.push(k[valueName]);
                                    break;
                                }
                            }
                        });
                        if (cellVals.length) {
                            this.$nextTick(() => {
                                if (source === 'autoFill')
                                    this.value = cellVals;
                            });
                        }
                    } else {
                        if (
                            v.length === 1 &&
                            v[0] &&
                            v[0][labelName] === query
                        ) {
                            this.value = v[0][labelName];
                        } else {
                            for (let [i, item] of v.entries()) {
                                if (
                                    item[labelName] === query &&
                                    source === 'autoFill'
                                ) {
                                    this.value = item[labelName];
                                    break;
                                }
                                if (i === v.length - 1) {
                                    this.isOK = false;
                                }
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
