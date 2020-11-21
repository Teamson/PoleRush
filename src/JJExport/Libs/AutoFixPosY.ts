import JJUtils from "../Common/JJUtils"

export default class AutoFixPosY extends Laya.Script {
    constructor() {
        super()
    }

    /**  @prop {name:isFix,tips:"",type:Bool}*/
    public isFix: boolean = false


    onAwake() {
        if (this.isFix) {
            let node: any = this.owner
            JJUtils.fixNodeY(node)
        }
    }

    onDestroy() {

    }
}