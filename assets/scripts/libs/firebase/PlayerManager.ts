const { ccclass, property } = cc._decorator;

declare const firebase: any;

@ccclass
export default class PlayerManager extends cc.Component {
    @property(cc.Prefab)
    localPlayerPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    remotePlayerPrefab: cc.Prefab = null;

    private db: firebase.database.Database = null;
    private currentUserId: string = null;
    private gameRoomId: string = "defaultGameRoom";

    private remotePlayers: { [uid: string]: cc.Node } = {};

    public async init(db: firebase.database.Database, currentUserId: string, gameRoomId: string) {
        this.db = db;
        this.currentUserId = currentUserId;
        this.gameRoomId = gameRoomId;

        const playersRef = this.db.ref(`games/${this.gameRoomId}/players`);

        playersRef.on('child_added', snapshot => {
            const uid = snapshot.key;
            const data = snapshot.val();
            if (uid === this.currentUserId) {
                this.spawnLocalPlayer(uid, data);
            } else {
                this.spawnRemotePlayer(uid, data);
            }
        });

        playersRef.on('child_changed', snapshot => {
            const uid = snapshot.key;
            const data = snapshot.val();
            if (uid !== this.currentUserId) {
                this.updateRemotePlayer(uid, data);
            }
        });

        playersRef.on('child_removed', snapshot => {
            const uid = snapshot.key;
            this.despawnRemotePlayer(uid);
        });
    }

    private spawnLocalPlayer(uid: string, data: any) {
        const node = cc.instantiate(this.localPlayerPrefab);
        node.setPosition(new cc.Vec2(100 + Math.random() * 300, 600));
        node.name = "localPlayer";
        this.node.addChild(node);

        const controller = node.getComponent("LocalPlayerController");
        const ref = this.db.ref(`games/${this.gameRoomId}/players/${uid}`);
        controller.setFirebaseRef(ref);
    }

    private spawnRemotePlayer(uid: string, data: any) {
        const node = cc.instantiate(this.remotePlayerPrefab);
        node.setPosition(new cc.Vec2(data.positionX || 0, data.positionY || 0));
        node.name = `remote_${uid}`;
        this.node.addChild(node);

        const rb = node.getComponent(cc.RigidBody);
        if (rb) rb.enabled = false;
        const collider = node.getComponent(cc.PhysicsBoxCollider);
        if (collider) collider.enabled = false;

        const controller = node.getComponent("RemotePlayerController");
        controller.init(uid, data);

        this.remotePlayers[uid] = node;
    }

    private updateRemotePlayer(uid: string, data: any) {
        const node = this.remotePlayers[uid];
        if (node) {
            const controller = node.getComponent("RemotePlayerController");
            controller.updateState(data);
        }
    }

    private despawnRemotePlayer(uid: string) {
        const node = this.remotePlayers[uid];
        if (node) {
            node.destroy();
            delete this.remotePlayers[uid];
        }
    }
}
