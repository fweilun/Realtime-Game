// GameManager.ts（修正版）
// 加入 Remote Player 的剛體啟用與同步道具與玩家狀態機制

import FirebaseManager from './FirebaseManager';
import LocalPlayerController from './LocalPlayerController';
import RemotePlayerController from './RemotePlayerController';
import Camera from '../../Player/Camera';
import WeightPlacer from '../../Tool/WeightPlacer';
import BoxPlacer from '../../Tool/BoxPlacer';
import SpikePlacer from '../../Tool/SpikePlacer';
import InventoryUI from '../../UI/InventoryUI';

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    @property(cc.Prefab)
    localPlayerPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    remotePlayerPrefab: cc.Prefab = null;

    @property(cc.String)
    gameRoomId: string = "defaultGameRoom";

    @property(Camera)
    mainCamera: Camera = null;

    @property(WeightPlacer)
    weightPlacer: WeightPlacer = null;

    @property(BoxPlacer)
    boxPlacer: BoxPlacer = null;

    @property(SpikePlacer)
    spikePlacer: SpikePlacer = null;

    @property(InventoryUI)
    inventoryUI: InventoryUI = null;

    private firebaseManager: FirebaseManager = null;
    private db: firebase.database.Database = null;
    private auth: firebase.auth.Auth = null;
    private currentUserId: string = null;
    private localPlayerNode: cc.Node = null;
    private remotePlayers: { [key: string]: cc.Node } = {};

    async start() {
        console.log("🚀 GameManager starting");

        this.firebaseManager = FirebaseManager.getInstance();
        await this.firebaseManager.awaitInitialization();
        this.db = this.firebaseManager.getDatabase();
        this.auth = this.firebaseManager.getAuth();

        if (!this.auth.currentUser) {
            console.warn("😶 No current user, signing in anonymously");
            await this.auth.signInAnonymously();
        }

        this.currentUserId = this.auth.currentUser.uid;
        console.log("👤 Current user UID:", this.currentUserId);

        this.joinGameRoom();
    }

    joinGameRoom() {
        const roomRef = this.db.ref(`games/${this.gameRoomId}`);
        const playerRef = roomRef.child("players").child(this.currentUserId);

        playerRef.set({
            positionX: 0,
            positionY: 0,
            scaleX: 1,
            moveDir: 0,
            currentAnim: "idle",
            isGrounded: true,
            status: "alive",
            lastUpdate: firebase.database.ServerValue.TIMESTAMP
        });

        playerRef.onDisconnect().remove();

        this.spawnLocalPlayer();

        roomRef.child("players").on("child_added", snapshot => {
            const id = snapshot.key;
            if (id !== this.currentUserId) {
                this.spawnRemotePlayer(id, snapshot.val());
            }
        });

        roomRef.child("players").on("child_changed", snapshot => {
            const id = snapshot.key;
            if (id !== this.currentUserId) {
                this.updateRemotePlayer(id, snapshot.val());
            }
        });

        roomRef.child("players").on("child_removed", snapshot => {
            const id = snapshot.key;
            this.despawnRemotePlayer(id);
        });
    }

    spawnLocalPlayer() {
        if (!this.localPlayerPrefab) {
            console.error("❌ Local player prefab is not assigned!");
            return;
        }

        this.localPlayerNode = cc.instantiate(this.localPlayerPrefab);
        this.localPlayerNode.setPosition(cc.v2(100, 700));
        this.node.addChild(this.localPlayerNode);

        const controller = this.localPlayerNode.getComponent(LocalPlayerController);
        if (!controller) {
            console.error("❌ LocalPlayerController not found on prefab!");
            return;
        }

        const ref = this.db.ref(`games/${this.gameRoomId}/players/${this.currentUserId}`);
        controller.setFirebaseRef(ref);
        console.log("✅ Local player spawned and Firebase ref set.");

        if (this.mainCamera) this.mainCamera.target = this.localPlayerNode;
        if (this.weightPlacer) this.weightPlacer.player = this.localPlayerNode;
        if (this.boxPlacer) this.boxPlacer.player = this.localPlayerNode;
        if (this.spikePlacer) this.spikePlacer.player = this.localPlayerNode;
        if (this.inventoryUI) this.inventoryUI.playerNode = this.localPlayerNode;
    }

    spawnRemotePlayer(id: string, state: any) {
        if (this.remotePlayers[id]) return;

        const remote = cc.instantiate(this.remotePlayerPrefab);
        remote.setPosition(cc.v2(state.positionX || 0, state.positionY || 0));
        this.node.addChild(remote);

        const controller = remote.getComponent(RemotePlayerController);
        if (controller) {
            controller.init(id, state);
        } else {
            console.warn(`⚠️ RemotePlayerController missing on remote ${id}`);
        }

        const rigid = remote.getComponent(cc.RigidBody);
        if (rigid) {
            rigid.enabled = true; // ✅ 保留碰撞功能供真實同步位置（可讓 remote 互擠）
        }

        this.remotePlayers[id] = remote;
    }

    updateRemotePlayer(id: string, state: any) {
        const remote = this.remotePlayers[id];
        if (remote) {
            const controller = remote.getComponent(RemotePlayerController);
            controller?.updateState(state);
        }
    }

    despawnRemotePlayer(id: string) {
        if (this.remotePlayers[id]) {
            this.remotePlayers[id].destroy();
            delete this.remotePlayers[id];
        }
    }
}
