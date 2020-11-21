export default class JJUtils {

    //网络请求
    public static httpRequest(url: string, params: any, type: string = 'get', completeHandler?: Function) {
        var xhr: Laya.HttpRequest = new Laya.HttpRequest();
        xhr.http.timeout = 5000;//设置超时时间；
        xhr.once(Laya.Event.COMPLETE, this, completeHandler);
        xhr.once(Laya.Event.ERROR, this, this.httpRequest, [url, params, type, completeHandler]);
        if (type == "get") {
            xhr.send(url + '?' + params, "", type, "text");
        } else if (type == "post") {
            xhr.send(url, JSON.stringify(params), type, "text");
        }
    }

    //打乱数组
    public static shuffleArr(arr: any[]) {
        let i = arr.length;
        while (i) {
            let j = Math.floor(Math.random() * i--);
            [arr[j], arr[i]] = [arr[i], arr[j]];
        }
        return arr;
    }

    public static fixNodeY(node) {
        node.y = node.y * Laya.stage.displayHeight / Laya.stage.designHeight
    }

    public static visibleDelay(node, duration: number = 1500) {
        node.visible = false
        Laya.timer.once(duration, this, () => {
            node.visible = true
        })
    }

    public static tMove(node, x, y, t, cb?: Function) {
        Laya.Tween.to(node, { x: x, y: y }, t, null, new Laya.Handler(this, () => {
            cb && cb()
        }))
    }

}