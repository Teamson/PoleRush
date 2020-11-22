import PlayerDataMgr from "../Libs/PlayerDataMgr"
import Utility from "../Mod/Utility"
import GameLogic from "./GameLogic"

export default class Player extends Laya.Script {
    constructor() {
        super()
    }

    myOwner: Laya.Sprite3D = null
    _ani: Laya.Animator = null
    isDied: boolean = false
    speed: number = 0.2
    roadEdge: number = 11

    trail1: Laya.ShuriKenParticle3D = null
    trail2: Laya.ShuriKenParticle3D = null
    trail3: Laya.ShuriKenParticle3D = null
    trail4: Laya.ShuriKenParticle3D = null
    trail5: Laya.ShuriKenParticle3D = null
    trail6: Laya.ShuriKenParticle3D = null
    LandFX: Laya.ShuriKenParticle3D = null

    onEnable() {
        this.myOwner = this.owner as Laya.Sprite3D
        this._ani = this.owner.getComponent(Laya.Animator)
        //this._ani.speed = 0
        this.playIdle()
        this.myOwner.transform.rotate(new Laya.Vector3(0, -90, 0), true, false)
        let pos = this.getMyPos()
        pos.x -= 1
        this.myOwner.transform.position = pos;

        this.trail1 = this.myOwner.getChildByName('Trail1') as Laya.ShuriKenParticle3D
        this.trail2 = this.myOwner.getChildByName('Trail2') as Laya.ShuriKenParticle3D
        this.trail3 = this.myOwner.getChildByName('Trail3') as Laya.ShuriKenParticle3D
        this.trail4 = this.myOwner.getChildByName('Trail4') as Laya.ShuriKenParticle3D
        this.trail5 = this.myOwner.getChildByName('Trail5') as Laya.ShuriKenParticle3D
        this.trail6 = this.myOwner.getChildByName('Trail6') as Laya.ShuriKenParticle3D
        this.LandFX = this.myOwner.getChildByName('LandFX') as Laya.ShuriKenParticle3D

        for (let i = 1; i <= 6; i++) {
            this['trail' + i].active = i - 1 == PlayerDataMgr.getPlayerData().msId
        }
        this.LandFX.active = false
    }

    onDisable() {

    }

    getMyPos() {
        return this.myOwner.transform.position.clone()
    }

