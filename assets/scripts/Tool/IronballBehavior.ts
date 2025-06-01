const { ccclass, property } = cc._decorator;

@ccclass
export default class IronballBehavior extends cc.Component {

    @property({ type: [cc.Prefab] })
    prefabs: cc.Prefab[] = [];  // 包含所有鐵球 prefab

    @property()
    interval: number = 0.15;

    private sequence: string[] = [
        "ironball_0", "ironball_20", "ironball_40", "ironball_60",
        "ironball_40", "ironball_20", "ironball_0",
        "ironball_-20", "ironball_-40", "ironball_-60",
        "ironball_-40", "ironball_-20"
    ];

    private index: number = 0;
    private timer: number = 0;

    start() {
        this.updateVisual();
    }

    update(dt: number) {
        this.timer += dt;
        if (this.timer >= this.interval) {
            this.timer = 0;
            this.index = (this.index + 1) % this.sequence.length;
            this.updateVisual();
        }
    }

    updateVisual() {
        // 先刪除現有子物件
        this.node.removeAllChildren();

        const prefabName = this.sequence[this.index];
        const prefab = this.prefabs.find(p => p.name === prefabName);

        if (!prefab) {
            cc.warn(`[⚠️] Prefab ${prefabName} not found in prefabs[]`);
            return;
        }

        const inst = cc.instantiate(prefab);
        inst.name = "ironball_main"; 
        inst.setPosition(cc.Vec2.ZERO); // 重要：確保出現在父物件中心
        this.node.addChild(inst);
    }
}
