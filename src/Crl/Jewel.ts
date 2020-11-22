import GameLogic from "./GameLogic"
import Utility from "../Mod/Utility"
import GameUI from "../View/GameUI"

export default class Jewel extends Laya.Script {
    constructor() {
        super()
    }

    myOwner: Laya.Sprite3D = null
    onEnable() {
        this.myOwner = this.owner as Laya.Sprite3D
    }

    onDisable() {

    }

    onUpdate() {
        if (!GameLogic.Share.isStartGame || GameLogic.Share.isGameOver) return

        let mbb = Utility.getBoundBox(this.myOwner as Laya.Sprite3D)
        let obb = GameLogic.Share._poleCrl.getMyBound()
        if (Laya.CollisionUtils.intersectsBoxAndBox(mbb, obb)) {
            GameLogic.Share._coinCount++
            GameUI.Share.fixJewelIcon(this.myOwner)
            this.myOwner.destroy()
        }
    }
}