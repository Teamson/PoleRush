export default class FixNodeY extends Laya.Script {
    constructor() {
        super()
    }

    onAwake() {
        let myOwner = this.owner as Laya.Sprite
        myOwner.y = myOwner.y * Laya.stage.displayHeight / 1334
    }
}