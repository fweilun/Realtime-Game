// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

declare const firebase: any;

import FirebaseManager from '../libs/firebase/FirebaseManager';

const {ccclass, property} = cc._decorator;

@ccclass
export default class RoomUI extends cc.Component {
    private firebaseManager: FirebaseManager | null = null;
    private db: any = null;
    private auth:any = null;
    private selectedRoomId: string = null;
    private joinedRoom:any = null;
    private updateInterval: number = 1; // 秒
    private updateRoomListCallback: Function = null;
    private roomState:string = "pending";

    @property(cc.Node)
    contentNode: cc.Node = null; // 指向 ScrollView 的 content

    @property(cc.Button)
    createRoomButton: cc.Button = null;

    @property(cc.Button)
    joinRoomButton: cc.Button = null;

    @property(cc.Button)
    startGameButton: cc.Button = null;

    @property(cc.Prefab)
    roomItemPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    playerItemPrefab: cc.Prefab = null;

    @property(cc.Node)
    playerListCol: cc.Node = null;

    onLoad() {
        // 視窗關閉時自動離開房間
        // window.addEventListener('beforeunload', this._onWindowUnload);
    }

    async start() {
        this.firebaseManager = FirebaseManager.getInstance();
        if (!this.firebaseManager) {
            cc.error("RoomUI: FirebaseManager instance not found via getInstance(). Aborting Firebase setup.");
            return;
        }
        await this.firebaseManager.awaitInitialization();
        this.db = this.firebaseManager.getDatabase();
        this.auth = this.firebaseManager.getAuth();

        if (!this.auth.currentUser) { // Check if there's no current user (useful after cold start)
            this.auth.signInAnonymously().catch(error => {
                cc.error("Error signing in anonymously at start():", error.code, error.message);
            });
        }
        
        this.reLoadRooms();
        if (this.createRoomButton) {
            this.createRoomButton.node.on('click', this.onCreateRoom, this);
        }
        this.joinRoomButton.node.on('click', this.onJoinRoom, this);
        this.startGameButton.node.on('click', this.onStartGame, this);

        // 定時自動更新房間列表和玩家列表
        this.updateRoomListCallback = () => {
            this.reLoadRooms();
            if (this.selectedRoomId) {
                this.reloadPlayerList(this.selectedRoomId);
                this.reloadGameState(this.selectedRoomId);
            }
        };
        this.schedule(this.updateRoomListCallback, this.updateInterval);
    }

    onDestroy() {
        if (this.updateRoomListCallback) {
            this.unschedule(this.updateRoomListCallback);
        }
        // window.removeEventListener('beforeunload', this._onWindowUnload);
    }

    // _onWindowUnload = (event) => {
        // if (this.joinedRoom) {
        //     this.removeFromRoom(this.joinedRoom);
        // }
    // }

    async reLoadRooms() {
        if (!this.db) return;
        this.db.ref('rooms/pending').once('value')
            .then(snapshot => {
                const rooms = snapshot.val();
                this.renderRoomList(rooms);
            })
            .catch(error => {
                cc.error('讀取房間失敗:', error);
            });
    }

    renderRoomList(rooms: any) {
        this.contentNode.removeAllChildren();
        if (!rooms) return;
        Object.keys(rooms).forEach(roomId => {
            const item = cc.instantiate(this.roomItemPrefab);
            const label = item.getComponent(cc.Label) || item.getComponentInChildren(cc.Label);
            if (label) label.string = roomId;
            const btn = item.getComponent(cc.Button) || item.getComponentInChildren(cc.Button);
            btn.node.off('click');
            btn.node.on('click', () => {
                this.selectedRoomId = roomId;
                this.onSelectRoom();
            }, this);
        
            this.contentNode.addChild(item);
        });
    }

