import PlayerDataMgr from "../Libs/PlayerDataMgr"
import WxApi from "../Libs/WxApi"
import ShareMgr from "../Mod/ShareMgr"

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

        this.skinBtnCB()
    }

    onClosed() {

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
    }
    motionBtnCB() {
        this.curPage = 1
        this.chooseId = PlayerDataMgr.getPlayerData().msId
        this.costNum.visible = false
        this.useBtn.skin = 'skinUI/tw_btn_4.png'
        this.skinBtn.skin = 'skinUI/tw_yq_2.png'
        this.motionBtn.skin = 'skinUI/tw_yq_4.png'
        this.updateItem()
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