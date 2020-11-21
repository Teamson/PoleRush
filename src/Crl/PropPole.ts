import Utility from "../Mod/Utility"
import GameLogic from "./GameLogic"

export default class PropPole extends Laya.Script {
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

        let mbb = Utility.getBoundBox(this.myOwner.getChildAt(0) as Laya.Sprite3D)
        let obb = GameLogic.Share._poleCrl.getMyBound()
        if (Laya.CollisionUtils.intersectsBoxAndBox(mbb, obb)) {
            GameLogic.Share._poleCrl.scalePole(1)
            this.myOwner.destroy()
        }
    }
}