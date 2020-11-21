import WxApi from "../Libs/WxApi"
import PlayerDataMgr from "../Libs/PlayerDataMgr"
import Utility from "../Mod/Utility"
import Player from "./Player"
import PrefabManager from "../Libs/PrefabManager"
import SoundMgr from "../Mod/SoundMgr"
import JJMgr, { SceneDir } from "../JJExport/Common/JJMgr"
import ShareMgr from "../Mod/ShareMgr"
import GameUI from "../View/GameUI"
import End from "./End"
import AdMgr from "../Mod/AdMgr"
import Pole from "./Pole"
import PropPole from "./PropPole"
import Box from "./Box"

export default class GameLogic {
    public static Share: GameLogic

    public _scene: Laya.Scene3D
    public _camera: Laya.Camera
    private _light: Laya.DirectionLight

    public camStartPos: Laya.Vector3 = new Laya.Vector3(0, 0, 0)
    private camStartRotation: Laya.Quaternion = null
    private lightStartForward: any = null
    private planePos: Laya.Vector3 = null

    public _levelNode: Laya.Sprite3D = null
    public _roadNode: Laya.Sprite3D = null
    public _buildingNode: Laya.Sprite3D = null
    public _player: Laya.Sprite3D = null
    public _playerCrl: Player = null
    public _pole: Laya.Sprite3D = null
    public _poleCrl: Pole = null
    public _collisionArr: Laya.Sprite3D[] = []
    public _desArr: Laya.Sprite3D[] = []
    public _barArr: Laya.Sprite3D[] = []
    public _boxNode: Laya.Sprite3D = null
    public _finish: Laya.Sprite3D = null

    public _score: number = 0
    public totalDistance: number = 0
    public isDes: boolean = false

    public isFlying: boolean = false
    public isStartGame: boolean = false
    public isGameOver: boolean = false
    public isWin: boolean = false
    public isPause: boolean = false

    constructor() {
        localStorage.clear()
        GameLogic.Share = this
        //AdMgr.instance.initAd()
        //初始化预制体单例
        //PrefabManager.instance()
        //new TimeCountMgr()
        PlayerDataMgr.getPlayerData()

        // JJMgr.instance.initJJ(WxApi.version, () => {
        //     ShareMgr.instance.initShare()
        //     //获取场景值
        //     if (Laya.Browser.onWeiXin) {
        //         WxApi.sceneId = WxApi.GetLaunchPassVar().scene
        //         console.log('sceneId:', WxApi.sceneId)
        //     }
        //     WxApi.calculateShareNumber()

        //     SoundMgr.instance.initLoading(() => {
        //         Laya.Scene.open('MyScenes/LoadingUI.scene')
        //     })
        // })
        // WxApi.WxOnHide(() => {
        //     PlayerDataMgr.setExitTime()
        //     localStorage.setItem('lastDate', new Date().getDate().toString())
        //     localStorage.setItem('front_share_number', WxApi.front_share_number.toString())
        // })

        // Laya.timer.frameLoop(1, this, this.activeRoad)

        Laya.Scene.open('MyScenes/LoadingUI.scene')
    }

    initScene() {
        Laya.Scene3D.load(WxApi.UnityPath + 'SampleScene.ls', Laya.Handler.create(this, this.onLoadScene));
    }
    onLoadScene(scene) {
        Laya.Scene.open('MyScenes/StartUI.scene')
        WxApi.aldEvent('进入首页')

        this._scene = Laya.stage.addChild(scene) as Laya.Scene3D
        Laya.stage.setChildIndex(this._scene, 0)
        this._camera = this._scene.getChildByName('Main Camera') as Laya.Camera
        this._light = this._scene.getChildByName('Directional Light') as Laya.DirectionLight
        //this.fixCameraField()
        this.camStartPos = this._camera.transform.position.clone()
        this.camStartRotation = this._camera.transform.rotation.clone()

        this._levelNode = new Laya.Sprite3D()

        this._scene.addChild(this._levelNode)

        this.createLevel()

        this.setFog()
    }

    fixCameraField() {
        let staticDT: number = 1624 - 1334
        let curDT: number = Laya.stage.displayHeight - 1334 < 0 ? 0 : Laya.stage.displayHeight - 1334
        let per = curDT / staticDT * 10
        this._camera.fieldOfView = 90 + per
    }

