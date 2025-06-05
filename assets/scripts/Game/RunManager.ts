// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;
import FirebaseManager from '../libs/firebase/FirebaseManager';

@ccclass
export default class RunManager extends cc.Component {

    @property(cc.Prefab) playerPrefab: cc.Prefab = null;
    @property(cc.Node) spawnPoint: cc.Node = null;
    @property(cc.Node) mapNode: cc.Node = null;

    private firebaseManager: FirebaseManager | null = null;
    private auth: any = null;
    private db: any = null;
    private roomId: string = null;
    private playerId: string = null;
    private playerListRef:any = null;

    async start () {
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
        this.playerListRef = this.db.ref(`rooms/active/${this.roomId}/players`);
        this.spawnPlayer();
    }

    spawnPlayer() {
        if (!this.playerPrefab || !this.spawnPoint) {
            console.warn(" 先設定 playerPrefab 和 spawnPoint");
            return;
        }

        const player = cc.instantiate(this.playerPrefab);
        player.setPosition(this.spawnPoint.position);
        console.log(this.spawnPoint.position);
        player.setPosition(cc.v2(-400,20));
        this.mapNode.addChild(player);
        const ctrl = player.getComponent("PlayerController");
        ctrl?.born(); 
        console.log("主角已生成");
    }

    syncOtherPlayer() {
        
    }
    // update (dt) {}
}
