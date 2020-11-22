import PlayerDataMgr from "../Libs/PlayerDataMgr"
import WxApi from "../Libs/WxApi"
import ShareMgr from "../Mod/ShareMgr"
import Utility from "../Mod/Utility"
import GameLogic from "../Crl/GameLogic"

export default class SkinUI extends Laya.Scene {
    constructor() {
        super()
    }

    coinNum: Laya.FontClip
    costNum: Laya.FontClip
    skinBtn: Laya.Image
    motionBtn: Laya.Image
    backBtn: Laya.Image
    useBtn: Laya.Image
    adBtn: Laya.Image
    itemNode: Laya.Sprite

    curPage: number = 0
    chooseId: number = 0

    onOpened() {
        Laya.timer.frameLoop(1, this, this.updateCB)
        this.skinBtn.on(Laya.Event.CLICK, this, this.skinBtnCB)
        this.motionBtn.on(Laya.Event.CLICK, this, this.motionBtnCB)
        this.useBtn.on(Laya.Event.CLICK, this, this.useBtnCB)
        this.adBtn.on(Laya.Event.CLICK, this, this.adBtnCB)
        this.backBtn.on(Laya.Event.CLICK, this, this.backBtnCB)

        this.init3DScene()
        this.skinBtnCB()
    }

    onClosed() {
        Laya.timer.clearAll(this)
        this.scene3D.destroy()
        GameLogic.Share._camera.active = true
    }

    scene3D: Laya.Scene3D = null
    light = null
    camera = null
    player: Laya.Sprite3D = null
    skinScene: Laya.Sprite3D = null
    init3DScene() {
        this.scene3D = Laya.stage.addChild(new Laya.Scene3D()) as Laya.Scene3D;
        Laya.stage.setChildIndex(this.scene3D, 0)
        this.light = this.scene3D.addChild(new Laya.DirectionLight()) as Laya.DirectionLight;
        this.light.color = new Laya.Vector3(1, 0.956, 0.839);
        //this.light.transform.rotate(new Laya.Vector3(0, 0, 0), true, false);

        this.camera = this.scene3D.addChild(new Laya.Camera(0, 0.1, 1000)) as Laya.Camera;
        this.camera.transform.translate(new Laya.Vector3(0, 0, 0));
        this.camera.transform.rotate(new Laya.Vector3(-20, 0, 0), true, false);
        this.camera.clearFlag = Laya.BaseCamera.CLEARFLAG_DEPTHONLY;
        this.camera.fieldOfView = 90
        //this.fixCameraField()

        this.skinScene = Utility.getSprite3DResByUrl('Cyl_01.lh', this.scene3D)
        this.skinScene.transform.position = new Laya.Vector3(0, -2, -15)

        this.player = Utility.getSprite3DResByUrl('Hero_01.lh', this.scene3D);
        this.player.transform.position = new Laya.Vector3(0, -2, -15);
        this.player.transform.localScale = new Laya.Vector3(2.5, 2.5, 2.5);
        (this.player.getComponent(Laya.Animator) as Laya.Animator).play('dance');
        this.player.getChildByName('LandFX').active = false;
        this.player.getChildByName('Trail1').active = false;
        this.player.getChildByName('Trail2').active = false;
        this.player.getChildByName('Trail3').active = false;
        this.player.getChildByName('Trail4').active = false;
        this.player.getChildByName('Trail5').active = false;
        this.player.getChildByName('Trail6').active = false;
    }

    trailMode() {
        (this.player.getComponent(Laya.Animator) as Laya.Animator).play('run');
        Utility.RotateTo(this.player, 100, new Laya.Vector3(0, 90, 0), () => { });
        this.activeTrail(this.chooseId)
        Laya.timer.frameLoop(1, this, this.playerMove)
    }
    activeTrail(index: number) {
        this.player.getChildByName('Trail1').active = false;
        this.player.getChildByName('Trail2').active = false;
        this.player.getChildByName('Trail3').active = false;
        this.player.getChildByName('Trail4').active = false;
        this.player.getChildByName('Trail5').active = false;
        this.player.getChildByName('Trail6').active = false;
        if (index >= 0)
            this.player.getChildByName('Trail' + (index + 1)).active = true;
    }
    playerMove() {
        this.player.transform.translate(new Laya.Vector3(1, 0, 0), false)
        this.skinScene.transform.translate(new Laya.Vector3(1, 0, 0), false)
        this.camera.transform.translate(new Laya.Vector3(1, 0, 0), false)
    }

    skinMode() {
        (this.player.getComponent(Laya.Animator) as Laya.Animator).play('dance');
        Utility.RotateTo(this.player, 100, new Laya.Vector3(0, 0, 0), () => { });
    }

    fixCameraField() {
        let staticDT: number = 1624 - 1334
        let curDT: number = Laya.stage.displayHeight - 1334 < 0 ? 0 : Laya.stage.displayHeight - 1334
        let per = curDT / staticDT * 10
        this.camera.fieldOfView += per
    }

