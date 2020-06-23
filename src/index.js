import MapleHandsontable from "./maple";

MapleHandsontable.install = vue => {
    vue.component(MapleHandsontable.name, MapleHandsontable);
};

export { MapleHandsontable };
