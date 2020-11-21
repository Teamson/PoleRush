import GameLogic from "../Crl/GameLogic"
import JJMgr, { SceneDir } from "../JJExport/Common/JJMgr"
import PlayerDataMgr from "../Libs/PlayerDataMgr"
import WxApi from "../Libs/WxApi"
import AdMgr from "../Mod/AdMgr"
import SoundMgr from "../Mod/SoundMgr"
import Utility from "../Mod/Utility"

export default class StartUI extends Laya.Scene {
    constructor() {
        super()
    }

    gradeNum: Laya.Label
    coinNum: Laya.Label
    startBtn: Laya.Image

    drawBtn: Laya.Image
    moreGameBtn: Laya.Image

    onAwake() {
        //SoundMgr.instance.playMusic('Bgm.mp3')
    }

    onOpened() {
        this.gradeNum.text = PlayerDataMgr.getPlayerData().grade.toString()
        this.startBtn.on(Laya.Event.MOUSE_UP, this, this.startBtnCB)
        Laya.timer.frameLoop(1, this, this.updateCB)

        // this.drawBtn.on(Laya.Event.CLICK, this, this.drawBtnCB)
        // this.moreGameBtn.on(Laya.Event.CLICK, this, this.moreGameBtnCB)

        // this.moreGameBtn.visible = WxApi.getIsExportValid()
        // this.moreGameBtn.visible = WxApi.getIsExportValid()

        // if (!WxApi.hadShowFriendUI) {
        //     WxApi.hadShowFriendUI = true
        //     JJMgr.instance.openScene(SceneDir.SCENE_FRIENDGAME, false, {
        //         closeCallbackFun: () => {
        //             JJMgr.instance.openScene(SceneDir.SCENE_RECOMMENDUI, false, {
        //                 closeCallbackFun: () => {
        //                     Laya.timer.once(100, this, () => {
        //                         AdMgr.instance.showBanner()
        //                     })
        //                 }
        //             })
        //         }
        //     })
        // } else {
        //     JJMgr.instance.openScene(SceneDir.SCENE_FRIENDGAME, false, {
        //         closeCallbackFun: () => {
        //             AdMgr.instance.showBanner()
        //         }
        //     })
        // }

        //JJMgr.instance.openScene(SceneDir.SCENE_STARTNAVUI, false)
    }


    onClosed() {
        Laya.timer.clearAll(this)
    }

    hadStart: boolean = false
    startBtnCB() {
        if (this.hadStart) return
        this.hadStart = true
        GameLogic.Share.gameStart()
        // let cb = () => {
        //     if (!AdMgr.instance.isBannerError && WxApi.isValidBanner() && JJMgr.instance.dataConfig.front_box_switch) {
        //         Laya.Scene.open('MyScenes/MadUI.scene', true, {
        //             closeCallback: () => {
        //                 if (JJMgr.instance.dataConfig.front_all_screen_page) {
        //                     JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI, true, {
        //                         continueCallbackFun: () => {
        //                             GameLogic.Share.gameStart()
        //                         }
        //                     })
        //                 } else {
        //                     GameLogic.Share.gameStart()
        //                 }
        //             }
        //         })
        //     } else {
        //         GameLogic.Share.gameStart()
        //     }
        // }

        // if (!WxApi.firstStartGame && JJMgr.instance.dataConfig.front_start_game_switch && !AdMgr.instance.videoIsError && WxApi.isValidBanner()) {
        //     WxApi.firstStartGame = true
        //     AdMgr.instance.adCloseCallback = cb
        //     AdMgr.instance.showVideo(() => { })
        // } else {
        //     cb()
        // }
    }

    moreGameBtnCB() {
        AdMgr.instance.hideBanner()
        JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI, false, {
            continueCallbackFun: () => {
                JJMgr.instance.openScene(SceneDir.SCENE_DRAWUI, false, { autoTime: 1500 })
                AdMgr.instance.showBanner()
            }
        })
    }

    drawBtnCB() {
        JJMgr.instance.openScene(SceneDir.SCENE_DRAWUI)
        WxApi.aldEvent('点击抽屉按钮人数')
    }

    updateCB() {
        this.coinNum.text = PlayerDataMgr.getPlayerData().coin.toString()
    }
}