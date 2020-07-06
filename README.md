# 申明

.[基于 handsontable 二次封装源码]: https://github.com/hf0913/vue-handsontable-element
.[handsontable 官网]: https://handsontable.com/

## 简要步骤

1. 原表格标签修改为：Handsontable
2. 对于 columns，key 或者 data 属性名都可以用来存放后端字段名
3. 对于 columns 中 type 属性，仅支持：autocomplete、checkbox、date、dropdown、handsontable、numeric、password、text、time，默认为 text，切记不要设置 type 类型为其他值

### 示例代码

<template>
    <Handsontable
        :checkBox="checkBox"
        :columns="columns"
        v-model="tableData"
        @click="handsontableClick"
        @change="handsontableChange"
        @getCore="getCore"
        @cellDblClick="cellDblClick"
        :options="options"
        ref="handsontableRef"
    />
</template>

<script>
export default {
    data(){
        return {
            selectArr: [{
                test: "maple1",
                id: 1
            }], // 下拉框数据集合
            tableData: [],
            columns: [{
                key: "checkbox", // 设置后端字段名
                type: "checkbox", // 复选框
                width: 200, // 表格宽度
                subType: "selection", // 用来挑选行数据，禁止使用title，如果使用了title，就会出现table header没有复选框，只显示 title。
                openCustomFiter: true // 开启自定义头部筛选
            },
            {
                title: "普通文本", // 表头名
                key: "text",
                width: 200,
                validator: (value, callback)=>{
                    // 自定义校验，value为单元格值，callback回调函数，入参为boolean类型。
                    callback(true) // 校验通过
                    callback(false) // 校验失败，单元格背景色标记红色
                },
                readOnly: true, // 只读属性，不能被修改。
                editor: false, // 禁止编辑，但是可以通过粘贴、被填充修改。
                allowEmpty: true, // 是否可以接受空值
                openCustomFiter: true // 开启自定义头部筛选
            },
            {
                title: "地址级联选择",
                data: "address",
                subType: "address",
                width: 200,
                extraField: "maple_address",
                valueType: "label", // label || value，默认value
                props: {} // 参考 https://element.eleme.cn/#/zh-CN/component/cascader
            },
            {
                title: "普通级联选择",
                data: "cascader",
                subType: "cascader",
                options: [],
                extraField: "maple_address",
                valueType: "label", // label || value，默认value
                props: {} // 参考 https://element.eleme.cn/#/zh-CN/component/cascader
            },
            {
                title: "时间日期组合",
                key: "datePicker",
                subType: "datePicker",
                width: 200,
                props: { // 参考 https://element.eleme.cn/#/zh-CN/component/datetime-picker
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
                },
                allowEmpty: true, // 是否可以接受空值
                width: 200
            },
            {
                title: "日期",
                data: "date",
                type: "date",
                dateFormat: "YYYY-MM-DD", // 日期类型
                width: 200
            },
            {
                title: "时间",
                data: "time",
                type: "time",
                timeFormat: "HH:mm", // 时间类型
                correctFormat: true, // 失去焦点，矫正时间格式
                width: 200
            },
            {
                title: "下拉框(优化模式，options属性或者source属性，接受一个回调函数，返回数据字典集合)",
                data: "select",
                type: "dropdown",
                // options: () => this.selectArr, // 这种也可以哦，下拉框选项值字段名支持：source || options
                source: () => this.selectArr, // 存放下拉框选项值集合，每一项中包含值和id，取名source或者options都可以
                width: 300,
                // extraField属性：调用getData方法，返回多余字段名，其值取item[valueType === valueName ? labelName : valueName]
                extraField: "maple_love",
                valueType: "id", // 配合extraField属性使用，默认等于valueName
                labelName: "test", // 下拉框选项值集合，每一项中值字段名，默认：label，即用户可以看到下拉框列表显示的值
                valueName: "id", // 下拉框选项值集合，每一项中id字段名，默认：value，即发送给后台的值，用户是看不到这个值
                subType: "optimize", // 优化模式，配合maxMatchLen属性一起使用
                maxMatchLen: 8 // 根据source属性值，模糊匹配最大条数，默认8条，即用户点击下拉框只可以选择8条数据。
            },
            {
                title: "下拉框(优化模式)",
                data: "select",
                type: "dropdown",
                source: [],
                width: 300,
                extraField: "maple_love",
                valueType: "id",
                labelName: "test",
                valueName: "id",
                subType: "optimize",
                maxMatchLen: 8
            },
            {
                title: "下拉框(自定义请求ajax)",
                data: "selectAjax",
                type: "dropdown",
                source: [],
                width: 300,
                extraField: "maple_love",
                valueType: "id",
                labelName: "test",
                valueName: "id",
                subType: "ajax", // 自定义ajax请求，在编辑业务场景中数据回显，请必须请求一次数据，并将数据赋值给source属性。
                ajaxConfig: { // ajax请求配置
                    url: "http://www.maplehu.com.cn/api/login", // 请求后端的完整地址，切记不能携带任何请求参数。
                    method: "post", // 请求方式
                    queryField: "query", // 查询字段名，动态获取查询值value
                    data: { // 请求参数以body形式发送，如果不需要请设置data属性。
                        login_name: "admin",
                        password: "123456",
                        query: "test"
                    },
                    // param:{} // 请求参数从url携带发送，查询参数，场景业务场景如get请求
                    result: "res.data.data" // 根据后端返回关于下拉框选项集合的数据结构，给出一个字段访问链。必须滴。
                }
            },
            {
                title: "操作",
                subType: "handle", // 操作模式
                width: 140,
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
            }],
            options: {
                // 更多options，https://handsontable.com/docs/7.4.2/Options.html
                maxRows: 12080, // 数据上限
                minRows: 8, // 至少8条，如果设置该属性，请删除与之冲突的补偿数据的代码。
                height: 400,
                readOnly: false, // table是否只读
                hiddenColumns: {
                    // 隐藏某些列，接受列号的数组
                    columns: []
                },
                wordWrap: false, // 不换行
                nestedHeaders: [ // 合并表头
                    ['A', {label: 'B', colspan: 8}, 'C'],
                    ['D', {label: 'E', colspan: 4}, {label: 'F', colspan: 4}, 'G'],
                    ['H', {label: 'I', colspan: 2}, {label: 'J', colspan: 2}, {label: 'K', colspan: 2}, {label: 'L', colspan: 2}, 'M'],
                    ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']
                ],
                cells: (row, column, prop) => { // 控制一个或多个单元格属性
                    // row:行号, column:列号, prop:字段名
                    const cellProperties = {};
                    
                    if (row === this.myValue.length - 1) { // 行号等于最后一行
                        cellProperties.readOnly = true; // 单元格只读
                        cellProperties.comment = { // 单元格备注
                            value: "备注内容", // 单元格备注内容
                            readOnly: true // 备注内容只读
                        };
                    }
                    if(this.core.getDataAtRow(row)[0] === '合计') {
                        cellProperties.readOnly = true;
                    } // 专为表尾合计用，如果使用了表尾合计，请一定要加上此段代码
                    return cellProperties;
                },
                columnSummary: [ // 表尾合计
                    {
                        key: "n1", // 需要统计某列的字段名
                        type: "sum", // 目前暂时仅支持sum类型（求和）
                        col: 2 // 需要统计某列的列号
                    },
                    {
                        key: "n2",
                        type: "sum",
                        col: 3
                    }
                ],
                openEmptyValid: true, // 是否开启空行校验，默认开启
                hasDefaultValFileds: ['字段一','字段二'], // 是否存在默认值的字段集合，在getData数据校验空行会综合考虑是否标记单元格红色
                multiColumnSorting: true, // 开启排序
                multiColumnSorting: { // 排序配置
                    initialConfig: [{
                        column: 1,
                        sortOrder: 'asc' // 正序
                    }, {
                        column: 0,
                        sortOrder: 'desc' // 反序
                    }]
                }
            },
            core: Object, // https://handsontable.com/docs/7.4.2/Core.html
            checkBox: {
                // 表头中全选checkBox必须配置
                key: "checkbox", // 复选框字段名
                col: 0 // 复选框行号
            },
        }
    },
    methods: {
        getCore (v) {
            // 获取core
            this.core = v
        },
        handsontableChange(o) {
            // change事件，通用模版
            // getKeyChange, filterKeysChanges方法二选一，个人建议filterKeysChanges方法，第三个参数是否过滤监听合计一行数据变化，默认是true，即过滤
            // row：行号 key：字段名 oldVal：旧值 newVal：新值 changes：单元格数据修改的集合
            // changeCurrentCell 修改当前监听的单元格值
            // filterSummaryRow: 过滤监听合计一行的数据变化，默认是true，即过滤
            // checked：勾选数据集合，复选框触发
            const { getKeyChange, filterKeysChanges, changes = [[]], changeCurrentCell, checked} = o;

            getKeyChange('你需要监听的字段名1', changes, true).map(([row, key, oldVal, newVal]) => {
                console.log(row, key, oldVal, newVal)
            });
            getKeyChange('你需要监听的字段名2', changes, true).map(([row, key, oldVal, newVal]) => {
                console.log(row, key, oldVal, newVal)
            });

            filterKeysChanges({
                filterSummaryRow: true, // 过滤监听合计一行的数据变化，默认是true，即过滤
                changes,
                keys: ['你需要监听的字段名1', '你需要监听的字段名2'],
                callback: ({ row, key, oldVal, newVal, changeCurrentCell }) => {
                    console.log(row, key, oldVal, newVal)
                    // changeCurrentCell[3] = 'maple test'
                }
            })
        },
        handsontableClick(o) {
            console.log(o, '点击事件')
        },
        /**
         * @description getData方法是一个promise，该方法会去遍历table数据，在遍历到每一个item，都会触发一个回调函数，该回调函数会提供两个参数（item,index），并接受一个对象，该对象会被浅合并到当前item。
        */
        getData() {
            this.$refs.handsontableRef.getData((item, index)=>{
                item = {
                    ...item,
                    notAddabled: false, // 是否不添加当前item数据，false即添加，true即不添加
                    maple: index // 基于item合并新属性
                }
                return item
            }).then(({value, valid, columns}) => {
                // valid 校验状态，true即通过
                console.log(value, valid, columns)
            })
        },
        /**
         * @description  单元格双击事件
         */
        cellDblClick({ row, col, $el }) {
            console.log(row, col, $el)
        }
    }
}
</script>

#### 使用说明

1. 关于下拉框，建议使用【title: "下拉框(优化模式，options 属性或者 source 属性，接受一个回调函数，返回数据字典集合)"】这种类型
2. 获取某一个单元格值：this.core.getDataAtCell(row,col)
3. 获取某一行数据：this.core.getDataAtRow(row)
4. 获取某一列数据：this.core.getDataAtCol(col)
5. 折叠行，https://handsontable.com/docs/7.4.2/demo-nested-rows.html
6. 设置某一个单元格的值：this.core.setDataAtCell(row, col, value, '标记')
7. 关于 core 获取，可以通过@getCore 方法，查看上面的示例代码，change 方法和 click 方法也会返回 core 对象
8. 请不要在 change 事件中使用 setTimeout 来达到视图层更新

##### 建议

1. 修改数组，建议使用可以修改原数组的方法，比如：push、splice、unshift、pop 等等
2. 修改对象某属性，先 data 中申明，然后可以使用 Object.assign 进行浅合并，示例：this.testOpts = Object.assign({}, testOpts, this.testNewOpts);
3. 修改单元格值请调用 core 方法中的 setDataAtCell
