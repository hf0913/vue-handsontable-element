<template>
    <div
        v-if="isRenderer"
        class="maple-text w-100 h-100 d-flex justify-center align-center"
        :id="`maple${row}${col}`"
        @dblclick="click"
    >
        <el-input
            ref="textareaRef"
            :disabled="dbDisabled"
            class="flex-1 text-center w-100 bg-white"
            v-model="value"
            v-bind="props"
            @blur="dbDisabled = true"
            @focus="$event => input($event)"
            :style="{
                color:
                    props && props.disabled
                        ? $store.state.MapleStore.hotSettings.readOnlyColor
                        : ''
            }"
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
            cellProperties: null,
            isEditor: null,
            isRenderer: null,
            editorElement: null,
            isVisible: false,
            dbDisabled: true
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
            this.dbDisabled = !!(this.props && this.props.disabled);
            if (!this.dbDisabled) {
                setTimeout(() => this.$refs.textareaRef.focus(), 60);
            }
            this.$store.state.MapleStore.commit("click", {
                type: "text",
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
                [`text-row-${this.row}-col-${this.col}`]: this.$store.state.MapleStore.changeCellProperties.bind(
                    this
                )
            });
            this.$store.commit("setChangeValue", {
                [`text-row-${this.row}-col-${this.col}`]: this.changeValue
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

<style>
.maple-text input {
    border: none;
    border: 0;
    outline: 0;
    resize: none;
    height: 28px;
    line-height: 28px;
    background: none !important;
    background-color: none !important;
    color: #606266 !important;
    cursor: initial !important;
}
</style>
