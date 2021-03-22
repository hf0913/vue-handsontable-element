import utils from './index';
import maple from 'custom-handsontable';
function getColumns(t) {
    let _cols = [],
        cols = [],
        key,
        { columns, options } = this;
    if (!t) this.myColumns = utils.deepCopy(columns);
    if (options.cacheId && options.openCache && columns.length) {
        _cols = JSON.parse(
            localStorage.getItem(`${options.cacheId}-columns`) || '[]'
        );
        if (_cols.length && !t) {
            _cols.map(item => {
                key = item.key || item.data;
                cols.push({
                    ...columns.find(
                        ele =>
                            (ele.key || ele.data) === key ||
                            (ele.subType === item.subType &&
                                item.subType === 'handle')
                    ),
                    _width: item._width,
                    className: item.className || 'htMiddle htCenter'
                });
            });
            this.myColumns = cols;
        }
    }
    if (!_cols.length) _cols = this.myColumns;
    return _cols;
}

function exchangeSort(key, n) {
    if (!this.options.openSort) return '';
    const { type: sortType, direction } = this.sort[key] || {};
    switch (true) {
        case sortType === 0:
            return direction === n ? `maple-${n}-arrow-default` : '';
        case sortType === 1:
            return direction === n ? `maple-${n}-arrow-select` : '';
        case sortType === -1:
            return direction === n ? `maple-${n}-arrow-select` : '';
    }
}

function colHeaders(col) {
    const { settings, myColumns, options, checkAllabled, data } = this;
    const item = myColumns[col];
    const key = item.key || item.data;
    const { openSort } = options || {};

    if (item.subType === 'selection' && item.type === 'checkbox') {
        this.checkboxAllIndex = col;
        return `<input type="checkbox" id="maple-all-checkbox" index=${col}CDC ${
            checkAllabled && data && data.length ? 'checked' : ''
        } ${settings.readOnly || !data.length ? 'disabled' : ''} />`;
    }
    return `
        <div style="display: flex" class="${
            item.subType !== 'handle' && !item.noSort ? 'maple-sort' : ''
        }">
            <div index=${col}CDC class="${
        item.subType !== 'handle' ? 'maple-sort' : ''
    } ${
        item.allowEmpty === false
            ? `maple-required-title maple-required-title-${key}`
            : `maple-title maple-title-${key}`
    } ${
        item.subType !== 'handle' && !item.noSort && openSort
            ? 'maple-public-title'
            : ''
    }">
                    ${item.title}
                </div>
            <div class="maple-arrow" style="display: ${
                item.subType !== 'handle' && !item.noSort && openSort
                    ? ''
                    : 'none'
            }">
                <div class="maple-up-arrow ${exchangeSort.call(
                    this,
                    key,
                    'up'
                )}"></div>
                <div class="maple-down-arrow ${exchangeSort.call(
                    this,
                    key,
                    'down'
                )}"></div>
            </div>
            <div class="maple-no-arrow" style="display: ${
                item.subType !== 'handle' && !item.noSort && openSort
                    ? 'none'
                    : ''
            }"></div>
        </div>
    `;
}

