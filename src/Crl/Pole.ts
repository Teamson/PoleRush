import WxApi from "../Libs/WxApi"
import SoundMgr from "../Mod/SoundMgr"
import Utility from "../Mod/Utility"
import GameUI from "../View/GameUI"
import GameLogic from "./GameLogic"

export default class Pole extends Laya.Script {
    constructor() {
        super()
    }

    myOwner: Laya.Sprite3D = null
    coll: Laya.Sprite3D = null
    min: Laya.Sprite3D = null
    max: Laya.Sprite3D = null

    onEnable() {
        this.myOwner = this.owner as Laya.Sprite3D
        this.myOwner.transform.localScale = new Laya.Vector3(5, 1, 1)
        this.max = this.myOwner.getChildByName('min') as Laya.Sprite3D
        this.min = this.myOwner.getChildByName('max') as Laya.Sprite3D
    }

    getMyBound() {
        return new Laya.BoundBox(this.min.transform.position.clone(), this.max.transform.position.clone())
    }

    onDisable() {

    }

    scalePole(v: number) {
        WxApi.DoVibrate(false)
        if (v > 0) {
            SoundMgr.instance.playSoundEffect('Longer.mp3')
            GameUI.Share.showTips(3)
        }
        else if (v < 0) {
            SoundMgr.instance.playSoundEffect('Shorter.mp3')
            GameUI.Share.showTips(2)
        }
        this.myOwner.transform.localScale = new Laya.Vector3(this.myOwner.transform.localScaleX + v, 1, 1)
    }
    movePole(v: number) {
        let p = this.myOwner.transform.localPosition.clone()
        p.x += v
        this.myOwner.transform.localPosition = p
    }

    canColl: boolean = true
    checkCollision() {
        if (!this.canColl) return

        for (let i = 0; i < GameLogic.Share._collisionArr.length; i++) {
            let c = GameLogic.Share._collisionArr[i]
            if (c === this.myOwner || !this.canColl) continue
            let mybb = this.getMyBound()
            let obb = Utility.getBoundBox(c)
            if (Laya.CollisionUtils.intersectsBoxAndBox(mybb, obb)) {
                if (c.name.search('Wall') != -1 || c.name.search('Saw') != -1) {
                    //this.canColl = false
                    let l = 0
                    let isLeft = true
                    if (c.transform.position.x > this.myOwner.transform.position.x) {
                        l = this.max.transform.position.x - (c.getChildByName('max') as Laya.Sprite3D).transform.position.x
                    } else if (c.transform.position.x < this.myOwner.transform.position.x) {
                        l = (c.getChildByName('min') as Laya.Sprite3D).transform.position.x - this.min.transform.position.x
                        isLeft = false
                    }
                    this.scalePole(-l)
                    this.movePole(isLeft ? -l / 2 : l / 2)
                    Laya.timer.once(300, this, () => {
                        let p = this.myOwner.transform.localPosition.clone()
                        // if (isLeft)
                        //     p.x += l / 2
                        // else
                        //     p.x -= l / 2
                        p.x = 0
                        Utility.TmoveToX(this.myOwner, 100, p, () => { this.canColl = true })
                    })
                    let newP = Utility.getSprite3DResByUrl('Pole_01.lh', GameLogic.Share._levelNode)
                    let myp = this.myOwner.transform.position.clone()
                    newP.transform.localScale = new Laya.Vector3(l, 1, 1)
                    myp.x = isLeft ? this.max.transform.position.x + l / 2 : this.min.transform.position.x - l / 2
                    myp.z -= 0.2
                    newP.transform.position = myp
                    let des = myp.clone()
                    des.y -= 0.8
                    Utility.TmoveTo(newP, 1000, des, null)
                }
                // else if (c.name.search('Pole') != -1) {
                //     this.scalePole(1)
                //     GameLogic.Share._collisionArr.splice(GameLogic.Share._collisionArr.indexOf(c), 1)
                //     c.destroy()
                //     return
                // }
            }
        }
    }

    onUpdate() {
        if (GameLogic.Share.isGameOver || !GameLogic.Share.isStartGame) return
        //GameLogic.Share.fixCameraField()
        this.checkCollision()
    }
}