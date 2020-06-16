import {
    address,
    debounce,
    exchange,
    checkType,
    changeCellProperties
} from "./utils";

export default {
    state: {
        changeCellProperties,
        debounce,
        hotSettings: {
            rowHeights: 28,
            data: [],
            colWidths: 128,
            readOnlyColor: "red"
        },
        tableData: [],
        tableColumn: [],
        commit: () => {},
        $input: Element,
        hotInstance: Object,
        keepCellAttribute: {},
        changeValues: {},
        changeTDbg: {},
        validate: debounce(async (callback = () => {}, vm) => {
            await vm.$store.dispatch("disValidate", (checkState, v) => {
                callback(checkState, v);
            });
        }),
        checkAllabled: false,
        initCellsAttribute: Function,
        loading: false
    },
    mutations: {
        setHotSettings(state, payload = {}) {
            state.hotSettings = Object.assign(state.hotSettings, payload);
        },
        setTableData(state, payload) {
            state.tableData = payload;
        },
        setTableColumn(state, payload = []) {
            state.tableColumn = payload;
        },
        setCommit(state, payload = () => {}) {
            state.commit = payload;
        },
        setInputTarget(state, payload = Element) {
            state.$input = payload;
        },
        setHotInstance(state, payload = Object) {
            state.hotInstance = payload;
        },
        setKeepCellAttribute(state, payload = {}) {
            state.keepCellAttribute = Object.assign(
                state.keepCellAttribute,
                payload
            );
        },
        setChangeValue(state, payload = {}) {
            state.changeValues = Object.assign(state.changeValues, payload);
        },
        setChangeTDbg(state, payload = {}) {
            state.changeTDbg = Object.assign(state.changeTDbg, payload);
        },
        setCheckAllabled(state, payload = false) {
            state.checkAllabled = payload;
        },
        setInitCellsAttribute(state, payload = Function) {
            state.initCellsAttribute = payload;
        },
        setLoading(state, payload = false) {
            state.loading = payload;
        }
    },
    actions: {
        disUpdateData(
            { state, commit, dispatch },
            { row, col, value, type = "splice", own, extraItem = {} }
        ) {
            const { key } = state.tableColumn[col];

            if (type === "splice") {
                state.hotSettings.data[row][col] = value;
                state.tableData[row][key] = value;

                commit("setTableData", state.tableData);
            }
            if (type === "copyAdd") {
                if (state.loading) return;
                dispatch("disLoading");

                let item = JSON.parse(
                    JSON.stringify(state.hotSettings.data[row])
                );
                const newItem = JSON.parse(
                    JSON.stringify({ ...state.tableData[row], ...extraItem })
                );

                if (state.tableColumn[1].type === "index") {
                    item[1] = state.hotSettings.data.length + 1;
                }
                if (state.tableColumn[0].type === "index") {
                    item[0] = state.hotSettings.data.length + 1;
                }

                commit("setTableData", state.tableData.concat([newItem]));
            }
            if (type === "addNew") {
                if (state.loading) return;
                dispatch("disLoading");
                let item = [];
                let newItem = {};

                for (let [key, value] of Object.entries(state.tableData[row])) {
                    let val;
                    switch (true) {
                        case typeof value === "number":
                            val = 0;
                            break;
                        case typeof value === "string":
                            val = "";
                            break;
                        case typeof value === "boolean":
                            val = false;
                            break;
                        case value instanceof Array:
                            val = [];
                            break;
                        case value instanceof Object:
                            val = {};
                            break;
                    }

                    newItem = { ...newItem, [key]: val, ...extraItem };
                }

                if (state.tableColumn[1].type === "index") {
                    item[1] = state.hotSettings.data.length + 1;
                }
                if (state.tableColumn[0].type === "index") {
                    item[0] = state.hotSettings.data.length + 1;
                }

                commit("setTableData", state.tableData.concat([newItem]));
            }
            if (type === "delete") {
                if (state.loading) return;
                dispatch("disLoading");
                state.hotSettings.data.splice(row, 1);
                state.tableData.splice(row, 1);

                if (state.hotSettings.data.length) {
                    for (let i = row; i < state.hotSettings.data.length; i++) {
                        if (state.tableColumn[1].type === "index") {
                            state.hotSettings.data[i][1]--;
                        }
                        if (state.tableColumn[0].type === "index") {
                            state.hotSettings.data[i][0]--;
                        }
                    }
                }

                commit("setTableData", state.tableData);
            }

            state.initCellsAttribute();
            own.$nextTick(() => {
                state.commit("input", state.tableData);
                state.validate(undefined, own);
            });
        },
        disComponentInit({ state, commit }, { own }) {
            commit("setHotInstance", own.hotInstance);
            const o = state.tableColumn[own.col];

            if (o) {
                if (o.subType === "address") {
                    let options = [];
                    for (let [k1, v1] of Object.entries(address["100000"])) {
                        let children1 = [];

                        for (let [k2, v2] of Object.entries(
                            address[k1] || []
                        )) {
                            let children2 = [];

                            for (let [k3, v3] of Object.entries(
                                address[k2] || []
                            )) {
                                children2.push({
                                    value: k3,
                                    label: v3
                                });
                            }

                            children1.push({
                                value: k2,
                                label: v2,
                                children: children2
                            });
                        }

                        options.push({
                            value: k1,
                            label: v1,
                            children: children1
                        });
                    }
                    own.options = options;
                } else own.options = o.options;
            }
        },
        disKeepCellValueOK({ state, dispatch }, { own }) {
            const o = state.tableColumn[own.col];
            const { type = "text" } = o || {};
            const options = o.options || [];
            const labels = options.map(({ label }) => label + "");
            const values = options.map(({ value }) => value + "");
            let value = own.value;

            if (type === "select" || type === "radio") {
                if (labels.includes(value + "")) {
                    value = exchange({
                        data: options,
                        currentValue: value + ""
                    });
                } else if (!values.includes(value + "")) {
                    value = "";
                }
            } else if (type === "switch" || type === "selection") {
                const open = [
                    "1",
                    1,
                    "是",
                    "开",
                    "打开",
                    "启用",
                    "true",
                    "open",
                    true
                ];
                value = open.includes(own.value);
            } else if (type === "inputNumber") {
                value = own.value - 0 || 0;
            }

            if (state.changeValues[`${type}-row-${own.row}-col-${own.col}`]) {
                state.changeValues[`${type}-row-${own.row}-col-${own.col}`](
                    value
                );
            }
            if (type === "cascader" || type === "date") {
                if (value && value.includes(`{"${type}":`)) {
                    let o = JSON.parse(value);
                    value = o[type];
                } else value = null;
            }
            dispatch("disUpdateData", {
                row: own.row,
                col: own.col,
                value,
                own
            });
            own.$nextTick(() => {
                setTimeout(() => {
                    state.commit("change", {
                        type,
                        value,
                        row: own.row,
                        col: own.col,
                        core: state.hotInstance,
                        td: own.TD
                    });
                });
            });
        },
        disSelectionChange(
            { state },
            { type = "selection", currentRow = -1208, subType }
        ) {
            let selection = [];
            state.hotSettings.data.map(([bl], row) => {
                if (bl) selection.push(row);
            });
            state.commit("change", {
                type,
                value: selection,
                row: currentRow,
                subType
            });
        },
        disExchangeData({ state }, { key, own, col }) {
            let v = own.value || "";
            if (v.includes(`{"${key}":`)) {
                let o = JSON.parse(own.value);
                own[key] = o[key];
            } else {
                let restVal = undefined;
                switch (true) {
                    case state.tableColumn[col].type === "date" &&
                        state.tableColumn[col].props &&
                        state.tableColumn[col].props.type === "datetimerange":
                        restVal = [];
                        break;
                    case state.tableColumn[col].type === "cascader":
                        restVal = [];
                        break;
                }
                own[key] = restVal;
                own.value = restVal;
                own.change(restVal);
            }
        },
        disValidate({ state }, callback = () => {}) {
            let validate = true;

            for (let [j, v] of state.hotSettings.data.entries()) {
                for (let [i, item] of state.tableColumn.entries()) {
                    const { dataType, customValidate } = state.tableColumn[i];
                    let value = v[i];

                    if (dataType) {
                        if (item.type === "date" || item.type === "cascader") {
                            if (value && value.includes(`{"${item.type}":`)) {
                                value = JSON.parse(value);
                                value = value[item.type];
                            } else value = null;
                        }
                        const { state: status } = checkType({
                            type: dataType,
                            value,
                            row: j,
                            col: i,
                            customValidate,
                            changeTDbg: state.changeTDbg
                        });

                        if (
                            Reflect.has(state.changeTDbg, `row-${j}-col-${i}`)
                        ) {
                            const $td = state.changeTDbg[`row-${j}-col-${i}`]();
                            if ($td) {
                                $td.style.background = status ? "" : "red";
                                if (!status) validate = false;
                            }
                        }
                    }
                }
            }

            callback(validate, state.tableData);
        },
        disLoading({ commit }, payload = 1208) {
            commit("setLoading", true);
            setTimeout(() => {
                document.querySelector(".el-loading-mask").style.width = `${
                    document.querySelector(".wtHider").clientWidth
                }px`;
            }, 60);
            setTimeout(() => commit("setLoading"), payload);
        }
    }
};
