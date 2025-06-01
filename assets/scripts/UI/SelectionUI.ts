const { ccclass, property } = cc._decorator;

@ccclass
export default class SelectionUI extends cc.Component {

    @property(cc.Node)
    slot1: cc.Node = null;

    @property(cc.Node)
    slot2: cc.Node = null;

    @property(cc.Prefab)
    boxIconPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    weightIconPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    spikeIconPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    sawIconPrefab: cc.Prefab = null;

    @property(cc.Button)
    boxButton: cc.Button = null;

    @property(cc.Button)
    weightButton: cc.Button = null;

    @property(cc.Button)
    spikeButton: cc.Button = null;

    @property(cc.Button)
    sawButton: cc.Button = null;

    private selected: string[] = [];

    onLoad() {
        if (this.boxButton) {
            this.boxButton.node.on('click', () => this.onSelect("box"), this);
        }
        if (this.weightButton) {
            this.weightButton.node.on('click', () => this.onSelect("weight"), this);
        }
        if (this.spikeButton) {
            this.spikeButton.node.on('click', () => this.onSelect("spike"), this);
        }
        if (this.sawButton) {
            this.sawButton.node.on('click', () => this.onSelect("saw"), this);
        }
    }

    onSelect(type: string) {
        if (this.selected.length >= 2) {
            console.warn("❗ 最多只能選兩個");
            return;
        }

        this.selected.push(type);
        const slot = this.selected.length === 1 ? this.slot1 : this.slot2;

        let icon: cc.Node = null;
        if (type === "box") {
            icon = cc.instantiate(this.boxIconPrefab);
        } else if (type === "weight") {
            icon = cc.instantiate(this.weightIconPrefab);
        } else if (type === "spike") {
            icon = cc. instantiate(this.spikeIconPrefab);
        } else if (type === "saw") {
            icon = cc.instantiate(this.sawIconPrefab);
        }

        if (!icon || !slot) {
            console.error("❌ 無法產生圖示或 slot 無效");
            return;
        }

        icon.parent = slot;
        icon.setPosition(0, 0);
        icon.opacity = 255;

        console.log("✅ 選擇了", type);

        // 如果已選兩個，跳場景
        if (this.selected.length === 2) {
            cc.game["selectedBlockTypes"] = this.selected;
            cc.director.loadScene("Scene1_dirt");
        }
    }
}
