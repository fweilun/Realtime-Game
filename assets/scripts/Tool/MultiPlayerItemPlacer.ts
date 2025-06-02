const { ccclass, property } = cc._decorator;

@ccclass
export default class MultiPlayerItemPlacer extends cc.Component {
    @property(cc.Prefab) boxPrefab: cc.Prefab = null;
    @property(cc.Prefab) weightPrefab: cc.Prefab = null;
    @property(cc.Prefab) spikePrefab: cc.Prefab = null;
    @property(cc.Prefab) sawPrefab: cc.Prefab = null;
    @property(cc.Prefab) gunPrefab: cc.Prefab = null;
    @property(cc.Prefab) cannonPrefab: cc.Prefab = null;
    @property(cc.Prefab) ironballPrefab: cc.Prefab = null;

    @property(cc.Prefab) boxIcon: cc.Prefab = null;
    @property(cc.Prefab) weightIcon: cc.Prefab = null;
    @property(cc.Prefab) spikeIcon: cc.Prefab = null;
    @property(cc.Prefab) sawIcon: cc.Prefab = null;
    @property(cc.Prefab) gunIcon: cc.Prefab = null;
    @property(cc.Prefab) cannonIcon: cc.Prefab = null;
    @property(cc.Prefab) ironballIcon: cc.Prefab = null;

    @property(cc.Node) mapNode: cc.Node = null;
    @property(cc.Node) cursorLayer: cc.Node = null;

    @property(cc.Prefab) playerPrefab: cc.Prefab = null;
    @property(cc.Node) spawnPoint: cc.Node = null;

    private cursorItem: cc.Node = null;
    private currentPrefab: cc.Prefab = null;
    private selectedType: string = null;

    private prefabMap: { [key: string]: cc.Prefab } = {};
    private iconMap: { [key: string]: cc.Prefab } = {};

    onLoad() {
        this.prefabMap = {
            box: this.boxPrefab,
            weight: this.weightPrefab,
            spike: this.spikePrefab,
            saw: this.sawPrefab,
            gun: this.gunPrefab,
            cannon: this.cannonPrefab,
            ironball: this.ironballPrefab,
        };
        this.iconMap = {
            box: this.boxIcon,
            weight: this.weightIcon,
            spike: this.spikeIcon,
            saw: this.sawIcon,
            gun: this.gunIcon,
            cannon: this.cannonIcon,
            ironball: this.ironballIcon,
        };

        this.cursorLayer.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.cursorLayer.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    start() {
        const selected = cc.game["selectedBlockType"];
        if (selected) {
            this.setSelectedType(selected);
        } else {
            console.warn("❗ 尚未從選擇場景讀取到選擇的道具！");
        }

        if (cc.game["placedItems"]) {
            for (const item of cc.game["placedItems"]) {
                const prefab = this.prefabMap[item.type];
                if (prefab) {
                    const node = cc.instantiate(prefab);
                    node.setPosition(item.x, item.y);
                    this.mapNode.addChild(node);
                }
            }
        }
    }

    onDestroy() {
        this.cursorLayer.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.cursorLayer.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    setSelectedType(type: string) {
        this.selectedType = type;

        if (this.cursorItem) this.cursorItem.destroy();

        const iconPrefab = this.iconMap[type];
        const actualPrefab = this.prefabMap[type];

        if (!iconPrefab || !actualPrefab) {
            console.warn("❌ 找不到對應的道具或圖示：", type);
            return;
        }

        this.currentPrefab = actualPrefab;
        this.cursorItem = cc.instantiate(iconPrefab);
        this.cursorItem.opacity = 180;
        this.cursorItem.parent = this.cursorLayer;
        this.cursorItem.zIndex = 999;
    }

    onMouseMove(event: cc.Event.EventMouse) {
        if (!this.cursorItem) return;
        const pos = this.cursorLayer.convertToNodeSpaceAR(event.getLocation());
        this.cursorItem.setPosition(pos);
    }

    onMouseDown(event: cc.Event.EventMouse) {
        if (!this.selectedType || !this.currentPrefab) return;

        const pos = this.mapNode.convertToNodeSpaceAR(event.getLocation());
        const newItem = cc.instantiate(this.currentPrefab);
        newItem.setPosition(pos);
        this.mapNode.addChild(newItem);

        console.log(`✅ 已放置 ${this.selectedType} 道具！`);

        // 清除游標，準備開始遊戲邏輯
        if (this.cursorItem) {
            this.cursorItem.destroy();
            this.cursorItem = null;
        }

        this.onPlaced(); // 可以自定義觸發遊戲開始

        if (!cc.game["placedItems"]) cc.game["placedItems"] = [];

        cc.game["placedItems"].push({
            type: this.selectedType,
            x: pos.x,
            y: pos.y
        });
    }

    spawnPlayer() {
        if (!this.playerPrefab || !this.spawnPoint) {
            console.warn(" 先設定 playerPrefab 和 spawnPoint");
            return;
        }

        const player = cc.instantiate(this.playerPrefab);
        player.setPosition(this.spawnPoint.position);
        this.mapNode.addChild(player);

        const ctrl = player.getComponent("PlayerController");
        ctrl?.born(); 

        console.log("主角已生成");
    }

    onPlaced() {
        console.log(" 道具放置完成，可以開始遊戲！");
        this.spawnPlayer();

        // ❌ 關閉事件監聽，不能再放置
        this.cursorLayer.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.cursorLayer.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.enabled = false;
    }
}
