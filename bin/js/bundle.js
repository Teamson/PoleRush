(function () {
    'use strict';

    class ModelPos {
        constructor(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        getV3() {
            return new Laya.Vector3(Number(this.x), Number(this.y), Number(this.z));
        }
    }
    class PlayerData {
        constructor() {
            this.grade = 1;
            this.coin = 90000;
            this.skinId = 0;
            this.skinArr = [1, 0, 0, 0, 0];
            this.msId = 0;
            this.msArr = [1, 0, 0, 0, 0, 0];
            this.exitTime = 0;
        }
    }
    class PlayerDataMgr {
        static getPlayerData() {
            if (!localStorage.getItem('playerData')) {
                this._playerData = new PlayerData();
                localStorage.setItem('playerData', JSON.stringify(this._playerData));
            }
            else {
                if (this._playerData == null) {
                    this._playerData = JSON.parse(localStorage.getItem('playerData'));
                }
            }
            return this._playerData;
        }
        static setPlayerData() {
            localStorage.setItem('playerData', JSON.stringify(this._playerData));
        }
        static changeCoin(dt) {
            this._playerData.coin += dt;
            this.setPlayerData();
        }
        static setExitTime() {
            this._playerData.exitTime = new Date().getTime();
            this.setPlayerData();
        }
        static getFruitColor(id) {
            if (id == 0) {
                return Laya.Color.RED;
            }
            else if (id == 1) {
                return Laya.Color.GREEN;
            }
            else if (id == 2) {
                return Laya.Color.YELLOW;
            }
        }
    }
    PlayerDataMgr._playerData = null;
    PlayerDataMgr.powerMax = 10;
    PlayerDataMgr.tempSkinId = -1;
    PlayerDataMgr.roadArr1 = [];
    PlayerDataMgr.roadArr2 = [];
    PlayerDataMgr.roadArr3 = [];

    class JJUtils {
        static httpRequest(url, params, type = 'get', completeHandler) {
            var xhr = new Laya.HttpRequest();
            xhr.http.timeout = 5000;
            xhr.once(Laya.Event.COMPLETE, this, completeHandler);
            xhr.once(Laya.Event.ERROR, this, this.httpRequest, [url, params, type, completeHandler]);
            if (type == "get") {
                xhr.send(url + '?' + params, "", type, "text");
            }
            else if (type == "post") {
                xhr.send(url, JSON.stringify(params), type, "text");
            }
        }
        static shuffleArr(arr) {
            let i = arr.length;
            while (i) {
                let j = Math.floor(Math.random() * i--);
                [arr[j], arr[i]] = [arr[i], arr[j]];
            }
            return arr;
        }
        static fixNodeY(node) {
            node.y = node.y * Laya.stage.displayHeight / Laya.stage.designHeight;
        }
        static visibleDelay(node, duration = 1500) {
            node.visible = false;
            Laya.timer.once(duration, this, () => {
                node.visible = true;
            });
        }
        static tMove(node, x, y, t, cb) {
            Laya.Tween.to(node, { x: x, y: y }, t, null, new Laya.Handler(this, () => {
                cb && cb();
            }));
        }
    }

    var SceneDir;
    (function (SceneDir) {
        SceneDir["SCENE_FRIENDGAME"] = "JJExport/FriendGameUI.scene";
        SceneDir["SCENE_SCROLLUI"] = "JJExport/ScrollUI.scene";
        SceneDir["SCENE_RECOMMENDUI"] = "JJExport/RecommendUI.scene";
        SceneDir["SCENE_FULLGAMEUI"] = "JJExport/FullGameUI.scene";
        SceneDir["SCENE_FINISHGAMEUI"] = "JJExport/FinishGameUI.scene";
        SceneDir["SCENE_DRAWUI"] = "JJExport/DrawUI.scene";
        SceneDir["SCENE_PROGRAMUI"] = "JJExport/ProgramUI.scene";
        SceneDir["SCENE_WECHATUI"] = "JJExport/WeChatUI.scene";
        SceneDir["SCENE_STARTNAVUI"] = "JJExport/StartNavUI.scene";
    })(SceneDir || (SceneDir = {}));
    class JJMgr {
        constructor() {
            this.dataConfig = {
                allow_share: true,
                front_allow_return: true,
                front_banner_number: 8,
                front_banner_second: 800,
                front_button_second: 300,
                front_ckin_banner_move: 700,
                front_ckin_banner_second: 500,
                front_direct_draw: true,
                front_extra_share: false,
                front_home_screen_level: 10,
                front_home_screen_number: 5,
                front_lucky_screen_chance: 50,
                front_lucky_screen_level: 20,
                front_lucky_screen_number: 5,
                front_pass_gate: 10,
                front_proceed_game: 1000,
                front_proceed_history: 1,
                front_share_config: { image: "https://oss.99huyu.cn/wxhuyu/a1f98703efb3f3bfe2b9a4d5a250f926.png", title: "根据实际年纪看看你该在啥水平..." },
                front_share_number: 4,
                is_allow_area: 1
            };
            this.navDataArr = [];
            this.JJConfigUrl = 'https://wxhy.jiujiuhuyu.com/m/tqxiaonengshou/config.json';
            this.isFinished = false;
            this.isNavigating = false;
        }
        static get instance() {
            if (!this._instance) {
                this._instance = new JJMgr();
            }
            return this._instance;
        }
        canShowFullScreen(level) {
            return level > this.dataConfig.front_auto_remen_level;
        }
        initJJ(version = '1.0.0', completeCB) {
            JJUtils.httpRequest(this.JJConfigUrl, 'version=' + version, 'get', (res) => {
                res = JSON.parse(res);
                console.log('JJ config.json:', res);
                this.dataConfig = res.data.config;
                this.navDataArr = res.data.mores.remen_game;
                this.isFinished = true;
                completeCB && completeCB();
            });
        }
        openScene(sceneDir, closeOther = false, param, parent) {
            if (!this.dataConfig.front_all_export_switch && param && param.closeCallbackFun) {
                param.closeCallbackFun();
                return;
            }
            else if (!this.dataConfig.front_all_export_switch && param && param.continueCallbackFun) {
                param.continueCallbackFun();
                return;
            }
            else if (!this.dataConfig.front_all_export_switch) {
                return;
            }
            Laya.Scene.open(sceneDir, closeOther, param, Laya.Handler.create(this, (v) => {
                if (parent)
                    parent.addChild(v);
            }));
        }
        closeScene(sceneDir) {
            Laya.Scene.close(sceneDir);
        }
        NavigateApp(index, cancelCB, successCB) {
            if (Laya.Browser.onWeiXin && !this.isNavigating) {
                this.isNavigating = true;
                WxApi.aldEvent('导出总点击数');
                Laya.Browser.window.wx.navigateToMiniProgram({
                    appId: this.navDataArr[index].appid,
                    path: this.navDataArr[index].path,
                    success: (res) => {
                        this.isNavigating = false;
                        successCB && successCB();
                        WxApi.aldEvent('导出成功-总用户数');
                        WxApi.aldEvent('导出成功-' + this.getTitle(index, false));
                    },
                    fail: (res) => {
                        this.isNavigating = false;
                        cancelCB && cancelCB();
                    }
                });
            }
        }
        getTitle(index, sub = true) {
            if (sub) {
                return this.navDataArr[index].subtitle || this.navDataArr[index].title;
            }
            else {
                return this.navDataArr[index].title;
            }
        }
    }

    class ShareMgr {
        constructor() {
            this.path = '';
            this.picCount = 3;
            this.preT = 0;
            this.shareTips = [
                '请分享到活跃的群！',
                '请分享到不同群！',
                '请分享给好友！',
                '请分享给20人以上的群！'
            ];
        }
        static get instance() {
            if (!this._instance) {
                this._instance = new ShareMgr();
            }
            return this._instance;
        }
        initShare() {
            if (Laya.Browser.onWeiXin) {
                Laya.Browser.window.wx.showShareMenu({
                    withShareTicket: true,
                    menus: ['shareAppMessage', 'shareTimeline']
                });
                let dir = JJMgr.instance.dataConfig.front_share_config.image;
                let content = JJMgr.instance.dataConfig.front_share_config.title;
                Laya.Browser.window.wx.onShareAppMessage(function (res) {
                    return {
                        title: content,
                        imageUrl: dir,
                    };
                });
                Laya.Browser.window.wx.onShow((para) => {
                    if (WxApi.shareCallback) {
                        console.log('share!!!');
                        if (AdMgr.instance.adCloseCallback) {
                            AdMgr.instance.adCloseCallback();
                        }
                        let t = new Date().getTime();
                        let diff = t - WxApi.shareTime;
                        if (diff / 1000 >= 3 && !WxApi.firstShare) {
                            WxApi.shareCallback();
                            Laya.Browser.window.wx.showToast({
                                title: '分享成功',
                                icon: 'none',
                                duration: 2000
                            });
                            WxApi.front_share_number--;
                            let fsn = parseInt(localStorage.getItem('front_share_number'));
                            fsn--;
                            localStorage.setItem('front_share_number', fsn.toString());
                            WxApi.shareCallback = null;
                        }
                        else {
                            WxApi.firstShare = false;
                            Laya.Browser.window.wx.showModal({
                                title: '提示',
                                content: this.shareTips[Math.floor(Math.random() * this.shareTips.length)],
                                confirmText: '重新分享',
                                success(res) {
                                    if (res.confirm) {
                                        console.log('用户点击确定');
                                        ShareMgr.instance.shareGame(WxApi.shareCallback);
                                    }
                                    else if (res.cancel) {
                                        console.log('用户点击取消');
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
        shareGame(cb) {
            if (WxApi.front_share_number <= 0 && !AdMgr.instance.videoIsError) {
                AdMgr.instance.showVideo(cb);
                return;
            }
            WxApi.shareCallback = cb;
            if (!Laya.Browser.onWeiXin) {
                cb();
                return;
            }
            WxApi.shareTime = new Date().getTime();
            let dir = JJMgr.instance.dataConfig.front_share_config.image;
            let content = JJMgr.instance.dataConfig.front_share_config.title;
            Laya.Browser.window.wx.shareAppMessage({
                title: content,
                imageUrl: dir
            });
        }
    }

    class AdMgr {
        constructor() {
            this.bannerUnitId = ['adunit-92e98b7e5de0d1d4', 'adunit-83cb1985411aee2c'];
            this.videoUnitId = 'adunit-6500db342ddd249b';
            this.bannerAd = null;
            this.videoAd = null;
            this.videoCallback = null;
            this.adCloseCallback = null;
            this.curBannerId = 0;
            this.showBannerCount = 0;
            this.videoIsError = true;
            this.videoLoaded = false;
            this.isBannerError = true;
        }
        static get instance() {
            if (!this._instance) {
                this._instance = new AdMgr();
            }
            return this._instance;
        }
        initAd() {
            if (Laya.Browser.onWeiXin) {
                this.initBanner();
                this.initVideo();
            }
        }
        initBanner() {
            this.isBannerError = false;
            let isIphonex = false;
            if (Laya.Browser.onWeiXin) {
                Laya.Browser.window.wx.getSystemInfo({
                    success: res => {
                        let modelmes = res.model;
                        if (modelmes.search('iPhone X') != -1) {
                            isIphonex = true;
                        }
                    }
                });
            }
            let winSize = Laya.Browser.window.wx.getSystemInfoSync();
            this.bannerAd = Laya.Browser.window.wx.createBannerAd({
                adUnitId: this.bannerUnitId[this.curBannerId],
                style: {
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 300
                }
            });
            this.bannerAd.onResize(res => {
                if (isIphonex) {
                    this.bannerAd.style.top = winSize.windowHeight - this.bannerAd.style.realHeight - 10;
                }
                else {
                    this.bannerAd.style.top = winSize.windowHeight - this.bannerAd.style.realHeight;
                }
                this.bannerAd.style.left = winSize.windowWidth / 2 - this.bannerAd.style.realWidth / 2;
            });
            this.bannerAd.onError(res => {
                this.isBannerError = true;
                console.log('banner error:', JSON.stringify(res));
            });
        }
        hideBanner(isCount = true) {
            if (Laya.Browser.onWeiXin) {
                if (this.isBannerError) {
                    JJMgr.instance.closeScene(SceneDir.SCENE_SCROLLUI);
                }
                else {
                    this.bannerAd.hide();
                    if (JJMgr.instance.dataConfig != null && this.showBannerCount >= parseInt(JJMgr.instance.dataConfig.front_banner_number) && isCount) {
                        this.showBannerCount = 0;
                        this.curBannerId++;
                        if (this.curBannerId >= this.bannerUnitId.length) {
                            this.curBannerId = 0;
                        }
                        console.log('destroy banner');
                        this.bannerAd.destroy();
                        this.bannerAd = null;
                        this.initBanner();
                    }
                }
            }
            else {
                JJMgr.instance.closeScene(SceneDir.SCENE_SCROLLUI);
            }
        }
        showBanner(isBig = false) {
            if (Laya.Browser.onWeiXin) {
                this.showBannerCount++;
                if (this.isBannerError && !WxApi.isKillBossUI) {
                    JJMgr.instance.openScene(SceneDir.SCENE_SCROLLUI, false);
                }
                else {
                    if (isBig) {
                        this.bannerAd.style.width = 750;
                        this.bannerAd.style.height = 300;
                    }
                    else {
                        this.bannerAd.style.width = 0;
                        this.bannerAd.style.height = 300;
                    }
                    this.bannerAd.show();
                }
            }
            else {
                JJMgr.instance.openScene(SceneDir.SCENE_SCROLLUI, false);
            }
        }
        destroyBanner() {
            if (Laya.Browser.onWeiXin && this.bannerAd) {
                this.bannerAd.destroy();
                this.bannerAd = null;
            }
        }
        initVideo() {
            if (!Laya.Browser.onWeiXin) {
                return;
            }
            if (!this.videoAd) {
                this.videoAd = Laya.Browser.window.wx.createRewardedVideoAd({
                    adUnitId: this.videoUnitId
                });
            }
            this.loadVideo();
            this.videoAd.onLoad(() => {
                console.log('激励视频加载成功');
                this.videoLoaded = true;
            });
            this.videoAd.onError(res => {
                console.log('video Error:', JSON.stringify(res));
                this.videoIsError = true;
            });
        }
        loadVideo() {
            if (Laya.Browser.onWeiXin && this.videoAd != null) {
                this.videoIsError = false;
                this.videoAd.load();
            }
        }
        showVideo(cb) {
            this.videoCallback = cb;
            if (!Laya.Browser.onWeiXin) {
                this.videoCallback();
                this.adCloseCallback && this.adCloseCallback();
                this.adCloseCallback = null;
                return;
            }
            if (this.videoIsError) {
                ShareMgr.instance.shareGame(cb);
                this.loadVideo();
                return;
            }
            if (this.videoLoaded == false) {
                WxApi.OpenAlert('视频正在加载中！');
                return;
            }
            if (this.videoAd) {
                this.videoAd.offClose();
            }
            Laya.SoundManager.muted = true;
            this.videoAd.onClose(res => {
                if (res && res.isEnded || res === undefined) {
                    console.log('正常播放结束，可以下发游戏奖励');
                    this.videoCallback();
                }
                else {
                    console.log('播放中途退出，不下发游戏奖励');
                }
                this.adCloseCallback && this.adCloseCallback();
                this.adCloseCallback = null;
                Laya.SoundManager.muted = false;
                this.videoLoaded = false;
                this.loadVideo();
            });
            this.videoAd.show();
        }
    }

    class Utility {
        static calcDistance(a, b) {
            return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        }
        static getWorldDis(a, b) {
            let pA = a.transform.position.clone();
            let pB = b.transform.position.clone();
            return Laya.Vector3.distance(pA, pB);
        }
        static getDirectionAToB(A, B, normalize = true) {
            let pA = A.transform.position.clone();
            let pB = B.transform.position.clone();
            let dir = new Laya.Vector3(0, 0, 0);
            Laya.Vector3.subtract(pB, pA, dir);
            if (normalize)
                Laya.Vector3.normalize(dir, dir);
            return dir;
        }
        static fixPosY(y, designHeight = 1334) {
            return y * Laya.stage.displayHeight / designHeight;
        }
        static findNodeByName(rootNode, name) {
            let targetNode = null;
            let funC = (node) => {
                for (let i = 0; i < node.numChildren; i++) {
                    if (node.getChildAt(i).name == name) {
                        targetNode = node.getChildAt(i);
                        return;
                    }
                    else {
                        funC(node.getChildAt(i));
                    }
                }
            };
            funC(rootNode);
            return targetNode;
        }
        static TmoveTo(node, duration, des, cb, ease) {
            let t = new Laya.Tween();
            var posOld = node.transform.position;
            t.to(node.transform.position, {
                x: des.x,
                y: des.y,
                z: des.z,
                update: new Laya.Handler(this, () => {
                    node.transform.position = posOld;
                })
            }, duration, ease ? ease : Laya.Ease.cubicOut, Laya.Handler.create(this, () => {
                cb && cb();
            }));
        }
        static TmoveToYZ(node, duration, des, cb, ease) {
            let t = new Laya.Tween();
            var posOld = node.transform.position;
            t.to(node.transform.position, {
                y: des.y,
                z: des.z,
                update: new Laya.Handler(this, () => {
                    node.transform.position = posOld;
                })
            }, duration, null, Laya.Handler.create(this, () => {
                cb && cb();
            }));
        }
        static TmoveToX(node, duration, des, cb, ease) {
            let t = new Laya.Tween();
            var posOld = node.transform.localPosition;
            t.to(node.transform.localPosition, {
                x: des.x,
                update: new Laya.Handler(this, () => {
                    node.transform.localPosition = posOld;
                })
            }, duration, null, Laya.Handler.create(this, () => {
                cb && cb();
            }));
        }
        static RotateTo(node, duration, des, cb) {
            var rotationOld = node.transform.localRotationEuler;
            Laya.Tween.to(node.transform.localRotationEuler, {
                x: des.x,
                y: des.y,
                z: des.z,
                update: new Laya.Handler(this, function () {
                    if (node)
                        node.transform.localRotationEuler = rotationOld;
                })
            }, duration, Laya.Ease.cubicOut, Laya.Handler.create(this, function () {
                cb && cb();
            }));
        }
        static tMove2D(node, x, y, t, cb) {
            Laya.Tween.to(node, { x: x, y: y }, t, null, new Laya.Handler(this, () => {
                if (cb)
                    cb();
            }));
        }
        static updateNumber(baseNum, times, label, labelOrFont = true, inclease, cb) {
            let timesNum = baseNum * times;
            let dt = Math.floor((timesNum - baseNum) / 60);
            dt = dt <= 0 ? 1 : dt;
            let func = () => {
                if (inclease) {
                    baseNum += dt;
                    if (baseNum >= timesNum) {
                        baseNum = timesNum;
                        cb && cb();
                        Laya.timer.clear(this, func);
                    }
                    if (labelOrFont)
                        label.text = baseNum.toString();
                    else
                        label.value = baseNum.toString();
                }
                else {
                    timesNum -= dt;
                    if (timesNum <= baseNum) {
                        timesNum = baseNum;
                        cb && cb();
                        Laya.timer.clear(this, func);
                    }
                    if (labelOrFont)
                        label.text = timesNum.toString();
                    else
                        label.value = timesNum.toString();
                }
            };
            Laya.timer.frameLoop(1, this, func);
        }
        static loadJson(str, complete) {
            Laya.loader.load(str, Laya.Handler.create(this, complete), null, Laya.Loader.JSON);
        }
        static objectShake(target, shakeTime = 1, shakeAmount = 0.7) {
            var shake = shakeTime;
            var decreaseFactor = 1;
            var originalPos = target.transform.localPosition.clone();
            Laya.timer.frameLoop(1, this, updateShake);
            function randomPos() {
                var x = Math.random() > 0.5 ? Math.random() : -(Math.random());
                var y = Math.random() > 0.5 ? Math.random() : -(Math.random());
                return new Laya.Vector3(x, y, 0);
            }
            function updateShake() {
                if (shake > 0) {
                    var pos = new Laya.Vector3();
                    Laya.Vector3.scale(randomPos(), shakeAmount, pos);
                    Laya.Vector3.add(originalPos, pos, pos);
                    target.transform.localPosition = pos;
                    shake -= 0.02 * decreaseFactor;
                }
                else {
                    shake = 0;
                    target.transform.localPosition = originalPos;
                    Laya.timer.clear(this, updateShake);
                }
            }
        }
        static getRandomItemInArr(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        }
        static shuffleArr(arr) {
            let i = arr.length;
            while (i) {
                let j = Math.floor(Math.random() * i--);
                [arr[j], arr[i]] = [arr[i], arr[j]];
            }
            return arr;
        }
        static GetRandom(mix, max, isInt = true) {
            let w = max - mix;
            let r1 = Math.random() * w + 1;
            r1 += mix;
            return isInt ? Math.floor(r1) : r1;
        }
        static coinCollectAnim(startPos, endPos, parent, amount = 10, callBack) {
            let am = amount;
            for (var i = 0; i < amount; i++) {
                let coin = Laya.Pool.getItemByClass("coin", Laya.Image);
                coin.skin = "startUI/zy_zs_1.png";
                coin.x = startPos.x;
                coin.y = startPos.y;
                parent.addChild(coin);
                let time = 300 + Math.random() * 100 - 50;
                Laya.Tween.to(coin, { x: coin.x + Math.random() * 250 - 125, y: coin.y + Math.random() * 250 - 125 }, time);
                Laya.timer.once(time + 50, this, function () {
                    Laya.Tween.to(coin, { x: endPos.x, y: endPos.y }, 400, null, new Laya.Handler(this, function () {
                        parent.removeChild(coin);
                        Laya.Pool.recover("coin", coin);
                        am--;
                        if (am == 0 && callBack)
                            callBack();
                    }));
                });
            }
        }
        static scaleLoop(node, rate, t) {
            var tw = Laya.Tween.to(node, { scaleX: rate, scaleY: rate }, t, null, new Laya.Handler(this, () => {
                Laya.Tween.to(node, { scaleX: 1, scaleY: 1 }, t, null, new Laya.Handler(this, () => {
                    this.scaleLoop(node, rate, t);
                }));
            }));
        }
        static rotateLoop(node, rate, t) {
            var tw = Laya.Tween.to(node, { rotation: rate }, t, null, new Laya.Handler(this, () => {
                Laya.Tween.to(node, { rotation: -rate }, 2 * t, null, new Laya.Handler(this, () => {
                    Laya.Tween.to(node, { rotation: 0 }, t, null, new Laya.Handler(this, () => {
                        this.rotateLoop(node, rate, t);
                    }));
                }));
            }));
        }
        static visibleDelay(node, duration) {
            node.visible = false;
            Laya.timer.once(duration, this, () => { node.visible = true; });
        }
        static pointInPolygon(point, vs) {
            var x = point.x, y = point.y;
            var inside = false;
            for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                var xi = vs[i].x, yi = vs[i].y;
                var xj = vs[j].x, yj = vs[j].y;
                var intersect = ((yi > y) != (yj > y))
                    && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect)
                    inside = !inside;
            }
            return inside;
        }
        static getSprite3DResByUrl(url, parent) {
            let res = Laya.loader.getRes(WxApi.UnityPath + url);
            return Laya.Sprite3D.instantiate(res, parent, false, new Laya.Vector3(0, 0, 0));
        }
        static getRandomItemInArrWithoutSelf(self, arr, count = 1) {
            let temp = [].concat(arr);
            temp.splice(temp.indexOf(self), 1);
            temp = this.shuffleArr(temp);
            return temp.slice(0, count);
        }
        static getBoundBox(node) {
            let coll = node.getComponent(Laya.PhysicsCollider);
            let shape = coll.colliderShape;
            let pos = node.transform.position.clone();
            pos.x += shape.localOffset.x;
            pos.y += shape.localOffset.y;
            pos.z += shape.localOffset.z;
            let min = new Laya.Vector3(pos.x - shape.sizeX / 2, pos.y - shape.sizeY / 2, pos.z - shape.sizeZ / 2);
            let max = new Laya.Vector3(pos.x + shape.sizeX / 2, pos.y + shape.sizeY / 2, pos.z + shape.sizeZ / 2);
            return new Laya.BoundBox(min, max);
        }
    }

    class WxApi {
        static LoginWx(cb) {
            if (!Laya.Browser.onWeiXin)
                return;
            let launchData = Laya.Browser.window.wx.getLaunchOptionsSync();
            Laya.Browser.window.wx.login({
                success(res) {
                    if (res.code) {
                        console.log('res.code:', res.code);
                        if (cb) {
                            cb(res.code, launchData.query);
                        }
                    }
                }
            });
        }
        static checkScope(btnNode) {
            if (Laya.Browser.onWeiXin) {
                Laya.Browser.window.wx.getSetting({
                    success: (response) => {
                        if (!response.authSetting['scope.userInfo']) {
                            console.log('没有授权');
                            this.createScope(btnNode);
                        }
                        else {
                            console.log('已经授权');
                        }
                    }
                });
            }
        }
        static createScope(btnNode) {
            this.scopeBtn = Laya.Browser.window.wx.createUserInfoButton({
                type: 'text',
                text: '',
                style: {
                    left: btnNode.x,
                    top: btnNode.y,
                    width: btnNode.width,
                    height: btnNode.height,
                    lineHeight: 40,
                    backgroundColor: '#ffffff',
                    color: '#ffffff',
                    textAlign: 'center',
                    fontSize: 16,
                    borderRadius: 0
                }
            });
            this.scopeBtn.onTap((res) => {
                if (res.errMsg == "getUserInfo:ok") {
                    this.scopeBtn.destroy();
                    this.scopeBtn = null;
                }
                else if (res.errMsg == 'getUserInfo:fail auth deny') {
                    this.scopeBtn.destroy();
                    this.scopeBtn = null;
                }
            });
        }
        static GetLaunchParam(fun) {
            if (Laya.Browser.onWeiXin) {
                this.OnShowFun = fun;
                fun(this.GetLaunchPassVar());
                Laya.Browser.window.wx.onShow((para) => {
                    if (this.OnShowFun != null) {
                        this.OnShowFun(para);
                    }
                    console.log("wx on show");
                });
            }
        }
        static GetLaunchPassVar() {
            if (Laya.Browser.onWeiXin) {
                return Laya.Browser.window.wx.getLaunchOptionsSync();
            }
            else {
                return null;
            }
        }
        static WxOnHide(fun) {
            if (Laya.Browser.onWeiXin) {
                Laya.Browser.window.wx.onHide(fun);
            }
        }
        static WxOffHide(fun) {
            if (fun && Laya.Browser.onWeiXin) {
                Laya.Browser.window.wx.offHide(fun);
            }
        }
        static httpRequest(url, params, type = 'get', completeHandler) {
            var xhr = new Laya.HttpRequest();
            xhr.http.timeout = 5000;
            xhr.once(Laya.Event.COMPLETE, this, completeHandler);
            xhr.once(Laya.Event.ERROR, this, this.httpRequest, [url, params, type, completeHandler]);
            if (type == "get") {
                xhr.send(url + '?' + params, "", type, "text");
            }
            else if (type == "post") {
                xhr.send(url, JSON.stringify(params), type, "text");
            }
        }
        static DoVibrate(isShort = true) {
            if (Laya.Browser.onWeiXin && this.isVibrate) {
                if (isShort) {
                    Laya.Browser.window.wx.vibrateShort();
                }
                else {
                    Laya.Browser.window.wx.vibrateLong();
                }
            }
        }
        static OpenAlert(msg, dur = 2000, icon = false) {
            if (Laya.Browser.onWeiXin) {
                Laya.Browser.window.wx.showToast({
                    title: msg,
                    duration: dur,
                    mask: false,
                    icon: icon ? 'success' : 'none',
                });
            }
        }
        static NavigateApp(appid, path, title, cancelCB, successCB) {
            if (Laya.Browser.onWeiXin) {
                let self = this;
                Laya.Browser.window.wx.navigateToMiniProgram({
                    appId: appid,
                    path: path,
                    success(res) {
                        console.log('打开成功');
                        successCB();
                    },
                    fail(res) {
                        console.log('打开失败');
                        cancelCB();
                    }
                });
            }
        }
        static preViewImage(url) {
            if (Laya.Browser.onWeiXin) {
                Laya.Browser.window.wx.previewImage({
                    current: url,
                    urls: [url]
                });
            }
        }
        static aldEvent(str) {
            if (Laya.Browser.onWeiXin)
                Laya.Browser.window.wx.aldSendEvent(str);
        }
        static fixBtnTouchPos(btn, startPosY, endPosY, target, cb, useEnd) {
            if (this.isValidBanner()) {
                btn.y = startPosY;
                Laya.timer.once(JJMgr.instance.dataConfig.front_banner_showtime, target, () => { AdMgr.instance.showBanner(); });
                Laya.timer.once(JJMgr.instance.dataConfig.front_banner_showtime + JJMgr.instance.dataConfig.front_button_moveup, target, () => {
                    Utility.tMove2D(btn, btn.x, endPosY, 1000);
                    cb && cb();
                });
            }
            else {
                btn.y = useEnd ? endPosY : startPosY;
                if (useEnd)
                    AdMgr.instance.showBanner();
                cb && cb();
            }
        }
        static isValidBanner() {
            return PlayerDataMgr.getPlayerData().grade >= JJMgr.instance.dataConfig.front_pass_gate && JJMgr.instance.dataConfig.is_allow_area == 1
                && this.allowScene();
        }
        static allowScene() {
            let s = JJMgr.instance.dataConfig.front_wuchu_scene.toString();
            if (s.search('|') == -1) {
                let sInt = parseInt(s);
                return sInt == WxApi.sceneId;
            }
            let sArr = s.split('|');
            for (let i = 0; i < sArr.length; i++) {
                let sInt = parseInt(sArr[i]);
                if (sInt == WxApi.sceneId) {
                    return true;
                }
            }
            return false;
        }
        static bannerWuChu2() {
            clearTimeout(this.bannerTO2);
            AdMgr.instance.hideBanner();
            if (WxApi.isValidBanner()) {
                let upTime = JJMgr.instance.dataConfig.front_export_banner_appear;
                let downTime = upTime + JJMgr.instance.dataConfig.front_export_banner_hide;
                this.bannerTO2 = setTimeout(() => {
                    AdMgr.instance.showBanner();
                    this.bannerTO2 = setTimeout(() => {
                        AdMgr.instance.hideBanner();
                    }, downTime);
                }, upTime);
            }
            else {
                AdMgr.instance.hideBanner();
            }
        }
        static bannerWuChu1() {
            clearTimeout(this.bannerTO1);
            AdMgr.instance.hideBanner();
            if (WxApi.isValidBanner()) {
                let upTime = JJMgr.instance.dataConfig.front_baokuan_banner_appear;
                let downTime = upTime + JJMgr.instance.dataConfig.front_baokuan_banner_hide;
                this.bannerTO1 = setTimeout(() => {
                    AdMgr.instance.showBanner();
                    this.bannerTO1 = setTimeout(() => {
                        AdMgr.instance.hideBanner();
                    }, downTime);
                }, upTime);
            }
            else {
                AdMgr.instance.hideBanner();
            }
        }
        static splitSection() {
            let s = JJMgr.instance.dataConfig.front_water_section.toString();
            if (s.search('|') == -1) {
                let sInt = parseInt(s);
                return [sInt];
            }
            let sArr = s.split('|');
            let iArr = [];
            for (let i = 0; i < sArr.length; i++) {
                let sInt = parseInt(sArr[i]);
                iArr.push(sInt);
            }
            return iArr;
        }
        static getIsExportValid() {
            return JJMgr.instance.dataConfig.front_all_export_switch;
        }
        static calculateShareNumber() {
            if (localStorage.getItem('lastDate')) {
                if (new Date().getDate() == parseInt(localStorage.getItem('lastDate'))) {
                    this.front_share_number = parseInt(localStorage.getItem('front_share_number'));
                }
                else {
                    this.front_share_number = JJMgr.instance.dataConfig.front_banner_number;
                }
            }
            else {
                this.front_share_number = JJMgr.instance.dataConfig.front_banner_number;
            }
            console.log('this.front_share_number:', this.front_share_number);
        }
    }
    WxApi.UnityPath = 'LayaScene_SampleScene/Conventional/';
    WxApi.openId = '';
    WxApi.version = '1.0.1';
    WxApi.isVibrate = true;
    WxApi.isMusic = true;
    WxApi.OnShowFun = null;
    WxApi.scopeBtn = null;
    WxApi.shareCallback = null;
    WxApi.front_share_number = 0;
    WxApi.sceneId = 0;
    WxApi.gotOfflineBounes = false;
    WxApi.configData = null;
    WxApi.shareTime = 0;
    WxApi.firstShare = true;
    WxApi.hadShowFriendUI = false;
    WxApi.launchGameUI = false;
    WxApi.firstStartGame = false;
    WxApi.isKillBossUI = false;
    WxApi.fromKillBossUI = false;
    WxApi.killbossCallback = null;
    WxApi.tempGrade = 1;
    WxApi.bannerTO2 = -1;
    WxApi.bannerTO1 = -1;

    class Player extends Laya.Script {
        constructor() {
            super();
            this.myOwner = null;
            this._ani = null;
            this.isDied = false;
            this.speed = 0.2;
            this.roadEdge = 11;
            this.trail1 = null;
            this.trail2 = null;
            this.trail3 = null;
            this.trail4 = null;
            this.trail5 = null;
            this.trail6 = null;
            this.LandFX = null;
        }
        onEnable() {
            this.myOwner = this.owner;
            this._ani = this.owner.getComponent(Laya.Animator);
            this.playIdle();
            this.myOwner.transform.rotate(new Laya.Vector3(0, -90, 0), true, false);
            let pos = this.getMyPos();
            pos.x -= 1;
            this.myOwner.transform.position = pos;
            this.trail1 = this.myOwner.getChildByName('Trail1');
            this.trail2 = this.myOwner.getChildByName('Trail2');
            this.trail3 = this.myOwner.getChildByName('Trail3');
            this.trail4 = this.myOwner.getChildByName('Trail4');
            this.trail5 = this.myOwner.getChildByName('Trail5');
            this.trail6 = this.myOwner.getChildByName('Trail6');
            this.LandFX = this.myOwner.getChildByName('LandFX');
            for (let i = 1; i <= 6; i++) {
                this['trail' + i].active = i - 1 == PlayerDataMgr.getPlayerData().msId;
            }
            this.LandFX.active = false;
        }
        onDisable() {
        }
        getMyPos() {
            return this.myOwner.transform.position.clone();
        }
        playIdle() {
            if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'idle')
                return;
            this._ani.play('idle');
        }
        playRun(reset) {
            if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'run')
                return;
            if (reset) {
                let pos = this.getMyPos();
                pos.x = 0;
                this.myOwner.transform.position = pos;
                this.myOwner.transform.rotate(new Laya.Vector3(0, 90, 0), true, false);
            }
            this._ani.play('run');
        }
        playHang() {
            if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'hang')
                return;
            this._ani.play('hang');
        }
        playFall() {
            if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'fall')
                return;
            this._ani.play('fall');
        }
        playDie() {
            if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'die')
                return;
            this._ani.play('die');
        }
        playDance() {
            if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'dance')
                return;
            this._ani.play('dance');
        }
        activeLandFX() {
            this.LandFX.active = true;
            this.LandFX.particleSystem.play();
            Laya.timer.once(1000, this, () => {
                this.LandFX.active = false;
            });
        }
        moveX(dtX) {
            if (GameLogic.Share.isGameOver || this.isDied) {
                return;
            }
            if (this.myOwner.transform.position.x + dtX > this.roadEdge) {
                this.myOwner.transform.position = new Laya.Vector3(this.roadEdge, this.myOwner.transform.position.clone().y, this.myOwner.transform.position.clone().z);
                return;
            }
            else if (this.myOwner.transform.position.x + dtX < -this.roadEdge) {
                this.myOwner.transform.position = new Laya.Vector3(-this.roadEdge, this.myOwner.transform.position.clone().y, this.myOwner.transform.position.clone().z);
                return;
            }
            let newPos = new Laya.Vector3(dtX, 0, 0);
            this.myOwner.transform.translate(newPos, false);
            GameLogic.Share._camera.transform.translate(newPos, false);
        }
        checkMyCollision() {
            for (let i = 0; i < GameLogic.Share._collisionArr.length; i++) {
                let c = GameLogic.Share._collisionArr[i];
                if (c == this.myOwner)
                    continue;
                let mybb = Utility.getBoundBox(this.myOwner);
                let obb = Utility.getBoundBox(c);
                if (Laya.CollisionUtils.intersectsBoxAndBox(mybb, obb)) {
                    if (c.name.search('FallArea') != -1) {
                        GameLogic.Share.loseCB(true);
                        return;
                    }
                    else if (c.name.search('SlideArea') != -1 && this._ani.getControllerLayer().getCurrentPlayState().animatorState.name != 'hang') {
                        this.myOwner.transform.translate(new Laya.Vector3(0, -0.5, 0), false);
                        this.playHang();
                    }
                    else if (c.name.search('ExitArea') != -1) {
                        GameLogic.Share._barArr[0].getChildByName('SparkFX1').active = false;
                        GameLogic.Share._barArr[0].getChildByName('SparkFX2').active = false;
                        GameLogic.Share.moveToDes();
                        this._ani.speed = 0;
                        c.removeSelf();
                        GameLogic.Share._collisionArr.splice(GameLogic.Share._collisionArr.indexOf(c), 1);
                        return;
                    }
                }
            }
        }
        onUpdate() {
            if (!GameLogic.Share.isStartGame || GameLogic.Share.isGameOver || GameLogic.Share.isPause)
                return;
            if (this.myOwner.transform.position.z >= GameLogic.Share.totalDistance) {
                GameLogic.Share.winCB();
                return;
            }
            if (this._ani.getControllerLayer().getCurrentPlayState().animatorState.name == 'hang' && !GameLogic.Share.isFlying) {
                if (GameLogic.Share._poleCrl.max.transform.position.x < GameLogic.Share._barArr[0].transform.position.x + 2.5 ||
                    GameLogic.Share._poleCrl.min.transform.position.x > GameLogic.Share._barArr[0].transform.position.x - 2.5) {
                    GameLogic.Share._barArr[0].getChildByName('SparkFX1').active = false;
                    GameLogic.Share._barArr[0].getChildByName('SparkFX2').active = false;
                    GameLogic.Share.loseCB(true);
                    return;
                }
                GameLogic.Share._barArr[0].getChildByName('SparkFX1').active = true;
                GameLogic.Share._barArr[0].getChildByName('SparkFX2').active = true;
                let p1 = GameLogic.Share._barArr[0].getChildByName('SparkFX1').transform.position.clone();
                p1.z = this.myOwner.transform.position.z + 1.5;
                let p2 = GameLogic.Share._barArr[0].getChildByName('SparkFX2').transform.position.clone();
                p2.z = this.myOwner.transform.position.z + 1.5;
                GameLogic.Share._barArr[0].getChildByName('SparkFX1').transform.position = p1;
                GameLogic.Share._barArr[0].getChildByName('SparkFX2').transform.position = p2;
            }
            if (!GameLogic.Share.isFlying) {
                let newPos = new Laya.Vector3(0, 0, this.speed);
                this.myOwner.transform.translate(newPos, false);
                GameLogic.Share._camera.transform.translate(newPos, false);
            }
            else {
                let p = new Laya.Vector3(0, 0, 0);
                Laya.Vector3.add(this.myOwner.transform.position.clone(), GameLogic.Share.camStartPos, p);
                GameLogic.Share._camera.transform.position = p;
            }
            this.checkMyCollision();
        }
    }

    class Pole extends Laya.Script {
        constructor() {
            super();
            this.myOwner = null;
            this.coll = null;
            this.min = null;
            this.max = null;
            this.canColl = true;
        }
        onEnable() {
            this.myOwner = this.owner;
            this.myOwner.transform.localScale = new Laya.Vector3(5, 1, 1);
            this.max = this.myOwner.getChildByName('min');
            this.min = this.myOwner.getChildByName('max');
        }
        getMyBound() {
            return new Laya.BoundBox(this.min.transform.position.clone(), this.max.transform.position.clone());
        }
        onDisable() {
        }
        scalePole(v) {
            this.myOwner.transform.localScale = new Laya.Vector3(this.myOwner.transform.localScaleX + v, 1, 1);
        }
        movePole(v) {
            let p = this.myOwner.transform.localPosition.clone();
            p.x += v;
            this.myOwner.transform.localPosition = p;
        }
        checkCollision() {
            if (!this.canColl)
                return;
            for (let i = 0; i < GameLogic.Share._collisionArr.length; i++) {
                let c = GameLogic.Share._collisionArr[i];
                if (c === this.myOwner)
                    continue;
                let mybb = this.getMyBound();
                let obb = Utility.getBoundBox(c);
                if (Laya.CollisionUtils.intersectsBoxAndBox(mybb, obb)) {
                    if (c.name.search('Wall') != -1 || c.name.search('Saw') != -1) {
                        this.canColl = false;
                        let l = 0;
                        let isLeft = true;
                        if (c.transform.position.x > this.myOwner.transform.position.x) {
                            l = this.max.transform.position.x - c.getChildByName('max').transform.position.x;
                        }
                        else if (c.transform.position.x < this.myOwner.transform.position.x) {
                            l = c.getChildByName('min').transform.position.x - this.min.transform.position.x;
                            isLeft = false;
                        }
                        this.scalePole(-l);
                        this.movePole(isLeft ? -l / 2 : l / 2);
                        Laya.timer.once(500, this, () => {
                            let p = this.myOwner.transform.localPosition.clone();
                            if (isLeft)
                                p.x += l / 2;
                            else
                                p.x -= l / 2;
                            Utility.TmoveToX(this.myOwner, 200, p, () => { this.canColl = true; });
                        });
                        let newP = Utility.getSprite3DResByUrl('Pole_01.lh', GameLogic.Share._levelNode);
                        let myp = this.myOwner.transform.position.clone();
                        newP.transform.localScale = new Laya.Vector3(l, 1, 1);
                        myp.x = isLeft ? this.max.transform.position.x + l / 2 : this.min.transform.position.x - l / 2;
                        myp.z -= 0.2;
                        newP.transform.position = myp;
                        let des = myp.clone();
                        des.y -= 0.8;
                        Utility.TmoveTo(newP, 1000, des, null);
                    }
                }
            }
        }
        onUpdate() {
            if (GameLogic.Share.isGameOver || !GameLogic.Share.isStartGame)
                return;
            GameLogic.Share.fixCameraField();
            this.checkCollision();
        }
    }

    class GameUI extends Laya.Scene {
        constructor() {
            super();
            this.touchStartX = 0;
            this.touchPreX = 0;
            this.touching = false;
        }
        onOpened() {
            GameUI.Share = this;
            GameLogic.Share.isStartGame = true;
            this.gradeNum.text = PlayerDataMgr.getPlayerData().grade.toString();
            this.curGrade.text = PlayerDataMgr.getPlayerData().grade.toString();
            this.touchBtn.on(Laya.Event.MOUSE_DOWN, this, this.touchBtnDownCB);
            this.touchBtn.on(Laya.Event.MOUSE_MOVE, this, this.touchBtnMoveCB);
            this.touchBtn.on(Laya.Event.MOUSE_UP, this, this.touchBtnUpCB);
            this.touchBtn.on(Laya.Event.MOUSE_OUT, this, this.touchBtnUpCB);
            Laya.timer.frameLoop(1, this, this.updateCB);
        }
        onClosed() {
            Laya.timer.clearAll(this);
        }
        touchBtnDownCB(event) {
            if (GameLogic.Share.isGameOver || !GameLogic.Share.isStartGame)
                return;
            this.touching = true;
            this.touchStartX = event.stageX;
            this.touchPreX = event.stageX;
        }
        touchBtnMoveCB(event) {
            if (!this.touching || GameLogic.Share.isGameOver || !GameLogic.Share.isStartGame)
                return;
            let sx = event.stageX;
            let dtx = this.touchPreX - sx;
            let dtStart = this.touchStartX - sx;
            GameLogic.Share._playerCrl.moveX(dtx / 20);
            this.touchPreX = sx;
        }
        touchBtnUpCB(event) {
            if (!this.touching || GameLogic.Share.isGameOver || !GameLogic.Share.isStartGame)
                return;
            this.touching = false;
        }
        updateCB() {
            this.gBar.value = GameLogic.Share._player.transform.position.z / GameLogic.Share.totalDistance;
            this.coinNum.text = PlayerDataMgr.getPlayerData().coin.toString();
        }
        fixJewelIcon(jewel) {
            let op = new Laya.Vector4(0, 0, 0);
            let hPos = jewel.transform.position.clone();
            hPos.y += 1;
            GameLogic.Share._camera.viewport.project(hPos, GameLogic.Share._camera.projectionViewMatrix, op);
            let j = new Laya.Image('startUI/zy_zs_1.png');
            j.anchorX = 0.5;
            j.anchorY = 0.5;
            j.pos(op.x / Laya.stage.clientScaleX, op.y / Laya.stage.clientScaleY);
            this.addChild(j);
            Utility.tMove2D(j, 60, 80, 1000, () => { j.removeSelf(); });
        }
        fixAddScore() {
            let op = new Laya.Vector4(0, 0, 0);
            let hPos = GameLogic.Share._player.transform.position.clone();
            hPos.y += 1;
            hPos.z += 2;
            GameLogic.Share._camera.viewport.project(hPos, GameLogic.Share._camera.projectionViewMatrix, op);
            let j = new Laya.Image('gameUI/yxz_jy_1.png');
            j.anchorX = 0.5;
            j.anchorY = 0.5;
            j.pos(op.x / Laya.stage.clientScaleX, op.y / Laya.stage.clientScaleY);
            this.addChild(j);
            Utility.tMove2D(j, j.x, j.y - 50, 500, () => { j.removeSelf(); });
        }
        initNav() {
            let id = Math.floor(Math.random() * JJMgr.instance.navDataArr.length);
            let icon = this.navNode.getChildByName('icon');
            icon.skin = JJMgr.instance.navDataArr[id].icon;
            this.navNode.off(Laya.Event.CLICK, this, this.navCB);
            this.navNode.on(Laya.Event.CLICK, this, this.navCB, [id]);
        }
        navCB(id) {
            console.log('click id:', id);
            GameLogic.Share.isPause = true;
            WxApi.aldEvent('游戏内导出位—总点击数');
            JJMgr.instance.NavigateApp(id, () => {
                JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI, false, {
                    continueCallbackFun: () => {
                        if (JJMgr.instance.dataConfig.front_main_banner_switch && WxApi.isValidBanner()) {
                            AdMgr.instance.showBanner();
                        }
                        GameLogic.Share.isPause = false;
                    }
                });
            }, () => {
                WxApi.aldEvent('游戏内导出位-总成功跳转数');
                GameLogic.Share.isPause = false;
            });
        }
    }

    class PropPole extends Laya.Script {
        constructor() {
            super();
            this.myOwner = null;
        }
        onEnable() {
            this.myOwner = this.owner;
        }
        onDisable() {
        }
        onUpdate() {
            if (!GameLogic.Share.isStartGame || GameLogic.Share.isGameOver)
                return;
            let mbb = Utility.getBoundBox(this.myOwner.getChildAt(0));
            let obb = GameLogic.Share._poleCrl.getMyBound();
            if (Laya.CollisionUtils.intersectsBoxAndBox(mbb, obb)) {
                GameLogic.Share._poleCrl.scalePole(1);
                GameUI.Share.fixAddScore();
                this.myOwner.destroy();
            }
        }
    }

    class Box extends Laya.Script {
        constructor() {
            super();
            this.myOwner = null;
            this.myId = 0;
            this.randX = 0;
            this.havaRandX = false;
        }
        onEnable() {
            this.myOwner = this.owner;
            this.randX = (Math.random() * 0.3) - 0.15;
        }
        onDisable() {
        }
        onUpdate() {
            if (!GameLogic.Share.isStartGame || GameLogic.Share.isGameOver)
                return;
            if (this.myOwner.transform.position.z >= GameLogic.Share.totalDistance) {
                this.myOwner.destroy();
                GameLogic.Share._score++;
                return;
            }
            let havePre = this.myId >= 10;
            let preBox = null;
            if (havePre)
                preBox = GameLogic.Share._boxNode.getChildAt(this.myId - 10);
            if (Math.abs(this.myOwner.transform.position.z - GameLogic.Share._pole.transform.position.z) <= 0.6) {
                if ((this.myOwner.transform.position.x + 0.5 <= GameLogic.Share._poleCrl.max.transform.position.x &&
                    this.myOwner.transform.position.x + 0.5 >= GameLogic.Share._poleCrl.min.transform.position.x) ||
                    (this.myOwner.transform.position.x - 0.5 <= GameLogic.Share._poleCrl.max.transform.position.x &&
                        this.myOwner.transform.position.x - 0.5 >= GameLogic.Share._poleCrl.min.transform.position.x)) {
                    let newPos = new Laya.Vector3(0, 0, GameLogic.Share._playerCrl.speed);
                    this.myOwner.transform.translate(newPos, false);
                }
            }
            else if (havePre && preBox && Math.abs(this.myOwner.transform.position.z - preBox.transform.position.z) <= 0.9) {
                let p = this.myOwner.transform.position.clone();
                if (!this.havaRandX) {
                    this.randX = p.x + this.randX;
                    this.havaRandX = true;
                }
                else {
                    var v = p.clone();
                    v.x = this.randX;
                    Laya.Vector3.lerp(p, v, 0.2, p);
                    this.myOwner.transform.position = p;
                }
                let newPos = new Laya.Vector3(0, 0, GameLogic.Share._playerCrl.speed);
                this.myOwner.transform.translate(newPos, false);
            }
        }
    }

    class Jewel extends Laya.Script {
        constructor() {
            super();
            this.myOwner = null;
        }
        onEnable() {
            this.myOwner = this.owner;
        }
        onDisable() {
        }
        onUpdate() {
            if (!GameLogic.Share.isStartGame || GameLogic.Share.isGameOver)
                return;
            let mbb = Utility.getBoundBox(this.myOwner);
            let obb = GameLogic.Share._poleCrl.getMyBound();
            if (Laya.CollisionUtils.intersectsBoxAndBox(mbb, obb)) {
                GameLogic.Share._coinCount++;
                GameUI.Share.fixJewelIcon(this.myOwner);
                this.myOwner.destroy();
            }
        }
    }

    class GameLogic {
        constructor() {
            this.camStartPos = new Laya.Vector3(0, 0, 0);
            this.camStartRotation = null;
            this.lightStartForward = null;
            this.planePos = null;
            this._levelNode = null;
            this._roadNode = null;
            this._buildingNode = null;
            this._player = null;
            this._playerCrl = null;
            this._pole = null;
            this._poleCrl = null;
            this._collisionArr = [];
            this._desArr = [];
            this._barArr = [];
            this._boxNode = null;
            this._finish = null;
            this._coinCount = 0;
            this._score = 0;
            this.totalDistance = 0;
            this.isDes = false;
            this.isFlying = false;
            this.isStartGame = false;
            this.isGameOver = false;
            this.isWin = false;
            this.isPause = false;
            this.maxPlaneCount = 5;
            localStorage.clear();
            GameLogic.Share = this;
            PlayerDataMgr.getPlayerData();
            Laya.Scene.open('MyScenes/LoadingUI.scene');
        }
        initScene() {
            Laya.Scene3D.load(WxApi.UnityPath + 'SampleScene.ls', Laya.Handler.create(this, this.onLoadScene));
        }
        onLoadScene(scene) {
            Laya.Scene.open('MyScenes/StartUI.scene');
            WxApi.aldEvent('进入首页');
            this._scene = Laya.stage.addChild(scene);
            Laya.stage.setChildIndex(this._scene, 0);
            this._camera = this._scene.getChildByName('Main Camera');
            this._light = this._scene.getChildByName('Directional Light');
            this.camStartPos = this._camera.transform.position.clone();
            this.camStartRotation = this._camera.transform.rotation.clone();
            this._levelNode = new Laya.Sprite3D();
            this._scene.addChild(this._levelNode);
            this.createLevel();
            this.setFog();
        }
        fixCameraField() {
            if (this._pole)
                this._camera.fieldOfView = 100 + this._pole.transform.localScaleX;
        }
        setFog() {
            let scene = this._scene;
            scene.enableFog = true;
            scene.fogColor = this.getRGB("#F17673");
            scene.fogStart = 0;
            scene.fogRange = 400;
        }
        getRGB(_hexColor) {
            var color = [], rgb = [];
            let hexColor = _hexColor.replace(/#/, "");
            if (hexColor.length == 3) {
                var tmp = [];
                for (var i = 0; i < 3; i++) {
                    tmp.push(hexColor.charAt(i) + hexColor.charAt(i));
                }
                hexColor = tmp.join("");
            }
            for (var i = 0; i < 3; i++) {
                color[i] = "0x" + hexColor.substr(i * 2, 2);
                rgb.push(parseInt(color[i]));
            }
            return new Laya.Vector3(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
        }
        gameStart() {
            Laya.Scene.open('MyScenes/GameUI.scene');
            this._playerCrl.playRun(true);
            this.createPole();
        }
        createLevel() {
            this._roadNode = this._levelNode.addChild(new Laya.Sprite3D());
            this._buildingNode = this._levelNode.addChild(new Laya.Sprite3D());
            this._player = Utility.getSprite3DResByUrl('Hero_01.lh', this._levelNode);
            this._playerCrl = this._player.addComponent(Player);
            this._collisionArr.push(this._player);
            for (let i = 0; i < this.maxPlaneCount; i++) {
                let rId = Utility.GetRandom(1, 3);
                if (i == 0) {
                    rId = 1;
                }
                let name = 'Road_0' + rId + '.lh';
                if (i == this.maxPlaneCount - 1)
                    name = 'Road_Finish.lh';
                let road = Utility.getSprite3DResByUrl(name, this._roadNode);
                road.transform.position = new Laya.Vector3(0, i * -30, 20 + i * 100);
                for (let j = 0; j < road.numChildren; j++) {
                    let rc = road.getChildAt(j);
                    if (rc.name.search('FallArea') != -1) {
                        this._collisionArr.push(rc);
                    }
                }
                if (i > 0) {
                    this._desArr.push(road.getChildByName('Des'));
                }
                if (i == this.maxPlaneCount - 1) {
                    this._boxNode = road.getChildByName('BoxNode');
                    this._finish = road.getChildByName('Finish');
                    this.totalDistance = this._finish.transform.position.z;
                    this.createBox();
                }
                if (i < this.maxPlaneCount - 1) {
                    let bar = Utility.getSprite3DResByUrl('Bar_01.lh', road);
                    bar.getChildByName('SparkFX1').active = false;
                    bar.getChildByName('SparkFX2').active = false;
                    let rPos = road.transform.position.clone();
                    rPos.y -= 0.4;
                    rPos.z += 32.5;
                    bar.transform.position = rPos;
                    this._collisionArr.push(bar.getChildAt(0));
                    this._collisionArr.push(bar.getChildAt(1));
                    this._collisionArr.push(bar.getChildAt(2));
                    this._collisionArr.push(bar.getChildAt(3));
                    this._barArr.push(bar);
                    this.createProp(rId, road, i == 0 ? 5 : 10);
                }
            }
            for (let i = 0; i < 8; i++) {
                let building = Utility.getSprite3DResByUrl('Building_01.lh', this._buildingNode);
                building.transform.position = new Laya.Vector3(((i % 2 == 0) ? 150 : -150) + Utility.GetRandom(-50, 50), -250, i * 300 + Utility.GetRandom(-50, 50));
            }
        }
        createProp(rId, road, max = 10) {
            let rootNode = road.addChild(new Laya.Sprite3D());
            let dataArr = [].concat(PlayerDataMgr['roadArr' + rId]);
            let index = Utility.GetRandom(0, max - 1);
            let data = dataArr[index];
            for (let i = 0; i < data.length; i++) {
                let name = data[i].name;
                let pos = new Laya.Vector3(Number(data[i].position.x), Number(data[i].position.y) + road.transform.position.y, Number(data[i].position.z));
                let scale = new Laya.Vector3(Number(data[i].scale.x), Number(data[i].scale.y), Number(data[i].scale.z));
                if (name.search('PropPole') != -1) {
                    this.createPropPole(rootNode, pos.clone());
                }
                else if (name.search('Saw') != -1) {
                    this.createSaw(rootNode, pos.clone());
                }
                else if (name.search('Jewel') != -1) {
                    this.createJewel(rootNode, pos.clone());
                }
                else if (name.search('Wall') != -1) {
                    let id = 1;
                    if (name.search('1') != -1)
                        id = 1;
                    else if (name.search('2') != -1)
                        id = 2;
                    else if (name.search('3') != -1)
                        id = 3;
                    this.createWall(id, rootNode, pos.clone(), scale.clone());
                }
            }
        }
        createPole() {
            this._pole = Utility.getSprite3DResByUrl('Pole_01.lh', this._player);
            let pos = this._player.transform.position.clone();
            pos.y += 1.11;
            pos.z += 0.64;
            this._pole.transform.position = pos;
            this._poleCrl = this._pole.addComponent(Pole);
        }
        createBox() {
            for (let i = 0; i < 100; i++) {
                let box = Utility.getSprite3DResByUrl('Box_01.lh', this._boxNode);
                box.transform.localPosition = new Laya.Vector3(-7.5 + (1.5 * Math.floor(i % 10)), 0, 2 * Math.floor(i / 10));
                let crl = box.addComponent(Box);
                crl.myId = i;
            }
        }
        createPropPole(root, pos) {
            let pole = Utility.getSprite3DResByUrl('PropPole.lh', root);
            pos.y = 1.11;
            pole.transform.position = pos;
            pole.addComponent(PropPole);
        }
        createSaw(root, pos) {
            let saw = Utility.getSprite3DResByUrl('Saw_01.lh', root);
            saw.transform.position = pos;
            this._collisionArr.push(saw);
        }
        createJewel(root, pos) {
            let jewel = Utility.getSprite3DResByUrl('Jewel_01.lh', root);
            jewel.transform.position = pos;
            jewel.addComponent(Jewel);
        }
        createWall(id, root, pos, scale) {
            let wall = Utility.getSprite3DResByUrl('Wall_0' + id + '.lh', root);
            wall.transform.position = pos;
            wall.transform.localScale = scale;
            this._collisionArr.push(wall);
        }
        moveToDes() {
            this.isFlying = true;
            let des = this._desArr[0];
            Utility.TmoveToYZ(this._player, 3000, des.transform.position.clone(), () => {
                if (this.isGameOver)
                    return;
                this._playerCrl.activeLandFX();
                this.isFlying = false;
                this._playerCrl._ani.speed = 1;
                this._playerCrl.playRun();
                this._barArr.splice(0, 1);
            });
            this._desArr[0].destroy();
            this._desArr.splice(0, 1);
        }
        winCB() {
            this.isGameOver = true;
            this.isWin = true;
            this.isStartGame = false;
            this._pole.destroy();
            this._playerCrl.playDance();
            Laya.timer.once(2000, this, () => {
                Laya.Scene.open('MyScenes/FinishUI.scene');
            });
        }
        loseCB(isFall) {
            this.isGameOver = true;
            this.isWin = false;
            this.isStartGame = false;
            this._playerCrl._ani.speed = 1;
            if (!isFall)
                this._playerCrl.playDie();
            else {
                this._playerCrl.playFall();
                let p = this._player.transform.position.clone();
                p.y -= 50;
                Utility.TmoveTo(this._player, 15000, p, null);
            }
            Laya.timer.once(2000, this, () => {
                Laya.Scene.open('MyScenes/FinishUI.scene');
            });
        }
        activeRoad() {
            if (!this._roadNode)
                return;
            for (let i = 0; i < this._roadNode.numChildren; i++) {
                let r = this._roadNode.getChildAt(i);
                if (r.transform.position.z < this._player.transform.position.z - 5) {
                    r.active = false;
                }
                else {
                    r.active = true;
                }
            }
        }
        restartGame() {
            this.isStartGame = false;
            this.isGameOver = false;
            this.isWin = false;
            this.totalDistance = 0;
            this._score = 0;
            this._coinCount = 0;
            this.isPause = false;
            this._collisionArr = [];
            this._desArr = [];
            this._barArr = [];
            this.isDes = false;
            this._levelNode.destroyChildren();
            this._camera.transform.position = this.camStartPos;
            this._camera.transform.rotation = this.camStartRotation;
            this.createLevel();
        }
    }

    class DrawUI extends Laya.Scene {
        constructor() {
            super();
            this.rootNode = this['rootNode'];
            this.closeBtn = this['closeBtn'];
            this.navList = this['navList'];
            this.navData = [];
            this.scrollDir = 1;
            this.preIndex = -1;
            this.closeCallbackFun = null;
            this.autoTime = 0;
        }
        onOpened(param) {
            if (param && param.closeCallbackFun) {
                this.closeCallbackFun = param.closeCallbackFun;
            }
            if (param && param.posY) {
                this.rootNode.y = param.posY;
            }
            if (param && param.fixY == true) {
                JJUtils.fixNodeY(this.rootNode);
            }
            if (param && param.autoTime) {
                this.autoTime = param.autoTime;
            }
            this._init();
        }
        onClosed() {
            Laya.timer.clearAll(this);
            this.closeCallbackFun && this.closeCallbackFun();
        }
        autoClose() {
            Laya.timer.once(this.autoTime, this, this.closeCB);
        }
        clearAutoClose() {
            Laya.timer.clear(this, this.closeCB);
        }
        _init() {
            this.closeBtn.on(Laya.Event.CLICK, this, this.closeCB);
            JJUtils.tMove(this.rootNode, 0, this.rootNode.y, 200, () => {
                Laya.timer.once(1000, this, () => {
                    Laya.timer.frameLoop(1, this, this.scrollLoop);
                });
            });
            this.initList();
            if (this.autoTime != 0)
                this.autoClose();
        }
        initList() {
            this.navData = [].concat(JJMgr.instance.navDataArr);
            this.navList.vScrollBarSkin = '';
            this.navList.repeatX = 3;
            this.navList.repeatY = Math.floor(this.navData.length / 3);
            this.navList.array = this.navData;
            this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
            this.navList.mouseHandler = new Laya.Handler(this, this.mouseHandler);
        }
        mouseHandler(e, index) {
            this.clearAutoClose();
            this.againScroll();
        }
        againScroll() {
            Laya.timer.clear(this, this.scrollLoop);
            Laya.timer.once(1000, this, () => {
                Laya.timer.frameLoop(1, this, this.scrollLoop);
            });
        }
        scrollLoop() {
            let scrollBar = this.navList.scrollBar;
            scrollBar.value += this.scrollDir;
            if (scrollBar.value >= scrollBar.max || scrollBar.value <= 0) {
                this.scrollDir = -this.scrollDir;
                this.againScroll();
            }
        }
        onListRender(cell, index) {
            if (index >= this.navList.array.length) {
                return;
            }
            var item = cell.getChildByName('item');
            var icon = item.getChildByName('icon');
            var name = item.getChildByName('name');
            icon.skin = this.navData[index].icon;
            name.text = JJMgr.instance.getTitle(index);
            item.off(Laya.Event.CLICK, this, this.navCB, [index]);
            item.on(Laya.Event.CLICK, this, this.navCB, [index]);
        }
        navCB(index) {
            console.log('click id:', index);
            WxApi.aldEvent('抽屉弹窗页面-总点击数');
            JJMgr.instance.NavigateApp(index, () => {
                JJMgr.instance.openScene(SceneDir.SCENE_RECOMMENDUI, false, {
                    closeCallbackFun: () => {
                        Laya.timer.once(100, this, () => { AdMgr.instance.showBanner(); });
                    }
                });
            }, () => {
                WxApi.aldEvent('抽屉弹窗页面-总成功跳转');
            });
        }
        closeCB() {
            JJUtils.tMove(this.rootNode, -600, this.rootNode.y, 200, () => {
                this.close();
            });
        }
    }

    class AutoFixPosY extends Laya.Script {
        constructor() {
            super();
            this.isFix = false;
        }
        onAwake() {
            if (this.isFix) {
                let node = this.owner;
                JJUtils.fixNodeY(node);
            }
        }
        onDestroy() {
        }
    }

    class FinishGameUI extends Laya.Scene {
        constructor() {
            super();
            this.navList = this['navList'];
            this.navData = [];
            this.from = null;
            this.totalArr = [];
            this.curIndex = 6;
            this.fingerNum = 0;
        }
        onOpened(param) {
            if (param) {
                if (param.posY) {
                    this.navList.y = param.posY;
                }
                if (param.fixY == true) {
                    JJUtils.fixNodeY(this.navList);
                }
                if (param.from) {
                    this.from = param.from;
                }
            }
            this._init();
        }
        onClosed() {
            Laya.timer.clearAll(this);
        }
        _init() {
            this.navData = [];
            this.totalArr = [].concat(JJMgr.instance.navDataArr);
            this.navData = this.totalArr.slice(0, 6);
            this.initList();
        }
        initList() {
            this.navList.vScrollBarSkin = '';
            this.navList.repeatX = 3;
            this.navList.repeatY = 2;
            this.navList.array = this.navData;
            this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
            this.fingerNum = Math.floor(Math.random() * 6);
        }
        onListRender(cell, index) {
            if (index >= this.navList.array.length) {
                return;
            }
            var item = cell.getChildByName('item');
            var icon = item.getChildByName('icon');
            var finger = item.getChildByName('navFinger');
            icon.skin = this.navData[index].icon;
            item.off(Laya.Event.CLICK, this, this.navCB, [this.navData[index], index]);
            item.on(Laya.Event.CLICK, this, this.navCB, [this.navData[index], index]);
            finger.visible = index == this.fingerNum;
        }
        navCB(data, listIndex) {
            console.log('click id:', this.totalArr.indexOf(data));
            JJMgr.instance.NavigateApp(this.totalArr.indexOf(data), () => {
                JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI, false, { continueCallbackFun: () => { AdMgr.instance.showBanner(); } });
            });
            this.navData[listIndex] = this.totalArr[this.curIndex];
            this.curIndex++;
            if (this.curIndex >= this.totalArr.length) {
                this.curIndex = 0;
            }
            this.initList();
        }
    }

    const ROOTNODE_POSY = 550;
    class FriendGameUI extends Laya.Scene {
        constructor() {
            super();
            this.rootNode = this['rootNode'];
            this.closeBtn = this['closeBtn'];
            this.navList = this['navList'];
            this.navData = [];
            this.scrollDir = 1;
            this.preIndex = -1;
            this.closeCallbackFun = null;
        }
        onOpened(param) {
            if (param && param.closeCallbackFun) {
                this.closeCallbackFun = param.closeCallbackFun;
            }
            this._init();
        }
        onClosed() {
            clearTimeout(WxApi.bannerTO2);
            AdMgr.instance.hideBanner();
            AdMgr.instance.showBanner();
            Laya.timer.clearAll(this);
            this.closeCallbackFun && this.closeCallbackFun();
        }
        _init() {
            this.rootNode.y = ROOTNODE_POSY;
            this.rootNode.y = this.rootNode.y * Laya.stage.displayHeight / Laya.stage.designHeight;
            this.closeBtn.on(Laya.Event.CLICK, this, this.closeCB);
            AdMgr.instance.hideBanner();
            if (WxApi.isValidBanner())
                WxApi.fixBtnTouchPos(this.closeBtn, -100, -300, this, null, true);
            else {
                Laya.timer.once(100, this, () => {
                    AdMgr.instance.showBanner();
                });
            }
            this.initList();
        }
        initList() {
            this.navData = [].concat(JJMgr.instance.navDataArr);
            this.navList.vScrollBarSkin = '';
            this.navList.repeatX = 3;
            this.navList.repeatY = Math.floor(this.navData.length / 3);
            this.navList.array = this.navData;
            this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
            this.navList.mouseHandler = new Laya.Handler(this, this.mouseHandler);
            Laya.timer.once(1000, this, () => {
                Laya.timer.frameLoop(1, this, this.scrollLoop);
            });
        }
        mouseHandler(e, index) {
            this.againScroll();
        }
        againScroll() {
            Laya.timer.clear(this, this.scrollLoop);
            Laya.timer.once(1000, this, () => {
                Laya.timer.frameLoop(1, this, this.scrollLoop);
            });
        }
        scrollLoop() {
            let scrollBar = this.navList.scrollBar;
            scrollBar.value += this.scrollDir;
            if (scrollBar.value >= scrollBar.max || scrollBar.value <= 0) {
                this.scrollDir = -this.scrollDir;
                this.againScroll();
            }
        }
        onListRender(cell, index) {
            if (index >= this.navList.array.length) {
                return;
            }
            var item = cell.getChildByName('item');
            var icon = item.getChildByName('icon');
            var name = item.getChildByName('name');
            icon.skin = this.navData[index].icon;
            name.text = JJMgr.instance.getTitle(index);
            item.off(Laya.Event.CLICK, this, this.navCB, [index]);
            item.on(Laya.Event.CLICK, this, this.navCB, [index]);
        }
        navCB(index) {
            console.log('click id:', index);
            WxApi.aldEvent('好友都在玩的爆款游戏弹窗-总点击数');
            JJMgr.instance.NavigateApp(index, () => {
                JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI, false, {
                    continueCallbackFun: () => {
                        AdMgr.instance.showBanner();
                    }
                });
            }, () => {
                WxApi.aldEvent('好友都在玩的爆款游戏弹窗-总成功跳转');
            });
        }
        closeCB() {
            this.close();
        }
    }

    class FixNodeY extends Laya.Script {
        constructor() {
            super();
        }
        onAwake() {
            let myOwner = this.owner;
            myOwner.y = myOwner.y * Laya.stage.displayHeight / 1334;
        }
    }

    class FullGameUI extends Laya.Scene {
        constructor() {
            super();
            this.exitBtn = this['exitBtn'];
            this.continueBtn = this['continueBtn'];
            this.navList = this['navList'];
            this.navData = [];
            this.scrollDir = 1;
            this.preIndex = -1;
            this.hotArr = [];
            this.continueCallbackFun = null;
            this.curGrade = -1;
            this.btnStartY = 0;
            this.btnEndY = 0;
        }
        onOpened(param) {
            if (param && param.continueCallbackFun) {
                this.continueCallbackFun = param.continueCallbackFun;
            }
            if (param && param.grade) {
                this.curGrade = param.grade;
            }
            this._init();
            this.btnEndY = this.navList.y + this.navList.height - this.continueBtn.height / 2 - 20;
            this.btnStartY = Laya.stage.displayHeight - this.continueBtn.height;
            AdMgr.instance.hideBanner();
            this.exitBtn.visible = PlayerDataMgr.getPlayerData().grade >= JJMgr.instance.dataConfig.front_randompaly_start_level &&
                WxApi.isValidBanner();
            if (JJMgr.instance.dataConfig.front_all_screen_auto) {
                this.continueBtn.y = WxApi.isValidBanner() ? this.btnStartY : this.btnEndY;
                this.randomCB(true);
            }
            else {
                WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true);
            }
        }
        onClosed() {
            Laya.timer.once(100, this, () => {
                this.continueCallbackFun && this.continueCallbackFun();
                Laya.timer.clearAll(this);
            });
            clearTimeout(WxApi.bannerTO2);
            AdMgr.instance.hideBanner();
        }
        _init() {
            this.exitBtn.on(Laya.Event.CLICK, this, this.randomCB);
            this.continueBtn.on(Laya.Event.CLICK, this, this.continueCB);
            this.initList();
        }
        getHotRandArr() {
            let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            arr = JJUtils.shuffleArr(arr);
            this.hotArr = arr.slice(0, 3);
        }
        initList() {
            this.navData = [].concat(JJMgr.instance.navDataArr);
            this.navList.vScrollBarSkin = '';
            this.navList.repeatX = 3;
            this.navList.repeatY = Math.floor(this.navData.length / 3);
            this.navList.array = this.navData;
            this.navList.height = Laya.stage.displayHeight - this.navList.y - 260;
            this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
            this.navList.mouseHandler = new Laya.Handler(this, this.mouseHandler);
            Laya.timer.once(1000, this, () => {
                Laya.timer.frameLoop(1, this, this.scrollLoop);
            });
        }
        mouseHandler(e, index) {
            this.againScroll();
        }
        againScroll() {
            Laya.timer.clear(this, this.scrollLoop);
            Laya.timer.once(1000, this, () => {
                Laya.timer.frameLoop(1, this, this.scrollLoop);
            });
        }
        scrollLoop() {
            let scrollBar = this.navList.scrollBar;
            scrollBar.value += this.scrollDir;
            if (scrollBar.value >= scrollBar.max || scrollBar.value <= 0) {
                this.scrollDir = -this.scrollDir;
                this.againScroll();
            }
        }
        onListRender(cell, index) {
            if (index >= this.navList.array.length) {
                return;
            }
            var item = cell.getChildByName('item');
            var icon = item.getChildByName('icon');
            var name = item.getChildByName('name');
            var hot = item.getChildByName('hot');
            var color = item.getChildByName('color');
            color.skin = 'JJExportRes/' + (Math.floor(index % 9) + 1) + '.png';
            icon.skin = this.navData[index].icon;
            name.text = JJMgr.instance.getTitle(index);
            hot.visible = this.hotArr.indexOf(index) != -1;
            item.off(Laya.Event.CLICK, this, this.navCB, [index]);
            item.on(Laya.Event.CLICK, this, this.navCB, [index]);
        }
        navCB(index, auto) {
            console.log('click id:', index);
            WxApi.aldEvent('网红爆款游戏全屏幕导出页-总点击数');
            JJMgr.instance.NavigateApp(index, () => {
                if (auto === true) {
                    WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true);
                }
            }, () => {
                WxApi.aldEvent('网红爆款游戏全屏幕导出页-总成功跳转数');
                if (auto === true) {
                    WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true);
                }
            });
        }
        randomCB(auto) {
            let id = Math.floor(Math.random() * 6);
            this.navCB(id, auto);
        }
        continueCB() {
            this.close();
        }
    }

    class ProgramUI extends Laya.Scene {
        constructor() {
            super();
            this.myList = null;
            this.navData = [];
            this.scrollLeft = false;
            this.preIndex = -1;
            this.randArr = [];
            this.fromDrawUI = false;
            this.fromFullUI = false;
            this.closeCallbackFun = null;
        }
        onOpened(param) {
            if (param && param.closeCallbackFun) {
                this.closeCallbackFun = param.closeCallbackFun;
            }
            this.backBtn.on(Laya.Event.CLICK, this, this.backCB);
            this.continueBtn.on(Laya.Event.CLICK, this, this.randomNav);
            if (JJMgr.instance.dataConfig.front_all_screen_auto) {
                this.randomNav(true);
            }
            else {
                WxApi.bannerWuChu2();
            }
            this.initList();
            AdMgr.instance.hideBanner();
        }
        onClosed() {
            Laya.timer.clearAll(this);
        }
        randomNav(auto) {
            let id = Math.floor(Math.random() * 6);
            this.navCB(id, auto);
        }
        backCB() {
            if (this.closeCallbackFun) {
                this.closeCallbackFun();
            }
            this.close();
        }
        initList() {
            let listData = [].concat(JJMgr.instance.navDataArr);
            this.navData = listData;
            for (let i = 0; i < 10; i++) {
                this.randArr.push(i);
            }
            this.randArr = Utility.shuffleArr(this.randArr);
            this.randArr.splice(6, this.navData.length - 4);
            this.myList.vScrollBarSkin = '';
            this.myList.repeatX = 1;
            this.myList.repeatY = listData.length;
            this.myList.array = listData;
            this.myList.height = 1100 * Laya.stage.displayHeight / 1334;
            this.myList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
            this.myList.mouseHandler = new Laya.Handler(this, this.mouseHandler);
            Laya.timer.once(1000, this, this.scrollLoop);
        }
        mouseHandler(e, index) {
            Laya.timer.clear(this, this.scrollLoop);
            Laya.timer.once(1000, this, this.scrollLoop);
        }
        scrollLoop() {
            let num = Math.floor(this.myList.startIndex);
            if (!this.scrollLeft) {
                num++;
                if (this.preIndex == Math.floor(this.myList.startIndex) && Math.floor(this.myList.startIndex) > 0) {
                    num--;
                    this.scrollLeft = !this.scrollLeft;
                }
            }
            else {
                num--;
                if (num < 0) {
                    this.scrollLeft = !this.scrollLeft;
                }
            }
            this.preIndex = Math.floor(this.myList.startIndex);
            this.myList.tweenTo(num, 1000, Laya.Handler.create(this, this.scrollLoop));
        }
        onListRender(cell, index) {
            if (index >= this.myList.array.length) {
                return;
            }
            var item = cell.getChildByName('item');
            var icon = item.getChildByName('icon');
            var name = item.getChildByName('name');
            var star = item.getChildByName('star');
            var tips = item.getChildByName('tips');
            tips.text = (Math.floor(Math.random() * 999999 + 100000)).toString() + '人正在玩';
            star.visible = false;
            icon.skin = this.navData[index].icon;
            name.text = this.navData[index].title;
            item.off(Laya.Event.CLICK, this, this.navCB, [index]);
            item.on(Laya.Event.CLICK, this, this.navCB, [index]);
            for (let i = 0; i < this.randArr.length; i++) {
                if (this.randArr[i] == index) {
                    star.visible = true;
                    break;
                }
            }
        }
        navCB(index, auto) {
            console.log('click id:', index);
            WxApi.aldEvent('游戏历史列表全屏幕导出页-总点击数');
            JJMgr.instance.NavigateApp(index, () => {
                if (auto === true) {
                    WxApi.bannerWuChu2();
                }
            }, () => {
                WxApi.aldEvent('游戏历史列表全屏幕导出页-总成功跳转');
                if (auto === true) {
                    WxApi.bannerWuChu2();
                }
            });
        }
    }

    class RecommendUI extends Laya.Scene {
        constructor() {
            super();
            this.backBtn = this['backBtn'];
            this.navList = this['navList'];
            this.navData = [];
            this.scrollDir = 1;
            this.preIndex = -1;
            this.closeCallbackFun = null;
            this.fingerNum = 0;
            this.btnStartY = 0;
            this.btnEndY = 0;
        }
        onOpened(param) {
            if (param && param.closeCallbackFun) {
                this.closeCallbackFun = param.closeCallbackFun;
            }
            this._init();
            this.btnEndY = this.navList.y + this.navList.height - this.continueBtn.height / 2 - 20;
            this.btnStartY = Laya.stage.displayHeight - this.continueBtn.height;
            AdMgr.instance.hideBanner();
            this.continueBtn.visible = PlayerDataMgr.getPlayerData().grade >= JJMgr.instance.dataConfig.front_continuegame_start_level &&
                WxApi.isValidBanner();
            if (JJMgr.instance.dataConfig.front_remen_screen_auto) {
                this.continueBtn.y = WxApi.isValidBanner() ? this.btnStartY : this.btnEndY;
                this.continueBtnCB(true);
            }
            else {
                WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true);
            }
        }
        onClosed() {
            Laya.timer.clearAll(this);
            clearTimeout(WxApi.bannerTO2);
            AdMgr.instance.hideBanner();
        }
        _init() {
            this.backBtn.on(Laya.Event.CLICK, this, this.closeCB);
            this.continueBtn.on(Laya.Event.CLICK, this, this.continueBtnCB);
            this.initList();
        }
        initList() {
            this.navData = [].concat(JJMgr.instance.navDataArr);
            this.navList.vScrollBarSkin = '';
            this.navList.repeatX = 2;
            this.navList.repeatY = Math.floor(this.navData.length / 2);
            this.navList.array = this.navData;
            this.navList.height = Laya.stage.displayHeight - this.navList.y - 260;
            this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
            this.navList.mouseHandler = new Laya.Handler(this, this.mouseHandler);
            this.fingerNum = Math.floor(Math.random() * 6);
            Laya.timer.once(1000, this, () => {
                Laya.timer.frameLoop(1, this, this.scrollLoop);
            });
        }
        mouseHandler(e, index) {
            this.againScroll();
        }
        againScroll() {
            Laya.timer.clear(this, this.scrollLoop);
            Laya.timer.once(1000, this, () => {
                Laya.timer.frameLoop(1, this, this.scrollLoop);
            });
        }
        scrollLoop() {
            let scrollBar = this.navList.scrollBar;
            scrollBar.value += this.scrollDir;
            if (scrollBar.value >= scrollBar.max || scrollBar.value <= 0) {
                this.scrollDir = -this.scrollDir;
                this.againScroll();
            }
        }
        onListRender(cell, index) {
            if (index >= this.navList.array.length) {
                return;
            }
            var item = cell.getChildByName('item');
            var icon = item.getChildByName('icon');
            var name = item.getChildByName('name');
            var finger = item.getChildByName('navFinger');
            icon.skin = this.navData[index].icon;
            name.text = JJMgr.instance.getTitle(index);
            item.off(Laya.Event.CLICK, this, this.navCB, [index]);
            item.on(Laya.Event.CLICK, this, this.navCB, [index]);
            finger.visible = index == this.fingerNum;
        }
        navCB(index, auto) {
            console.log('click id:', index);
            WxApi.aldEvent('热门推荐全屏幕导出页-总点击数');
            JJMgr.instance.NavigateApp(index, () => {
                if (auto === true) {
                    WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true);
                }
            }, () => {
                WxApi.aldEvent('热门推荐全屏幕导出页-总成功跳转');
                if (auto === true) {
                    WxApi.fixBtnTouchPos(this.continueBtn, this.btnStartY, this.btnEndY, this, null, true);
                }
            });
        }
        continueBtnCB(auto) {
            let id = Math.floor(Math.random() * 6);
            this.navCB(id, auto);
        }
        closeCB() {
            if (this.closeCallbackFun) {
                this.closeCallbackFun();
            }
            this.close();
        }
    }

    class ScrollUI extends Laya.Scene {
        constructor() {
            super();
            this.navList = this['navList'];
            this.navData = [];
            this.scrollDir = 1;
            this.preIndex = -1;
        }
        onOpened(param) {
            if (param) {
                if (param.posY) {
                    this.navList.y = param.posY;
                }
                if (param.fixY == true) {
                    JJUtils.fixNodeY(this.navList);
                }
            }
            this.initList();
        }
        onClosed() {
            Laya.timer.clearAll(this);
        }
        initList() {
            this.navData = [].concat(JJMgr.instance.navDataArr);
            this.navList.hScrollBarSkin = '';
            this.navList.repeatX = this.navData.length;
            this.navList.repeatY = 1;
            this.navList.array = this.navData;
            this.navList.renderHandler = Laya.Handler.create(this, this.onListRender, null, false);
            this.navList.mouseHandler = new Laya.Handler(this, this.mouseHandler);
            this.scrollLoop();
        }
        mouseHandler(e, index) {
            Laya.timer.clear(this, this.scrollLoop);
            Laya.timer.once(1000, this, this.scrollLoop);
        }
        scrollLoop() {
            Laya.timer.once(1000, this, () => {
                let num = Math.floor(this.navList.startIndex);
                if (this.scrollDir == 1) {
                    num++;
                    if (num >= this.navData.length - 4) {
                        num--;
                        this.scrollDir = -this.scrollDir;
                    }
                }
                else {
                    num--;
                    if (num < 0) {
                        this.scrollDir = -this.scrollDir;
                    }
                }
                this.navList.tweenTo(num, 1000, Laya.Handler.create(this, this.scrollLoop));
            });
        }
        onListRender(cell, index) {
            if (index >= this.navList.array.length) {
                return;
            }
            var item = cell.getChildByName('item');
            var icon = item.getChildByName('icon');
            icon.skin = this.navData[index].icon;
            item.off(Laya.Event.CLICK, this, this.navCB, [index]);
            item.on(Laya.Event.CLICK, this, this.navCB, [index]);
        }
        navCB(index) {
            console.log('click id:', index);
            JJMgr.instance.NavigateApp(index, () => {
                JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI);
            });
        }
    }

    class StartNavUI extends Laya.Scene {
        constructor() {
            super();
        }
        onOpened(param) {
            this.initNav();
            Laya.timer.loop(3000, this, this.initNav);
            for (let i = 0; i < this.navNode.numChildren; i++) {
                let n = this.navNode.getChildAt(i);
                Utility.rotateLoop(n, 10, 300);
            }
        }
        onClosed() {
        }
        initNav() {
            if (JJMgr.instance.navDataArr.length <= 0) {
                return;
            }
            let tempArr = [].concat(JJMgr.instance.navDataArr);
            let arr = [];
            for (let i = 0; i < tempArr.length; i++) {
                arr.push(i);
            }
            arr = Utility.shuffleArr(arr);
            arr = arr.splice(0, 4);
            let eNode = this.navNode;
            for (let i = 0; i < 4; i++) {
                let item = eNode.getChildAt(i);
                let icon = item.getChildByName('icon');
                let name = item.getChildByName('name');
                icon.skin = tempArr[arr[i]].icon;
                name.text = tempArr[arr[i]].title;
                item.off(Laya.Event.CLICK, this, this.navCB);
                item.on(Laya.Event.CLICK, this, this.navCB, [arr[i]]);
            }
        }
        navCB(i) {
            console.log('click id:', i);
            JJMgr.instance.NavigateApp(i, () => {
                JJMgr.instance.openScene(SceneDir.SCENE_RECOMMENDUI, false, {
                    closeCallbackFun: () => {
                        Laya.timer.once(100, this, () => {
                            AdMgr.instance.showBanner();
                        });
                    }
                });
            }, () => { });
        }
    }

    class WeChatUI extends Laya.Scene {
        constructor() {
            super();
            this.playerNames = ["有个小可爱", "大妈杀手", "神秘靓仔", "超级飞侠乐迪", "几一鸡", "爱喝可乐", "卖葫芦的葫芦娃", "多啦ABCD梦", "坏女孩", "沙雕网友"];
        }
        onAwake() {
            this.height = Laya.stage.height;
            if (!WeChatUI.currentPlayerNames || WeChatUI.currentPlayerNames.length == 0) {
                WeChatUI.currentPlayerNames = [].concat(this.playerNames);
            }
            if (!WeChatUI.currentGames || WeChatUI.currentGames.length == 0) {
                WeChatUI.currentGames = [0, 1, 2, 3, 4, 5];
            }
            this.currentName = WeChatUI.currentPlayerNames.shift();
        }
        onOpened() {
            this.lbName.text = this.currentName;
            this.bg.top = -150;
            Laya.Tween.to(this.bg, { top: 10 }, 500);
            var index = WeChatUI.currentGames.shift();
            this.bg.on(Laya.Event.CLICK, this, this.navCB, [index]);
            this.lbGame.text = "邀请你一起玩 " + JJMgr.instance.getTitle(index);
            WxApi.aldEvent("好友消息提示横幅出现次数");
        }
        onClosed() {
            Laya.timer.clearAll(this);
        }
        navCB(index) {
            JJMgr.instance.closeScene(SceneDir.SCENE_WECHATUI);
            WxApi.aldEvent("好友消息提示横幅-总点击数");
            console.log('click id:', index);
            JJMgr.instance.NavigateApp(index, () => {
            }, () => {
                WxApi.aldEvent("好友消息提示横幅-总成功跳转数");
            });
        }
    }

    class FinishUI extends Laya.Scene {
        constructor() {
            super();
        }
        onOpened(param) {
            this.coinNum.value = PlayerDataMgr.getPlayerData().coin.toString();
            this.bounesNum.value = GameLogic.Share.isWin ? (GameLogic.Share._coinCount + GameLogic.Share._score).toString() : '0';
            this.winTitle.visible = GameLogic.Share.isWin;
            this.loseTitle.visible = !GameLogic.Share.isWin;
            this.trippleBtn.visible = GameLogic.Share.isWin;
            this.skipBtn.visible = !GameLogic.Share.isWin;
            this.normalBtn.visible = GameLogic.Share.isWin;
            this.restartBtn.visible = !GameLogic.Share.isWin;
            this.trippleBtn.on(Laya.Event.CLICK, this, this.trippleBtnCB);
            this.skipBtn.on(Laya.Event.CLICK, this, this.skipBtnCB);
            this.normalBtn.on(Laya.Event.CLICK, this, this.normalBtnCB);
            this.restartBtn.on(Laya.Event.CLICK, this, this.restartBtnCB);
        }
        onClosed() {
        }
        trippleBtnCB() {
            let cb = () => {
                PlayerDataMgr.getPlayerData().coin += parseInt(this.bounesNum.value) * 3;
                this.back();
            };
            ShareMgr.instance.shareGame(cb);
        }
        skipBtnCB() {
            let cb = () => {
                PlayerDataMgr.getPlayerData().grade++;
                this.back();
            };
            ShareMgr.instance.shareGame(cb);
        }
        normalBtnCB() {
            PlayerDataMgr.getPlayerData().coin += parseInt(this.bounesNum.value);
            PlayerDataMgr.getPlayerData().grade++;
            this.back();
        }
        restartBtnCB() {
            this.back();
        }
        back() {
            PlayerDataMgr.setPlayerData();
            Laya.Scene.open('MyScenes/StartUI.scene');
            GameLogic.Share.restartGame();
        }
    }

    class LoadingUI extends Laya.Scene {
        constructor() {
            super();
            this.count = 0;
        }
        onOpened() {
            WxApi.aldEvent('加载页面');
            this.loadJsonData();
        }
        onClosed() {
        }
        loadJsonData() {
            for (let i = 1; i <= 10; i++) {
                Utility.loadJson('res/config/Road1/' + i + '.json', (data) => {
                    PlayerDataMgr.roadArr1.push(data);
                    this.loadJsonComplete();
                });
            }
            for (let i = 1; i <= 10; i++) {
                Utility.loadJson('res/config/Road2/' + i + '.json', (data) => {
                    PlayerDataMgr.roadArr2.push(data);
                    this.loadJsonComplete();
                });
            }
            for (let i = 1; i <= 10; i++) {
                Utility.loadJson('res/config/Road3/' + i + '.json', (data) => {
                    PlayerDataMgr.roadArr3.push(data);
                    this.loadJsonComplete();
                });
            }
        }
        loadJsonComplete() {
            this.count++;
            if (this.count >= 30) {
                console.log(PlayerDataMgr.roadArr1);
                console.log(PlayerDataMgr.roadArr2);
                console.log(PlayerDataMgr.roadArr3);
                this.loadRes();
            }
        }
        loadSubpackage() {
            const loadTask = Laya.Browser.window.wx.loadSubpackage({
                name: 'unity',
                success: (res) => {
                    this.loadRes();
                },
                fail: (res) => {
                    this.loadSubpackage();
                }
            });
            loadTask.onProgressUpdate(res => {
                console.log('下载进度', res.progress);
                console.log('已经下载的数据长度', res.totalBytesWritten);
                console.log('预期需要下载的数据总长度', res.totalBytesExpectedToWrite);
            });
        }
        loadRes() {
            var resUrl = [
                WxApi.UnityPath + 'Bar_01.lh',
                WxApi.UnityPath + 'Box_01.lh',
                WxApi.UnityPath + 'Building_01.lh',
                WxApi.UnityPath + 'Hero_01.lh',
                WxApi.UnityPath + 'Jewel_01.lh',
                WxApi.UnityPath + 'Pole_01.lh',
                WxApi.UnityPath + 'Road_01.lh',
                WxApi.UnityPath + 'Road_02.lh',
                WxApi.UnityPath + 'Road_03.lh',
                WxApi.UnityPath + 'Road_Finish.lh',
                WxApi.UnityPath + 'Saw_01.lh',
                WxApi.UnityPath + 'Wall_01.lh',
                WxApi.UnityPath + 'Wall_02.lh',
                WxApi.UnityPath + 'Wall_03.lh',
                WxApi.UnityPath + 'Cyl_01.lh',
                WxApi.UnityPath + 'PropPole.lh'
            ];
            Laya.loader.create(resUrl, Laya.Handler.create(this, this.onComplete), Laya.Handler.create(this, this.onProgress));
        }
        onComplete() {
            GameLogic.Share.initScene();
        }
        onProgress(value) {
            this.bar.value = value;
        }
    }

    class MadUI extends Laya.Scene {
        constructor() {
            super();
            this.closeCallback = null;
            this.hadShowBanner = false;
            this.maxPer = 100;
        }
        onOpened(param) {
            if (param != null && param != undefined) {
                this.closeCallback = param.closeCallback;
            }
            this.clickBtn.on(Laya.Event.MOUSE_DOWN, this, this.clickBtnCBDown);
            this.clickBtn.on(Laya.Event.MOUSE_UP, this, this.clickBtnCBUp);
            this.maxPer = Utility.GetRandom(JJMgr.instance.dataConfig.front_box_progress[0], JJMgr.instance.dataConfig.front_box_progress[1]);
            AdMgr.instance.hideBanner();
            Laya.timer.frameLoop(1, this, this.decBar);
            WxApi.isKillBossUI = true;
            WxApi.WxOffHide(WxApi.killbossCallback);
            WxApi.killbossCallback = () => {
                if (WxApi.isKillBossUI) {
                    Laya.timer.once(100, this, () => { Laya.Scene.close('MyScenes/MadUI.scene'); });
                }
            };
            WxApi.WxOnHide(WxApi.killbossCallback);
        }
        onClosed() {
            AdMgr.instance.hideBanner();
            Laya.timer.clearAll(this);
            if (this.closeCallback) {
                Laya.timer.once(100, this, () => {
                    this.closeCallback();
                });
            }
            WxApi.isKillBossUI = false;
        }
        decBar() {
            this.bar.value -= 0.06 / 60;
            if (this.bar.value < 0) {
                this.bar.value = 0;
            }
        }
        clickBtnCBDown() {
            this.boxAni.play(0, false);
            this.bar.value += 0.2;
            if (this.bar.value > 1) {
                this.bar.value = 1;
            }
            if (!this.hadShowBanner) {
                if (this.bar.value * 100 >= this.maxPer) {
                    AdMgr.instance.showBanner(true);
                    Laya.timer.once(5000, this, () => {
                        this.closeBtnCB();
                    });
                    this.hadShowBanner = true;
                    Laya.timer.clear(this, this.decBar);
                }
            }
            this.clickBtn.scaleX = 1.1;
            this.clickBtn.scaleY = 1.1;
        }
        clickBtnCBUp() {
            this.clickBtn.scaleX = 1;
            this.clickBtn.scaleY = 1;
        }
        closeBtnCB() {
            this.close();
        }
    }

    class SkinUI extends Laya.Scene {
        constructor() {
            super();
            this.curPage = 0;
            this.chooseId = 0;
        }
        onOpened() {
            Laya.timer.frameLoop(1, this, this.updateCB);
            this.skinBtn.on(Laya.Event.CLICK, this, this.skinBtnCB);
            this.motionBtn.on(Laya.Event.CLICK, this, this.motionBtnCB);
            this.useBtn.on(Laya.Event.CLICK, this, this.useBtnCB);
            this.adBtn.on(Laya.Event.CLICK, this, this.adBtnCB);
            this.backBtn.on(Laya.Event.CLICK, this, this.backBtnCB);
            this.skinBtnCB();
        }
        onClosed() {
        }
        updateItem() {
            for (let i = 0; i < this.itemNode.numChildren; i++) {
                if (this.curPage == 0 && i == this.itemNode.numChildren - 1) {
                    this.itemNode.getChildAt(i).visible = false;
                    continue;
                }
                else {
                    this.itemNode.getChildAt(i).visible = true;
                }
                let item = this.itemNode.getChildAt(i);
                let icon = item.getChildByName('icon');
                let choose = item.getChildByName('choose');
                let tips = item.getChildByName('tips');
                if (this.curPage == 0) {
                    item.skin = PlayerDataMgr.getPlayerData().skinArr[i] == 1 ? 'skinUI/pf_yy_1.png' : 'skinUI/pf_wyy_1.png';
                    icon.skin = 'skinUI/pf_js_' + (i + 1) + '.png';
                    choose.visible = i == this.chooseId;
                    tips.visible = PlayerDataMgr.getPlayerData().skinArr[i] == 0 || PlayerDataMgr.getPlayerData().skinId == i;
                    tips.skin = i == PlayerDataMgr.getPlayerData().skinId ? 'skinUI/tw_syz_1.png' : 'skinUI/tw_syy_1.png';
                }
                else {
                    item.skin = 'skinUI/tw_mr_' + (i + 1) + '.png';
                    icon.skin = '';
                    choose.visible = i == this.chooseId;
                    tips.visible = PlayerDataMgr.getPlayerData().msArr[i] == 0 || PlayerDataMgr.getPlayerData().msId == i;
                    tips.skin = i == PlayerDataMgr.getPlayerData().msId ? 'skinUI/tw_syz_1.png' : 'skinUI/tw_syy_1.png';
                }
                item.off(Laya.Event.CLICK, this, this.itemCB);
                item.on(Laya.Event.CLICK, this, this.itemCB, [i]);
            }
        }
        itemCB(index) {
            this.chooseId = index;
            this.costNum.visible = false;
            if (this.curPage == 0) {
                if (PlayerDataMgr.getPlayerData().skinArr[index] == 1) {
                    if (PlayerDataMgr.getPlayerData().skinId == index) {
                        this.useBtn.skin = 'skinUI/tw_btn_4.png';
                    }
                    else {
                        this.useBtn.skin = 'skinUI/tw_btn_2.png';
                    }
                }
                else {
                    this.useBtn.skin = 'skinUI/tw_btn_3.png';
                    this.costNum.visible = true;
                    this.costNum.value = '3000';
                }
            }
            else {
                if (PlayerDataMgr.getPlayerData().msArr[index] == 1) {
                    if (PlayerDataMgr.getPlayerData().msId == index) {
                        this.useBtn.skin = 'skinUI/tw_btn_4.png';
                    }
                    else {
                        this.useBtn.skin = 'skinUI/tw_btn_2.png';
                    }
                }
                else {
                    this.useBtn.skin = 'skinUI/tw_btn_3.png';
                    this.costNum.visible = true;
                    this.costNum.value = '2000';
                }
            }
            this.updateItem();
        }
        skinBtnCB() {
            this.curPage = 0;
            this.chooseId = PlayerDataMgr.getPlayerData().skinId;
            this.costNum.visible = false;
            this.useBtn.skin = 'skinUI/tw_btn_4.png';
            this.skinBtn.skin = 'skinUI/tw_yq_4.png';
            this.motionBtn.skin = 'skinUI/tw_yq_2.png';
            this.updateItem();
        }
        motionBtnCB() {
            this.curPage = 1;
            this.chooseId = PlayerDataMgr.getPlayerData().msId;
            this.costNum.visible = false;
            this.useBtn.skin = 'skinUI/tw_btn_4.png';
            this.skinBtn.skin = 'skinUI/tw_yq_2.png';
            this.motionBtn.skin = 'skinUI/tw_yq_4.png';
            this.updateItem();
        }
        useBtnCB() {
            if (this.useBtn.skin == 'skinUI/tw_btn_2.png') {
                if (this.curPage == 0) {
                    PlayerDataMgr.getPlayerData().skinId = this.chooseId;
                }
                else {
                    PlayerDataMgr.getPlayerData().msId = this.chooseId;
                }
            }
            else if (this.useBtn.skin == 'skinUI/tw_btn_3.png') {
                if (this.curPage == 0) {
                    if (PlayerDataMgr.getPlayerData().coin >= 3000) {
                        PlayerDataMgr.getPlayerData().skinArr[this.chooseId] = 1;
                        PlayerDataMgr.getPlayerData().skinId = this.chooseId;
                        PlayerDataMgr.getPlayerData().coin -= 3000;
                        this.costNum.visible = false;
                        this.useBtn.skin = 'skinUI/tw_btn_4.png';
                    }
                    else {
                        WxApi.OpenAlert('钻石不足！');
                    }
                }
                else {
                    if (PlayerDataMgr.getPlayerData().coin >= 2000) {
                        PlayerDataMgr.getPlayerData().msArr[this.chooseId] = 1;
                        PlayerDataMgr.getPlayerData().msId = this.chooseId;
                        PlayerDataMgr.getPlayerData().coin -= 2000;
                        this.costNum.visible = false;
                        this.useBtn.skin = 'skinUI/tw_btn_4.png';
                    }
                    else {
                        WxApi.OpenAlert('钻石不足！');
                    }
                }
            }
            PlayerDataMgr.setPlayerData();
            this.updateItem();
        }
        adBtnCB() {
            let cb = () => {
                PlayerDataMgr.getPlayerData().coin += 1000;
                PlayerDataMgr.setPlayerData();
                WxApi.OpenAlert('获得1000钻石！');
            };
            ShareMgr.instance.shareGame(cb);
        }
        backBtnCB() {
            Laya.Scene.open('MyScenes/StartUI.scene');
        }
        updateCB() {
            this.coinNum.value = PlayerDataMgr.getPlayerData().coin.toString();
        }
    }

    class StartUI extends Laya.Scene {
        constructor() {
            super();
            this.hadStart = false;
        }
        onAwake() {
        }
        onOpened() {
            this.gradeNum.text = PlayerDataMgr.getPlayerData().grade.toString();
            this.startBtn.on(Laya.Event.MOUSE_UP, this, this.startBtnCB);
            this.skinBtn.on(Laya.Event.MOUSE_UP, this, this.skinBtnCB);
            Laya.timer.frameLoop(1, this, this.updateCB);
        }
        onClosed() {
            Laya.timer.clearAll(this);
        }
        startBtnCB() {
            if (this.hadStart)
                return;
            this.hadStart = true;
            GameLogic.Share.gameStart();
        }
        skinBtnCB() {
            Laya.Scene.open('MyScenes/SkinUI.scene');
        }
        moreGameBtnCB() {
            AdMgr.instance.hideBanner();
            JJMgr.instance.openScene(SceneDir.SCENE_FULLGAMEUI, false, {
                continueCallbackFun: () => {
                    JJMgr.instance.openScene(SceneDir.SCENE_DRAWUI, false, { autoTime: 1500 });
                    AdMgr.instance.showBanner();
                }
            });
        }
        drawBtnCB() {
            JJMgr.instance.openScene(SceneDir.SCENE_DRAWUI);
            WxApi.aldEvent('点击抽屉按钮人数');
        }
        updateCB() {
            this.coinNum.value = PlayerDataMgr.getPlayerData().coin.toString();
        }
    }

    class GameConfig {
        constructor() {
        }
        static init() {
            var reg = Laya.ClassUtils.regClass;
            reg("JJExport/View/DrawUI.ts", DrawUI);
            reg("JJExport/Libs/AutoFixPosY.ts", AutoFixPosY);
            reg("JJExport/View/FinishGameUI.ts", FinishGameUI);
            reg("JJExport/View/FriendGameUI.ts", FriendGameUI);
            reg("Libs/FixNodeY.ts", FixNodeY);
            reg("JJExport/View/FullGameUI.ts", FullGameUI);
            reg("JJExport/View/ProgramUI.ts", ProgramUI);
            reg("JJExport/View/RecommendUI.ts", RecommendUI);
            reg("JJExport/View/ScrollUI.ts", ScrollUI);
            reg("JJExport/View/StartNavUI.ts", StartNavUI);
            reg("JJExport/View/WeChatUI.ts", WeChatUI);
            reg("View/FinishUI.ts", FinishUI);
            reg("View/GameUI.ts", GameUI);
            reg("View/LoadingUI.ts", LoadingUI);
            reg("View/MadUI.ts", MadUI);
            reg("View/SkinUI.ts", SkinUI);
            reg("View/StartUI.ts", StartUI);
        }
    }
    GameConfig.width = 750;
    GameConfig.height = 1334;
    GameConfig.scaleMode = "fixedwidth";
    GameConfig.screenMode = "vertical";
    GameConfig.alignV = "top";
    GameConfig.alignH = "left";
    GameConfig.startScene = "MyScenes/FinishUI.scene";
    GameConfig.sceneRoot = "";
    GameConfig.debug = false;
    GameConfig.stat = false;
    GameConfig.physicsDebug = false;
    GameConfig.exportSceneToJson = true;
    GameConfig.init();

    class Main {
        constructor() {
            if (window["Laya3D"])
                Laya3D.init(GameConfig.width, GameConfig.height);
            else
                Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
            Laya["Physics"] && Laya["Physics"].enable();
            Laya["DebugPanel"] && Laya["DebugPanel"].enable();
            Laya.stage.scaleMode = GameConfig.scaleMode;
            Laya.stage.screenMode = GameConfig.screenMode;
            Laya.stage.alignV = GameConfig.alignV;
            Laya.stage.alignH = GameConfig.alignH;
            Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
            Laya.stage.useRetinalCanvas = true;
            if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
                Laya.enableDebugPanel();
            if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
                Laya["PhysicsDebugDraw"].enable();
            if (GameConfig.stat)
                Laya.Stat.show();
            Laya.alertGlobalError(true);
            Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
        }
        onVersionLoaded() {
            Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
        }
        onConfigLoaded() {
            new GameLogic();
        }
    }
    new Main();

}());
//# sourceMappingURL=bundle.js.map
