import GameLogic from "../Crl/GameLogic"
import JJMgr, { SceneDir } from "../JJExport/Common/JJMgr"
import PlayerDataMgr from "../Libs/PlayerDataMgr"
import WxApi from "../Libs/WxApi"
import AdMgr from "../Mod/AdMgr"

export default class FinishUI extends Laya.Scene {
    constructor() {
        super()
    }

    winTitle: Laya.Image
    loseTitle: Laya.Image
    trippleBtn: Laya.Image
    skipBtn: Laya.Image
    normalBtn: Laya.Image
    restartBtn: Laya.Image
    bounesNum: Laya.FontClip
    coinNum: Laya.FontClip

    onOpened(param) {
        this.coinNum.value = PlayerDataMgr.getPlayerData().coin.toString()
        this.winTitle.visible = GameLogic.Share.isWin
        this.loseTitle.visible = !GameLogic.Share.isWin
        this.trippleBtn.visible = GameLogic.Share.isWin
        this.skipBtn.visible = !GameLogic.Share.isWin
        this.normalBtn.visible = GameLogic.Share.isWin
        this.restartBtn.visible = !GameLogic.Share.isWin

        this.trippleBtn.on(Laya.Event.CLICK, this, this.trippleBtnCB)
        this.skipBtn.on(Laya.Event.CLICK, this, this.skipBtnCB)
        this.normalBtn.on(Laya.Event.CLICK, this, this.normalBtnCB)
        this.restartBtn.on(Laya.Event.CLICK, this, this.restartBtnCB)
    }

    onClosed() {

    }

    trippleBtnCB() {

    }

    skipBtnCB() {

    }

    normalBtnCB() {

    }

    restartBtnCB() {

    }
}