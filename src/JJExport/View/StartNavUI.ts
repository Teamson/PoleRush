import AdMgr from "../../Mod/AdMgr"
import Utility from "../../Mod/Utility"
import JJMgr, { SceneDir } from "../Common/JJMgr"

export default class StartNavUI extends Laya.Scene {
    constructor() {
        super()
    }

    navNode: Laya.Sprite

    onOpened(param?: any) {
        this.initNav()
        Laya.timer.loop(3000, this, this.initNav)
        for (let i = 0; i < this.navNode.numChildren; i++) {
            let n = this.navNode.getChildAt(i) as Laya.Image
            Utility.rotateLoop(n, 10, 300)
        }
    }

    onClosed() {

    }
    
    initNav() {
        if (JJMgr.instance.navDataArr.length <= 0) {
            return
        }
        let tempArr = [].concat(JJMgr.instance.navDataArr)
        let arr = []
        for (let i = 0; i < tempArr.length; i++) {
            arr.push(i)
        }
        arr = Utility.shuffleArr(arr)
        arr = arr.splice(0, 4)
        let eNode = this.navNode
        for (let i = 0; i < 4; i++) {
            let item = eNode.getChildAt(i) as Laya.Image
            let icon = item.getChildByName('icon') as Laya.Image
            let name = item.getChildByName('name') as Laya.Label
            icon.skin = tempArr[arr[i]].icon
            name.text = tempArr[arr[i]].title

            item.off(Laya.Event.CLICK, this, this.navCB)
            item.on(Laya.Event.CLICK, this, this.navCB, [arr[i]])
        }
    }
    navCB(i: number) {
        console.log('click id:', i)
        JJMgr.instance.NavigateApp(i, () => {
            JJMgr.instance.openScene(SceneDir.SCENE_RECOMMENDUI, false, {
                closeCallbackFun: () => {
                    Laya.timer.once(100, this, () => {
                        AdMgr.instance.showBanner()
                    })
                }
            })
        }, () => { })
    }
}