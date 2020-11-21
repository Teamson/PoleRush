import WxApi from "../Libs/WxApi"
import GameUI from "../View/GameUI"
import GameLogic from "./GameLogic"

export default class End extends Laya.Script {
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
        if (!GameLogic.Share.isDes) return

    }
}