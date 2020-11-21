import JJMgr, { SceneDir } from "../Common/JJMgr"
import JJUtils from "../Common/JJUtils"
import WxApi from "../../Libs/WxApi"
import AdMgr from "../../Mod/AdMgr"
import PlayerDataMgr from "../../Libs/PlayerDataMgr"

export default class RecommendUI extends Laya.Scene {
    constructor() {
        super()
    }
    backBtn: Laya.Image = this['backBtn']
    navList: Laya.List = this['navList']
    continueBtn: Laya.Image

    navData: any[] = []
    scrollDir: number = 1
    preIndex: number = -1

    closeCallbackFun: Function = null

    fingerNum: number = 0

    btnStartY: number = 0
    btnEndY: number = 0

    onOpened(param?: any) {
        if (param && param.closeCallbackFun) {
            this.closeCallbackFun = param.closeCallbackFun
        }
        this._init()

        this.btnEndY = this.navList.y + this.navList.height - this.continueBtn.height / 2 - 20
        this.btnStartY = Laya.stage.displayHeight - this.continueBtn.height
        AdMgr.instance.hideBanner()
        this.continueBtn.visible = PlayerDataMgr.getPlayerData().grade >= JJMgr.instance.dataConfig.front_continuegame_start_level &&
            WxApi.isValidBanner()

        if (JJMgr.instance.dataConfig.front_remen_screen_auto) {
            this.continueBtn.y = WxApi.isValidBanner() ? this.btnStartY : this.btnEndY
            this.continueBtnCB(true)
        } else {
            WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true)
        }
        //WxApi.bannerWuChu2()
    }

    onClosed() {
        Laya.timer.clearAll(this)
        clearTimeout(WxApi.bannerTO2)
        AdMgr.instance.hideBanner()
    }

    _init() {
        this.backBtn.on(Laya.Event.CLICK, this, this.closeCB)
        this.continueBtn.on(Laya.Event.CLICK, this, this.continueBtnCB)
        this.initList()
    }

    //初始化list
    initList() {
        this.navData = [].concat(JJMgr.instance.navDataArr)
        this.navList.vScrollBarSkin = '';
        this.navList.repeatX = 2;
        this.navList.repeatY = Math.floor(this.navData.length / 2);
        this.navList.array = this.navData;
        this.navList.height = Laya.stage.displayHeight - this.navList.y - 260
        this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
        this.navList.mouseHandler = new Laya.Handler(this, this.mouseHandler);

        this.fingerNum = Math.floor(Math.random() * 6)

        Laya.timer.once(1000, this, () => {
            Laya.timer.frameLoop(1, this, this.scrollLoop)
        })
    }
    mouseHandler(e, index) {
        this.againScroll()
    }
    againScroll() {
        Laya.timer.clear(this, this.scrollLoop)
        Laya.timer.once(1000, this, () => {
            Laya.timer.frameLoop(1, this, this.scrollLoop)
        })
    }
    scrollLoop() {
        let scrollBar: Laya.ScrollBar = this.navList.scrollBar
        scrollBar.value += this.scrollDir
        if (scrollBar.value >= scrollBar.max || scrollBar.value <= 0) {
            this.scrollDir = -this.scrollDir
            this.againScroll()
        }
    }
    onListRender(cell, index) {
        if (index >= this.navList.array.length) {
            return;
        }
        var item = cell.getChildByName('item')
        var icon = item.getChildByName('icon')
        var name = item.getChildByName('name')
        var finger = item.getChildByName('navFinger')

        icon.skin = this.navData[index].icon
        name.text = JJMgr.instance.getTitle(index)
        item.off(Laya.Event.CLICK, this, this.navCB, [index])
        item.on(Laya.Event.CLICK, this, this.navCB, [index])

        finger.visible = index == this.fingerNum
    }
    navCB(index: number, auto?: boolean) {
        console.log('click id:', index)
        WxApi.aldEvent('热门推荐全屏幕导出页-总点击数')
        JJMgr.instance.NavigateApp(index, () => {
            if (auto === true) {
                WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true)
            }
        }, () => {
            WxApi.aldEvent('热门推荐全屏幕导出页-总成功跳转')
            if (auto === true) {
                WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true)
            }
        })
    }

    continueBtnCB(auto?: boolean) {
        let id = Math.floor(Math.random() * 6)
        this.navCB(id, auto)
    }
    closeCB() {
        if (this.closeCallbackFun) {
            this.closeCallbackFun()
        }
        this.close()
    }
}