<template>
    <div id="maple-table">
        <hot-table
            licenseKey="non-commercial-and-evaluation"
            ref="mapleTable"
            :style="customStyle"
        />
        <MapleDatePicker
            ref="datePickerRef"
            @change="v => (stopKeyEvent = v)"
        />
        <MapleCascader
            ref="cascaderRef"
            @getCascaderVals="getCascaderVals"
            @change="v => (stopKeyEvent = v)"
        />
        <MapleSelect
            ref="selectRef"
            @getSelectOpts="getSelectOpts"
            @change="v => (stopKeyEvent = v)"
        />
        <div class="empty" v-show="showEmpty" :style="{ width: emptyWidth }">
            暂无数据
        </div>
    </div>
</template>

<script>
import { HotTable } from '@handsontable/vue';
import _ from './utils';
import MapleCascader from './components/MapleCascader';
import MapleDatePicker from './components/MapleDatePicker';
import MapleSelect from './components/MapleSelect';
import {
    colHeaders,
    customColumns,
    getColumns,
    beforeChange,
    afterOnCellMouseDown,
    beforePaste
} from './utils/handsontable';
import sortData from './utils/sort';

export default {
    name: 'MapleHandsontable',
    props: {
        columns: {
            required: true,
            type: Array
        },
        data: {
            required: true,
            type: Array
        },
        options: {
            type: Object
        },
        selectBoxConfig: {
            type: Object,
            default: () => ({ key: 'checked', col: 0 })
        },
        widthAuto: {
            type: Boolean
        },
        customStyle: {
            type: Object
        },
        lazyLoadAbled: {
            type: Boolean,
            default: false
        },
        initSize: {
            type: Number,
            default: 20
        },
        pageSize: {
            type: Number,
            default: 128
        },
        diff: {
            type: Number,
            default: 5
        },
        singleSelectConfig: {
            type: Object,
            default: () => ({})
        },
        showLastTotalText: {
            type: Boolean
        },
        asyncLoadConfig: {
            type: Object
        },
        beforeReplaceSumData: {
            type: Object
        },
        rowHeight: {
            type: Number,
            default: 23
        }
    },
    data() {
        return {
            settings: {
                beforeSumData: null,
                data: [],
                columns: [],
                trimRows: true,
                filters: true,
                manualColumnResize: true,
                fillHandle: {
                    autoInsertRow: false,
                    direction: 'vertical'
                },
                dropdownMenu: null,
                manualRowResize: false,
                renderAllRows: false,
                maxRows: 12080,
                height: 1208,
                readOnlyCellClassName: 'maple-readOnly',
                openEmptyValid: true,
                hiddenColumns: true,
                viewportColumnRenderingOffset: 128,
                licenseKey: 'non-commercial-and-evaluation',
                language: 'zh-CN',
                className: 'htCenter htMiddle',
                bindRowsWithHeaders: true,
                rowHeaders: true,
                comments: true,
                manualRowResizeboolean: true,
                contextMenu: {
                    items: {
                        row_above: {},
                        row_below: {},
                        remove_row: {},
                        clear_column: {},
                        hidden_columns_hide: {
                            name: '隐藏列'
                        },
                        hidden_columns_show: {
                            name: '展示列'
                        },
                        undo: {},
                        redo: {},
                        cut: {},
                        copy: {}
                    }
                }
            },
            singleSelectIndex: -1208,
            core: {},
            checkAllabled: false,
            width: 0,
            height: 0,
            getDataDoubled: false,
            hasColumnSummary: this.showLastTotalText,
            showEmpty: false,
            keyOpts: {},
            selectVals: {},
            cascaderVals: {},
            myColumns: [],
            hiddenColumns: [],
            sort: {},
            sortabled: false,
            sortKey: {},
            stopKeyEvent: false,
            autoRowSizePlugin: null,
            lastPage: null,
            copyData: [],
            stopLazyAbled: true,
            emptyWidth: '100%',
            checkAllabledIndex: 0,
            filterFailData: [],
            currentCol: 0
        };
    },
    components: { HotTable, MapleCascader, MapleDatePicker, MapleSelect },
    mounted() {
        this.$emit('getCore', this.$refs.mapleTable.hotInstance);
        this.core = this.$refs.mapleTable.hotInstance;
        this.autoRowSizePlugin = this.core.getPlugin('autoRowSize');
        this.init();
    },
    activated() {
        this.fixView();
    },
    methods: {
        perfectFilters(conditions) {
            let { copyData, filterFailData } = this,
                d = [],
                cLen = copyData.length,
                fLen = filterFailData.length,
                sumData;
            this.conditions = conditions;
            if (fLen) {
                if (cLen > fLen) {
                    filterFailData.map((item, index) => {
                        let { mapleTotal, _maplePosition: p } = item,
                            fItem = filterFailData[index - 1] || {
                                _maplePosition: -1
                            },
                            _maplePosition =
                                p == null ? fItem._maplePosition + 1 : p;
                        if (fItem && _maplePosition < fItem._maplePosition) {
                            _maplePosition = fItem._maplePosition + 1;
                        }
                        item = Object.assign(item, { _maplePosition });
                        mapleTotal === '合计'
                            ? (sumData = item)
                            : copyData.splice(_maplePosition, 0, {
                                  ...item,
                                  _maplePosition
                              });
                    });
                    if (sumData) copyData.push(sumData);
                } else {
                    copyData.map((item, index) => {
                        let { mapleTotal, _maplePosition: p } = item,
                            cItem = copyData[index - 1] || {
                                _maplePosition: -1
                            },
                            _maplePosition =
                                p == null ? cItem._maplePosition + 1 : p;
                        if (cItem && _maplePosition < cItem._maplePosition) {
                            _maplePosition = cItem._maplePosition + 1;
                        }
                        item = Object.assign(item, { _maplePosition });
                        mapleTotal === '合计'
                            ? (sumData = item)
                            : filterFailData.splice(_maplePosition, 0, {
                                  ...item,
                                  _maplePosition
                              });
                    });
                    if (sumData) filterFailData.push(sumData);
                    this.copyData = copyData = filterFailData;
                }
            }
            this.filterFailData = [];
            d = this.filterData(copyData);
            this.$emit('update', d);
        },
        beforeFilter(conditions) {
            this.conditions = conditions;
            this.init(d => {
                const {
                        options: { columnSummary = [], lastTotalFields = [] },
                        filterData,
                        core,
                        getNowColumns,
                        settings,
                        hasColumnSummary
                    } = this,
                    data = filterData(d),
                    sumData = this.sumData,
                    h = settings.height,
                    height =
                        this.rowHeight * (data.length + 1) < h ? 'auto' : h,
                    t = columnSummary.length ? columnSummary : lastTotalFields;

                if (sumData && hasColumnSummary) {
                    const cols = getNowColumns();
                    this.$nextTick(() => {
                        let dataAtCells = [],
                            len = core.countRows() - 1;
                        if (data[len] && data[len].mapleTotal !== '合计')
                            this.replaceSumData = _.deepCopy(data[len]);
                        if (len === 0 || height === 'auto') len++;
                        data.splice(len, 1, sumData);
                        for (let j = 0; j < t.length; j++) {
                            const { key } = t[j],
                                keyIndex = cols.findIndex((item, index) => {
                                    const bl =
                                        item.key === key || item.data === key;
                                    if (!bl)
                                        dataAtCells.push([len, index, null]);
                                    return bl;
                                });
                            if (~keyIndex)
                                dataAtCells.push([len, keyIndex, sumData[key]]);
                        }
                        core.setDataAtCell(dataAtCells);
                    });
                }
                this.$nextTick(() => {
                    this.core.updateSettings({
                        height
                    });
                });
                return data;
            });
        },
        filterData(d) {
            const {
                    conditions = [],
                    getNowColumns,
                    options: { columnSummary },
                    beforeSumData
                } = this,
                cols = getNowColumns(),
                data = d.filter((item, index) => {
                    let passCount = 0,
                        bl = false,
                        byValabled;

                    item = Object.assign(item, {
                        _maplePosition: index,
                        _mapleIndex:
                            item._mapleIndex || `${index}-${Math.random()}`
                    });
                    if (!item) return false;
                    if (item.mapleTotal === '合计') {
                        if (index < d.length - 1) {
                            this.sumData = _.deepCopy(item);
                            item = Object.assign({}, beforeSumData);
                            d[index] = item;
                        } else return false;
                    }
                    conditions.map(({ column: i, conditions: factor }) => {
                        factor.map(({ name: type, args }) => {
                            const key = cols[i].key || cols[i].data;
                            let curr = item[key];
                            if (
                                this.sumData &&
                                curr &&
                                ~columnSummary.findIndex(
                                    item => item.key === key
                                ) &&
                                curr == this.sumData[key]
                            ) {
                                item = Object.assign({}, beforeSumData);
                                d[index] = item;
                            }
                            curr = item[key];
                            switch (type) {
                                case 'begins_with':
                                    if (
                                        typeof curr === 'string' &&
                                        curr.startsWith(args[0])
                                    )
                                        passCount++;
                                    break;
                                case 'between':
                                    if (
                                        curr - 0 >= args[0] &&
                                        curr - 0 <= args[1]
                                    )
                                        passCount++;
                                    break;
                                case 'contains':
                                    if (
                                        typeof curr === 'string' &&
                                        curr.includes(args[0])
                                    )
                                        passCount++;
                                    break;
                                case 'empty':
                                    if (curr == null || curr === '')
                                        passCount++;
                                    break;
                                case 'ends_with':
                                    if (
                                        typeof curr === 'string' &&
                                        curr.endsWith(args[0])
                                    )
                                        passCount++;
                                    break;
                                case 'eq':
                                    if (curr == args[0]) passCount++;
                                    break;
                                case 'gt':
                                    if (curr - 0 > args[0]) passCount++;
                                    break;
                                // Greater than or equal
                                case 'gte':
                                    if (curr - 0 >= args[0]) passCount++;
                                    break;
                                case 'lt':
                                    if (curr - 0 < args[0]) passCount++;
                                    break;
                                // Less than or equal
                                case 'lte':
                                    if (curr - 0 <= args[0]) passCount++;
                                    break;
                                case 'not_between':
                                    if (
                                        !(
                                            curr - 0 >= args[0] &&
                                            curr - 0 <= args[1]
                                        )
                                    )
                                        passCount++;
                                    break;
                                case 'not_contains':
                                    if (
                                        !(
                                            typeof curr === 'string' &&
                                            curr.includes(args[0])
                                        )
                                    )
                                        passCount++;
                                    break;
                                case 'not_empty':
                                    if (!(curr == null || curr === ''))
                                        passCount++;
                                    break;
                                // Not equal
                                case 'neq':
                                    if (curr != args[0]) passCount++;
                                    break;
                                case 'by_value':
                                    if (
                                        byValabled == null &&
                                        factor.length === 1
                                    )
                                        passCount++;
                                    byValabled = args[0].some(e =>
                                        curr == null
                                            ? e == curr || e === ''
                                            : curr == e
                                    );
                                    break;
                                case 'date_before':
                                    break;
                                case 'date_after':
                                    break;
                                case 'date_tomorrow':
                                    break;
                                case 'date_today':
                                    break;
                                case 'date_yesterday':
                                    break;
                            }
                        });
                    });
                    bl =
                        passCount === conditions.length &&
                        (byValabled || byValabled == null);
                    if (!bl) this.filterFailData.push(item);
                    return bl;
                });
            return data;
        },
        getCascaderVals(o) {
            this.$emit('getCascaderVals', o);
            this.cascaderVals = o.data;
        },
        getSelectOpts(o) {
            if (!o.noEmit) this.$emit('getSelectOpts', o);
            this.selectVals = o.selectVals;
            this.keyOpts = o.keyOpts;
        },
        cellDblClick(o) {
            const { event: mouseEvent } = o;
            const columns = getColumns.call(this, 'no');
            const $el = mouseEvent.target;
            const [[row, col]] = this.core.getSelected() || [[]];
            const { width, top, left, height } = $el.getBoundingClientRect();
            if (columns[col] == null)
                return this.$emit('cellDblClick', {
                    mouseEvent,
                    $el,
                    coord: {
                        row,
                        col
                    },
                    eventData: o
                });
            const { readOnly } = this.core.getCellMeta(row, col);
            let { subType } = columns[col];

            if (subType === 'address') subType = 'cascader';
            if (
                this.$refs[`${subType}Ref`] &&
                row >= 0 &&
                !readOnly &&
                !this.settings.readOnly &&
                ((this.hasColumnSummary && row !== this.core.countRows() - 1) ||
                    !this.hasColumnSummary)
            ) {
                const customCellDblClick = this.settings.customCellDblClick;
                if (customCellDblClick instanceof Function) {
                    if (
                        customCellDblClick({
                            row,
                            col,
                            $el,
                            core: this.core
                        })
                    ) {
                        return;
                    }
                }
                this.$refs[`${subType}Ref`].controlOpen({
                    col,
                    row,
                    width,
                    height,
                    top,
                    left,
                    open: true,
                    core: this.core,
                    columns,
                    orgColumns: this.columns
                });
            }
            this.$emit('cellDblClick', {
                mouseEvent,
                $el,
                coord: {
                    row,
                    col
                },
                eventData: o
            });
        },
        init(cb) {
            if (this.lazyLoadAbled) {
                this.lazyLoadDataLen = this.core.countRows();
                for (let [index, item] of this.data.entries()) {
                    item = item || {};
                    item = Object.assign(item, {
                        _mapleIndex:
                            item._mapleIndex || `${index}-${Math.random()}`
                    });
                }
            }
            let {
                    data,
                    lazyLoadAbled,
                    initSize,
                    lazyLoadDataLen,
                    asyncLoadConfig,
                    filterInit,
                    rowHeight
                } = this,
                hiddCols = [],
                startIndex = initSize,
                initData = data;
            this.copyData = data;
            if (this.options.cacheId && this.options.openCache) {
                hiddCols = JSON.parse(
                    localStorage.getItem(
                        `${this.options.cacheId}-hiddenColumns`
                    ) || '[]'
                );
            }
            if (!hiddCols.length) hiddCols = this.settings.hiddCols || [];
            this.hasColumnSummary =
                (this.options.columnSummary &&
                    this.options.columnSummary.length > 0) ||
                this.showLastTotalText;
            if (lazyLoadDataLen > initSize) {
                lazyLoadDataLen =
                    data.length - lazyLoadDataLen < 5
                        ? data.length
                        : lazyLoadDataLen;
                startIndex = filterInit ? initSize : lazyLoadDataLen;
            }
            if (filterInit) this.filterInit = false;
            this.options.minRows
                ? (this.showEmpty = false)
                : (this.showEmpty = !this.copyData.length);
            if (lazyLoadAbled && data.length > initSize && !asyncLoadConfig) {
                cb instanceof Function
                    ? (initData = cb(data).slice(0, startIndex))
                    : (initData = data.slice(0, startIndex));
            }
            this.settings = Object.assign(this.settings, this.options, {
                columns: customColumns.call(this),
                data: initData,
                colHeaders: colHeaders.bind(this),
                hiddenColumns: {
                    columns: hiddCols,
                    indicators: true
                },
                persistentState: false,
                manualColumnMove:
                    this.options.cacheId && this.options.openCache,
                afterOnCellMouseDown: afterOnCellMouseDown.bind(this),
                afterChange: this.afterChange,
                afterRemoveRow: this.afterRemoveRow,
                afterCreateRow: this.afterCreateRow,
                afterValidate: this.afterValidate,
                beforeChange: beforeChange.bind(this),
                afterScrollHorizontally: this.afterScrollHorizontally,
                afterScrollVertically: this.afterScrollVertically,
                afterHideColumns: this.afterHideColumns,
                afterUnhideColumns: this.afterUnhideColumns,
                afterColumnMove: this.afterColumnMove,
                afterOnCellCornerDblClick: this.afterOnCellCornerDblClick,
                beforePaste: beforePaste.bind(this),
                afterPasteCustom: v => {
                    const { afterPasteCustom } = this.options || {};
                    return (afterPasteCustom && afterPasteCustom(v)) || null;
                },
                beforeFilter: v => {
                    const {
                        perfectFilters,
                        initSize,
                        options: {
                            allowFilters,
                            beforeFilter: beforeFilterFn,
                            getNowColumns,
                            filterData
                        }
                    } = this;
                    this.filterInit = true;
                    this.lastPage = initSize;
                    this.stopLazyAbled = true;
                    if (allowFilters) {
                        perfectFilters(v);
                    } else if (beforeFilterFn) {
                        beforeFilterFn({
                            conditions: v,
                            columns: getNowColumns(),
                            filterData
                        });
                    }
                    return false;
                },
                beforeKeyDown: event => {
                    if (this.stopKeyEvent) {
                        event.stopImmediatePropagation();
                    }
                },
                depthFilterByValue: (d, m) => {
                    // 针对filter_by_value选项，深度过滤选项值最终显示结果
                    const lastRow = m.hot.countRows() - 1,
                        { hasColumnSummary } = this;

                    return ~d.indexOf(lastRow)
                        ? d
                        : d.concat(hasColumnSummary ? [lastRow] : []);
                },
                getColumnVisibleValuesDepth: (d, m) => {
                    // 针对filter_by_value选项，深度过滤选项列表
                    const lastRow = m.hot.countRows() - 1,
                        { hasColumnSummary } = this;

                    return ~d.indexOf(lastRow)
                        ? d
                        : d.slice(0, hasColumnSummary ? lastRow - 1 : lastRow);
                },
                beforeAdjustRowsAndCols: () => {
                    const { settings, conditions } = this;
                    if (settings.filters && conditions && conditions.length)
                        return false;
                },
                onCellDblClick: this.cellDblClick,
                customFilterByValueList: (items, o) => {
                    const {
                            lazyLoadAbled,
                            copyData,
                            currentCol,
                            getNowColumns,
                            filterFailData
                        } = this,
                        list = [];
                    let emptyData;

                    if (lazyLoadAbled) {
                        const colItem = getNowColumns()[currentCol],
                            key = colItem.key || colItem.data,
                            getList = d => {
                                d.map(ele => {
                                    const val =
                                        ele[key] === 0
                                            ? ele[key]
                                            : ele[key] || '';
                                    if (
                                        list.some(v => v.value == val) ||
                                        ele.mapleTotal === '合计'
                                    )
                                        return;
                                    if (!val) {
                                        emptyData = {
                                            checked: true,
                                            value: '',
                                            visualValue: '(空白单元格)'
                                        };
                                    } else {
                                        list.push({
                                            checked: true,
                                            value: val,
                                            visualValue: val
                                        });
                                    }
                                });
                            };
                        getList(copyData);
                        getList(filterFailData);
                        setTimeout(() =>
                            o.onSelectAllClick({ preventDefault: () => {} })
                        );
                        items = list.sort(
                            sortData('asc', {
                                sortEmptyCells: true,
                                key: 'visualValue'
                            })
                        );
                        if (emptyData) list.unshift(emptyData);
                    }
                    return items;
                }
            });
            this.core.updateSettings({
                ...this.settings,
                height:
                    rowHeight * (initData.length + 1) < this.settings.height
                        ? 'auto'
                        : this.settings.height
            });
        },
        hiddenPopup(type, e) {
            this.$refs.datePickerRef.controlOpen();
            this.$refs.cascaderRef.controlOpen();
            this.$refs.selectRef.controlOpen();
            if (type) this.$emit(type, e);
        },
        asyncLoad({ ajax, params }) {
            this.stopLazyAbled = false;
            ajax(params);
            this.asyncLoadConfig.cb = () => (this.stopLazyAbled = true);
        },
        lazyLoadData() {
            let {
                autoRowSizePlugin,
                lazyLoadAbled,
                core,
                stopLazyAbled,
                copyData,
                lastPage,
                pageSize,
                checkAllabled,
                selectBoxConfig,
                hasColumnSummary,
                diff,
                asyncLoadConfig,
                asyncLoad,
                beforeSumData
            } = this;
            if (lazyLoadAbled && stopLazyAbled) {
                const lastIndex = autoRowSizePlugin.getLastVisibleRow(),
                    sourceData = core.getSourceData(),
                    currentLen = sourceData.length;
                let copySoucreData = copyData,
                    copyDataLen = copySoucreData.length;

                if (
                    asyncLoadConfig &&
                    lastIndex >= currentLen - diff &&
                    currentLen < asyncLoadConfig.total
                )
                    return asyncLoad(asyncLoadConfig);

                if (
                    !asyncLoadConfig &&
                    lastIndex >= currentLen - diff &&
                    currentLen < copyDataLen
                ) {
                    this.stopLazyAbled = false;
                    copyDataLen = copySoucreData.length;
                    lastPage = currentLen + pageSize;
                    let data = copySoucreData.slice(0, lastPage);
                    if (hasColumnSummary) {
                        let sumIndex = lastPage - pageSize - 1,
                            sumData = _.deepCopy(sourceData[sumIndex]);
                        if (sumData) {
                            sumData.mapleTotal = '合计';
                            data.splice(sumIndex, 1, beforeSumData);
                            this.beforeSumData = _.deepCopy(
                                data[lastPage - 1] || data[data.length - 1]
                            );
                            data.length === copyDataLen
                                ? data.splice(copyDataLen - 1, 1, sumData)
                                : data.splice(lastPage - 1, 1, sumData);
                            copySoucreData[sumIndex] = beforeSumData;
                        }
                    }
                    if (checkAllabled) {
                        const { key = 'checked' } = selectBoxConfig || {};
                        data.forEach(item => {
                            item[key] = true;
                        });
                    }
                    core.updateSettings({
                        data
                    });
                    this.lastPage = lastPage;
                    if (data.length < copyDataLen) this.stopLazyAbled = true;
                }
            }
        },
        afterOnCellCornerDblClick(event) {
            this.hiddenPopup('afterOnCellCornerDblClick', event);
        },
        afterScrollVertically() {
            this.hiddenPopup('afterScrollVertically');
            this.lazyLoadData();
        },
        afterScrollHorizontally() {
            this.hiddenPopup('afterScrollHorizontally');
        },
        afterChange(changes, source) {
            if (!changes || (changes && !changes.length)) return;
            const {
                    hasColumnSummary,
                    selectBoxConfig,
                    getKeyChange,
                    core
                } = this,
                {
                    key = 'checked',
                    col = 0,
                    checkedTemplate = 'checkedTemplate'
                } = selectBoxConfig || {},
                checkBoxVal = getKeyChange(key, changes);
            let checked = [];

            if (checkBoxVal.length) {
                let { length: len } = core
                    .getDataAtCol(col)
                    .filter((bl, row) => {
                        if (bl || bl === checkedTemplate) {
                            checked.push({
                                row,
                                checked: bl
                            });
                        }
                        return bl;
                    });
                let countRows = core.countRows(),
                    bl = hasColumnSummary
                        ? len === countRows - 1
                        : len === countRows;
                if (bl !== this.checkAllabled) {
                    this.checkAllabled = bl;
                    core.render();
                }
            }

            this.$emit('change', {
                source,
                changes,
                core: this.core,
                type: 'change',
                getKeyChange: this.getKeyChange,
                filterKeysChanges: this.filterKeysChanges,
                checked,
                columns: this.myColumns
            });
        },
        afterRemoveRow(index, amount, physicalRows, source) {
            this.showEmpty = this.core.countRows() === 0;
            this.$emit('afterRemoveRow', {
                index,
                amount,
                physicalRows,
                source
            });
        },
        afterCreateRow(index, amount, source) {
            this.$emit('afterCreateRow', {
                index,
                amount,
                source
            });
        },
        getData(
            callback = () => {},
            { key: checkedKey, value: checkedVal } = {}
        ) {
            if (this.getDataDoubled) {
                return Promise.resolve({
                    value: [],
                    valid: false
                });
            }
            this.getDataDoubled = true;
            const timeOut = this.clearFilters() ? 2128 : 0;
            return new Promise(resolve => {
                setTimeout(() => {
                    const d = this.core.getData();
                    const data = [];
                    let addressOtps = [];
                    let keyVals = {};
                    let sumIndex;
                    const judgeVals = val => {
                        let bl = true;
                        if (
                            Object.prototype.toString.call(val) ===
                                '[object Array]' &&
                            !val.length
                        ) {
                            bl = false;
                        }
                        if (val == null || val === '') bl = false;
                        return bl;
                    };
                    d.map((ele, i) => {
                        let o = this.data[i] || {};
                        const dItem = d[i];
                        const keys = getColumns.call(this, 'no');
                        for (let [j, itemData] of keys.entries()) {
                            let v = dItem[j],
                                k = itemData.key || itemData.data;
                            let newItem = {};
                            if (newItem[k]) {
                                newItem = keyVals[k];
                            } else {
                                for (let [, w] of this.columns.entries()) {
                                    if (w.key === k || w.data === k) {
                                        newItem = w;
                                        keyVals[k] = w;
                                        break;
                                    }
                                }
                            }

                            let {
                                valueType,
                                labelName = 'label',
                                valueName = 'value',
                                extraField = '_extraField_',
                                subType,
                                type,
                                checkedTemplate,
                                uncheckedTemplate,
                                ajaxConfig
                            } = newItem;

                            let opts = newItem.options || newItem.source;
                            if (opts instanceof Function) {
                                opts = opts() || [];
                            }
                            if (type === 'checkbox') {
                                let checkboxVal = o[k];
                                if (
                                    checkedTemplate != null &&
                                    checkedTemplate != ''
                                ) {
                                    checkboxVal = checkboxVal
                                        ? checkedTemplate
                                        : uncheckedTemplate;
                                }
                                o = {
                                    ...o,
                                    [k]: checkboxVal
                                };
                            } else if (
                                (((type === 'dropdown' ||
                                    type === 'autocomplete') &&
                                    ((opts && opts.length) ||
                                        subType === 'ajax')) ||
                                    subType === 'select') &&
                                k
                            ) {
                                const { multiple } = newItem.props || {};
                                let currentValue,
                                    selectVals = this.selectVals[
                                        `key-${k}-value-${v}`
                                    ];
                                valueType = valueType || valueName;
                                if (multiple) v = (v || '').split(',');
                                if (selectVals) {
                                    currentValue = multiple
                                        ? selectVals.map(ele => ele[valueName])
                                        : selectVals[valueName];
                                } else {
                                    currentValue =
                                        _.exchange({
                                            data: opts,
                                            currentValue: v,
                                            currentKey: labelName
                                        })[valueName] || undefined;
                                }
                                if (valueType === valueName) {
                                    o = {
                                        ...o,
                                        [k]: judgeVals(v) ? currentValue : o[k],
                                        [extraField]: judgeVals(v)
                                            ? v
                                            : o[extraField]
                                    };
                                    if (
                                        extraField === '_extraField_' &&
                                        o[k] == null &&
                                        ajaxConfig &&
                                        ajaxConfig.url
                                    ) {
                                        o = {
                                            ...o,
                                            [k]: v,
                                            [extraField]: undefined
                                        };
                                    }
                                } else {
                                    o = {
                                        ...o,
                                        [k]: judgeVals(v) ? v : o[k],
                                        [extraField]: judgeVals(currentValue)
                                            ? currentValue
                                            : o[extraField]
                                    };
                                }
                            } else if (
                                subType === 'cascader' ||
                                subType === 'address'
                            ) {
                                const exchangeArrary = val => {
                                    return val instanceof Array
                                        ? val
                                        : (val || '').split('/');
                                };
                                if (
                                    addressOtps.length === 0 &&
                                    subType === 'address'
                                ) {
                                    addressOtps = _.collageAddress(_.address);
                                }
                                if (this.cascaderVals[`key-${k}-value-${v}`]) {
                                    const cascaderVals = this.cascaderVals[
                                        `key-${k}-value-${v}`
                                    ];
                                    if (valueType === 'label') {
                                        o = {
                                            ...o,
                                            [k]: judgeVals(
                                                exchangeArrary(
                                                    cascaderVals.label
                                                )
                                            )
                                                ? exchangeArrary(
                                                      cascaderVals.label
                                                  )
                                                : exchangeArrary(o[k]),
                                            [extraField]: judgeVals(
                                                exchangeArrary(
                                                    cascaderVals.value
                                                )
                                            )
                                                ? exchangeArrary(
                                                      cascaderVals.value
                                                  )
                                                : exchangeArrary(o[extraField])
                                        };
                                    } else {
                                        o = {
                                            ...o,
                                            [k]: judgeVals(
                                                exchangeArrary(
                                                    cascaderVals.value
                                                )
                                            )
                                                ? exchangeArrary(
                                                      cascaderVals.value
                                                  )
                                                : exchangeArrary(o[k]),
                                            [extraField]: judgeVals(
                                                exchangeArrary(
                                                    cascaderVals.label
                                                )
                                            )
                                                ? exchangeArrary(
                                                      cascaderVals.label
                                                  )
                                                : exchangeArrary(o[extraField])
                                        };
                                    }
                                } else {
                                    const res = _.getCascaderLabelValue({
                                        data:
                                            subType === 'address'
                                                ? addressOtps
                                                : opts,
                                        value: (v && v.split('/')) || [],
                                        matchFieldName: 'label'
                                    });
                                    if (valueType === 'label') {
                                        o = {
                                            ...o,
                                            [k]: judgeVals(
                                                res.map(({ label }) => label)
                                            )
                                                ? res.map(({ label }) => label)
                                                : exchangeArrary(o[k]),
                                            [extraField]: judgeVals(
                                                res.map(({ value }) => value)
                                            )
                                                ? res.map(({ value }) => value)
                                                : exchangeArrary(o[extraField])
                                        };
                                    } else {
                                        o = {
                                            ...o,
                                            [k]: judgeVals(
                                                res.map(({ value }) => value)
                                            )
                                                ? res.map(({ value }) => value)
                                                : exchangeArrary(o[k]),
                                            [extraField]: judgeVals(
                                                res.map(({ label }) => label)
                                            )
                                                ? res.map(({ label }) => label)
                                                : exchangeArrary(o[extraField])
                                        };
                                    }
                                }
                            } else if (subType !== 'handle' && k) {
                                o = {
                                    ...o,
                                    [k]: v
                                };
                            }
                        }
                        let extraItem = callback(o, i) || {};

                        o = {
                            ...o,
                            ...extraItem
                        };
                        if (
                            !checkedKey ||
                            (checkedKey &&
                                (o[checkedKey] === checkedVal ||
                                    o[checkedKey] === true))
                        ) {
                            // 根据callback返回的notAddabled字段，判断是否添加数据
                            if (!o.notAddabled && o.mapleTotal !== '合计') {
                                data.push({
                                    ...o,
                                    notAddabled: undefined,
                                    _extraField_: undefined,
                                    undefined
                                });
                                if (
                                    !this.asyncLoadConfig &&
                                    this.lazyLoadAbled &&
                                    this.hasColumnSummary &&
                                    i === d.length - 1
                                ) {
                                    sumIndex = i;
                                }
                            }
                        }
                    });
                    this.core.validateCells(valid => {
                        let popData = this.copyData.slice(d.length);
                        if (checkedKey) {
                            popData = popData.filter(
                                item =>
                                    item[checkedKey] === checkedVal ||
                                    item[checkedKey] === true
                            );
                        }
                        const value = data.concat(popData).filter(item => item); // 暂时只增加filter方法，后续需要优化，针对设置最少行数
                        if (
                            !this.asyncLoadConfig &&
                            this.lazyLoadAbled &&
                            this.hasColumnSummary &&
                            sumIndex
                        ) {
                            value[sumIndex] = this.beforeSumData;
                        }
                        resolve({
                            value:
                                value[value.length - 1] &&
                                value[value.length - 1].mapleTotal === '合计'
                                    ? value.slice(0, value.length - 1)
                                    : value,
                            valid: valid
                        });
                        this.getDataDoubled = false;
                    });
                }, timeOut);
            });
        },
        checkAllBox(event, coords, $el) {
            if (!coords) return;
            const { row, col } = coords,
                {
                    core,
                    getKeyChange,
                    filterKeysChanges,
                    myColumns,
                    selectBoxConfig
                } = this,
                { key = 'checked', col: checkedIndex } = selectBoxConfig || {};
            let type = 'checkbox',
                d = this.copyData;
            if (event.target.id === 'maple-all-checkbox') {
                this.checkAllabled = !this.checkAllabled;
                if (
                    this.checkAllabled &&
                    this.options.takeoverCheckAll &&
                    this.options.takeoverCheckAll({
                        event,
                        coords,
                        $el,
                        checked: this.checkAllabled
                    })
                )
                    return;
                for (let i = 0; i < d.length; i++) {
                    if (d[i].mapleTotal === '合计') continue;
                    d[i][key] = this.checkAllabled
                        ? myColumns[checkedIndex].checkedTemplate || true
                        : myColumns[checkedIndex].uncheckedTemplate || false;
                    if (this.checkAllabled) this.checkAllabledIndex++;
                }
                this.core.render();
                type = 'allCheckbox';
                this.$emit('change', {
                    type,
                    event,
                    core: core,
                    checkAllabled: this.checkAllabled,
                    getKeyChange: getKeyChange,
                    filterKeysChanges: filterKeysChanges,
                    columns: myColumns
                });
            }
            this.$emit('click', {
                col,
                row,
                $el,
                core: this.core,
                name: event.target.type,
                event,
                type,
                columns: this.myColumns
            });
        },
        clearFilters() {
            const { settings, conditions, columns, core } = this,
                bl = settings.filters && conditions && conditions.length;
            if (bl) {
                const filtersPlugin = core.getPlugin('filters');
                for (let i of columns.keys()) {
                    filtersPlugin.removeConditions(i);
                }
                filtersPlugin.filter();
                core.updateSettings({
                    hiddenRows: {
                        copyPasteEnabled: true,
                        indicators: true,
                        rows: []
                    }
                });
            }
            return bl;
        },
        getKeyChange(key, changes, filterSummaryRow = false, precise = true) {
            let o = [];

            for (let item of changes.values()) {
                if (
                    filterSummaryRow &&
                    this.hasColumnSummary &&
                    item[0] === this.core.countRows() - 1
                ) {
                    return o;
                }
                if (precise) {
                    if (item[1] === key && item[2] !== item[3]) {
                        o.push(item);
                    }
                } else if (item[1] === key) {
                    o.push(item);
                }
            }
            return o;
        },
        filterKeysChanges({
            keys,
            changes,
            callback,
            filterSummaryRow = false,
            precise = true // 精确过滤
        }) {
            for (let [index, item] of changes.entries()) {
                const [row, key, oldVal, newVal] = item;
                const i = keys.indexOf(key);

                if (
                    filterSummaryRow &&
                    this.hasColumnSummary &&
                    row === this.core.countRows() - 1
                ) {
                    return;
                }
                if (precise) {
                    if (keys[i] === key && oldVal !== newVal) {
                        callback({
                            row,
                            key,
                            oldVal,
                            newVal,
                            changeCurrentCell: item,
                            index
                        });
                    }
                } else if (keys[i] === key) {
                    callback({
                        row,
                        key,
                        oldVal,
                        newVal,
                        changeCurrentCell: item,
                        index
                    });
                }
            }
        },
        fixView() {
            const { core } = this;
            core && core.render();
        },
        afterValidate(isValid, value, row, prop) {
            const {
                selectBoxConfig,
                settings,
                getDataDoubled,
                hasColumnSummary,
                core,
                myColumns
            } = this;
            const customValidate = settings.customValidate;

            if (getDataDoubled && settings.openEmptyValid) {
                const hasDefaultValFileds = settings.hasDefaultValFileds || [];

                if (hasColumnSummary && row + 1 === core.countRows()) {
                    return true;
                }

                const isEmptyRow = core.isEmptyRow(row);

                if (isEmptyRow) {
                    isValid = true;
                } else {
                    const rowData = core.getDataAtRow(row);
                    let itemData = {};
                    let emptyCount = 0;

                    for (let [j, item] of myColumns.entries()) {
                        const k = item.data || item.key || 'maple-field';
                        const i = hasDefaultValFileds.indexOf(k);
                        const key = hasDefaultValFileds[i];
                        const v = rowData[j];
                        const emptyVal =
                            v === '' ||
                            v == null ||
                            v === false ||
                            v === item.uncheckedTemplate;

                        if (k === prop) itemData = item;
                        if (k === selectBoxConfig.key && emptyVal) {
                            return true;
                        }
                        if (k !== key && emptyVal) {
                            emptyCount++;
                        }
                    }
                    if (
                        emptyCount + hasDefaultValFileds.length ===
                            core.countCols() &&
                        itemData.allowEmpty === false
                    ) {
                        isValid = true;
                    }
                }
            }

            if (customValidate instanceof Function) {
                return customValidate({
                    isValid,
                    value,
                    row,
                    key: prop
                });
            }
            return isValid;
        },
        afterHideColumns(currentHideConfig, destinationHideConfig) {
            this.hiddenColumns = destinationHideConfig;
            this.getColumns();
        },
        afterUnhideColumns(currentHideConfig, destinationHideConfig) {
            this.hiddenColumns = destinationHideConfig;
            this.getColumns();
        },
        afterColumnMove() {
            this.getColumns();
        },
        getColumns() {
            if (this.settings.cacheId && this.settings.openCache) {
                const t = this.core.getColHeader();
                const cols = [];
                t.map(ele => {
                    const index = ele.slice(
                        ele.indexOf('index=') + 6,
                        ele.indexOf('CDC')
                    );
                    cols.push(this.myColumns[index]);
                });
                localStorage.setItem(
                    `${this.settings.cacheId}-hiddenColumns`,
                    JSON.stringify(this.hiddenColumns)
                );
                localStorage.setItem(
                    `${this.settings.cacheId}-columns`,
                    JSON.stringify(cols)
                );
            }
        },
        getNowColumns() {
            return getColumns.call(this, 'no');
        },
        changeSort(o) {
            if (this.sortabled) return;
            this.sortabled = true;
            const { col, direction } = o,
                key = this.myColumns[col].key || this.myColumns[col].data;
            let sortType = 0,
                v = this.sort[key] || {};
            if ((!v.type || v.type === -1) && direction === 'up') {
                sortType = 1;
            }
            if (v.type === 1 && direction === 'up') {
                sortType = 0;
            }
            if ((!v.type || v.type === 1) && direction === 'down') {
                sortType = -1;
            }
            if (v.type === -1 && direction === 'down') {
                sortType = 0;
            }
            this.$emit('changeSort', {
                data: {
                    ...o,
                    currentData: {
                        type: sortType,
                        t: new Date().valueOf(),
                        key,
                        sort: this.sort,
                        col
                    }
                },
                callback: (config = {}) => {
                    if (config.state) {
                        this.sort[key] = {
                            type: sortType,
                            t: new Date().valueOf(),
                            direction
                        };
                        if (config.clear) {
                            for (let [k] of Object.entries(this.sortKey)) {
                                if (key !== k) this.sort[k] = {};
                            }
                        }
                        this.sortKey[key] = key;
                    }
                    if (!sortType) {
                        this.sort[key] = {
                            type: sortType,
                            t: new Date().valueOf(),
                            direction
                        };
                    }
                    this.sortabled = false;
                    this.core.render();
                }
            });
        },
        clearSort() {
            this.sort = {};
            this.core.render();
        },
        sum(o) {
            if (this.settings.summaryColumn instanceof Array) {
                let sumKey = [];
                this.settings.summaryColumn.forEach(item => {
                    if (item.type === 'sum') {
                        sumKey.push(item.key);
                    }
                });
                o.filterKeysChanges({
                    filterSummaryRow: false, // 过滤监听合计一行的数据变化，默认是true，即过滤
                    changes: o.changes,
                    keys: sumKey,
                    callback: ({ key, oldVal, newVal }) => {
                        let diff = 0,
                            lastData = this.value[this.value.length - 1];

                        newVal = newVal - 0 || 0;
                        oldVal = oldVal - 0 || 0;
                        diff = newVal - oldVal;
                        lastData[key] = (lastData[key] - 0 || 0) + diff;
                    }
                });
            }
        },
        changeCheckAllabled(bl) {
            this.checkAllabled = bl;
        },
        getCheckedData({ key, value, clear, getItem = () => {} } = {}) {
            if (!key)
                throw `Please provide the field name of the selection box`;
            let d = [],
                { clearFilters, copyData } = this;
            for (const item of copyData.values()) {
                if (item[key] === value || item[key] === true) {
                    getItem(item);
                    d.push(item);
                }
            }
            if (clear) {
                let t = setTimeout(() => {
                    clearFilters();
                    clearTimeout(t);
                    t = null;
                });
            }
            return {
                checkedData: d,
                clearFilters
            };
        }
    },
    watch: {
        columns() {
            this.init();
        },
        data() {
            this.init();
        },
        options() {
            this.init();
        },
        beforeReplaceSumData(v) {
            this.beforeSumData = v;
        }
    },
    beforeDestroy() {
        Object.assign(this.$data, {});
    }
};
</script>

<style scoped>
@import url('./scoped.css');
</style>
