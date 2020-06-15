<template>
    <div
        v-if="isRenderer"
        class="maple-cascader w-100 h-100 d-flex justify-center align-center"
        :id="`maple${row}${col}`"
    >
        <el-cascader
            clearable
            size="mini"
            v-bind="props"
            v-model="cascader"
            :options="options"
            @change="change"
            @click.native="click"
            style="width: 90%"
        ></el-cascader>
    </div>
</template>
<script>
import { BaseEditorComponent } from "@handsontable/vue";

export default {
    extends: BaseEditorComponent,
    data() {
        return {
            props: null,
            options: [],
            value: null,
            cascader: null,
            hotInstance: null,
            TD: null,
            row: null,
            col: null,
            prop: null,
            cellProperties: {
                editor: false,
                readOnly: false
            },
            isEditor: null,
            isRenderer: null,
            editorElement: null,
            isVisible: false
        };
    },
    methods: {
        close() {
            this.isVisible = false;
        },
        setValue(v) {
            this.value = v;
        },
        getValue() {
            return this.value;
        },
        open() {
            this.isVisible = true;
        },
        change(v) {
            const cascader = JSON.stringify({
                cascader: v
            });
            this.setValue(cascader);
            this.value = cascader;
        },
        changeValue(v) {
            if (v && v.includes(`{"cascader":`)) {
                const { cascader } = JSON.parse(v);
                v = cascader;
            } else v = null;
            this.cascader = v;
        },
        changeTDbg() {
            return this.TD.querySelector(`#maple${this.row}${this.col}`)
                ? this.TD
                : null;
        },
        click() {
            this.$store.state.MapleStore.commit("click", {
                type: "cascader",
                col: this.col,
                row: this.row,
                core: this.hotInstance,
                td: this.TD
            });
        }
    },
    created() {
        if (this.col != null) {
            this.$store.commit("setKeepCellAttribute", {
                [`cascader-row-${this.row}-col-${this.col}`]: this.$store.state.MapleStore.changeCellProperties.bind(
                    this
                )
            });
            this.$store.commit("setChangeValue", {
                [`cascader-row-${this.row}-col-${this.col}`]: this.changeValue
            });
            this.$store.commit("setChangeTDbg", {
                [`row-${this.row}-col-${this.col}`]: this.changeTDbg
            });
        }
        this.$store.dispatch("disExchangeData", {
            key: "cascader",
            own: this,
            col: this.col
        });
        this.$store.dispatch("disComponentInit", {
            own: this
        });
    },
    watch: {
        value(v) {
            this.changeValue(v);
            this.$store.dispatch("disKeepCellValueOK", {
                own: this
            });
        }
    }
};
</script>
