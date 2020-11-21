import JJUtils from "../Common/JJUtils"
import JJMgr, { SceneDir } from "../Common/JJMgr"
import WxApi from "../../Libs/WxApi";

export default class WeChatUI extends Laya.Scene {
    constructor() {
        super()
    }

    static currentPlayerNames: string[];
    static currentGames: number[];

    currentName: string;
    playerNames: string[] = ["有个小可爱", "大妈杀手", "神秘靓仔", "超级飞侠乐迪", "几一鸡", "爱喝可乐", "卖葫芦的葫芦娃", "多啦ABCD梦", "坏女孩", "沙雕网友"];

    bg: Laya.Button;
    lbName: Laya.Label;
    lbGame: Laya.Label;


    onAwake() {
        this.height = Laya.stage.height;

        if (!WeChatUI.currentPlayerNames || WeChatUI.currentPlayerNames.length == 0) {
            WeChatUI.currentPlayerNames = [].concat(this.playerNames);
        }

        if (!WeChatUI.currentGames || WeChatUI.currentGames.length == 0) {
            WeChatUI.currentGames = [0, 1, 2, 3, 4, 5]
        }

        this.currentName = WeChatUI.currentPlayerNames.shift();
    }

    onOpened() {
        this.lbName.text = this.currentName;

        this.bg.top = -150;
        Laya.Tween.to(this.bg, { top: 10 }, 500);

        var index = WeChatUI.currentGames.shift();
        this.bg.on(Laya.Event.CLICK, this, this.navCB, [index])

        this.lbGame.text = "邀请你一起玩 " + JJMgr.instance.getTitle(index);

        WxApi.aldEvent("好友消息提示横幅出现次数");
    }

    onClosed() {
        Laya.timer.clearAll(this)
    }

    navCB(index: number) {
        JJMgr.instance.closeScene(SceneDir.SCENE_WECHATUI);

        WxApi.aldEvent("好友消息提示横幅-总点击数");
        console.log('click id:', index)
        JJMgr.instance.NavigateApp(index,
            () => {

            }, () => {
                WxApi.aldEvent("好友消息提示横幅-总成功跳转数");
            }
        )
    }
}