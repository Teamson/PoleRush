import JJMgr, { SceneDir } from "../Common/JJMgr"
import JJUtils from "../Common/JJUtils"
import AdMgr from "../../Mod/AdMgr"
import WxApi from "../../Libs/WxApi"

const ROOTNODE_POSY: number = 550
export default class FriendGameUI extends Laya.Scene {
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

    onOpened(param?: any) {
        if (param && param.closeCallbackFun) {
            this.closeCallbackFun = param.closeCallbackFun
        }
        this._init()

    }

    onClosed() {
        clearTimeout(WxApi.bannerTO2)
        AdMgr.instance.hideBanner()
        AdMgr.instance.showBanner()
        Laya.timer.clearAll(this)
        this.closeCallbackFun && this.closeCallbackFun()
    }

    _init() {
        this.rootNode.y = ROOTNODE_POSY
        this.rootNode.y = this.rootNode.y * Laya.stage.displayHeight / Laya.stage.designHeight
        this.closeBtn.on(Laya.Event.CLICK, this, this.closeCB)
        AdMgr.instance.hideBanner()
        if (WxApi.isValidBanner())
            WxApi.fixBtnTouchPos(this.closeBtn, -100, -300, this, null, true)
        else {
            Laya.timer.once(100, this, () => {
                AdMgr.instance.showBanner()
            })
        }
        this.initList()
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

        icon.skin = this.navData[index].icon
        name.text = JJMgr.instance.getTitle(index)
        item.off(Laya.Event.CLICK, this, this.navCB, [index])
        item.on(Laya.Event.CLICK, this, this.navCB, [index])
    }
    navCB(index: number) {
        console.log('click id:', index)
        WxApi.aldEvent('好友都在玩的爆款游戏弹窗-总点击数')
        JJMgr.instance.NavigateApp(index, () => {
            JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI, false, {
                continueCallbackFun: () => {
                    AdMgr.instance.showBanner()
                }
            })
        }, () => {
            WxApi.aldEvent('好友都在玩的爆款游戏弹窗-总成功跳转')
        })
    }

    closeCB() {
        this.close()
    }
}