import JJUtils from "../Common/JJUtils"
import JJMgr, { SceneDir } from "../Common/JJMgr"
import WxApi from "../../Libs/WxApi"
import AdMgr from "../../Mod/AdMgr"

export default class DrawUI extends Laya.Scene {
    constructor() {
        super()
    }

    rootNode: Laya.Sprite = this['rootNode']
    closeBtn: Laya.Image = this['closeBtn']
    navList: Laya.List = this['navList']

    navData: any[] = []
    scrollDir: number = 1
    preIndex: number = -1
    closeCallbackFun: Function = null

    autoTime: number = 0

    onOpened(param?: any) {
        if (param && param.closeCallbackFun) {
            this.closeCallbackFun = param.closeCallbackFun
        }
        if (param && param.posY) {
            this.rootNode.y = param.posY
        }
        if (param && param.fixY == true) {
            JJUtils.fixNodeY(this.rootNode)
        }
        if (param && param.autoTime) {
            this.autoTime = param.autoTime
        }
        this._init()
    }

    onClosed() {
        Laya.timer.clearAll(this)
        this.closeCallbackFun && this.closeCallbackFun()
    }

    autoClose() {
        Laya.timer.once(this.autoTime, this, this.closeCB)
    }
    clearAutoClose() {
        Laya.timer.clear(this, this.closeCB)
    }

    _init() {
        this.closeBtn.on(Laya.Event.CLICK, this, this.closeCB)
        JJUtils.tMove(this.rootNode, 0, this.rootNode.y, 200, () => {
            Laya.timer.once(1000, this, () => {
                Laya.timer.frameLoop(1, this, this.scrollLoop)
            })
        })
        this.initList()
        if (this.autoTime != 0)
            this.autoClose()
    }

    //初始化list
    initList() {
        this.navData = [].concat(JJMgr.instance.navDataArr)
        this.navList.vScrollBarSkin = '';
        this.navList.repeatX = 3;
        this.navList.repeatY = Math.floor(this.navData.length / 3);
        this.navList.array = this.navData;
        this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
        this.navList.mouseHandler = new Laya.Handler(this, this.mouseHandler);

        // Laya.timer.once(1000, this, () => {
        //     Laya.timer.frameLoop(1, this, this.scrollLoop)
        // })
    }
    mouseHandler(e, index) {
        this.clearAutoClose()
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

        icon.skin = this.navData[index].icon
        name.text = JJMgr.instance.getTitle(index)
        item.off(Laya.Event.CLICK, this, this.navCB, [index])
        item.on(Laya.Event.CLICK, this, this.navCB, [index])
    }
    navCB(index: number) {
        console.log('click id:', index)
        WxApi.aldEvent('抽屉弹窗页面-总点击数')
        JJMgr.instance.NavigateApp(index, () => {
            JJMgr.instance.openScene(SceneDir.SCENE_RECOMMENDUI, false, {
                closeCallbackFun: () => {
                    Laya.timer.once(100, this, () => { AdMgr.instance.showBanner() })
                }
            })
        }, () => {
            WxApi.aldEvent('抽屉弹窗页面-总成功跳转')
        })
    }

    closeCB() {
        JJUtils.tMove(this.rootNode, -600, this.rootNode.y, 200, () => {
            this.close()
        })
    }
}