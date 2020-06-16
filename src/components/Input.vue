<template>
    <div
        v-if="isRenderer"
        class="maple-input w-100 h-100 d-flex justify-center align-center"
        :id="`maple${row}${col}`"
    >
        <el-input
            clearable
            size="mini"
            v-model="value"
            v-bind="props"
            @focus="$event => input($event)"
            @click.native="click"
            style="width: 90%"
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
        input({ target }) {
            this.$store.commit("setInputTarget", target);
        },
        changeTDbg() {
            return this.TD.querySelector(`#maple${this.row}${this.col}`)
                ? this.TD
                : null;
        },
        changeValue(v) {
            this.value = v;
        },
        click() {
            this.$store.state.MapleStore.commit("click", {
                type: "input",
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
                [`input-row-${this.row}-col-${this.col}`]: this.$store.state.MapleStore.changeCellProperties.bind(
                    this
                )
            });
            this.$store.commit("setChangeTDbg", {
                [`row-${this.row}-col-${this.col}`]: this.changeTDbg
            });
            this.$store.commit("setChangeValue", {
                [`input-row-${this.row}-col-${this.col}`]: this.changeValue
            });
        }
        this.$store.dispatch("disComponentInit", {
            own: this
        });
    },
    watch: {
        value() {
            this.$store.dispatch("disKeepCellValueOK", {
                own: this
            });
        }
    }
};
</script>
