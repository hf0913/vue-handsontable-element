# 申明

.[基于 handsontable 二次封装源码]: https://github.com/hf0913/vue-handsontable-element
.[handsontable 官网]: https://handsontable.com/

## 简要步骤

1. 原表格标签修改为：Handsontable
2. 对于 columns，key 或者 data 属性名都可以用来存放后端字段名
3. 对于 columns 中 type 属性，仅支持：autocomplete、checkbox、date、dropdown、handsontable、numeric、password、text、time，默认为 text，切记不要设置 type 类型为其他值

### 示例代码

```html
<template>
    <Handsontable
        :selectBoxConfig="selectBoxConfig"
        :columns="columns"
        v-model="tableData"
        @click="handsontableClick"
        @change="handsontableChange"
        @getCore="getCore"
        @cellDblClick="cellDblClick"
        @getSelectOpts="getSelectOpts"
        @changeSort="changeSort"
        :options="options"
        ref="handsontableRef"
    />
</template>

<script>
    export default {
        data() {
            return {
                selectArr: [
                    {
                        test: "maple1",
                        id: 1
                    }
                ], // 下拉框数据集合
                tableData: [],
                columns: [
                    {
                        //公共属性解释
                        title: "表头名", // 表格表头名
                        key: "common", // 表格渲染字段名，可以支持data或者key属性名
                        _width: 200, // 表格宽度
                        readOnly: true, // 是否只读，控制单元格是否支持下拉填充、粘贴赋值，true开启，false关闭，默认false
                        allowEmpty: false, // 是否必填，false必填，true非必填，默认text，同type属性
                        type: "checkbox", // 模式类型，仅支持：text（文本）、checkbox（复选框）、numeric（数字）、date（日期）、time（时间）、dropdown（下拉框），autocomplete（懒加载下拉框，相比dropdown不会自动填充值），默认text
                        subType: "selection", // 扩展模式类型，仅支持：selection（表头复选框）、address（地址级联选择器）、cascader（普通级联选择器）、datePicker（日期时间选择器）、posInt（正整数类型）、optimize（下拉框优化模式）、handle（操作）
                        editor: false, // 是否可以编辑，false不可以编辑，但是可以被下拉填充或者粘贴，仅支持：text（文本）、checkbox（复选框）、numeric（数字）、date（日期）、time（时间）、dropdown（下拉框），false
                        validator: (value, callback) => {
                            // 自定义校验，value为单元格值，callback回调函数，入参为boolean类型。
                            callback(true); // true校验通过,false校验失败，单元格背景色标记红色
                        },
                        className: "htLeft htMiddle" // 对齐方式，仅支持：htRight htLeft htMiddle htBottom
                    },
                    {
                        title: "普通复选框",
                        key: "checked",
                        type: "checkbox",
                        checkedTemplate: "1", // true翻译成字符串1
                        uncheckedTemplate: "0" // false翻译成字符串0
                    },
                    {
                        key: "checked",
                        type: "checkbox",
                        subType: "selection" // 表头复选框
                    },
                    {
                        title: "普通文本",
                        key: "text",
                        maxLength: 8 // 文字最大长度
                    },
                    {
                        title: "地址级联选择",
                        data: "address",
                        subType: "address",
                        exchange: false, // 键值对都有值，不会转化，默认都会转化
                        extraField: "maple_address", // 额外多返回一个字段，该值由valueType属性控制
                        valueType: "label", // label || value，默认value
                        asyncOpts: () => {
                            // 移步赋值options
                            return new Promiss((resolve, reject) => {
                                resolve([]);
                            });
                        },
                        props: {} // 参考 https://element.eleme.cn/#/zh-CN/component/cascader
                    },
                    {
                        title: "普通级联选择",
                        data: "cascader",
                        exchange: false, // 键值对都有值，不会转化，默认都会转化
                        subType: "cascader",
                        asyncOpts: () => {
                            // 移步赋值options
                            return new Promiss((resolve, reject) => {
                                resolve([]);
                            });
                        },
                        options: [], // 也接受function,如：options: ({row, col}) => []
                        extraField: "maple_address", // 额外多返回一个字段，该值由valueType属性控制
                        valueType: "label", // label || value，默认value
                        props: {} // 参考 https://element.eleme.cn/#/zh-CN/component/cascader
                    },
                    {
                        title: "时间日期组合",
                        key: "datePicker",
                        subType: "datePicker",
                        props: {
                            // 参考 https://element.eleme.cn/#/zh-CN/component/datetime-picker
                            type: "datetime",
                            format: "yyyy-MM-dd HH:mm:ss",
                            valueFormat: "yyyy-MM-dd HH:mm:ss"
                        }
                    },
                    {
                        title: "数字",
                        data: "numeric",
                        type: "numeric",
                        subType: "posInt", // 正整数类型
                        numericFormat: {
                            pattern: "0.00", // 显示值类型
                            min: 0, // 最小值
                            max: 1208 // 最大值
                        }
                    },
                    {
                        title: "日期",
                        data: "date",
                        type: "date",
                        dateFormat: "YYYY-MM-DD" // 日期类型
                    },
                    {
                        title: "时间",
                        data: "time",
                        type: "time",
                        timeFormat: "HH:mm", // 时间类型
                        correctFormat: true // 失去焦点，矫正时间格式
                    },
                    {
                        title:
                            "下拉框(优化模式，options属性或者source属性，接受一个回调函数，返回数据字典集合)",
                        data: "select",
                        type: "dropdown",
                        // options: () => this.selectArr, // 这种也可以哦，下拉框选项值字段名支持：source || options
                        options: () => this.selectArr, // 存放下拉框选项值集合，每一项中包含值和id，取名source或者options都可以
                        // extraField属性：调用getData方法，返回多余字段名，其值取item[valueType === valueName ? labelName : valueName]
                        extraField: "maple_love",
                        valueType: "id", // 配合extraField属性使用，默认等于valueName
                        labelName: "test", // 下拉框选项值集合，每一项中值字段名，默认：label，即用户可以看到下拉框列表显示的值
                        valueName: "id", // 下拉框选项值集合，每一项中id字段名，默认：value，即发送给后台的值，用户是看不到这个值
                        subType: "optimize", // 优化模式，配合maxMatchLen属性一起使用
                        maxMatchLen: 8, // 根据source属性值，模糊匹配最大条数，默认8条，即用户点击下拉框只可以选择8条数据。
                        visibleRows: 4, // 可见列表数量
                        exchange: false, // 键值对都有值，不会转化，默认都会转化
                        mnemonicCode: ["shorthandCode"] // 助记符
                    },
                    {
                        title: "下拉框（ajax远程搜索）",
                        data: "select-maple",
                        subType: "select",
                        options: [
                            {
                                unitId: 1,
                                unitName: "maple1",
                                test: "ok"
                            },
                            {
                                unitId: 2,
                                unitName: "mtt1",
                                test: "tt"
                            }
                        ],
                        _width: 200,
                        mnemonicCode: ["test"],
                        extraField: "maple_select",
                        valueType: "unitId", // 配合extraField属性使用，默认等于valueName
                        labelName: "unitName", // 下拉框选项值集合，每一项中值字段名，默认：label，即用户可以看到下拉框列表显示的值
                        valueName: "unitId", // 下拉框选项值集合，每一项中id字段名，默认：value，即发送给后台的值，用户是看不到这个值
                        asyncOpts: () => {
                            // 移步赋值options
                            return new Promiss((resolve, reject) => {
                                resolve([]);
                            });
                        },
                        ajaxConfig: {
                            // ajax请求配置
                            url:
                                "http://47.110.56.139:8008/api/foundation/unit/component", // 请求后端的完整地址，切记不能携带任何请求参数。
                            method: "post", // 请求方式
                            queryField: "param", // 查询字段名，动态获取查询值value
                            data: {
                                // 请求参数以body形式发送，如果不需要请设置data属性。接受函数，如：data:()=>({param: ''})
                                pageNum: 1,
                                pageSize: 10,
                                param: ""
                            },
                            header: {
                                // 接受function，举例：header:()=>({Authorization: "eyJhbGciOiJIUzUxMiJ9"})
                                Authorization: "eyJhbGciOiJIUzUxMiJ9"
                            },
                            // param:{param: ''} // 请求参数从url携带发送，查询参数，场景业务场景如get请求, 接受函数，如：param:()=>({param: ''})
                            result: "data" // 根据后端返回关于下拉框选项集合的数据结构，给出一个字段访问链。必须滴。
                        },
                        props: {
                            remote: true, // 是否开启远程搜索
                            placeholder: "输入即搜索"
                        } // 参考 https://element.eleme.cn/#/zh-CN/component/cascader
                    },
                    {
                        title: "操作",
                        subType: "handle",
                        _width: 140,
                        options: [
                            {
                                name: "复制", // 文本标题
                                color: "#409eff" // 文本颜色
                            },
                            {
                                name: "添加",
                                color: "#67c23a"
                            },
                            {
                                name: "删除",
                                color: "#f56c6c"
                            }
                        ]
                    }
                ],
                options: {
                    // 更多options，https://handsontable.com/docs/7.4.2/Options.html
                    maxRows: 12080, // 数据上限
                    minRows: 8, // 至少8条，如果设置该属性，请删除与之冲突的补偿数据的代码。
                    height: 400,
                    readOnly: false, // table是否只读
                    columnSorting: true, // 开启排序
                    wordWrap: false, // 不换行
                    nestedHeaders: [
                        // 合并表头
                        ["A", { label: "B", colspan: 8 }, "C"],
                        [
                            "D",
                            { label: "E", colspan: 4 },
                            { label: "F", colspan: 4 },
                            "G"
                        ],
                        [
                            "H",
                            { label: "I", colspan: 2 },
                            { label: "J", colspan: 2 },
                            { label: "K", colspan: 2 },
                            { label: "L", colspan: 2 },
                            "M"
                        ],
                        ["N", "O", "P", "Q", "R", "S", "T", "U", "V", "W"]
                    ],
                    cells: (row, column, prop) => {
                        // 控制一个或多个单元格属性
                        // row:行号, column:列号, prop:字段名
                        const cellProperties = {};

                        if (row === this.myValue.length - 1) {
                            // 行号等于最后一行
                            cellProperties.readOnly = true; // 单元格只读
                            cellProperties.comment = {
                                // 单元格备注
                                value: "备注内容", // 单元格备注内容
                                readOnly: true // 备注内容只读
                            };
                        }
                        if (row === this.core.countRows() - 1) {
                            cellProperties.readOnly = true;
                        } // 专为表尾合计用，如果使用了表尾合计，请一定要加上此段代码
                        return cellProperties;
                    },
                    columnSummary: [
                        // 表尾合计
                        {
                            key: "n1", // 需要统计某列的字段名
                            type: "sum" // 目前暂时仅支持sum类型（求和）
                        },
                        {
                            key: "n2",
                            type: "sum"
                        }
                    ],
                    openEmptyValid: true, // 是否开启空行校验，默认开启
                    hasDefaultValFileds: ["字段一", "字段二"], // 是否存在默认值的字段集合，在getData数据校验空行会综合考虑是否标记单元格红色，如果默认字段有值且符合单元格校验规则，则被视为空单元格
                    openSort: true, // 自定义排序
                    multiColumnSorting: true, // 开启排序
                    multiColumnSorting: {
                        // 排序配置
                        initialConfig: [
                            {
                                column: 1,
                                sortOrder: "asc" // 正序
                            },
                            {
                                column: 0,
                                sortOrder: "desc" // 反序
                            }
                        ]
                    },
                    customValidate: ({ isValid, value, row, key }) => {
                        // 全局自定义校验回调函数
                        // isValid：当前单元格校验状态,value：当前单元格值,row：当前单元格行号,key：当前单元格字段名
                        return true; // true即校验通过，false即校验失败
                    },
                    customCellDblClick: ({ row, col, $el, core }) => {
                        // 自定义双击单元格回调函数
                        // row：行号，col：列号，$el：当前单元格dom
                        return true; // true即通过，false即阻止
                    }
                },
                core: Object, // https://handsontable.com/docs/7.4.2/Core.html
                selectBoxConfig: {
                    // 表头中全选checkBox辅助配置，没有配置该属性，change事件返回的checked属性值为空
                    key: "checkbox", // 复选框字段名
                    col: 0 // 复选框行号
                }
            };
        },
        methods: {
            getCore(v) {
                // 获取core
                this.core = v;
            },
            handsontableChange(o) {
                // change事件，通用模版
                // getKeyChange, filterKeysChanges方法二选一，个人建议filterKeysChanges方法，第三个参数是否过滤监听合计一行数据变化，默认是true，即过滤
                // row：行号 key：字段名 oldVal：旧值 newVal：新值 changes：单元格数据修改的集合
                // changeCurrentCell 修改当前监听的单元格值
                // filterSummaryRow: 过滤监听合计一行的数据变化，默认是true，即过滤
                // checked：勾选数据集合，复选框触发
                const {
                    getKeyChange,
                    filterKeysChanges,
                    changes = [[]],
                    changeCurrentCell,
                    checked
                } = o;

                getKeyChange("你需要监听的字段名1", changes, true).map(
                    ([row, key, oldVal, newVal]) => {
                        console.log(row, key, oldVal, newVal);
                    }
                );
                getKeyChange("你需要监听的字段名2", changes, true).map(
                    ([row, key, oldVal, newVal]) => {
                        console.log(row, key, oldVal, newVal);
                    }
                );

                filterKeysChanges({
                    filterSummaryRow: true, // 过滤监听合计一行的数据变化，默认是true，即过滤
                    changes,
                    keys: ["你需要监听的字段名1", "你需要监听的字段名2"],
                    callback: ({
                        row,
                        key,
                        oldVal,
                        newVal,
                        changeCurrentCell,
                        index
                    }) => {
                        console.log(row, key, oldVal, newVal, index);
                        // changeCurrentCell[3] = 'maple test'
                    }
                });
            },
            handsontableClick(o) {
                console.log(o, "点击事件");
            },
            /**
             * @description getData方法是一个promise，该方法会去遍历table数据，在遍历到每一个item，都会触发一个回调函数，该回调函数会提供两个参数（item,index），并接受一个对象，该对象会被浅合并到当前item。
             */
            getData() {
                // 如果不需要任何校验，可以不需要调用该函数
                this.$refs.handsontableRef
                    .getData((item, index) => {
                        item = {
                            ...item,
                            notAddabled: false, // 是否不添加当前item数据，false即添加，true即不添加
                            maple: index // 基于item合并新属性
                        };
                        return item;
                    })
                    .then(({ value, valid, columns }) => {
                        // valid 校验状态，true即通过
                        console.log(value, valid, columns);
                    });
            },
            /**
             * @description  单元格双击事件
             */
            cellDblClick({ coord, mouseEvent, $el }) {
                console.log(coord, mouseEvent, $el);
            },
            /**
             * @description  获取下拉框列表变化
             */
            getSelectOpts(o) {
                console.log("getSelectOpts", o);
            },
            utils() {
                // 工具方法 https://github.com/hf0913/vue-handsontable-element/blob/master/src/utils/index.js
                return utils;
            },
            changeSort(o) {
                // 排序回调
                this.$emit("changeSort", o);
            },
            clearSort(t) {
                // 清空排序
                return this.$refs.mapleHandsontableRef.clearSort();
            },
            changeCheckAllabled(bl) {
                // 表格全选赋值
                return this.$refs.changeCheckAllabled(bl);
            }
        }
    };
</script>

#### 使用说明 1. 关于下拉框，建议使用【title: "下拉框(优化模式，options 属性或者
source 属性，接受一个回调函数，返回数据字典集合)"】这种类型 2.
获取某一个单元格值：this.core.getDataAtCell(row,col) 3.
获取某一行数据：this.core.getDataAtRow(row) 4.
获取某一列数据：this.core.getDataAtCol(col) 5.
折叠行，https://handsontable.com/docs/7.4.2/demo-nested-rows.html 6.
设置某一个单元格的值：this.core.setDataAtCell(row, col, value,
'标记')，强烈不建议用在批量修改数据 7. 关于 core 获取，可以通过@getCore
方法，查看上面的示例代码，change 方法和 click 方法也会返回 core 对象 8. 请勿使用
setTimeout 来达到视图层更新 9. 修改数据，如果视图没有响应式渲染，请调用
this.core.updateSettings({data: this.tableData}); ##### 注意事项
全局修改该组件样式，会影响严重组件布局与功能，切记～
```
