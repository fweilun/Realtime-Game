const { ccclass, property } = cc._decorator;

@ccclass
export default class WeightPlacer extends cc.Component {

    @property(cc.Prefab)
    weightPrefab: cc.Prefab = null;

    @property(cc.Node)
    player: cc.Node = null;

    @property(cc.Node)
    mapNode: cc.Node = null;

    @property
    tileSize: number = 70;

    @property
    cooldownSeconds: number = 3;

    private canvasElement: HTMLCanvasElement = null;
    private boundMouseHandler: any = null;
    private lastPlacedTime: number = -Infinity;

    onLoad() {
        this.canvasElement = document.getElementById("GameCanvas") as HTMLCanvasElement;
        this.boundMouseHandler = this.onMouseDownNative.bind(this);

        if (this.canvasElement) {
            this.canvasElement.addEventListener("mousedown", this.boundMouseHandler);
            console.log("✅ Canvas 綁定成功 (Weight)");
        } else {
            console.error("❌ 無法找到 GameCanvas");
        }
    }

    onDestroy() {
        if (this.canvasElement && this.boundMouseHandler) {
            this.canvasElement.removeEventListener("mousedown", this.boundMouseHandler);
        }
    }

    onMouseDownNative(e: MouseEvent) {
        const button = e.button;
        if (button !== 0) return; // 只處理左鍵

        const now = Date.now();
        if (now - this.lastPlacedTime < this.cooldownSeconds * 1000) {
            console.log("⌛ Weight 冷卻中");
            return;
        }

        if(!this.playerNode) return;
        const player = this.playerNode.getComponent("LocalPlayerController");
        if (playerScript.blockHold !== "weight") return;

        const screenPos = new cc.Vec2(e.clientX, e.clientY);
        const worldPos = cc.Camera.main.getScreenToWorldPoint(screenPos);
        const localPos = this.mapNode.convertToNodeSpaceAR(worldPos);

        const x = localPos.x;
        const y = localPos.y;
        const snappedPos = cc.v2(x - 330, -y + 50);

        if (snappedPos.y <= 280) {
            console.log("⚠️ y <= 280，不能放 weight");
            return;
        }

        const weight = cc.instantiate(this.weightPrefab);
        this.mapNode.addChild(weight);
        weight.setPosition(snappedPos);

        const rigid = weight.getComponent(cc.RigidBody);
        if (rigid) {
            rigid.type = cc.RigidBodyType.Dynamic;
            rigid.gravityScale = 2;
        }

        this.lastPlacedTime = now;
        console.log("✅ 放置 Weight（冷卻重置）：", snappedPos);
    }
}
