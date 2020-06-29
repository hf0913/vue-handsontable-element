import MapleHandsontable from "./maple";
import "./maple.css";

MapleHandsontable.install = vue => {
    vue.component(MapleHandsontable.name, MapleHandsontable);
};

export { MapleHandsontable };
