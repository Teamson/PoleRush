import WxApi from "../../Libs/WxApi"
import Utility from "../../Mod/Utility"
import AdMgr from "../../Mod/AdMgr"
import JJMgr from "../Common/JJMgr"

export default class ProgramUI extends Laya.Scene {
    constructor() {
        super()
    }

    continueBtn: Laya.Image
    backBtn: Laya.Image

    myList: Laya.List = null

    navData: any[] = []
    scrollLeft: boolean = false

    preIndex: number = -1
    randArr: number[] = []

    fromDrawUI: boolean = false
    fromFullUI: boolean = false

    closeCallbackFun: Function = null

    onOpened(param: any) {
        if (param && param.closeCallbackFun) {
            this.closeCallbackFun = param.closeCallbackFun
        }

        this.backBtn.on(Laya.Event.CLICK, this, this.backCB)
        this.continueBtn.on(Laya.Event.CLICK, this, this.randomNav)
        if (JJMgr.instance.dataConfig.front_all_screen_auto) {
            this.randomNav(true)
        } else {
            WxApi.bannerWuChu2()
        }
        this.initList()
        AdMgr.instance.hideBanner()
    }

    onClosed() {
        Laya.timer.clearAll(this)
    }

    randomNav(auto?: boolean) {
        let id = Math.floor(Math.random() * 6)
        this.navCB(id, auto)
    }

    backCB() {
        if (this.closeCallbackFun) {
            this.closeCallbackFun()
        }
        this.close()
    }

    //初始化list
    initList() {
        let listData: any[] = [].concat(JJMgr.instance.navDataArr)
        this.navData = listData
        for (let i = 0; i < 10; i++) {
            this.randArr.push(i)
        }
        this.randArr = Utility.shuffleArr(this.randArr)
        this.randArr.splice(6, this.navData.length - 4)

        this.myList.vScrollBarSkin = '';
        this.myList.repeatX = 1;
        this.myList.repeatY = listData.length;
        this.myList.array = listData;
        this.myList.height = 1100 * Laya.stage.displayHeight / 1334
        this.myList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
        this.myList.mouseHandler = new Laya.Handler(this, this.mouseHandler);

        Laya.timer.once(1000, this, this.scrollLoop)
    }
    mouseHandler(e, index) {
        Laya.timer.clear(this, this.scrollLoop)
        Laya.timer.once(1000, this, this.scrollLoop)
    }
    scrollLoop() {
        let num: number = Math.floor(this.myList.startIndex)
        if (!this.scrollLeft) {
            num++
            if (this.preIndex == Math.floor(this.myList.startIndex) && Math.floor(this.myList.startIndex) > 0) {
                num--
                this.scrollLeft = !this.scrollLeft
            }
        } else {
            num--
            if (num < 0) {
                this.scrollLeft = !this.scrollLeft
            }
        }
        this.preIndex = Math.floor(this.myList.startIndex)
        this.myList.tweenTo(num, 1000, Laya.Handler.create(this, this.scrollLoop))
    }
    onListRender(cell, index) {
        if (index >= this.myList.array.length) {
            return;
        }
        var item = cell.getChildByName('item')
        var icon = item.getChildByName('icon')
        var name = item.getChildByName('name')
        var star = item.getChildByName('star')
        var tips = item.getChildByName('tips')
        tips.text = (Math.floor(Math.random() * 999999 + 100000)).toString() + '人正在玩'
        star.visible = false

        icon.skin = this.navData[index].icon
        name.text = this.navData[index].title
        item.off(Laya.Event.CLICK, this, this.navCB, [index])
        item.on(Laya.Event.CLICK, this, this.navCB, [index])

        for (let i = 0; i < this.randArr.length; i++) {
            if (this.randArr[i] == index) {
                star.visible = true
                break
            }
        }

    }
    navCB(index, auto?: boolean) {
        console.log('click id:', index)
        WxApi.aldEvent('游戏历史列表全屏幕导出页-总点击数')
        JJMgr.instance.NavigateApp(index, () => {
            if (auto === true) {
                WxApi.bannerWuChu2()
            }
        }, () => {
            WxApi.aldEvent('游戏历史列表全屏幕导出页-总成功跳转')
            if (auto === true) {
                WxApi.bannerWuChu2()
            }
        })
    }
}