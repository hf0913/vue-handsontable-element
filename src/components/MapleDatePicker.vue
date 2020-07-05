<template>
    <el-date-picker
        ref="datePickerRef"
        v-model="value"
        size="mini"
        clearable
        filterable
        :style="{
            background: 'white',
            position: 'absolute',
            zIndex: 1208,
            width: `${width}px`,
            top: 0,
            left: 0,
            marginTop: `${top}px`,
            marginLeft: `${left}px`
        }"
        :class="{ 'maple-hidden': show && neddInput }"
        v-bind="prop"
        @change="change"
        @blur="blur"
    />
</template>

<script>
export default {
    name: "MapleDatePicker",
    props: {
        neddInput: {
            type: Boolean,
            default: true
        }
    },
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
            $input: null
        };
    },
    mounted() {
        this.$body = document.body;
        this.$body.appendChild(this.$el);
    },
    methods: {
        blur() {
            this.show = true;
        },
        change(v) {
            this.controlPickerPanel(false);
            this.changeDate(v);
        },
        changeDate(v) {
            const { col, row } = this.coords;

            if (col !== -1208 && row !== -1208 && col != null && row != null) {
                this.core.setDataAtCell(row, col, v, "changeDate");
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
            columns = []
        } = {}) {
            this.coords = {
                col,
                row
            };
            if (col !== -1208 && row !== -1208 && col != null && row != null) {
                const { subType = "", props = {}, type } = columns[col];

                this.columns = columns;
                if (subType === "datePicker" && !type) {
                    this.value = core.getDataAtCell(row, col);
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
            if (bl) {
                let t = setTimeout(() => {
                    this.$refs.datePickerRef.focus();
                    clearTimeout(t);
                    t = null;
                }, 333);
            }
        }
    }
};
</script>
