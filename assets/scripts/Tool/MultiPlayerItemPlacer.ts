const { ccclass, property } = cc._decorator;
import FirebaseManager from '../libs/firebase/FirebaseManager';

enum ItemState {
    Moving = "moving",
    Placed = "placed"
}

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

    private firebaseManager: FirebaseManager | null = null;
    private auth: any = null;
    private db: any = null;
    private roomId: string = null;
    private playerId: string = null;

    private ghostItems: { [key: string]: cc.Node } = {};
    private ghoastItemNum:number = null
    private itemListRef:any = null;
    private itemKey:any = null;
    private placed:boolean = null;

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

    async start() {
        // load information
        this.roomId = cc.game["currentRoomId"];
        this.firebaseManager = FirebaseManager.getInstance();
        if (!this.firebaseManager) {
            cc.error("RoomUI: FirebaseManager instance not found via getInstance(). Aborting Firebase setup.");
            return;
        }
        await this.firebaseManager.awaitInitialization();
        this.db = this.firebaseManager.getDatabase();
        this.auth = this.firebaseManager.getAuth();
        if (this.auth.currentUser) {
            this.playerId = this.auth.currentUser.uid;
        } else {
            console.error("User not logged in yet.");
            // 可以選擇導向登入流程或等待 onAuthStateChanged
        }

        if (!this.auth.currentUser) { // Check if there's no current user (useful after cold start)
            this.auth.signInAnonymously().catch(error => {
                cc.error("Error signing in anonymously at start():", error.code, error.message);
            });
        }
        this.itemListRef = this.db.ref(`rooms/active/${this.roomId}/items`);
        // Add item to group first
        const selected = cc.game["selectedBlockType"];
        if (selected) {
            this.setSelectedType(selected);
        } else {
            console.warn("❗ 尚未從選擇場景讀取到選擇的道具！");
        }
        // add item to list
        const tempRef = this.itemListRef.push({
            type: this.selectedType,
            state: ItemState.Moving,
            placedBy: this.playerId,
            x: 0,
            y: 0
        });
        this.itemKey = tempRef.key
        // 從 Firebase 讀取已放置的道具
        this.loadPlacedItems();
        this.listenToOtherPlayers();
    }

    async loadPlacedItems() {
        if (!this.db || !this.roomId) return;
        const snapshot = await this.itemListRef.once('value');
        const items = snapshot.val() || [];
        for (const item of items) {
            if (item.state != ItemState.Placed) continue;
            const prefab = this.prefabMap[item.type];
            if (prefab) {
                const node = cc.instantiate(prefab);
                node.setPosition(item.x, item.y);
                this.mapNode.addChild(node);
            }
        }
    }
    async syncObjectPos() {
        if (!this.itemKey || !this.itemListRef) return;
        const pos = this.cursorItem.getPosition();
        await this.itemListRef.child(this.itemKey).update({
            x: pos.x,
            y: pos.y
        });
    }

    onDestroy() {
        this.cursorLayer.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.cursorLayer.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        
        // 清理 Firebase 監聽
        if (this.itemListRef) {
            this.itemListRef.off();
        }
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
        this.syncObjectPos();
    }

    onMouseDown(event: cc.Event.EventMouse) {
        if (!this.selectedType || !this.currentPrefab) return;

        const pos = this.mapNode.convertToNodeSpaceAR(event.getLocation());
        const newItem = cc.instantiate(this.currentPrefab);
        newItem.setPosition(pos);
        this.mapNode.addChild(newItem);

        // 更新到 Firebase
        if (this.db && this.roomId) {
            const newRef = this.itemListRef.push({
                type: this.selectedType,
                x: pos.x,
                y: pos.y,
                placedBy: this.playerId,
                state: ItemState.Placed
            });
        }
        console.log(`✅ 已放置 ${this.selectedType} 道具！`);

        if (this.cursorItem) {
            this.cursorItem.destroy();
            this.cursorItem = null;
        }

        this.onPlaced();
    }

    listenToOtherPlayers() {
        if (!this.itemListRef) return;
        
        // 監聽新放置的道具
        this.itemListRef.on('child_added', (snapshot) => {
            const item = snapshot.val();
            const key = snapshot.key;
            if (item.placedBy !== this.playerId) {
                const prefab = this.prefabMap[item.type];
                if (prefab) {
                    if (item.state == ItemState.Moving) {
                        // 產生半透明方塊
                        const ghost = cc.instantiate(prefab);
                        ghost.opacity = 100; // 半透明
                        ghost.setPosition(item.x, item.y);
                        this.mapNode.addChild(ghost);
                        // 記錄起來
                        this.ghoastItemNum++;
                        this.ghostItems[key] = ghost;
                    }else{
                        console.error("Item放置非預期");
                    }
                }
            }
        });

        this.itemListRef.on('child_changed', (snapshot) => {
            const item = snapshot.val();
            const key = snapshot.key;

            if (item.placedBy !== this.playerId) {
                if (item.state == ItemState.Placed) {
                    if (this.ghostItems[key]) {
                        this.ghostItems[key].destroy();
                        delete this.ghostItems[key];
                        --this.ghoastItemNum;
                        // 有玩家放好方塊就檢查要不要開始遊戲
                        this.checkAllPlaced();
                    }
                    // 放正式的
                    const prefab = this.prefabMap[item.type];
                    if (prefab) {
                        const node = cc.instantiate(prefab);
                        node.setPosition(item.x, item.y);
                        this.mapNode.addChild(node);
                    }
                } else if (item.state == ItemState.Moving) {
                    // ghost 還在，更新位置
                    if (this.ghostItems[key]) {
                        this.ghostItems[key].setPosition(item.x, item.y);
                    }
                }
            }
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
        this.placed = true;
        this.cursorLayer.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.cursorLayer.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        // 只 update state，不要再 push
        if (this.itemKey && this.itemListRef) {
            const pos = this.cursorItem ? this.cursorItem.getPosition() : {x: 0, y: 0};
            this.itemListRef.child(this.itemKey).update({
                x: pos.x,
                y: pos.y,
                state: ItemState.Placed
            });
        }

        this.checkAllPlaced();
    }

    private checkAllPlaced() {
        console.log("why bro");
        console.log(this.ghostItems);
        console.log(this.playerId);
        if (this.placed && (this.ghoastItemNum==0)) {
            console.log(" 道具放置完成，可以開始遊戲！");
            this.spawnPlayer();
            this.enabled = false;
        }else{
            console.log("還有玩家沒放道具！");
        }
    }
}
