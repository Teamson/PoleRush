import GameLogic from "../Crl/GameLogic"
import JJMgr, { SceneDir } from "../JJExport/Common/JJMgr"
import PlayerDataMgr from "../Libs/PlayerDataMgr"
import WxApi from "../Libs/WxApi"
import AdMgr from "../Mod/AdMgr"
import SoundMgr from "../Mod/SoundMgr"
import Utility from "../Mod/Utility"

export default class GameUI extends Laya.Scene {
    constructor() {
        super()
    }
    public static Share: GameUI

    touchBtn: Laya.Image
    gradeNum: Laya.Label
    coinNum: Laya.Label
    curGrade: Laya.Label
    gBar: Laya.ProgressBar

    touchStartX: number = 0
    touchPreX: number = 0
    touching: boolean = false

    navNode: Laya.Image

    onOpened() {
        GameUI.Share = this
        GameLogic.Share.isStartGame = true
        this.gradeNum.text = PlayerDataMgr.getPlayerData().grade.toString()
        this.curGrade.text = PlayerDataMgr.getPlayerData().grade.toString()
        this.touchBtn.on(Laya.Event.MOUSE_DOWN, this, this.touchBtnDownCB)
        this.touchBtn.on(Laya.Event.MOUSE_MOVE, this, this.touchBtnMoveCB)
        this.touchBtn.on(Laya.Event.MOUSE_UP, this, this.touchBtnUpCB)
        this.touchBtn.on(Laya.Event.MOUSE_OUT, this, this.touchBtnUpCB)

        Laya.timer.frameLoop(1, this, this.updateCB)

        // this.navNode.visible = JJMgr.instance.dataConfig.front_receive_switch && WxApi.getIsExportValid()
        // if (this.navNode.visible) {
        //     this.initNav()
        //     Laya.timer.once(1500, this, () => {
        //         Utility.tMove2D(this.navNode, 650, 310, 1000, () => {
        //             Utility.rotateLoop(this.navNode, 5, 300)
        //             Laya.timer.loop(5000, this, this.initNav)
        //         })
        //     })
        // }

        // if (JJMgr.instance.dataConfig.front_main_banner_switch && WxApi.isValidBanner()) {
        //     AdMgr.instance.showBanner()
        // } else {
        //     AdMgr.instance.hideBanner()
        // }
    }

    onClosed() {
        Laya.timer.clearAll(this)
    }

    touchBtnDownCB(event: Laya.Event) {
        if (GameLogic.Share.isGameOver || !GameLogic.Share.isStartGame) return

        this.touching = true
        this.touchStartX = event.stageX
        this.touchPreX = event.stageX
    }

    touchBtnMoveCB(event: Laya.Event) {
        if (!this.touching || GameLogic.Share.isGameOver || !GameLogic.Share.isStartGame) return
        let sx = event.stageX
        let dtx = this.touchPreX - sx
        let dtStart = this.touchStartX - sx
        GameLogic.Share._playerCrl.moveX(dtx / 20)
        this.touchPreX = sx
    }

    touchBtnUpCB(event: Laya.Event) {
        if (!this.touching || GameLogic.Share.isGameOver || !GameLogic.Share.isStartGame) return
        this.touching = false
    }

    updateCB() {
        this.gBar.value = GameLogic.Share._player.transform.position.z / GameLogic.Share.totalDistance
        this.coinNum.text = PlayerDataMgr.getPlayerData().coin.toString()
    }

    fixJewelIcon(jewel: Laya.Sprite3D) {
        let op: Laya.Vector4 = new Laya.Vector4(0, 0, 0)
        let hPos = jewel.transform.position.clone()
        hPos.y += 1
        GameLogic.Share._camera.viewport.project(hPos, GameLogic.Share._camera.projectionViewMatrix, op)

        let j = new Laya.Image('startUI/zy_zs_1.png')
        j.anchorX = 0.5
        j.anchorY = 0.5
        j.pos(op.x / Laya.stage.clientScaleX, op.y / Laya.stage.clientScaleY)
        this.addChild(j)
        Utility.tMove2D(j, 60, 80, 1000, () => { j.removeSelf() })
    }

    fixAddScore() {
        let op: Laya.Vector4 = new Laya.Vector4(0, 0, 0)
        let hPos = GameLogic.Share._player.transform.position.clone()
        hPos.y += 1
        hPos.z += 2
        GameLogic.Share._camera.viewport.project(hPos, GameLogic.Share._camera.projectionViewMatrix, op)

        let j = new Laya.Image('gameUI/yxz_jy_1.png')
        j.anchorX = 0.5
        j.anchorY = 0.5
        j.pos(op.x / Laya.stage.clientScaleX, op.y / Laya.stage.clientScaleY)
        this.addChild(j)
        Utility.tMove2D(j, j.x, j.y - 50, 500, () => { j.removeSelf() })
    }

    initNav() {
        let id = Math.floor(Math.random() * JJMgr.instance.navDataArr.length)
        let icon = this.navNode.getChildByName('icon') as Laya.Image
        icon.skin = JJMgr.instance.navDataArr[id].icon
        this.navNode.off(Laya.Event.CLICK, this, this.navCB)
        this.navNode.on(Laya.Event.CLICK, this, this.navCB, [id])
    }

    navCB(id) {
        console.log('click id:', id)
        GameLogic.Share.isPause = true
        WxApi.aldEvent('游戏内导出位—总点击数')
        JJMgr.instance.NavigateApp(id, () => {
            JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI, false, {
                continueCallbackFun: () => {
                    if (JJMgr.instance.dataConfig.front_main_banner_switch && WxApi.isValidBanner()) {
                        AdMgr.instance.showBanner()
                    }
                    GameLogic.Share.isPause = false
                }
            })
        }, () => {
            WxApi.aldEvent('游戏内导出位-总成功跳转数')
            GameLogic.Share.isPause = false
        })
    }
}