    playIdle() {
        if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'idle') return
        this._ani.play('idle')
    }
    playRun(reset?: boolean) {
        if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'run') return
        if (reset) {
            let pos = this.getMyPos()
            pos.x = 0
            this.myOwner.transform.position = pos
            this.myOwner.transform.rotate(new Laya.Vector3(0, 90, 0), true, false)
        }
        this._ani.play('run')
    }
    playHang() {
        if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'hang') return
        this._ani.play('hang')
    }
    playFall() {
        if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'fall') return
        this._ani.play('fall')
    }
    playDie() {
        if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'die') return
        this._ani.play('die')
    }
    playDance() {
        if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'dance') return
        this._ani.play('dance')
    }

    activeLandFX() {
        this.LandFX.active = true
        this.LandFX.particleSystem.play()
        Laya.timer.once(1000, this, () => {
            this.LandFX.active = false
        })
    }

    moveX(dtX: number) {
        if (GameLogic.Share.isGameOver || this.isDied) {
            return
        }

        if (this.myOwner.transform.position.x + dtX > this.roadEdge) {
            this.myOwner.transform.position = new Laya.Vector3(this.roadEdge, this.myOwner.transform.position.clone().y, this.myOwner.transform.position.clone().z)
            return
        } else if (this.myOwner.transform.position.x + dtX < -this.roadEdge) {
            this.myOwner.transform.position = new Laya.Vector3(-this.roadEdge, this.myOwner.transform.position.clone().y, this.myOwner.transform.position.clone().z)
            return
        }
        let newPos = new Laya.Vector3(dtX, 0, 0)
        this.myOwner.transform.translate(newPos, false)
        GameLogic.Share._camera.transform.translate(newPos, false)
    }

    checkMyCollision() {
        for (let i = 0; i < GameLogic.Share._collisionArr.length; i++) {
            let c = GameLogic.Share._collisionArr[i]
            if (c == this.myOwner) continue

            let mybb = Utility.getBoundBox(this.myOwner)
            let obb = Utility.getBoundBox(c)
            if (Laya.CollisionUtils.intersectsBoxAndBox(mybb, obb)) {
                if (c.name.search('FallArea') != -1) {
                    GameLogic.Share.loseCB(true)
                    return
                }
                else if (c.name.search('SlideArea') != -1 && this._ani.getControllerLayer().getCurrentPlayState().animatorState.name != 'hang') {
                    this.myOwner.transform.translate(new Laya.Vector3(0, -0.5, 0), false)
                    this.playHang()
                } else if (c.name.search('ExitArea') != -1) {
                    GameLogic.Share._barArr[0].getChildByName('SparkFX1').active = false
                    GameLogic.Share._barArr[0].getChildByName('SparkFX2').active = false;
                    GameLogic.Share.moveToDes()
                    this._ani.speed = 0
                    c.removeSelf()
                    GameLogic.Share._collisionArr.splice(GameLogic.Share._collisionArr.indexOf(c), 1)
                    return
                }
            }
        }
    }

    onUpdate() {
        if (!GameLogic.Share.isStartGame || GameLogic.Share.isGameOver || GameLogic.Share.isPause) return

        if (this.myOwner.transform.position.z >= GameLogic.Share.totalDistance) {
            GameLogic.Share.winCB()
            return
        }
        if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'hang' && !GameLogic.Share.isFlying) {
            if (GameLogic.Share._poleCrl.max.transform.position.x < GameLogic.Share._barArr[0].transform.position.x + 2.5 ||
                GameLogic.Share._poleCrl.min.transform.position.x > GameLogic.Share._barArr[0].transform.position.x - 2.5) {
                GameLogic.Share._barArr[0].getChildByName('SparkFX1').active = false
                GameLogic.Share._barArr[0].getChildByName('SparkFX2').active = false;
                GameLogic.Share.loseCB(true)
                return
            }
            GameLogic.Share._barArr[0].getChildByName('SparkFX1').active = true
            GameLogic.Share._barArr[0].getChildByName('SparkFX2').active = true;
            let p1 = (GameLogic.Share._barArr[0].getChildByName('SparkFX1') as Laya.ShuriKenParticle3D).transform.position.clone();
            p1.z = this.myOwner.transform.position.z + 1.5;
            let p2 = (GameLogic.Share._barArr[0].getChildByName('SparkFX2') as Laya.ShuriKenParticle3D).transform.position.clone();
            p2.z = this.myOwner.transform.position.z + 1.5;
            (GameLogic.Share._barArr[0].getChildByName('SparkFX1') as Laya.ShuriKenParticle3D).transform.position = p1;
            (GameLogic.Share._barArr[0].getChildByName('SparkFX2') as Laya.ShuriKenParticle3D).transform.position = p2;
        }

        if (!GameLogic.Share.isFlying) {
            let newPos = new Laya.Vector3(0, 0, this.speed)
            this.myOwner.transform.translate(newPos, false)
            GameLogic.Share._camera.transform.translate(newPos, false)
        } else {
            let p = new Laya.Vector3(0, 0, 0)
            Laya.Vector3.add(this.myOwner.transform.position.clone(), GameLogic.Share.camStartPos, p)
            GameLogic.Share._camera.transform.position = p
        }

        this.checkMyCollision()
        // if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'hang') {
        //     GameLogic.Share._pole.transform.localPosition = new Laya.Vector3(0, 1.11 + 0.2, 0.64)
        // } else {
        //     GameLogic.Share._pole.transform.localPosition = new Laya.Vector3(0, 1.11, 0.64)
        // }
    }
}