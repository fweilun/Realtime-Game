const { ccclass, property } = cc._decorator;

@ccclass
export default class BoxPlacer extends cc.Component {

    @property(cc.Prefab)
    boxPrefab: cc.Prefab = null;

    @property(cc.Node)
    player: cc.Node = null;

    @property(cc.Node)
    mapNode: cc.Node = null;

    @property
    tileSize: number = 70;

    @property
    maxBoxCount: number = 3;

    private placedBoxes: cc.Node[] = [];
    private canvasElement: HTMLCanvasElement = null;
    private boundMouseHandler: any = null;

    onLoad() {
        this.canvasElement = document.getElementById("GameCanvas") as HTMLCanvasElement;
        this.boundMouseHandler = this.onMouseDownNative.bind(this);

        if (this.canvasElement) {
            this.canvasElement.addEventListener("mousedown", this.boundMouseHandler);
            console.log("✅ Canvas 綁定成功");
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
        const playerScript = this.player.getComponent("PlayerController"); 
        if (playerScript.blockHold !== "box") return;
        const button = e.button;

        const screenPos = new cc.Vec2(e.clientX, e.clientY);
        const worldPos = cc.Camera.main.getScreenToWorldPoint(screenPos);
        const localPos = this.mapNode.convertToNodeSpaceAR(worldPos);

        const x = localPos.x
        const y = localPos.y;
        const snappedPos = cc.v2(x-330, -y+50); 

        if (button === 0) {
    
            if (this.placedBoxes.length < this.maxBoxCount && this.canPlaceAt(snappedPos)) {
                const box = cc.instantiate(this.boxPrefab);
                this.mapNode.addChild(box);
                box.setPosition(snappedPos);

                const rigid = box.getComponent(cc.RigidBody);
                if (rigid) {
                    rigid.type = cc.RigidBodyType.Static;
                }

                this.placedBoxes.push(box);
                console.log("✅ 放置 Box：", snappedPos);
            }
        }

        if (button === 2) {
            for (const box of this.placedBoxes) {
                box.destroy();
            }
            this.placedBoxes = [];
            console.log("🧹 Box 已全部清除");
        }
    }

    canPlaceAt(pos: cc.Vec2): boolean {
        return true;
    }
}