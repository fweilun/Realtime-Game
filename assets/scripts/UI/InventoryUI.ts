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
        // slot1 放 box icon
        const Icon1 = cc.instantiate(this.Icon1);
        Icon1.parent = this.slot1;
        Icon1.setPosition(0, 0);

        const Icon2 = cc.instantiate(this.Icon2);
        Icon2.parent = this.slot2;
        Icon2.setPosition(0, 0);

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
        const player = this.playerNode.getComponent("PlayerController");
        player.blockHold = this.blockTypes[this.currentIndex];
        console.log("🎯 blockHold =", player.blockHold);
    }
}
