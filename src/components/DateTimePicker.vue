<template>
    <div
        v-if="isRenderer"
        class="maple-date-time-picker w-100 h-100 d-flex justify-center align-center"
        :id="`maple${row}${col}`"
    >
        <el-date-picker
            clearable
            size="mini"
            v-bind="props"
            v-model="date"
            @change="change"
            @click.native="click"
            style="width: 80%"
        />
    </div>
</template>

<script>
import { BaseEditorComponent } from "@handsontable/vue";

export default {
    extends: BaseEditorComponent,
    data() {
        return {
            props: {},
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
            isVisible: false,
            value: null,
            date: []
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
            const date = JSON.stringify({
                date: v
            });
            this.setValue(date);
            this.value = date;
        },
        changeValue(v) {
            if (v && v.includes(`{"date":`)) {
                const { date } = JSON.parse(v);
                v = date;
            } else v = null;
            this.date = v;
        },
        changeTDbg() {
            return this.TD.querySelector(`#maple${this.row}${this.col}`)
                ? this.TD
                : null;
        },
        click() {
            this.$store.state.MapleStore.commit("click", {
                type: "date",
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
                [`date-row-${this.row}-col-${this.col}`]: this.$store.state.MapleStore.changeCellProperties.bind(
                    this
                )
            });
            this.$store.commit("setChangeValue", {
                [`date-row-${this.row}-col-${this.col}`]: this.changeValue
            });
            this.$store.commit("setChangeTDbg", {
                [`row-${this.row}-col-${this.col}`]: this.changeTDbg
            });
        }
        this.$store.dispatch("disComponentInit", {
            own: this
        });
        this.$store.dispatch("disExchangeData", {
            key: "date",
            own: this,
            col: this.col
        });
    },
    mounted() {
        if (this.col != null) {
            this.changeValue(this.value);
        }
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