function customColumns() {
    const columns = [];

    getColumns.call(this);
    this.myColumns.map(item => {
        const k = item.key || item.data;
        if (
            item.subType === 'optimize' &&
            (item.type === 'autocomplete' || item.type === 'dropdown')
        ) {
            item.type = 'dropdown';
            const sourceFn = (query, process, item, k) => {
                const optionsTotal = item.maxMatchLen || 12,
                    labelName = item.labelName || 'label';
                let mnemonicCode = item.mnemonicCode || [];
                let options = [],
                    j = 1,
                    processOpts = [],
                    opts = [];
                let list = [];
                for (let [, w] of this.columns.entries()) {
                    if (w.key === k || w.data === k) {
                        const wOptions = w.options || w.source;
                        list =
                            wOptions instanceof Function
                                ? wOptions() || []
                                : wOptions;
                        mnemonicCode = w.mnemonicCode || [];
                        break;
                    }
                }
                if (list.length) {
                    options = list;
                }
                for (let [, v] of options.entries()) {
                    const val = v[labelName] || '';
                    if (!query) {
                        processOpts.push(val);
                        opts.push(v);
                        if (optionsTotal === j) break;
                        j++;
                    }
                    if (query) {
                        let addAbled = val.includes(query);
                        let allow = false;
                        if (mnemonicCode instanceof Array) {
                            mnemonicCode.map(code => {
                                if (v[code] && v[code].includes(query)) {
                                    allow = true;
                                }
                            });
                        }
                        if (addAbled || allow) {
                            processOpts.push(val);
                            opts.push(v);
                            if (optionsTotal === j) break;
                            j++;
                        }
                    }
                    if (query === val) {
                        this.selectVals[`key-${k}-value-${val}`] = v;
                    }
                }
                this.keyOpts[k] = {
                    opts,
                    processOpts
                };
                if (item.type !== 'autocomplete') {
                    this.$emit('getSelectOpts', {
                        keyOpts: this.keyOpts,
                        selectVals: this.selectVals,
                        orgSelect: true,
                        key: k
                    });
                }
                process(options.map(oItem => oItem[labelName]));
            };
            // 下拉框静态优化模式
            item.source = (query, process) => sourceFn(query, process, item, k);
            item.validator = (value, callback) => {
                callback(
                    utils.checkType.call(this, {
                        value,
                        item
                    })
                );
            };
        }
        if (
            item.subType === 'datePicker' ||
            item.subType === 'cascader' ||
            item.subType === 'address' ||
            item.subType === 'select'
        ) {
            item.validator = (value, callback) => {
                callback(
                    utils.checkType.call(this, {
                        value,
                        item
                    })
                );
            };
            item.editor = false;
        }
        if (
            (item.type === 'text' || !item.type || item.subType === 'text') &&
            item.subType !== 'datePicker' &&
            item.subType !== 'cascader' &&
            item.subType !== 'address' &&
            item.subType !== 'handle' &&
            item.subType !== 'select'
        ) {
            item.validator = (value, callback) => {
                const vaild = item.allowEmpty === false ? !!value : true;
                if (vaild && item.maxLength) {
                    value = value + '';
                    return callback(value.length <= item.maxLength);
                }
                callback(vaild);
            };
        }
        if (item.type === 'numeric' && item.subType !== 'text') {
            item.validator = (value, callback) => {
                callback(
                    utils.checkType.call(this, {
                        value,
                        item
                    })
                );
            };
        }
        if (item.subType === 'handle') {
            // eslint-disable-next-line no-unused-vars
            item.readOnly = true;
            item.renderer = (instance, td, row, col) => {
                let $el = document.createElement('DIV');
                $el.style.height = '100%';
                $el.style.display = 'flex';
                $el.style.justifyContent = 'space-around';
                $el.style.alignItems = 'center';

                if (this.hasColumnSummary && row === instance.countRows() - 1) {
                    maple.dom.empty(td);
                    td.innerHTML = col === 0 ? '合计' : '';
                    td.setAttribute('class', 'maple-table-total');
                    td.parentElement &&
                        td.parentElement.setAttribute(
                            'class',
                            'maple-table-total-tr'
                        );
                    return td;
                }
                item.options.map(({ name, color }, index) => {
                    let $btn = document.createElement('DIV');
                    $btn.innerHTML = name;
                    $btn.style.color = color;
                    $btn.style.cursor = 'pointer';
                    $el.append($btn);

                    maple.dom.addEvent($btn, 'mousedown', event => {
                        this.$emit('click', {
                            row,
                            col,
                            index,
                            $el: $btn,
                            event,
                            core: instance,
                            name,
                            getCols: this.getNowColumns
                        });
                        event.stopPropagation && event.stopPropagation();
                        event.cancelBubble = true;
                    });
                });

                maple.dom.empty(td);
                td.appendChild($el);

                return td;
            };
        }
        if (item.type === 'checkbox') {
            // eslint-disable-next-line no-unused-vars
            const {
                columns,
                data,
                getKeyChange,
                filterKeysChanges,
                myColumns,
                hasColumnSummary,
                singleSelectConfig
            } = this;
            item.renderer = (instance, td, row, col, prop, value) => {
                const { readOnly, editor } = instance.getCellMeta(row, col),
                    { _mapleIndex } = instance.getSourceDataAtRow(row) || {};
                let sourceIndex = data.findIndex(
                    e => e && e._mapleIndex === _mapleIndex
                );
                sourceIndex = ~sourceIndex ? sourceIndex : row;
                if (!data[sourceIndex]) return td;
                maple.dom.empty(td);
                let $el = document.createElement('INPUT'),
                    $div = document.createElement('DIV'),
                    oldVal = $el.checked,
                    { checkedTemplate } = columns[col] || {},
                    checkedVal =
                        checkedTemplate != null && checkedTemplate !== ''
                            ? checkedTemplate === value ||
                              value === true ||
                              value === 'true'
                            : !!value;
                const { singleSelectIndex } = this;
                if (
                    singleSelectConfig.openAbled &&
                    singleSelectConfig.key === prop &&
                    row !== singleSelectIndex &&
                    checkedVal
                ) {
                    if (singleSelectIndex >= 0 && data[singleSelectIndex]) {
                        data[singleSelectIndex][prop] = false;
                    }
                    this.singleSelectIndex = row;
                }

                $el.type = 'checkbox';
                if (data[sourceIndex]) {
                    $el.checked = checkedVal;
                    $el.disabled =
                        readOnly ||
                        editor === false ||
                        (singleSelectConfig.openAbled &&
                            singleSelectConfig.strict &&
                            checkedVal);
                    data[sourceIndex][prop] = checkedVal;
                }
                $el.setAttribute('class', 'maple-td-input-checkbox');
                $el.setAttribute('id', `maple-td-input-checkbox-${row}`);

                maple.dom.addEvent($el, 'mousedown', event => {
                    if (!data[sourceIndex]) return;
                    let checked = [],
                        checkedClickVal = !event.target.checked;
                    data[sourceIndex][prop] = checkedClickVal;

                    const { singleSelectIndex } = this;
                    if (
                        singleSelectConfig.openAbled &&
                        singleSelectConfig.key === prop &&
                        row !== singleSelectIndex &&
                        checkedClickVal
                    ) {
                        let timer = setTimeout(() => {
                            $el.checked = checkedClickVal;
                            $el.disabled =
                                readOnly ||
                                editor === false ||
                                (singleSelectConfig.openAbled &&
                                    singleSelectConfig.strict &&
                                    checkedClickVal);
                            clearTimeout(timer);
                            timer = null;
                        }, 128);
                        if (singleSelectIndex >= 0 && data[singleSelectIndex]) {
                            data[singleSelectIndex][prop] = false;
                            instance.render();
                        }
                        this.singleSelectIndex = row;
                    }

                    data.filter((item, row) => {
                        let cVal = item[prop];
                        if (cVal) {
                            checked.push({
                                row,
                                checked: cVal
                            });
                        }
                    });
                    this.$emit('change', {
                        source: 'checkbox',
                        changes: [[row, prop, oldVal, checkedClickVal]],
                        core: instance,
                        type: 'change',
                        getKeyChange,
                        filterKeysChanges,
                        checked,
                        columns: myColumns
                    });
                    this.checkAllabled = !!(checked.length && hasColumnSummary
                        ? checked.length === data.length - 1
                        : checked.length === data.length);
                    instance.render();
                });
                if (
                    col === 0 &&
                    hasColumnSummary &&
                    row === instance.countRows() - 1
                ) {
                    data[sourceIndex][prop] = false;
                    td.innerHTML = '合计';
                    td.setAttribute('class', 'maple-table-total');
                    td.parentElement &&
                        td.parentElement.setAttribute(
                            'class',
                            'maple-table-total-tr'
                        );
                    return td;
                }

                $div.style.height = '100%';
                $div.style.display = 'flex';
                $div.style.justifyContent = 'space-around';
                $div.style.alignItems = 'center';
                $div.setAttribute('class', 'maple-td-checkbox');
                $div.setAttribute('id', `maple-td-checkbox-${row}`);
                maple.dom.addEvent($div, 'dblclick', () => {
                    if (!data[sourceIndex]) return;
                    let checked = [],
                        checkedClickVal = $el.checked;
                    data[sourceIndex][prop] = checkedClickVal;
                    data[sourceIndex][prop] = $el.checked;

                    const { singleSelectIndex } = this;
                    if (
                        singleSelectConfig.openAbled &&
                        singleSelectConfig.key === prop &&
                        row !== singleSelectIndex &&
                        checkedClickVal
                    ) {
                        $el.checked = checkedClickVal;
                        $el.disabled =
                            readOnly ||
                            editor === false ||
                            (singleSelectConfig.openAbled &&
                                singleSelectConfig.strict &&
                                checkedClickVal);
                        if (singleSelectIndex >= 0 && data[singleSelectIndex]) {
                            data[singleSelectIndex][prop] = false;
                            instance.render();
                        }
                        this.singleSelectIndex = row;
                    }

                    data.filter((item, row) => {
                        let cVal = item[prop];
                        if (cVal) {
                            checked.push({
                                row,
                                checked: cVal
                            });
                        }
                    });
                    this.$emit('change', {
                        source: 'checkbox',
                        changes: [[row, prop, oldVal, checkedClickVal]],
                        core: instance,
                        type: 'change',
                        getKeyChange,
                        filterKeysChanges,
                        checked,
                        columns: myColumns
                    });
                    this.checkAllabled = !!(checked.length && hasColumnSummary
                        ? checked.length === data.length - 1
                        : checked.length === data.length);
                    instance.render();
                });
                td.setAttribute('class', 'maple-custom-checkbox-td');
                $div.appendChild($el);
                td.appendChild($div);
                return td;
            };
        }

        item = {
            ...item,
            data: item.key || item.data,
            width: this.widthAuto ? item._width : item.width,
            myTitle: item.title,
            title: null,
            visibleRows: item.visibleRows || 6
        };
        columns.push(item);
    });
    return columns;
}

