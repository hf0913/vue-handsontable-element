import MapleHandsontable from "./maple";
import MapleDatePicker from "./components/MapleDatePicker.vue";
import MapleCascader from "./components/MapleCascader.vue";
import utils from "./utils";
import "./maple.css";
import "handsontable/languages/zh-CN";
import "handsontable/dist/handsontable.full.css";
import "element-ui/lib/theme-chalk/index.css";
// const viewsFiles = require.context('../views/',true,/\.vue/)
const components = [MapleHandsontable, MapleDatePicker, MapleCascader];

export { MapleHandsontable, MapleDatePicker, MapleCascader, utils };

export default function install(Vue) {
    components.map(component => {
        Vue.component(component.name, component);
    });
}
