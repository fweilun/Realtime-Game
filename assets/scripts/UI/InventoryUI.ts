const { ccclass, property } = cc._decorator;

@ccclass
export default class InventoryUI extends cc.Component {

    @property(cc.Node)
    inventoryUI: cc.Node = null; 

    private isVisible: boolean = true;

    onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        if (event.keyCode === cc.macro.KEY.shift) {
            this.isVisible = !this.isVisible;
            this.inventoryUI.active = this.isVisible;
        }
    }
}
