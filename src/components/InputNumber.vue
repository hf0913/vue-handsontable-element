<template>
    <div
        v-if="isRenderer"
        class="maple-input-number w-100 h-100 d-flex justify-center align-center"
        :id="`maple${row}${col}`"
    >
        <el-input-number
            style="width: 90%"
            @click.native="click"
            size="mini"
            v-model="value"
            v-bind="props"
        />
    </div>
</template>
<script>
import { BaseEditorComponent } from "@handsontable/vue";

export default {
    extends: BaseEditorComponent,
    data() {
        return {
            props: null,
            value: null,
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
        changeValue(v) {
            this.value = v;
        },
        changeTDbg() {
            return this.TD.querySelector(`#maple${this.row}${this.col}`)
                ? this.TD
                : null;
        },
        click() {
            this.$store.state.MapleStore.commit("click", {
                type: "inputNumber",
                col: this.col,
                row: this.row,
                core: this.hotInstance
            });
        }
    },
    created() {
        if (this.col != null) {
            this.$store.commit("setKeepCellAttribute", {
                [`inputNumber-row-${this.row}-col-${this.col}`]: this.$store.state.MapleStore.changeCellProperties.bind(
                    this
                )
            });
            this.$store.commit("setChangeValue", {
                [`inputNumber-row-${this.row}-col-${this.col}`]: this
                    .changeValue
            });
            this.$store.commit("setChangeTDbg", {
                [`row-${this.row}-col-${this.col}`]: this.changeTDbg
            });
        }
        this.$store.dispatch("disComponentInit", {
            own: this
        });
    },
    watch: {
        value(v) {
            this.setValue(v);
            this.$store.dispatch("disKeepCellValueOK", {
                own: this
            });
        }
    }
};
</script>
