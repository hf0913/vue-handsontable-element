<template>
    <el-date-picker
        v-if="datePickerAbled"
        ref="datePickerRef"
        v-model="value"
        size="mini"
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
    />
</template>

<script>
import { DatePicker } from 'element-ui';

export default {
    name: 'MapleDatePicker',
    props: {
        neddInput: {
            type: Boolean,
            default: true
        }
    },
    components: { 'el-date-picker': DatePicker },
    data() {
        return {
            key: null,
            value: null,
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
            datePickerAbled: true
        };
    },
    mounted() {
        this.$body = document.body;
        this.$body.appendChild(this.$el);
    },
    methods: {
        blur() {
            this.show = true;
            this.$emit('change', false);
        },
        change(v) {
            this.controlPickerPanel(false);
            this.changeDate(v);
        },
        changeDate(v) {
            const { row, col } = this.coords;

            if (col !== -1208 && row !== -1208 && col != null && row != null) {
                this.core.setDataAtRowProp(row, this.key, v, 'changeDate');
            }
        },
        controlOpen({
            open = false,
            col = 0,
            row = 0,
            width = 'auto',
            top = 0,
            left = 0,
            core = {},
            columns = []
        } = {}) {
            if (!open) {
                this.$emit('change', false);
                return (this.datePickerAbled = false);
            }
            this.datePickerAbled = true;
            this.coords = {
                col,
                row
            };
            if (col !== -1208 && row !== -1208 && col != null && row != null) {
                const { subType = '', props = {}, type, key, data } = columns[
                    col
                ];
                const charReg = /^[\u4e00-\u9fa5]+$/;
                const { valueFormat = 'yyyy-MM-dd HH:mm:ss' } = props;

                this.columns = columns;
                if (subType === 'datePicker' && !type) {
                    let v = core.getDataAtCell(row, col);

                    this.key = key || data;
                    this.value =
                        v && v.length === valueFormat.length && !charReg.test(v)
                            ? v
                            : null;
                    this.core = core;
                    this.show = !open;
                    this.controlPickerPanel(open);
                    this.core = core;
                    this.width = width;
                    this.top = top;
                    this.left = left;
                    this.prop = Object.assign({}, props);
                }
            }
        },
        controlPickerPanel(bl) {
            this.$emit('change', bl);
            if (bl) {
                let t = setTimeout(() => {
                    this.$refs.datePickerRef.focus();
                    clearTimeout(t);
                    t = null;
                }, 333);
            }
        }
    },
    beforeDestroy() {
        Object.assign(this.$data, this.$options.data());
    }
};
</script>
