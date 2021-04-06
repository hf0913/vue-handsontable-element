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
        },
        menuFillName: {
            type: String,
            default: '向下填充'
        },
        handleFilterHtmlShow: {
            type: Boolean
        }
    },
    data() {
        return {
            beforeSumData: {},
            settings: {
                selectionMode: 'range',
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
        contextMenu() {
            const vm = this,
                contextMenu = vm.options.contextMenu || vm.settings.contextMenu,
                fill_cells_data = {
                    name: this.menuFillName,
                    disabled: function () {
                        return vm.options.controlFillDisabled instanceof
                            Function
                            ? vm.options.controlFillDisabled()
                            : false;
                    },
                    callback: function (
                        key,
                        [
                            {
                                start: { col: startCol, row: startRow },
                                end: { col: endCol, row: endRow }
                            }
                        ]
                    ) {
                        let {
                                copyData,
                                getNowColumns,
                                core,
                                beforeSumData,
                                afterChange
                            } = vm,
                            keys = getNowColumns(),
                            fillData = [],
                            changes = [],
                            k,
                            changeKeys = [],
                            ij = 0,
                            collcet = (row, oldVals, newVals) => {
                                changeKeys.map(v => {
                                    changes.push([
                                        row,
                                        v,
                                        oldVals[v],
                                        newVals[v]
                                    ]);
                                });
                            };
                        for (let i = startRow; i <= endRow; i++) {
                            fillData.push({});
                            for (let j = startCol; j <= endCol; j++) {
                                k = keys[j].key || keys[j].data;
                                fillData[i - startRow][k] = copyData[i][k];
                            }
                        }
                        if (!fillData.length) return;
                        for (let r = endRow + 1; r < copyData.length - 1; r++) {
                            if (
                                r === copyData.length - 1 &&
                                copyData[r].mapleTotal === '合计'
                            )
                                break;
                            changeKeys = Object.keys(fillData[ij]);
                            if (
                                copyData[r].mapleTotal === '合计' &&
                                beforeSumData
                            ) {
                                collcet(r, beforeSumData, fillData[ij]);
                                Object.assign(beforeSumData, fillData[ij]);
                                vm.$emit(
                                    'updata-replace-sum-data',
                                    beforeSumData
                                );
                                continue;
                            }
                            collcet(r, copyData[r], fillData[ij]);
                            copyData[r] = Object.assign(
                                copyData[r],
                                fillData[ij]
                            );
                            ij >= fillData.length - 1 ? (ij = 0) : ij++;
                        }
                        vm.$emit('update', copyData);
                        afterChange(changes, 'customFill.fill');
                        core.render();
                    }
                };
            if (contextMenu) {
                contextMenu.items.fill_cells_data = fill_cells_data;
            }
            return contextMenu;
        },
        perfectFilters(conditions) {
            let { copyData, filterFailData } = this,
                d = [],
                cLen = copyData.length,
                fLen = filterFailData.length,
                sumData;
            this.conditions = conditions;

            if (fLen) {
                let currP, _currP, hasPItem;
                if (cLen > fLen) {
                    filterFailData.map((item, index) => {
                        currP = _currP = null;
                        let { mapleTotal, _maplePosition: p } = item,
                            fItem = filterFailData[index - 1] || {
                                _maplePosition: -1
                            },
                            _maplePosition =
                                p == null ? fItem._maplePosition + 1 : p;
                        if (
                            _maplePosition &&
                            _maplePosition <= fItem._maplePosition
                        ) {
                            _maplePosition = fItem._maplePosition + 1;
                        }
                        currP = _maplePosition;
                        _currP = (copyData[currP] || {})._maplePosition;
                        if (_currP != null) _currP = currP;
                        while (
                            currP < copyData.length &&
                            ((_currP && _currP < _maplePosition) ||
                                _currP == null)
                        ) {
                            currP++;
                            _currP = (copyData[currP] || {})._maplePosition;
                        }
                        _maplePosition = currP;
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
                        if (item._maplePosition != null && hasPItem == null)
                            hasPItem = JSON.parse(JSON.stringify(item));
                        if (item._maplePosition == null)
                            _currP == null ? (_currP = 1) : _currP++;
                        else if (
                            _currP > 1 &&
                            item._maplePosition - hasPItem._maplePosition !== 1
                        ) {
                            _maplePosition += _currP;
                            _currP = null;
                            hasPItem = null;
                        }
                        if (
                            hasPItem &&
                            item._maplePosition != null &&
                            item._maplePosition - hasPItem._maplePosition === 1
                        ) {
                            hasPItem = JSON.parse(JSON.stringify(item));
                        }
                        if (
                            _maplePosition &&
                            _maplePosition <= cItem._maplePosition
                        ) {
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
                    _currP = null;
                    hasPItem = null;
                    if (sumData) filterFailData.push(sumData);
                    this.copyData = copyData = filterFailData;
                }
            }
            this.filterFailData = [];
            d = this.filterData(copyData);
            this.$emit('update', d);
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
                            item = Object.assign({}, beforeSumData, {
                                _maplePosition:
                                    beforeSumData._maplePosition == null
                                        ? item._maplePosition
                                        : beforeSumData._maplePosition
                            });
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
                            if (
                                typeof curr === 'string' &&
                                curr.includes('javascript')
                            ) {
                                curr = curr.slice(30).replace(/<\/a>/g, '');
                            }
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
            }
            let {
                    data,
                    lazyLoadAbled,
                    initSize,
                    lazyLoadDataLen,
                    asyncLoadConfig,
                    initSizeAbled,
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
                startIndex = initSizeAbled ? initSize : lazyLoadDataLen;
            }
            if (initSizeAbled) this.initSizeAbled = false;
            this.options.minRows
                ? (this.showEmpty = false)
                : (this.showEmpty = !this.copyData.length);

            if (
                lazyLoadAbled &&
                data.length > initSize &&
                (!asyncLoadConfig || asyncLoadConfig.allabled)
            ) {
                cb instanceof Function
                    ? (initData = cb(data).slice(0, startIndex))
                    : (initData = data.slice(0, startIndex));
            }
            for (let [index, item] of initData.entries()) {
                item = item || {};
                item = Object.assign(item, {
                    _mapleIndex: item._mapleIndex || `${index}-${Math.random()}`
                });
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
                contextMenu: this.contextMenu(),
                afterPasteCustom: v => {
                    const { afterPasteCustom } = this.options || {};
                    return (afterPasteCustom && afterPasteCustom(v)) || null;
                },
                beforeFilter: v => {
                    const {
                        perfectFilters,
                        initSize,
                        getNowColumns,
                        options: {
                            allowFilters,
                            beforeFilter: beforeFilterFn,
                            filterData
                        }
                    } = this;
                    this.initSizeAbled = true;
                    this.lastPage = initSize;
                    this.stopLazyAbled = true;
                    this.clearSort(false);
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
                            filterFailData,
                            beforeSumData,
                            handleFilterHtmlShow
                        } = this,
                        list = [];
                    let emptyData;

                    if (lazyLoadAbled || handleFilterHtmlShow) {
                        const colItem = getNowColumns()[currentCol],
                            key = colItem.key || colItem.data,
                            getList = d => {
                                d.map(ele => {
                                    let val =
                                        ele[key] === 0
                                            ? ele[key]
                                            : ele[key] || '';
                                    if (ele.mapleTotal === '合计')
                                        val = beforeSumData[key];
                                    if (ele._mapleTotal === '合计') return;
                                    if (
                                        typeof val === 'string' &&
                                        val.includes('javascript')
                                    ) {
                                        val = val
                                            .slice(30)
                                            .replace(/<\/a>/g, '');
                                    }
                                    if (list.some(v => v.value == val)) return;
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
                        items = list.sort(sortData('asc', 'visualValue'));
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
                    currentLen = core.countRows();
                let copySoucreData = copyData,
                    copyDataLen = copySoucreData.length;
                if (
                    asyncLoadConfig &&
                    lastIndex >= currentLen - diff &&
                    currentLen < asyncLoadConfig.total &&
                    !asyncLoadConfig.allabled
                )
                    return asyncLoad(asyncLoadConfig);
                if (
                    lastIndex >= currentLen - diff &&
                    currentLen < copyDataLen
                ) {
                    this.stopLazyAbled = false;
                    copyDataLen = copySoucreData.length;
                    lastPage =
                        currentLen + pageSize > copyDataLen
                            ? copyDataLen
                            : currentLen + pageSize;
                    let data = copySoucreData.slice(0, lastPage),
                        startI = core.countRows() - 1;
                    for (let index = startI; index < lastPage - 1; index++) {
                        data[index] = Object.assign(data[index], {
                            _mapleIndex:
                                data[index]._mapleIndex ||
                                `${index}-${Math.random()}`
                        });
                    }
                    if (hasColumnSummary) {
                        let sumIndex =
                            lastPage - pageSize - 1 < 0
                                ? startI
                                : lastPage - pageSize - 1;
                        if (data[startI].mapleTotal === '合计')
                            sumIndex = startI;
                        let sumData = _.deepCopy(data[sumIndex]);
                        if (sumData) {
                            sumData.mapleTotal = '合计';
                            data.splice(sumIndex, 1, beforeSumData);
                            this.beforeSumData = _.deepCopy(
                                data[lastPage - 1] || data[data.length - 1]
                            );
                            this.$emit(
                                'updata-replace-sum-data',
                                this.beforeSumData
                            );
                            if (data.length === copyDataLen) {
                                copySoucreData[copyDataLen - 1] = sumData;
                                data.splice(copyDataLen - 1, 1, sumData);
                            } else {
                                copySoucreData[lastPage - 1] = sumData;
                                data.splice(lastPage - 1, 1, sumData);
                            }
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
                    core,
                    getCheckedData,
                    copyData
                } = this,
                { key = 'checked', checkedTemplate = 'checkedTemplate' } =
                    selectBoxConfig || {},
                checkBoxVal = getKeyChange(key, changes);
            let checked = [];

            if (checkBoxVal.length) {
                checked = getCheckedData({
                    key,
                    value: checkedTemplate
                });
                checked = checked.checkedData;
                let countRows = copyData.length,
                    bl = hasColumnSummary
                        ? checked.length === countRows - 1
                        : checked.length === countRows;
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
                    let addressOtps = [],
                        keyVals = {},
                        popData = [],
                        dItem = {},
                        o = {},
                        hasReplace = false;
                    const d = this.core.getData(),
                        data = [],
                        keys = getColumns.call(this, 'no'),
                        judgeVals = val => {
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
                        },
                        handleMap = (i, mapItem) => {
                            o = mapItem || this.data[i] || {};
                            dItem = d[i] || [];
                            if (
                                o.mapleTotal === '合计' &&
                                this.hasColumnSummary &&
                                this.beforeSumData &&
                                i !== this.copyData.length - 1 &&
                                !hasReplace
                            ) {
                                hasReplace = true;
                                o = _.deepCopy(this.beforeSumData);
                                o._markReplace = true;
                            }
                            for (let [j, itemData] of keys.entries()) {
                                let v = dItem[j],
                                    k = itemData.key || itemData.data;
                                let newItem = {};
                                if (mapItem) v = mapItem[k];
                                if (o._markReplace) v = o[k];
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
                                            ? selectVals.map(
                                                  ele => ele[valueName]
                                              )
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
                                            [k]: judgeVals(v)
                                                ? currentValue
                                                : o[k],
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
                                            [extraField]: judgeVals(
                                                currentValue
                                            )
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
                                        addressOtps = _.collageAddress(
                                            _.address
                                        );
                                    }
                                    if (
                                        this.cascaderVals[`key-${k}-value-${v}`]
                                    ) {
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
                                                    : exchangeArrary(
                                                          o[extraField]
                                                      )
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
                                                    : exchangeArrary(
                                                          o[extraField]
                                                      )
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
                                                    res.map(
                                                        ({ label }) => label
                                                    )
                                                )
                                                    ? res.map(
                                                          ({ label }) => label
                                                      )
                                                    : exchangeArrary(o[k]),
                                                [extraField]: judgeVals(
                                                    res.map(
                                                        ({ value }) => value
                                                    )
                                                )
                                                    ? res.map(
                                                          ({ value }) => value
                                                      )
                                                    : exchangeArrary(
                                                          o[extraField]
                                                      )
                                            };
                                        } else {
                                            o = {
                                                ...o,
                                                [k]: judgeVals(
                                                    res.map(
                                                        ({ value }) => value
                                                    )
                                                )
                                                    ? res.map(
                                                          ({ value }) => value
                                                      )
                                                    : exchangeArrary(o[k]),
                                                [extraField]: judgeVals(
                                                    res.map(
                                                        ({ label }) => label
                                                    )
                                                )
                                                    ? res.map(
                                                          ({ label }) => label
                                                      )
                                                    : exchangeArrary(
                                                          o[extraField]
                                                      )
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
                            o = callback(o, i) || o;
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
                                        _markReplace: undefined
                                    });
                                }
                            }
                        };
                    d.map((dEle, i) => handleMap(i));
                    popData = this.copyData.slice(d.length);
                    popData.map((pEle, i) => handleMap(i, pEle));
                    this.core.validateCells(valid => {
                        resolve({
                            value: data,
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
                    if (d[i].mapleTotal === '合计' && i !== d.length - 1)
                        continue;
                    d[i][key] = this.checkAllabled
                        ? myColumns[checkedIndex].checkedTemplate || true
                        : myColumns[checkedIndex].uncheckedTemplate || false;
                    if (this.checkAllabled) this.checkAllabledIndex++;
                }
                this.core.render();
                type = 'allCheckbox';
                this.beforeSumData[key] = this.checkAllabled
                    ? myColumns[checkedIndex].checkedTemplate || true
                    : myColumns[checkedIndex].uncheckedTemplate || false;
                this.$emit('updata-replace-sum-data', this.beforeSumData);
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
                getCols: this.getNowColumns,
                columns: this.myColumns
            });
        },
        clearFilters(clearAll = false) {
            const { settings, conditions, columns, core } = this,
                bl = settings.filters && conditions && conditions.length;
            if (bl) {
                const filtersPlugin = core.getPlugin('filters');
                if (clearAll) {
                    this.initSizeAbled = true;
                    this.conditions = [];
                    this.filterFailData = [];
                    this.copyData = [];
                }
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
            } else this.clearSort();
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
        },
        afterUnhideColumns(currentHideConfig, destinationHideConfig) {
            this.hiddenColumns = destinationHideConfig;
        },
        afterColumnMove(
            movedColumns,
            finalIndex,
            dropIndex,
            movePossible,
            orderChanged
        ) {
            if (orderChanged) this.getColumns();
        },
        getColumns() {
            if (this.settings.cacheId && this.settings.openCache) {
                const myColumns = this.myColumns,
                    t = this.core.getColHeader(),
                    cols = [],
                    columns = [];
                let _width, className, key, subType;
                t.map(ele => {
                    const index = ele.slice(
                        ele.indexOf('index=') + 6,
                        ele.indexOf('CDC')
                    );
                    _width = myColumns[index]._width;
                    className = myColumns[index].className;
                    key = myColumns[index].key || myColumns[index].data;
                    subType = myColumns[index].subType;
                    cols.push({
                        subType,
                        key,
                        _width,
                        className
                    });
                    columns.push(myColumns[index]);
                });
                localStorage.setItem(
                    `${this.settings.cacheId}-hiddenColumns`,
                    JSON.stringify(this.hiddenColumns)
                );
                localStorage.setItem(
                    `${this.settings.cacheId}-columns`,
                    JSON.stringify(cols)
                );
                this.myColumns = columns;
                this.$nextTick(() => {
                    this.$emit('update-columns', columns);
                });
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
                sortConfig = {},
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
            sortConfig = {
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
                    if (!config.notRender) this.core.render();
                }
            };
            this.core.selectCell(0, col);
            if (this.settings.customSort) return this.customSort(sortConfig);
            this.$emit('changeSort', sortConfig);
        },
        clearSort(bl = true) {
            if (this.options.openSort) {
                this.sort = {};
                this.sortDir = null;
                this.sortK = null;
                if (bl) this.core.render();
            }
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
        getCheckedData({
            key,
            value,
            clear,
            getItem = () => {},
            all = false
        } = {}) {
            if (!key)
                throw `Please provide the field name of the selection box`;
            let d = [],
                { clearFilters, copyData, beforeSumData } = this;

            for (let [index, item] of copyData.entries()) {
                if (index !== copyData.length - 1) {
                    if (item.mapleTotal === '合计')
                        item = _.deepCopy(beforeSumData);
                    if (item[key] === value || item[key] === true || all) {
                        getItem(item);
                        d.push(item);
                    }
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
        },
        customSort({ data: info, callback: end }) {
            const { copyData, sortDir, sortK } = this,
                {
                    currentData: { key },
                    direction
                } = info;
            if (sortDir === direction && sortK === key) {
                this.sortDir = null;
                return end({
                    state: true,
                    clear: true
                });
            }
            this.sortK = key;
            this.sortDir = direction;
            let d = copyData
                .filter(item => item.mapleTotal !== '合计')
                .sort(sortData(direction === 'up' ? 'asc' : 'desc', key));
            end({
                state: true,
                notRender: true,
                clear: true
            });
            this.initSizeAbled = true;
            this.$emit('update', d);
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
