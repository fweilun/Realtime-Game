import FirebaseManager from '../libs/firebase/FirebaseManager';
const { ccclass, property } = cc._decorator;
enum GamePhase {
    BUILD = 'build',
    BUILD_DONE = 'build done',
    RUN = 'run',
    RUN_DONE = 'rundone',
    SCORE = 'score'
}

@ccclass
export default class GameManager extends cc.Component {

    @property(cc.Node) itemPlacer:cc.Node = null;
    @property(cc.Node) localPlayer:cc.Node = null;
    @property(cc.Node) remotePlayer:cc.Node = null;

    private phase: GamePhase = GamePhase.BUILD;
    private firebaseManager:any=null;
    private db:any=null;
    private auth:any=null;
    private roomId:string="";
    private scoreCountdownStarted: boolean = false;
    private isOwner:boolean = false;
    async start() {
        await this.initFirebase();
        await this.checkIsOwner();
        await this.listenPhase();
        if (this.isOwner){
            this.remoteStateUpdate();
        }
    }

    async listenPhase() {
        const roomRef = this.db.ref(`rooms/active/${this.roomId}/state`);
        roomRef.on('value', (snapshot) => {
            const phase = snapshot.val();
            if (phase && phase !== this.phase) {
                this.phase = phase;
                this.onPhaseChanged(phase);
            }
        });
    }

    onPhaseChanged(phase: GamePhase) {
        // 先全部關閉
        if (this.itemPlacer) this.itemPlacer.active = false;
        if (this.localPlayer) this.localPlayer.active = false;
        if (this.remotePlayer) this.remotePlayer.active = false;

        // 根據 phase 開啟對應功能
        if (phase === GamePhase.BUILD) {
            if (this.itemPlacer) this.itemPlacer.active = true;
            // 只允許放道具
        } else if (phase === GamePhase.RUN) {
            if (this.localPlayer) this.localPlayer.active = true;
            if (this.remotePlayer) this.remotePlayer.active = true;
            // 只允許角色操作與同步
        } else if (phase === GamePhase.SCORE) {
            // 你可以在這裡顯示分數UI或其他
        }
        // 其他 phase 可依需求擴充
    }

    allPlayersPlaced(): boolean {
        // 判斷邏輯
        return true;
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
        if (!this.auth.currentUser) { // Check if there's no current user (useful after cold start)
            this.auth.signInAnonymously().catch(error => {
                cc.error("Error signing in anonymously at start():", error.code, error.message);
            });
        }
    }

    async checkIsOwner() {
        const roomRef = this.db.ref(`rooms/active/${this.roomId}/owner`);
        const snapshot = await roomRef.once('value');
        const ownerUid = snapshot.val();
        this.isOwner = (this.auth.currentUser.uid === ownerUid);
    }

    // 只有房主會呼叫這個function，主要功能為改變遠端狀態，房主本身的狀態不會因此改變
    async remoteStateUpdate() {
        const playersRef = this.db.ref(`rooms/active/${this.roomId}/players`);
        const roomRef = this.db.ref(`rooms/active/${this.roomId}/state`);
        playersRef.on('value', async (snapshot) => {
            const players = snapshot.val();
            if (!players) return;

            // 直接讀取最新 phase
            const phaseSnap = await roomRef.once('value');
            const phase = phaseSnap.val();

            if (phase == GamePhase.BUILD) {
                const allBuildDone = Object.values(players).every((player: any) => player.state === GamePhase.BUILD_DONE);
                if (allBuildDone) {
                    await roomRef.set(GamePhase.RUN);
                    const updates: any = {};
                    Object.keys(players).forEach(uid => {
                        updates[`${uid}/state`] = GamePhase.RUN;
                    });
                    await playersRef.update(updates);
                }
            } else if (phase == GamePhase.RUN) {
                const allRunDone = Object.values(players).every((player: any) => player.state === GamePhase.RUN_DONE);
                if (allRunDone) {
                    await roomRef.set(GamePhase.SCORE);
                    const updates: any = {};
                    Object.keys(players).forEach(uid => {
                        updates[`${uid}/state`] = GamePhase.SCORE;
                    });
                    await playersRef.update(updates);
                }
            } else if (phase == GamePhase.SCORE) {
                if (!this.scoreCountdownStarted) {
                    this.scoreCountdownStarted = true;
                    cc.log('Score phase倒數10秒開始');
                    this.scheduleOnce(async () => {
                        await roomRef.set(GamePhase.BUILD);
                        const playersRef = this.db.ref(`rooms/active/${this.roomId}/players`);
                        const snapshot = await playersRef.once('value');
                        const players = snapshot.val();
                        if (players) {
                            const updates: any = {};
                            Object.keys(players).forEach(uid => {
                                updates[`${uid}/state`] = GamePhase.BUILD;
                            });
                            await playersRef.update(updates);
                        }
                        this.scoreCountdownStarted = false;
                    }, 10);
                }
            }
        });
    }

    onDestroy() {
        if (this.isOwner && this.db && this.roomId) {
            const playersRef = this.db.ref(`rooms/active/${this.roomId}/players`);
            playersRef.off();
        }
    }
}
