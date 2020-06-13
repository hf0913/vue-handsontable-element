<template>
    <div
        v-if="isRenderer"
        class="maple-checkbox w-100 h-100 d-flex justify-center align-center"
        :id="`maple${row}${col}`"
    >
        <el-checkbox-group
            size="mini"
            v-model="value"
            v-bind="props"
            v-if="options"
            @click.native="click"
        >
            <el-checkbox
                size="mini"
                v-bind="item.props"
                v-for="(item, index) in options"
                :key="index"
                :label="item.label"
            ></el-checkbox>
        </el-checkbox-group>
        <el-checkbox
            size="mini"
            v-else
            v-model="value"
            v-bind="props"
        ></el-checkbox>
    </div>
</template>
<script>
import { BaseEditorComponent } from "@handsontable/vue";

export default {
    extends: BaseEditorComponent,
    data() {
        return {
            props: null,
            options: null,
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
                type: "selection",
                col: this.col,
                row: this.row,
                core: this.hotInstance
            });
        }
    },
    created() {
        if (this.col != null) {
            this.$store.commit("setKeepCellAttribute", {
                [`selection-row-${this.row}-col-${this.col}`]: this.$store.state.MapleStore.changeCellProperties.bind(
                    this
                )
            });
            this.$store.commit("setChangeValue", {
                [`selection-row-${this.row}-col-${this.col}`]: this.changeValue
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
            this.$nextTick(() => {
                const checked = this.$store.state.MapleStore.hotSettings.data.filter(
                    ([c]) => c
                );
                if (checked.length === this.hotInstance.countRows()) {
                    this.$store.state.MapleStore.checkAllabled = true;
                    this.$store.commit("setCheckAllabled", true);
                    this.hotInstance.render();
                }
                if (
                    checked.length !== this.hotInstance.countRows() &&
                    this.$store.state.MapleStore.checkAllabled
                ) {
                    this.$store.state.MapleStore.checkAllabled = false;
                    this.$store.commit("setCheckAllabled", false);
                    this.hotInstance.render();
                }
            });
        }
    }
};
</script>