    setFog() {
        // return;
        //开启雾化效果
        let scene = this._scene
        scene.enableFog = true;
        //设置雾化的颜色
        scene.fogColor = this.getRGB("#F17673"); //00FFD6
        //设置雾化的起始位置，相对于相机的距离
        scene.fogStart = 0;
        //设置雾化最浓处的距离。
        scene.fogRange = 400;
    }
    getRGB(_hexColor) {
        var color = [], rgb = [];
        let hexColor = _hexColor.replace(/#/, "");
        if (hexColor.length == 3) { // 处理 "#abc" 成 "#aabbcc"
            var tmp = [];
            for (var i = 0; i < 3; i++) {
                tmp.push(hexColor.charAt(i) + hexColor.charAt(i));
            }
            hexColor = tmp.join("");
        }

        for (var i = 0; i < 3; i++) {
            color[i] = "0x" + hexColor.substr(i * 2, 2);
            // rgb.push(parseInt(Number(color[i])));
            rgb.push(parseInt(color[i]));
        }
        return new Laya.Vector3(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
    }

    gameStart() {
        Laya.Scene.open('MyScenes/GameUI.scene')
        this._playerCrl.playRun(true)
        this.createPole()
        this.isStartGame = true
        // let pp = this._pole.transform.position.clone()
        // pp.y = 1.11
        // pp.z = 0.64
        // this._pole.transform.position = pp
    }

    maxPlaneCount: number = 2
    createLevel() {
        this._roadNode = this._levelNode.addChild(new Laya.Sprite3D()) as Laya.Sprite3D
        this._buildingNode = this._levelNode.addChild(new Laya.Sprite3D()) as Laya.Sprite3D

        this._player = Utility.getSprite3DResByUrl('Hero_01.lh', this._levelNode)
        this._playerCrl = this._player.addComponent(Player)
        this._collisionArr.push(this._player)

        for (let i = 0; i < this.maxPlaneCount; i++) {
            let rId: number = Utility.GetRandom(1, 3)
            let name = 'Road_0' + rId + '.lh'
            if (i == 0) name = 'Road_01.lh'
            if (i == this.maxPlaneCount - 1) name = 'Road_Finish.lh'
            let road = Utility.getSprite3DResByUrl(name, this._roadNode)
            road.transform.position = new Laya.Vector3(0, i * -30, 20 + i * 100)
            for (let j = 0; j < road.numChildren; j++) {
                let rc = road.getChildAt(j) as Laya.Sprite3D
                if (rc.name.search('FallArea') != -1) {
                    this._collisionArr.push(rc)
                }
            }
            if (i > 0) {
                this._desArr.push(road.getChildByName('Des') as Laya.Sprite3D)
            }
            if (i == this.maxPlaneCount - 1) {
                this._boxNode = road.getChildByName('BoxNode') as Laya.Sprite3D
                this._finish = road.getChildByName('Finish') as Laya.Sprite3D
                this.totalDistance = this._finish.transform.position.z
                this.createBox()
            }

            if (i < this.maxPlaneCount - 1) {
                let bar = Utility.getSprite3DResByUrl('Bar_01.lh', road)
                let rPos = road.transform.position.clone()
                rPos.y -= 0.4
                rPos.z += 32.5
                bar.transform.position = rPos
                this._collisionArr.push(bar.getChildAt(0) as Laya.Sprite3D)
                this._collisionArr.push(bar.getChildAt(1) as Laya.Sprite3D)
                this._collisionArr.push(bar.getChildAt(2) as Laya.Sprite3D)
                this._collisionArr.push(bar.getChildAt(3) as Laya.Sprite3D)
                this._barArr.push(bar)

                this.createProp(rId, road, i == 0 ? 5 : 10)
            }
        }

        for (let i = 0; i < 8; i++) {
            let building = Utility.getSprite3DResByUrl('Building_01.lh', this._buildingNode)
            building.transform.position = new Laya.Vector3(((i % 2 == 0) ? 150 : -150) + Utility.GetRandom(-50, 50), -250, i * 300 + Utility.GetRandom(-50, 50))
        }
    }

    createProp(rId: number, road: Laya.Sprite3D, max: number = 10) {
        let rootNode = road.addChild(new Laya.Sprite3D())
        let dataArr: any[] = [].concat(PlayerDataMgr['roadArr' + rId])
        let index = Utility.GetRandom(1, max)
        let data = dataArr[index]
    }

    createPole() {
        this._pole = Utility.getSprite3DResByUrl('Pole_01.lh', this._player)
        let pos = this._player.transform.position.clone()
        pos.y += 1.11
        pos.z += 0.64
        this._pole.transform.position = pos
        this._poleCrl = this._pole.addComponent(Pole)
    }

    createBox() {
        for (let i = 0; i < 100; i++) {
            let box = Utility.getSprite3DResByUrl('Box_01.lh', this._boxNode)
            box.transform.localPosition = new Laya.Vector3(-7.5 + (1.5 * Math.floor(i % 10)), 0, 2 * Math.floor(i / 10))
            let crl = box.addComponent(Box) as Box
            crl.myId = i
        }
    }

    createPropPole(root: Laya.Sprite3D, pos: Laya.Vector3) {
        let pole = Utility.getSprite3DResByUrl('PropPole.lh', root)
        pos.y = 1.11
        pole.transform.position = pos
        pole.addComponent(PropPole)
    }
    createSaw(root: Laya.Sprite3D, pos: Laya.Vector3) {
        let saw = Utility.getSprite3DResByUrl('Saw_01.lh', root)
        saw.transform.position = pos
        this._collisionArr.push(saw)
    }
    createJewel(root: Laya.Sprite3D, pos: Laya.Vector3) {
        let jewel = Utility.getSprite3DResByUrl('Jewel_01.lh', root)
        jewel.transform.position = pos
        this._collisionArr.push(jewel)
    }
    createWall(id: number, root: Laya.Sprite3D, pos: Laya.Vector3, scale: Laya.Vector3) {
        let wall = Utility.getSprite3DResByUrl('Wall_0' + id + '.lh', root)
        wall.transform.position = pos
        wall.transform.localScale = scale
        this._collisionArr.push(wall)
    }

    moveToDes() {
        this.isFlying = true
        let des: Laya.Sprite3D = this._desArr[0]
        Utility.TmoveToYZ(this._player, 3000, des.transform.position.clone(), () => {
            if (this.isGameOver) return
            this.isFlying = false
            this._playerCrl._ani.speed = 1
            this._playerCrl.playRun()
            this._barArr.splice(0, 1)
        })
        this._desArr.splice(0, 1)
    }

    winCB() {
        this.isGameOver = true
        this.isWin = true
        this.isStartGame = false

        this._pole.destroy()
        this._playerCrl.playDance()
    }

    showFinish() {
        JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI, true, {
            continueCallbackFun: () => {
                JJMgr.instance.openScene(SceneDir.SCENE_RECOMMENDUI, true, {
                    closeCallbackFun: () => {
                        Laya.Scene.open('MyScenes/FinishUI.scene', true)
                    }
                })
            }
        })
    }

    loseCB(isFall?: boolean) {
        this.isGameOver = true
        this.isWin = false
        this.isStartGame = false
        this._playerCrl._ani.speed = 1
        if (!isFall)
            this._playerCrl.playDie()
        else {
            this._playerCrl.playFall()
            let p = this._player.transform.position.clone()
            p.y -= 50
            Utility.TmoveTo(this._player, 15000, p, null)
        }
    }

    activeRoad() {
        if (!this._roadNode) return
        for (let i = 0; i < this._roadNode.numChildren; i++) {
            let r = this._roadNode.getChildAt(i) as Laya.Sprite3D
            if (r.transform.position.z < this._player.transform.position.z - 5) {
                r.active = false
            } else {
                r.active = true
            }
        }
    }

    restartGame() {
        this.isStartGame = false
        this.isGameOver = false
        this.isWin = false
        this.totalDistance = 0
        this._score = 0
        this.isPause = false
        this._collisionArr = []
        this._desArr = []
        this._barArr = []

        this.isDes = false

        this._levelNode.destroyChildren()
        this._camera.transform.position = this.camStartPos
        this._camera.transform.rotation = this.camStartRotation

    }
}