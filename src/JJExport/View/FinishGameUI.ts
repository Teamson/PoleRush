import JJMgr, { SceneDir } from "../Common/JJMgr"
import JJUtils from "../Common/JJUtils"
import Utility from "../../Mod/Utility"
import GameLogic from "../../Crl/GameLogic"
import PlayerDataMgr from "../../Libs/PlayerDataMgr"
import AdMgr from "../../Mod/AdMgr"

export default class FinishGameUI extends Laya.Scene {
    constructor() {
        super()
    }

    navList: Laya.List = this['navList']

    navData: any[] = []

    from: string = null

    totalArr: any[] = []
    curIndex: number = 6
    fingerNum: number = 0

    onOpened(param?: any) {
        if (param) {
            if (param.posY) {
                this.navList.y = param.posY
            }
            if (param.fixY == true) {
                JJUtils.fixNodeY(this.navList)
            }
            if (param.from) {
                this.from = param.from
            }
        }

        this._init()
    }

    onClosed() {
        Laya.timer.clearAll(this)
    }

    _init() {
        this.navData = []
        this.totalArr = [].concat(JJMgr.instance.navDataArr)
        this.navData = this.totalArr.slice(0, 6)
        this.initList()
    }

    //初始化list
    initList() {
        this.navList.vScrollBarSkin = '';
        this.navList.repeatX = 3;
        this.navList.repeatY = 2;
        this.navList.array = this.navData;
        this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
        this.fingerNum = Math.floor(Math.random() * 6)
    }
    onListRender(cell, index) {
        if (index >= this.navList.array.length) {
            return;
        }
        var item = cell.getChildByName('item')
        var icon = item.getChildByName('icon')
        var finger = item.getChildByName('navFinger')

        icon.skin = this.navData[index].icon
        item.off(Laya.Event.CLICK, this, this.navCB, [this.navData[index], index])
        item.on(Laya.Event.CLICK, this, this.navCB, [this.navData[index], index])
        finger.visible = index == this.fingerNum
    }
    navCB(data: any, listIndex: number) {
        console.log('click id:', this.totalArr.indexOf(data))
        JJMgr.instance.NavigateApp(this.totalArr.indexOf(data), () => {
            JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI, false, { continueCallbackFun: () => { AdMgr.instance.showBanner() } })
        })

        this.navData[listIndex] = this.totalArr[this.curIndex]
        this.curIndex++
        if (this.curIndex >= this.totalArr.length) {
            this.curIndex = 0
        }
        this.initList()
    }
}