    updateItem() {
        for (let i = 0; i < this.itemNode.numChildren; i++) {
            if (this.curPage == 0 && i == this.itemNode.numChildren - 1) {
                (this.itemNode.getChildAt(i) as Laya.Image).visible = false;
                continue
            } else {
                (this.itemNode.getChildAt(i) as Laya.Image).visible = true;
            }

            let item: Laya.Image = this.itemNode.getChildAt(i) as Laya.Image
            let icon: Laya.Image = item.getChildByName('icon') as Laya.Image
            let choose: Laya.Image = item.getChildByName('choose') as Laya.Image
            let tips: Laya.Image = item.getChildByName('tips') as Laya.Image

            if (this.curPage == 0) {
                item.skin = PlayerDataMgr.getPlayerData().skinArr[i] == 1 ? 'skinUI/pf_yy_1.png' : 'skinUI/pf_wyy_1.png'
                icon.skin = 'skinUI/pf_js_' + (i + 1) + '.png'
                choose.visible = i == this.chooseId
                tips.visible = PlayerDataMgr.getPlayerData().skinArr[i] == 0 || PlayerDataMgr.getPlayerData().skinId == i
                tips.skin = i == PlayerDataMgr.getPlayerData().skinId ? 'skinUI/tw_syz_1.png' : 'skinUI/tw_syy_1.png'
            } else {
                item.skin = 'skinUI/tw_mr_' + (i + 1) + '.png'
                icon.skin = ''
                choose.visible = i == this.chooseId
                tips.visible = PlayerDataMgr.getPlayerData().msArr[i] == 0 || PlayerDataMgr.getPlayerData().msId == i
                tips.skin = i == PlayerDataMgr.getPlayerData().msId ? 'skinUI/tw_syz_1.png' : 'skinUI/tw_syy_1.png'
            }
            item.off(Laya.Event.CLICK, this, this.itemCB)
            item.on(Laya.Event.CLICK, this, this.itemCB, [i])
        }
    }

    itemCB(index: number) {
        this.chooseId = index
        this.costNum.visible = false
        if (this.curPage == 0) {
            if (PlayerDataMgr.getPlayerData().skinArr[index] == 1) {
                //已拥有
                if (PlayerDataMgr.getPlayerData().skinId == index) {
                    //使用中
                    this.useBtn.skin = 'skinUI/tw_btn_4.png'
                } else {
                    //可使用
                    this.useBtn.skin = 'skinUI/tw_btn_2.png'
                }
            } else {
                //未拥有
                this.useBtn.skin = 'skinUI/tw_btn_3.png'
                this.costNum.visible = true
                this.costNum.value = '3000'
            }
        } else {
            this.activeTrail(index)
            if (PlayerDataMgr.getPlayerData().msArr[index] == 1) {
                //已拥有
                if (PlayerDataMgr.getPlayerData().msId == index) {
                    //使用中
                    this.useBtn.skin = 'skinUI/tw_btn_4.png'
                } else {
                    //可使用
                    this.useBtn.skin = 'skinUI/tw_btn_2.png'
                }
            } else {
                //未拥有
                this.useBtn.skin = 'skinUI/tw_btn_3.png'
                this.costNum.visible = true
                this.costNum.value = '2000'
            }
        }
        this.updateItem()
    }

    skinBtnCB() {
        this.curPage = 0
        this.chooseId = PlayerDataMgr.getPlayerData().skinId
        this.costNum.visible = false
        this.useBtn.skin = 'skinUI/tw_btn_4.png'
        this.skinBtn.skin = 'skinUI/tw_yq_4.png'
        this.motionBtn.skin = 'skinUI/tw_yq_2.png'
        this.updateItem()
        this.activeTrail(-1)
        Laya.timer.clearAll(this)
        this.skinMode()
    }
    motionBtnCB() {
        this.curPage = 1
        this.chooseId = PlayerDataMgr.getPlayerData().msId
        this.costNum.visible = false
        this.useBtn.skin = 'skinUI/tw_btn_4.png'
        this.skinBtn.skin = 'skinUI/tw_yq_2.png'
        this.motionBtn.skin = 'skinUI/tw_yq_4.png'
        this.updateItem()
        this.trailMode()
    }
    useBtnCB() {
        if (this.useBtn.skin == 'skinUI/tw_btn_2.png') {
            //可使用
            if (this.curPage == 0) {
                PlayerDataMgr.getPlayerData().skinId = this.chooseId
            } else {
                PlayerDataMgr.getPlayerData().msId = this.chooseId
            }
        } else if (this.useBtn.skin == 'skinUI/tw_btn_3.png') {
            //可购买
            if (this.curPage == 0) {
                if (PlayerDataMgr.getPlayerData().coin >= 3000) {
                    PlayerDataMgr.getPlayerData().skinArr[this.chooseId] = 1
                    PlayerDataMgr.getPlayerData().skinId = this.chooseId
                    PlayerDataMgr.getPlayerData().coin -= 3000
                    this.costNum.visible = false
                    this.useBtn.skin = 'skinUI/tw_btn_4.png'
                } else {
                    WxApi.OpenAlert('钻石不足！')
                }
            } else {
                if (PlayerDataMgr.getPlayerData().coin >= 2000) {
                    PlayerDataMgr.getPlayerData().msArr[this.chooseId] = 1
                    PlayerDataMgr.getPlayerData().msId = this.chooseId
                    PlayerDataMgr.getPlayerData().coin -= 2000
                    this.costNum.visible = false
                    this.useBtn.skin = 'skinUI/tw_btn_4.png'
                } else {
                    WxApi.OpenAlert('钻石不足！')
                }
            }
        }
        PlayerDataMgr.setPlayerData()
        this.updateItem()
    }
    adBtnCB() {
        let cb = () => {
            PlayerDataMgr.getPlayerData().coin += 1000
            PlayerDataMgr.setPlayerData()
            WxApi.OpenAlert('获得1000钻石！')
        }
        ShareMgr.instance.shareGame(cb)
    }
    backBtnCB() {
        Laya.Scene.open('MyScenes/StartUI.scene')
    }

    updateCB() {
        this.coinNum.value = PlayerDataMgr.getPlayerData().coin.toString()
    }
}