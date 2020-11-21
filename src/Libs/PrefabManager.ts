
/**预制体类型 */
export enum PrefabItem {
    Add = 'MyScenes/addScore.prefab',
    Dec = 'MyScenes/decScore.prefab'
}

export default class PrefabManager {
    private static _instance: PrefabManager
    private url: string[];

    constructor() {
        this.init();
        Laya.loader.load(this.url, Laya.Handler.create(this, this.loadComplete), Laya.Handler.create(this, this.loadProgress), Laya.Loader.PREFAB);
    }

    public static instance() {
        return PrefabManager._instance ? PrefabManager._instance : PrefabManager._instance = new PrefabManager()
    }

    /**初始化 */
    init() {
        this.url = [];
        for (let prefab in PrefabItem) {
            this.url.push(PrefabItem[prefab]);
        }
    }

    /**
     * 获取预制体对象
     * @param name 预制体名称
     */
    getItem(name): any {
        let prefab: Laya.Prefab = Laya.loader.getRes(name);

        if (prefab) {
            return Laya.Pool.getItemByCreateFun(name, prefab.create, prefab);
        }
        else return null;
    }

    /**
     * 回收预制体对象
     * @param name 预制体名称
     * @param item 预制体对象
     */
    recoverItem(name, item) {
        Laya.Pool.recover(name, item);
    }

    loadProgress(res) {
        console.log("预制体资源加载中...", res);
    }

    loadComplete() {
        console.log("预制体资源加载完成!");
    }
}