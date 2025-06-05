// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import FirebaseManager from '../libs/firebase/FirebaseManager';
const {ccclass, property} = cc._decorator;

@ccclass
export default class RemoteLoader extends cc.Component {

    // onLoad () {}
    // for connection
    private firebaseManager: FirebaseManager | null = null;
    private db: any = null;
    private auth:any = null;
    private roomId:number = null;

    @property(cc.Prefab)
    playerPrefab: cc.Prefab = null;

    @property(cc.Node)
    playerLayer: cc.Node = null;

    private remotePlayers: { [uid: string]: cc.Node } = {};

    async start () {
        await this.initFirebase();
        this.initPlayerPrefabs();
        this.listenRemotePlayers();
    }

    async initFirebase() {
        this.firebaseManager = FirebaseManager.getInstance();
        if (!this.firebaseManager) {
            cc.error("RoomUI: FirebaseManager instance not found via getInstance(). Aborting Firebase setup.");
            return;
        }
        await this.firebaseManager.awaitInitialization();
        this.db = this.firebaseManager.getDatabase();
        this.auth = this.firebaseManager.getAuth();
        this.roomId = cc.game["currentRoomId"];
    }

    initPlayerPrefabs() {
        if (!this.db || !this.roomId || !this.auth) return;
        const playersRef = this.db.ref(`rooms/active/${this.roomId}/players`);
        // 初始化所有玩家
        playersRef.once('value', (snapshot) => {
            const players = snapshot.val();
            if (!players) return;
            Object.entries(players).forEach(([uid, data]: [string, any]) => {
                if (uid === this.auth.currentUser.uid) return; // 跳過自己
                let node = cc.instantiate(this.playerPrefab);
                this.remotePlayers[uid] = node;
                // 移除物理元件
                const rb = node.getComponent(cc.RigidBody);
                if (rb) node.removeComponent(rb);
                node.getComponents(cc.Collider).forEach(collider => node.removeComponent(collider));
                
                this.playerLayer.addChild(node);
            });
        });

        if (Object.keys(this.remotePlayers).length > 1) {
            cc.error("EError: remotePlayers has more than one key. Current keys:", Object.keys(this.remotePlayers));
        }
    }

    listenRemotePlayers() {
        if (!this.db || !this.roomId) return;
        const playersRef = this.db.ref(`rooms/active/${this.roomId}/players`);

        // 監聽玩家資料變動
        playersRef.on('value', (snapshot) => {
            const players = snapshot.val();
            if (!players) return;
            // console.log("Current user uid:", this.auth.currentUser.uid);
            // console.log("All players:", players);
            // 更新玩家位置
            Object.entries(players).forEach(([uid, data]: [string, any]) => {
                // console.log("Checking player:", uid, "against current user:", this.auth.currentUser.uid);
                if (uid === this.auth.currentUser.uid) {
                    // console.log("Skipping self");
                    return; // 跳過自己
                }
                let node = this.remotePlayers[uid];
                if (node) {
                    node.x = data.x;
                    node.y = data.y;
                    node.scaleX = data.scaleX;
                    node.scaleY = data.scaleY;
                }
            });
        });
    }

    // update (dt) {}
}
