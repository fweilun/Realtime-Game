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
    private ghoastItemNum: number = 0;
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
        this.roomId = cc.game["currentRoomId"];
        await this.initFirebase();
        this.itemListRef = this.db.ref(`rooms/active/${this.roomId}/items`);
        this.playerId = this.auth.currentUser.uid;
        // 監聽 remote item
        this.listenToRemoteItems();
        // 本地玩家選擇道具
        const selected = cc.game["selectedBlockType"];
        if (selected) this.setSelectedType(selected);
    }

    async initFirebase() {
        this.firebaseManager = FirebaseManager.getInstance();
        await this.firebaseManager.awaitInitialization();
        this.db = this.firebaseManager.getDatabase();
        this.auth = this.firebaseManager.getAuth();
    }

    setSelectedType(type: string) {
        this.selectedType = type;
        if (this.cursorItem) this.cursorItem.destroy();
        const iconPrefab = this.iconMap[type];
        if (!iconPrefab) return;
        this.cursorItem = cc.instantiate(iconPrefab);
        this.cursorItem.opacity = 180;
        this.cursorItem.parent = this.cursorLayer;
        this.cursorItem.zIndex = 999;
        // push item to firebase
        const tempRef = this.itemListRef.push({
            type: this.selectedType,
            state: ItemState.Moving,
            placedBy: this.playerId,
            x: 0,
            y: 0
        });
        this.itemKey = tempRef.key;
    }

    onMouseMove(event: cc.Event.EventMouse) {
        if (!this.cursorItem) return;
        const pos = this.cursorLayer.convertToNodeSpaceAR(event.getLocation());
        this.cursorItem.setPosition(pos);
        // 即時同步位置
        if (this.itemKey && this.itemListRef) {
            this.itemListRef.child(this.itemKey).update({
                x: pos.x,
                y: pos.y
            });
        }
    }

    onMouseDown(event: cc.Event.EventMouse) {
        if (!this.selectedType) return;
        const pos = this.mapNode.convertToNodeSpaceAR(event.getLocation());
        // 放置正式 item
        const newItem = cc.instantiate(this.prefabMap[this.selectedType]);
        newItem.setPosition(pos);
        this.mapNode.addChild(newItem);
        // 更新 firebase 狀態
        if (this.itemKey && this.itemListRef) {
            this.itemListRef.child(this.itemKey).update({
                x: pos.x,
                y: pos.y,
                state: ItemState.Placed
            });
        }
        if (this.cursorItem) {
            this.cursorItem.destroy();
            this.cursorItem = null;
        }
        this.placed = true;
        this.checkAllPlaced();
    }

    listenToRemoteItems() {
        if (!this.itemListRef) return;
        // 監聽新增 item
        this.itemListRef.on('child_added', (snapshot) => {
            const item = snapshot.val();
            const key = snapshot.key;
            if (item.placedBy !== this.playerId) {
                const prefab = this.prefabMap[item.type];
                if (prefab) {
                    if (item.state === ItemState.Moving) {
                        // ghost
                        const ghost = cc.instantiate(prefab);
                        ghost.opacity = 100;
                        ghost.setPosition(item.x, item.y);
                        this.mapNode.addChild(ghost);
                        this.ghostItems[key] = ghost;
                    } else if (item.state === ItemState.Placed) {
                        // 直接放正式 item
                        const node = cc.instantiate(prefab);
                        node.setPosition(item.x, item.y);
                        this.mapNode.addChild(node);
                    }
                }
            }
        });
        // 監聽 item 狀態變化
        this.itemListRef.on('child_changed', (snapshot) => {
            const item = snapshot.val();
            const key = snapshot.key;
            if (item.placedBy !== this.playerId) {
                if (item.state === ItemState.Placed) {
                    if (this.ghostItems[key]) {
                        this.ghostItems[key].destroy();
                        delete this.ghostItems[key];
                    }
                    // 放正式 item
                    const prefab = this.prefabMap[item.type];
                    if (prefab) {
                        const node = cc.instantiate(prefab);
                        node.setPosition(item.x, item.y);
                        this.mapNode.addChild(node);
                    }
                    this.checkAllPlaced();
                } else if (item.state === ItemState.Moving) {
                    // ghost 移動
                    if (this.ghostItems[key]) {
                        this.ghostItems[key].setPosition(item.x, item.y);
                    }
                }
            }
        });
    }

    checkAllPlaced() {
        // 檢查所有 item 是否都已 placed
        this.itemListRef.once('value', (snapshot) => {
            const items = snapshot.val();
            let allPlaced = true;
            for (const key in items) {
                if (items[key].state !== ItemState.Placed) {
                    allPlaced = false;
                    break;
                }
            }
            if (allPlaced) {
                // 進入下一階段
                this.onAllPlaced();
            }
        });
    }

    onAllPlaced() {
        // 進入下一階段的邏輯
        cc.log("所有玩家都放好道具，進入下一階段！");
        // 你可以在這裡切換遊戲狀態
        
    }

    onDestroy() {
        this.cursorLayer.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.cursorLayer.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        if (this.itemListRef) this.itemListRef.off();
    }
}
