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
        tableData: null,
        tableColumn: null,
        commit: () => {},
        addressOpts: [],
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
        checkAllabled: false
    },
    mutations: {
        setHotSettings(state, payload = {}) {
            state.hotSettings = Object.assign(state.hotSettings, payload);
        },
        setTableData(state, payload = []) {
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
        setCheckAllabled(state, payload) {
            state.checkAllabled = payload;
        }
    },
    actions: {
        disUpdateData(
            { state, commit },
            { row, col, value, type = "splice", own }
        ) {
            if (type === "splice") {
                state.hotSettings.data[row][col] = value;
            }
            if (type === "copyAdd") {
                let item = JSON.parse(
                    JSON.stringify(state.hotSettings.data[row])
                );
                if (state.tableColumn[1].type === "index") {
                    item[1] = state.hotSettings.data.length + 1;
                }
                if (state.tableColumn[0].type === "index") {
                    item[0] = state.hotSettings.data.length + 1;
                }
                state.hotSettings.data.push(item);
                commit("setHotSettings", {
                    data: state.hotSettings.data
                });
            }
            if (type === "addNew") {
                let item = [];
                if (state.tableColumn[1].type === "index") {
                    item[1] = state.hotSettings.data.length + 1;
                }
                if (state.tableColumn[0].type === "index") {
                    item[0] = state.hotSettings.data.length + 1;
                }
                state.hotSettings.data.push(item);
                state.tableData.push(item);
                state.commit("input", state.tableData);
            }
            if (type === "delete") {
                state.hotSettings.data.splice(row, 1);
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
            }
            own.$nextTick(() => {
                own.$store.state.MapleStore.validate(undefined, own);
            });
        },
        disComponentInit({ state, commit }, { own }) {
            commit("setHotInstance", own.hotInstance);
            const o = state.tableColumn[own.col];

            if (o) {
                if (o._type === "address") {
                    if (state.addressOpts.length) {
                        own.options = state.addressOpts;
                    } else {
                        for (let [k1, v1] of Object.entries(
                            address["100000"]
                        )) {
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

                            own.options.push({
                                value: k1,
                                label: v1,
                                children: children1
                            });
                        }
                        state.addressOpts = own.options;
                    }
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
                    dispatch("disUpdateData", {
                        row: own.row,
                        col: own.col,
                        value,
                        own
                    });
                } else if (values.includes(value + "")) {
                    dispatch("disUpdateData", {
                        row: own.row,
                        col: own.col,
                        value,
                        own
                    });
                } else {
                    value = "";
                    dispatch("disUpdateData", {
                        row: own.row,
                        col: own.col,
                        value,
                        own
                    });
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
                dispatch("disUpdateData", {
                    row: own.row,
                    col: own.col,
                    value,
                    own
                });
            } else if (type === "inputNumber") {
                value = own.value - 0 || 0;
                dispatch("disUpdateData", {
                    row: own.row,
                    col: own.col,
                    value,
                    own
                });
            } else {
                dispatch("disUpdateData", {
                    row: own.row,
                    col: own.col,
                    value,
                    own
                });
            }

            if (state.changeValues[`${type}-row-${own.row}-col-${own.col}`])
                state.changeValues[`${type}-row-${own.row}-col-${own.col}`](
                    value
                );
            if (type === "cascader" || type === "date") {
                if (value && value.includes(`{"${type}":`)) {
                    let o = JSON.parse(value);
                    value = o[type];
                } else value = null;
            }
            state.commit("change", {
                type,
                value,
                row: own.row,
                col: own.col,
                core: state.hotInstance
            });
        },
        disSelectionChange({ state }, { type, currentRow = -1208 }) {
            let selection = [];
            state.hotSettings.data.map(([bl], row) => {
                if (bl) selection.push(row);
            });
            state.commit("change", {
                type,
                value: selection,
                currentRow
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
            let value;
            let validate = true;
            const d = [];

            for (let fn of Object.values(state.changeTDbg)) {
                let $td = fn();
                if ($td) $td.style.padding = 0;
            }

            for (let [j, v] of state.hotSettings.data.entries()) {
                let o = {};
                for (let [i, item] of state.tableColumn.entries()) {
                    const { dataType } = state.tableColumn[i];
                    value = v[i];

                    switch (true) {
                        case item.type === "date" || item.type === "cascader":
                            if (value && value.includes(`{"${item.type}":`)) {
                                value = JSON.parse(value);
                                value = value[item.type];
                            } else value = null;
                            o = {
                                ...o,
                                [item.key]: value
                            };
                            break;
                        case item.type === "selection":
                            o = {
                                ...o,
                                mapleChecked: value
                            };
                            break;
                        case item.type === "index":
                            o = {
                                ...o,
                                mapleIndex: value
                            };
                            break;
                        case item.type !== "handle":
                            o = { ...o, [item.key]: value };
                            break;
                    }

                    if (dataType) {
                        const { state: status, value: val } = checkType(
                            dataType,
                            value
                        );
                        if (
                            Reflect.has(state.changeTDbg, `row-${j}-col-${i}`)
                        ) {
                            const $td = state.changeTDbg[`row-${j}-col-${i}`]();
                            if ($td) {
                                $td.style.background = status ? "" : "red";
                                if (!status) validate = false;
                            }
                        }
                        value = val;
                    }
                }
                const obj = state.tableData[j] || {};
                d.push({
                    ...obj,
                    ...o
                });
            }
            console.log(d, 8888);
            state.commit("input", d);
            callback(validate, d);
        }
    }
};
