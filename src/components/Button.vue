<template>
    <div
        v-if="isRenderer"
        class="maple-button w-100 h-100 d-flex justify-center align-center"
        :id="`maple${row}${col}`"
    >
        <el-button
            v-for="(item, index) in options"
            :key="index"
            size="mini"
            v-bind="item.props"
            @click.native="click(index, item)"
        >
            <i v-if="item.name">{{ item.name }}</i>
        </el-button>
    </div>
</template>
<script>
import { BaseEditorComponent } from "@handsontable/vue";

export default {
    extends: BaseEditorComponent,
    data() {
        return {
            value: null,
            options: [],
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
        click(index, item) {
            this.$store.state.MapleStore.commit("click", {
                type: "button",
                index,
                item,
                col: this.col,
                row: this.row,
                core: this.hotInstance,
                td: this.TD,
                copyAddRow: extraItem => {
                    this.$store.dispatch("disUpdateData", {
                        type: "copyAdd",
                        td: this.TD,
                        col: this.col,
                        row: this.row,
                        own: this,
                        extraItem
                    });
                },
                addNewRow: extraItem => {
                    this.$store.dispatch("disUpdateData", {
                        type: "addNew",
                        td: this.TD,
                        col: this.col,
                        row: this.row,
                        own: this,
                        extraItem
                    });
                },
                deleteRow: () => {
                    this.$store.dispatch("disUpdateData", {
                        type: "delete",
                        td: this.TD,
                        col: this.col,
                        row: this.row,
                        own: this
                    });
                }
            });
        },
        changeTDbg() {
            return this.TD.querySelector(`#maple${this.row}${this.col}`)
                ? this.TD
                : null;
        }
    },
    created() {
        if (this.col != null) {
            this.$store.commit("setKeepCellAttribute", {
                [`handle-row-${this.row}-col-${this.col}`]: this.$store.state.MapleStore.changeCellProperties.bind(
                    this
                )
            });
            this.$store.commit("setChangeTDbg", {
                [`row-${this.row}-col-${this.col}`]: this.changeTDbg
            });
        }
        this.$store.dispatch("disComponentInit", {
            own: this
        });
    }
};
</script>
