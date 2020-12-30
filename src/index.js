import MapleHandsontable from "./maple";
import MapleDatePicker from "./components/MapleDatePicker.vue";
import MapleCascader from "./components/MapleCascader.vue";
import utils from "./utils";
import "./maple.css";
import "custom-handsontable/languages/zh-CN";
import "custom-handsontable/dist/custom-handsontable.full.css";
import "element-ui/lib/theme-chalk/index.css";
import ElSelect from "./components/ElSelect";
import ElOption from "./components/ElOption";

const components = [MapleHandsontable, MapleDatePicker, MapleCascader];

export { MapleHandsontable, MapleDatePicker, MapleCascader, utils ,ElSelect, ElOption};

export default function install(Vue) {
    components.map(component => {
        Vue.component(component.name, component);
    });
}
