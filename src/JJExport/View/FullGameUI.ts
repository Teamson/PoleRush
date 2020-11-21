import JJMgr, { SceneDir } from "../Common/JJMgr"
import JJUtils from "../Common/JJUtils"
import WxApi from "../../Libs/WxApi"
import AdMgr from "../../Mod/AdMgr"
import PlayerDataMgr from "../../Libs/PlayerDataMgr"

export default class FullGameUI extends Laya.Scene {
    constructor() {
        super()
    }

    exitBtn: Laya.Image = this['exitBtn']
    continueBtn: Laya.Image = this['continueBtn']
    navList: Laya.List = this['navList']

    navData: any[] = []
    scrollDir: number = 1
    preIndex: number = -1

    hotArr: number[] = []

    continueCallbackFun: Function = null

    curGrade: number = -1

    btnStartY: number = 0
    btnEndY: number = 0

    onOpened(param?: any) {
        if (param && param.continueCallbackFun) {
            this.continueCallbackFun = param.continueCallbackFun
        }
        if (param && param.grade) {
            this.curGrade = param.grade
        }
        this._init()

        this.btnEndY = this.navList.y + this.navList.height - this.continueBtn.height / 2 - 20
        this.btnStartY = Laya.stage.displayHeight - this.continueBtn.height

        AdMgr.instance.hideBanner()
        this.exitBtn.visible = PlayerDataMgr.getPlayerData().grade >= JJMgr.instance.dataConfig.front_randompaly_start_level &&
            WxApi.isValidBanner()
        if (JJMgr.instance.dataConfig.front_all_screen_auto) {
            this.continueBtn.y = WxApi.isValidBanner() ? this.btnStartY : this.btnEndY
            this.randomCB(true)
        } else {
            WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true)
        }

        //WxApi.bannerWuChu2()
    }

    onClosed() {
        Laya.timer.once(100, this, () => {
            this.continueCallbackFun && this.continueCallbackFun()
            Laya.timer.clearAll(this)
        })
        clearTimeout(WxApi.bannerTO2)
        AdMgr.instance.hideBanner()
    }

    _init() {
        this.exitBtn.on(Laya.Event.CLICK, this, this.randomCB)
        this.continueBtn.on(Laya.Event.CLICK, this, this.continueCB)
        this.initList()
    }

    getHotRandArr() {
        let arr: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8]
        arr = JJUtils.shuffleArr(arr)
        this.hotArr = arr.slice(0, 3)
    }

    //初始化list
    initList() {
        this.navData = [].concat(JJMgr.instance.navDataArr)
        this.navList.vScrollBarSkin = '';
        this.navList.repeatX = 3;
        this.navList.repeatY = Math.floor(this.navData.length / 3);
        this.navList.array = this.navData;
        this.navList.height = Laya.stage.displayHeight - this.navList.y - 260
        this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
        this.navList.mouseHandler = new Laya.Handler(this, this.mouseHandler);

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
        var hot = item.getChildByName('hot')
        var color = item.getChildByName('color')

        color.skin = 'JJExportRes/' + (Math.floor(index % 9) + 1) + '.png'
        icon.skin = this.navData[index].icon
        name.text = JJMgr.instance.getTitle(index)
        hot.visible = this.hotArr.indexOf(index) != -1
        item.off(Laya.Event.CLICK, this, this.navCB, [index])
        item.on(Laya.Event.CLICK, this, this.navCB, [index])
    }
    navCB(index: number, auto?: boolean) {
        console.log('click id:', index)
        WxApi.aldEvent('网红爆款游戏全屏幕导出页-总点击数')
        JJMgr.instance.NavigateApp(index, () => {
            if (auto === true) {
                WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true)
            }
        }, () => {
            WxApi.aldEvent('网红爆款游戏全屏幕导出页-总成功跳转数')
            if (auto === true) {
                WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true)
            }
        })
    }

    randomCB(auto?: boolean) {
        let id = Math.floor(Math.random() * 6)
        this.navCB(id, auto)
    }

    continueCB() {
        this.close()
    }
}