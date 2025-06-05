// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
import FirebaseManager from '../libs/firebase/FirebaseManager';
const {ccclass, property} = cc._decorator;

@ccclass
export default class ScoreBoardUI extends cc.Component {
    private firebaseManager: FirebaseManager | null = null;
    private db: any = null;
    private auth: any = null;
    
    @property(cc.Prefab)
    playerIconPrefab: cc.Prefab = null;

    @property(cc.Node)
    playerListIcon: cc.Node = null;

    @property
    barHeight: number = 30;

    @property
    barWidth: number = 200;

    @property
    iconSpacing: number = 60;

    async start() {
        this.firebaseManager = FirebaseManager.getInstance();
        if (!this.firebaseManager) {
            cc.error("ScoreBoardUI: FirebaseManager instance not found via getInstance(). Aborting Firebase setup.");
            return;
        }
        await this.firebaseManager.awaitInitialization();
        this.db = this.firebaseManager.getDatabase();
        this.auth = this.firebaseManager.getAuth();

        if (!this.auth.currentUser) {
            this.auth.signInAnonymously().catch(error => {
                cc.error("Error signing in anonymously at start():", error.code, error.message);
            });
        }
        const roomId = cc.game["currentRoomId"];
        await this.reloadPlayerList(roomId);
    }

    async reloadPlayerList(selectedRoomId) {
        console.log("reload");
        const roomPath = 'rooms/active/' + selectedRoomId + '/players';
        const snapshot = await this.db.ref(roomPath).once('value');
        const players = snapshot.val();
        if (!players) {
            cc.log('房間內沒有玩家');
            return;
        }
        console.log("player exist");
        if (this.playerListIcon) this.playerListIcon.removeAllChildren();
        
        // 獲取每個玩家的名字
        for (const [uid, playerData] of Object.entries(players)) {
            console.log("pp");
            const item = cc.instantiate(this.playerIconPrefab);
            // 獲取並設置玩家名字
            const nameNode = item.getChildByName('name');
            const ismeNode = item.getChildByName('isme');
            if (nameNode) {
                const label = nameNode.getComponent(cc.Label);
                if (label) {
                    // 從數據庫獲取玩家名字，如果沒有則顯示 "None"
                    const playerInfo = playerData as { name?: string };
                    const playerName = playerInfo.name || "None";
                    label.string = playerName;
                }
            }
            // 設置是否為當前玩家的標識
            if (ismeNode) {
                const label = ismeNode.getComponent(cc.Label);
                if (label && this.auth.currentUser) {
                    label.string = uid === this.auth.currentUser.uid ? "ME!" : "";
                }
            }

            // 取得 bar 子節點
            const barNode = item.getChildByName('bar');
            if (barNode) {
                // 先清空舊圖形
                barNode.removeComponent(cc.Graphics);
                const graphics = barNode.addComponent(cc.Graphics);

                // 畫灰色底
                graphics.fillColor = cc.Color.GRAY;
                graphics.rect(0, -this.barHeight/2, this.barWidth, this.barHeight);
                graphics.fill();

                // 畫分數條（固定300分）
                graphics.fillColor = uid === this.auth.currentUser?.uid ? cc.Color.GREEN : cc.Color.BLUE;
                graphics.rect(0, -this.barHeight/2, this.barWidth, this.barHeight);
                graphics.fill();

                // 分數文字
                let scoreLabel = barNode.getChildByName('scoreLabel') as cc.Node;
                if (!scoreLabel) {
                    scoreLabel = new cc.Node('scoreLabel');
                    barNode.addChild(scoreLabel);
                }
                let label = scoreLabel.getComponent(cc.Label);
                if (!label) label = scoreLabel.addComponent(cc.Label);
                label.string = '300';
                label.fontSize = 20;
                scoreLabel.x = this.barWidth + 10;
                scoreLabel.y = 0;
            }

            this.playerListIcon.addChild(item);
        }
    }

    // update (dt) {}
}
