const { ccclass, property } = cc._decorator;

@ccclass
export default class InventoryUI extends cc.Component {

    @property(cc.Node)
    inventoryUI: cc.Node = null; 

    @property(cc.Prefab)
    Icon1: cc.Prefab = null;

    @property(cc.Prefab)
    Icon2: cc.Prefab = null;

    @property(cc.Node)
    slot1: cc.Node = null;

    @property(cc.Node)
    slot2: cc.Node = null;

    @property(cc.Node)
    selectorBox: cc.Node = null;

    @property(cc.Node)
    playerNode: cc.Node = null;

    private isVisible: boolean = true;
    private currentIndex: number = 0;
    private blockTypes: string[] = ["box", "weight"];
    private boundWheelHandler: any = null;

    onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        this.boundWheelHandler = this.onWheelNative.bind(this);
        const canvas = document.getElementById("GameCanvas");
        if (canvas) {
            canvas.addEventListener("wheel", this.boundWheelHandler);
            console.log("🖱️ 滑鼠滾輪事件綁定成功");
        } else {
            console.warn("⚠️ 找不到 GameCanvas，滾輪事件無法綁定");
        }
    }

    start() {
        const selected = cc.game["selectedBlockTypes"];
        if (selected && selected.length === 2) {
            this.blockTypes = selected;
            console.log("🧩 從 SelectionScene 讀入 blockTypes：", this.blockTypes);
        }

        for (let i = 0; i < 2; i++) {
            const type = this.blockTypes[i];
            const iconPrefab = type === "box" ? this.Icon1 : this.Icon2;
            const slot = i === 0 ? this.slot1 : this.slot2;
            const icon = cc.instantiate(iconPrefab);
            icon.parent = slot;
            icon.setPosition(0, 0);
        }

        this.updateSelector();
        this.updatePlayerBlockHold();
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        const canvas = document.getElementById("GameCanvas");
        if (canvas && this.boundWheelHandler) {
            canvas.removeEventListener("wheel", this.boundWheelHandler);
        }
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        if (event.keyCode === cc.macro.KEY.shift) {
            this.isVisible = !this.isVisible;
            this.inventoryUI.active = this.isVisible;
        }
    }

    onWheelNative(event: WheelEvent) {
        const dir = event.deltaY > 0 ? 1 : -1;
        this.currentIndex = (this.currentIndex + dir + 2) % 2;
        this.updateSelector();
        this.updatePlayerBlockHold();
    }

    updateSelector() {
        const currentSlot = [this.slot1, this.slot2][this.currentIndex];
        this.selectorBox.parent = currentSlot;
        this.selectorBox.setPosition(0, 0); // 對齊 slot 中心
    }

    updatePlayerBlockHold() {
        if(!this.playerNode) return;
        const player = this.playerNode.getComponent("LocalPlayerController");
        player.blockHold = this.blockTypes[this.currentIndex];
        console.log("🎯 blockHold =", player.blockHold);
    }
}
