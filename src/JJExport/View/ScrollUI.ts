import JJMgr, { SceneDir } from "../Common/JJMgr"
import JJUtils from "../Common/JJUtils"

export default class ScrollUI extends Laya.Scene {
    constructor() {
        super()
    }

    navList: Laya.List = this['navList']

    navData: any[] = []
    scrollDir: number = 1
    preIndex: number = -1

    onOpened(param?: any) {
        if (param) {
            if (param.posY) {
                this.navList.y = param.posY
            }
            if (param.fixY == true) {
                JJUtils.fixNodeY(this.navList)
            }
        }
        this.initList()
    }

    onClosed() {
        Laya.timer.clearAll(this)
    }

    //初始化list
    initList() {
        this.navData = [].concat(JJMgr.instance.navDataArr)
        this.navList.hScrollBarSkin = '';
        this.navList.repeatX = this.navData.length;
        this.navList.repeatY = 1;
        this.navList.array = this.navData;
        this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
        this.navList.mouseHandler = new Laya.Handler(this, this.mouseHandler);

        this.scrollLoop()
    }
    mouseHandler(e, index) {
        Laya.timer.clear(this, this.scrollLoop)
        Laya.timer.once(1000, this, this.scrollLoop)
    }
    scrollLoop() {
        Laya.timer.once(1000, this, () => {
            let num: number = Math.floor(this.navList.startIndex)
            if (this.scrollDir == 1) {
                num++
                if (num >= this.navData.length - 4) {
                    num--
                    this.scrollDir = -this.scrollDir
                }
            } else {
                num--
                if (num < 0) {
                    this.scrollDir = -this.scrollDir
                }
            }
            this.navList.tweenTo(num, 1000, Laya.Handler.create(this, this.scrollLoop))
        })
    }
    onListRender(cell, index) {
        if (index >= this.navList.array.length) {
            return;
        }
        var item = cell.getChildByName('item')
        var icon = item.getChildByName('icon')

        icon.skin = this.navData[index].icon
        item.off(Laya.Event.CLICK, this, this.navCB, [index])
        item.on(Laya.Event.CLICK, this, this.navCB, [index])
    }
    navCB(index: number) {
        console.log('click id:', index)
        JJMgr.instance.NavigateApp(index, () => {
            JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI)
        })
    }

}