function beforeChange(change) {
    if (
        change.length &&
        change[0] &&
        change[0].length &&
        change[0].filter(value => Number.isNaN(value)).length
    ) {
        return false;
    }
    if (this.settings.changeBefore instanceof Function) {
        return this.settings.changeBefore(change);
    }
    return true;
}

function afterOnCellMouseDown(event, coords, $el) {
    if (coords) {
        const { row, col } = coords;
        const className = event.target.className;
        if (
            className.includes('maple-up-arrow') ||
            className.includes('maple-down-arrow')
        ) {
            this.changeSort({
                col,
                row,
                $el,
                core: this.core,
                name: 'titleCells',
                event,
                type: 'sort',
                direction: className.includes('maple-up-arrow') ? 'up' : 'down'
            });
        }
        if (event.target.id === 'maple-fliter') {
            this.$emit('controlCustomFilter', {
                event,
                coords,
                $el
            });
        }
        if (event.target.id === 'maple-all-checkbox') {
            this.checkAllBox(event, coords, $el);
        } else {
            this.currentCol = col;
            this.$emit('click', {
                col,
                row,
                $el,
                core: this.core,
                name: 'cells',
                event,
                type: 'click',
                getCols: this.getNowColumns
            });
        }
    }
}

function beforePaste(d, [{ startRow, endRow, startCol, endCol }]) {
    const { data, lazyLoadAbled, $parent, core, afterChange } = this,
        keys = getColumns.call(this, 'no');
    let rs = endRow - startRow + 1,
        cs = endCol - startCol + 1,
        rd = [],
        cd = [],
        key,
        changes = [],
        val;

    if (!lazyLoadAbled) return true;
    if (startRow === endRow && d.length && endRow <= d.length) {
        rs = d.length;
        endRow = d.length - 1 + startRow;
    }

    for (let i = 0; i < rs; i++) {
        if (rd.length === rs) break;
        d.map(dItem => {
            if (
                startCol === endCol &&
                dItem.length &&
                endCol <= dItem.length &&
                rd.length !== rs
            ) {
                cs = dItem.length;
                endCol = dItem.length - 1 + startCol;
            }
            for (let j = 0; j < cs; j++) {
                if (cd.length === cs) break;
                dItem.map(di => {
                    if (cd.length !== cs) {
                        return cd.push(di);
                    }
                });
            }
            if (rd.length !== rs) {
                rd.push(cd);
                return (cd = []);
            }
        });
    }

    for (let x = startRow; x <= endRow; x++) {
        for (let y = startCol; y <= endCol; y++) {
            if (!keys[y]) return;
            key = keys[y].key || keys[y].data;
            data[x] = data[x] || {};
            data[x]._mapleIndex =
                data[x]._mapleIndex || `${x}-${Math.random()}`;
            val = rd[x - startRow][y - startCol];
            changes.push([x, key, data[x][key], val]);
            if (data[x].mapleTotal === '合计') {
                data[x] = {
                    ...$parent.replaceSumData,
                    [key]: val
                };
            } else {
                data[x][key] = val;
            }
        }
    }
    afterChange(changes, 'CopyPaste.paste');
    core.render();
    return false;
}

export {
    colHeaders,
    customColumns,
    beforeChange,
    beforePaste,
    afterOnCellMouseDown,
    getColumns
};
