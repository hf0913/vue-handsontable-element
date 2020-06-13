# Requirements

1.监听当前单元格并修改当前单元格，存在 bug，对方必须使用 setTimeout

## Install

From npm:

```sh

$ npm install vue-upload-drag -D

```

### Usage

```javascript
import VueUploadDrag from "vue-upload-drag";
Vue.use(VueUploadDrag);
```

```html
<!--your.vue-->
<template>
    <upload-drag v-model="fileList" :config="config" />
</template>
```

#### API

-   `{onChange} Function`
-   `{onProgress} Function`
-   `{onError} Function`
-   `{onSuccess} Function 必须接受，并回调exChangeUrl方法`

##### slot

-   `具名插槽：loading，用于自定义loading，结合config.loading用`
-   `具名插槽：imgBtns，用于自定义imgBtns，结合config.imgBtns用`
-   `具名插槽：liItem，该插槽是在li元素根节点`

###### Arguments:

-   `{config} Object`

```javascript
export default {
    name: "uploadDrag",
    props: {
        value: {
            required: true,
            type: Array
        },
        config: {
            required: false,
            type: Object,
            default: _ => ({
                accept: "image/*", // 文件上传类型
                action: "https://jsonplaceholder.typicode.com/posts/", // 上传域名
                data: {}, // 请求参数
                limit: 9, // 支持最大上传文件数
                multiple: true, // 支持多个文件选择
                imgUrl: "url", // 图片路径字段
                deleteBtnName: "删除", // 删除按钮名
                viewBtnName: "查看", // 查看按钮名
                dragabled: true, // 是否拖拽
                imgBtns: ["删除", "查看"], // 图片按钮显示集合，另可以通过具名插槽名imgBtns自定义
                loading: true, // 图片加载loading是否开启，另可以通过具名插槽名Loading自定义
                isHttpRequest: false, // 是否自定义请求
                uploadField: "file" // 上传默认字段
            })
        }
    }
};
```

###### Example

```html
<template>
    <upload-drag
        v-model="fileList"
        :config="config"
        @onChange="onChange"
        @onProgress="onProgress"
        @picsExceed="picsExceed"
        @onError="onError"
        @onSuccess="onSuccess"
    />
</template>
```

```javascript
import VueUploadDrag from "vue-upload-drag";
Vue.use(VueUploadDrag);

export default {
    data() {
        return {
            fileList: [
                {
                    name: "food.jpg",
                    url: "https://www.baidu.com/img/bd_logo1.png",
                    id: 11
                }
            ],
            config: {
                limit: 1
            }
        };
    },
    methods: {
        onChange(f) {
            // 图片选择改变，且config中isHttpRequest为true
            console.log(f);
        },
        onProgress({ e, file, uid }) {
            // 上传中
            console.log(e, file, uid);
        },
        onError({ err, file, uid }) {
            // 上传失败,会自动把图片移除，建议给提示
            alert("图片上传失败");
            console.log(err, file, uid);
        },
        picsExceed({ uploadBefore, selectCount, files, value }) {
            // 同时选择多张图片超过限制数会被触发
            alert("选择的图片数量超过最大数");
            uploadBefore(files, value); // 过滤多余的图片继续上传
        },
        onSuccess({ res, file, _uid, exChangeUrl, handleRemove }) {
            // 上传成功，请必须接受onSuccess方法
            console.log(res, file, _uid, exChangeUrl, handleRemove);
            // 仅是举例而已哦
            if (res.code === "0") {
                // 根据后端状态判断
                const { url } = res.data;
                exChangeUrl(_uid, url); // url为后端返回的图片链接值，uid是onSuccess传入的
            } else {
                alert("图片上传失败");
                handleRemove(_uid); // 删除图片
            }
        }
    }
};
```