    async onCreateRoom() {
        // 產生一個合法的亂碼房間 ID
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
        const roomId = 'room_' + Array(8).fill(0).map(() =>
            chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
        await this.db.ref('rooms/pending/' + roomId).set({
            createdAt: Date.now(),
            state: 'pending'
        });
        this.addToRoom(roomId);
        const user = firebase.auth().currentUser;
        if (user && this.db) {
            const uid = user.uid;
            await this.db.ref('rooms/pending/' + roomId + '/players/' + uid).set({ joinedAt: Date.now() });
        }
        this.selectedRoomId = roomId;
        await this.reLoadRooms();
        await this.onJoinRoom();
        await this.updateOwner(roomId);
    }

    async onSelectRoom() {
        if (!this.selectedRoomId) {
            cc.warn('請先選擇房間');
            return;
        }
        if (!this.db) return;
        // 讀取玩家列表
        this.reloadPlayerList(this.selectedRoomId);
    }

    async onJoinRoom() {
        if (this.joinedRoom){
            this.removeFromRoom(this.joinedRoom);
        }
        if (!this.selectedRoomId) {
            cc.warn('請先選擇房間');
            return;
        }
        const user = firebase.auth().currentUser;
        if (!user || !this.db) {
            console.log("join room fail, user not found or db problem");
            return;
        }
        // Player加入Room
        const uid = user.uid;
        const roomPath = 'rooms/pending/' + this.selectedRoomId + '/players/' + uid;
        await this.db.ref(roomPath).set({ joinedAt: Date.now() });
        this.joinedRoom = this.selectedRoomId;
        await this.reloadPlayerList(this.joinedRoom);
    }

    async addToRoom(roomId: string) {
        const user = firebase.auth().currentUser;
        if (!user || !this.db) return;
        const uid = user.uid;
        const roomPath = 'rooms/pending/' + roomId + '/players/' + uid;
        await this.db.ref(roomPath).set({ joinedAt: Date.now() });
        await this.reloadPlayerList(roomId);
    }

    async removeFromRoom(roomId: string) {
        const user = firebase.auth().currentUser;
        if (!user || !this.db) return;
        const uid = user.uid;
        const roomPath = 'rooms/pending/' + roomId + '/players/' + uid;
        await this.db.ref(roomPath).remove();
        // 檢查房間是否還有其他玩家，沒人就刪房間
        const playersPath = 'rooms/pending/' + roomId + '/players';
        const snapshot = await this.db.ref(playersPath).once('value');
        const players = snapshot.val();
        if (!players || Object.keys(players).length === 0) {
            await this.roomDelete(roomId);
        }else{
            await this.updateOwner(roomId);
        }
    }
    async updateOwner(roomId: string) {
        if (!this.db) return;
        const playersPath = 'rooms/pending/' + roomId + '/players';
        const ownerPath = 'rooms/pending/' + roomId + '/owner';
        const snapshot = await this.db.ref(playersPath).once('value');
        const players = snapshot.val();
        if (players) {
            const firstUid = Object.keys(players)[0];
            if (firstUid) {
                await this.db.ref(ownerPath).set(firstUid);
            }
        }
    }

    async roomDelete(roomId: string) {
        if (!this.db) return;
        const roomPath = 'rooms/pending/' + roomId;
        await this.db.ref(roomPath).remove();
        if (this.playerListCol) this.playerListCol.removeAllChildren();
        this.reLoadRooms();
    }

    async reloadPlayerList(selectedRoomId) {
        const roomPath = 'rooms/pending/' + selectedRoomId + '/players';
        const snapshot = await this.db.ref(roomPath).once('value');
        const players = snapshot.val();
        if (this.playerListCol) this.playerListCol.removeAllChildren();
        if (!players) {
            cc.log('房間內沒有玩家');
            return;
        }
        Object.keys(players).forEach(uid => {
            const item = cc.instantiate(this.playerItemPrefab);
            const label = item.getComponent(cc.Label) || item.getComponentInChildren(cc.Label);
            if (label) label.string = uid; // 你可以改成顯示玩家暱稱
            this.playerListCol.addChild(item);
        });
    }

    async onStartGame() {
        const user = firebase.auth().currentUser;
        if (!user) return;
        const uid = user.uid;
        const roomId = this.selectedRoomId;
        const roomRef = this.db.ref('rooms/pending/' + roomId);
        // 只有 owner 可以 start
        const ownerSnap = await roomRef.child('owner').once('value');
        if (ownerSnap.val() === uid) {
            await roomRef.child('state').set('ready');
            cc.log('房主已將房間狀態設為 ready');
        } else {
            cc.warn('只有房主可以開始遊戲');
        }
    }

    async reloadGameState(roomId: string) {
        if (!this.db || !roomId) return;
        const roomPath = 'rooms/pending/' + roomId + '/state';
        const snapshot = await this.db.ref(roomPath).once('value');
        const state = snapshot.val();
        console.log(state);
        if (state === 'ready') {
            console.log('房間狀態為 ready');
        }
    }

    // update (dt) {}
}
