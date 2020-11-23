import WxApi from "../Libs/WxApi"
import SoundMgr from "../Mod/SoundMgr"
import Utility from "../Mod/Utility"
import GameUI from "../View/GameUI"
import GameLogic from "./GameLogic"

export default class Box extends Laya.Script {
    constructor() {
        super()
    }

    myOwner: Laya.Sprite3D = null
    myId: number = 0
    randX: number = 0
    havaRandX: boolean = false

    isDie: boolean = false

    onEnable() {
        this.myOwner = this.owner as Laya.Sprite3D
        this.randX = (Math.random() * 0.3) - 0.15
    }

    onDisable() {

    }

    onUpdate() {
        if (!GameLogic.Share.isStartGame || GameLogic.Share.isGameOver || this.isDie) return

        if (this.myOwner.transform.position.z >= GameLogic.Share.totalDistance) {
            // let jewel = Utility.getSprite3DResByUrl('Jewel_01.lh', GameLogic.Share._levelNode)
            // let p: Laya.Vector3 = this.myOwner.transform.position.clone()
            // p.z += 5
            // jewel.transform.position = p.clone()
            // jewel.transform.localScale = new Laya.Vector3(0.5, 0.5, 0.5)
            // p.y += 10
            // Utility.TmoveTo(jewel, 1000, p, () => { jewel.destroy() })
            GameUI.Share.fixJewelIcon(this.myOwner)
            WxApi.DoVibrate(false)
            this.isDie = true
            this.myOwner.transform.translate(new Laya.Vector3(0, 0, 1000))
            //GameLogic.Share.destroyBoxArr.push(this.myOwner)
            GameLogic.Share._score++
            GameLogic.Share.setScorePlane()
            return
        }

        let havePre: boolean = this.myId >= 10
        let preBox: Laya.Sprite3D = null
        if (havePre)
            preBox = GameLogic.Share._boxNode.getChildAt(this.myId - 10) as Laya.Sprite3D;
        if (Math.abs(this.myOwner.transform.position.z - GameLogic.Share._pole.transform.position.z) <= 0.6) {
            if ((this.myOwner.transform.position.x + 0.5 <= GameLogic.Share._poleCrl.max.transform.position.x &&
                this.myOwner.transform.position.x + 0.5 >= GameLogic.Share._poleCrl.min.transform.position.x) ||
                (this.myOwner.transform.position.x - 0.5 <= GameLogic.Share._poleCrl.max.transform.position.x &&
                    this.myOwner.transform.position.x - 0.5 >= GameLogic.Share._poleCrl.min.transform.position.x)) {
                let newPos = new Laya.Vector3(0, 0, GameLogic.Share._playerCrl.speed)
                this.myOwner.transform.translate(newPos, false)
            }
        } else if (havePre && preBox && Math.abs(this.myOwner.transform.position.z - preBox.transform.position.z) <= 0.9) {
            let p = this.myOwner.transform.position.clone()

            if (!this.havaRandX) {
                this.randX = p.x + this.randX
                this.havaRandX = true
            }
            else {
                var v = p.clone();
                v.x = this.randX;
                Laya.Vector3.lerp(p, v, 0.2, p);
                this.myOwner.transform.position = p
            }

            let newPos = new Laya.Vector3(0, 0, GameLogic.Share._playerCrl.speed)
            this.myOwner.transform.translate(newPos, false)
        }
    }
}