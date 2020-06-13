import "./assets/common.css";
import MapleHandsontable from "./maple";
import ElementUI from "element-ui";
import MapleStore from "./store";
import "element-ui/lib/theme-chalk/index.css";
import "handsontable/dist/handsontable.full.css";

MapleHandsontable.install = vue => {
    vue.use(ElementUI);
    vue.component(MapleHandsontable.name, MapleHandsontable);
};

export { MapleHandsontable, MapleStore };
