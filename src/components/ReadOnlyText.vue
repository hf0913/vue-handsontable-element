<template>
    <div
        v-if="isRenderer"
        class="maple-readonly-text w-100 h-100 d-flex justify-center align-center"
        v-text="value"
        @click="click"
        :style="{ color: $store.state.MapleStore.hotSettings.readOnlyColor }"
    ></div>
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
                readOnly: true
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
        click() {
            this.$store.state.MapleStore.commit("click", {
                type: "readOnlyText",
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
                [`readOnlyText-row-${this.row}-col-${this.col}`]: this.$store.state.MapleStore.changeCellProperties.bind(
                    this,
                    {
                        properties: {
                            editor: false,
                            readOnly: true
                        }
                    }
                )
            });
        }
    }
};
</script>

<style scoped>
.maple-readonly-text {
    font-size: 12px;
    cursor: not-allowed;
}
</style>
