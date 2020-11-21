import WxApi from "./WxApi"

export default class FixAdShareIcon extends Laya.Script {
    constructor() {
        super()
    }

    /**  @prop {name:shareIconStr,tips:"",type:String}*/
    public shareIconStr: string = ''
    /**  @prop {name:videoIconStr,tips:"",type:String}*/
    public videoIconStr: string = ''

    myOwner: Laya.Image = null

    onAwake() {
        this.myOwner = this.owner as Laya.Image
    }

    onDisable() {

    }

    onUpdate() {
        if (WxApi.front_share_number > 0) {
            this.myOwner.skin = this.shareIconStr
        } else {
            this.myOwner.skin = this.videoIconStr
        }
    }
}