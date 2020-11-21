import JJMgr from "../JJExport/Common/JJMgr"
import PlayerDataMgr from "../Libs/PlayerDataMgr"
import PrefabManager, { PrefabItem } from "../Libs/PrefabManager"
import WxApi from "../Libs/WxApi"
import AdMgr from "../Mod/AdMgr"
import Utility from "../Mod/Utility"

export default class MadUI extends Laya.Scene {
    constructor() {
        super()
    }
    bar: Laya.ProgressBar
    clickBtn: Laya.Image
    boxAni: Laya.Animation

    closeCallback: Function = null

    hadShowBanner: boolean = false
    maxPer: number = 100

    onOpened(param?: any) {
        if (param != null && param != undefined) {
            this.closeCallback = param.closeCallback
        }

        this.clickBtn.on(Laya.Event.MOUSE_DOWN, this, this.clickBtnCBDown)
        this.clickBtn.on(Laya.Event.MOUSE_UP, this, this.clickBtnCBUp)
        this.maxPer = Utility.GetRandom(JJMgr.instance.dataConfig.front_box_progress[0], JJMgr.instance.dataConfig.front_box_progress[1])

        AdMgr.instance.hideBanner()

        Laya.timer.frameLoop(1, this, this.decBar)

        WxApi.isKillBossUI = true
        WxApi.WxOffHide(WxApi.killbossCallback)
        WxApi.killbossCallback = () => {
            if (WxApi.isKillBossUI) {
                Laya.timer.once(100, this, () => { Laya.Scene.close('MyScenes/MadUI.scene') })
            }
        }
        WxApi.WxOnHide(WxApi.killbossCallback)
    }

    onClosed() {
        AdMgr.instance.hideBanner()
        Laya.timer.clearAll(this)
        if (this.closeCallback) {
            Laya.timer.once(100, this, () => {
                this.closeCallback()
            })
        }
        WxApi.isKillBossUI = false
    }

    decBar() {
        this.bar.value -= 0.06 / 60
        if (this.bar.value < 0) {
            this.bar.value = 0
        }
    }

    clickBtnCBDown() {
        this.boxAni.play(0,false)
        this.bar.value += 0.2
        if (this.bar.value > 1) {
            this.bar.value = 1
        }

        if (!this.hadShowBanner) {
            if (this.bar.value * 100 >= this.maxPer) {
                AdMgr.instance.showBanner(true)
                Laya.timer.once(5000, this, () => {
                    this.closeBtnCB()
                })
                this.hadShowBanner = true
                Laya.timer.clear(this, this.decBar)
            }
        }
        this.clickBtn.scaleX = 1.1
        this.clickBtn.scaleY = 1.1
    }
    clickBtnCBUp() {
        this.clickBtn.scaleX = 1
        this.clickBtn.scaleY = 1
    }

    closeBtnCB() {
        this.close()
    }
}