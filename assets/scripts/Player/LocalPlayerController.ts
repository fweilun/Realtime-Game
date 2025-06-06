import FirebaseManager from '../libs/firebase/FirebaseManager';
const { ccclass, property } = cc._decorator;

@ccclass
export default class LocalPlayerController extends cc.Component {

    @property
    playerSpeed: number = 80;

    @property
    jumpForce: number = 100;

    public blockHold: string = "box";
     
    private isInvincible: boolean = false;
    private rb: cc.RigidBody = null;
    private isGrounded: boolean = false;
    private moveDir: number = 0;
    private startPos: cc.Vec3 = null;
    private currentAnim: string = "";
    private rightDown = false;
    private leftDown = false;
    // for connection
    private firebaseManager: FirebaseManager | null = null;
    private db: any = null;
    private auth:any = null;
    private roomId:number = null;
    private playerId: string = null;
    
    onLoad() {
        this.startPos = this.node.position.clone();
        cc.director.getPhysicsManager().enabled = true;

        this.rb = this.getComponent(cc.RigidBody);
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.fixedRotation = true;
        this.getComponent(cc.PhysicsBoxCollider).friction = 0;

        let box = this.getComponent(cc.PhysicsBoxCollider);
        if (!box) {
            box = this.node.addComponent(cc.PhysicsBoxCollider);
        }
        box.apply();

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        
        console.log("🧍 player initialized.");
    }

    async start() {
        await this.initFirebase();
        this.born();  // 👈 初始重生
        this.schedule(this.sendInfo, 0.02, cc.macro.REPEAT_FOREVER, 0);
        this.listenForEveryoneStatus();
    }


    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        if (event.keyCode === cc.macro.KEY.a) {
            this.leftDown = true;
            this.moveDir = -1;
        } else if (event.keyCode === cc.macro.KEY.d) {
            this.rightDown = true;
            this.moveDir = 1;
        } else if (event.keyCode === cc.macro.KEY.w) {
            console.log("🔼 Space pressed | isGrounded:", this.isGrounded);
            if (this.isGrounded) {
                this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce);
                // this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, 1000);
                this.isGrounded = false;
               // cc.audioEngine.playEffect(this.jumpSound, false);
                console.log("🕴 Jumped!");
            } else {
                console.log("🚫 Jump blocked. Not grounded.");
            }
        } else if (event.keyCode === cc.macro.KEY.r) {
            console.log("die");
            this.die();
        } else if (event.keyCode === cc.macro.KEY.q) {
            console.log("Player dance");
            // dance animation code ...
        } else if (event.keyCode === cc.macro.KEY.s) {
            console.log("Player sit");
            // sit animation code ...
        }
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        if (event.keyCode === cc.macro.KEY.a) {
            this.leftDown = false;
            if (this.rightDown){
                this.moveDir = 1;
            }else{
                this.moveDir = 0;
            }
        }else if (event.keyCode === cc.macro.KEY.d) {
            this.rightDown = false;
            if (this.leftDown){
                this.moveDir = -1;
            }else{
                this.moveDir = 0;
            }
        }
    }

    update(dt: number) {
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(this.playerSpeed * this.moveDir, this.rb.linearVelocity.y);
        }

        const anim = this.getComponent(cc.Animation);

        if (!this.isGrounded) {
            this.node.scaleX = this.moveDir >= 0 ? 1 : -1;
            if (this.currentAnim !== "jump") {
                if (!anim) {
                    console.warn("⚠️ Animation component not found on Mario node");
                } else if (!anim.getClips().some(c => c.name === "jump")) {
                    console.warn("⚠️ 'jump' animation clip not found in Animation component");
                } else {
                    anim.play("jump");
                    this.currentAnim = "jump";
                    console.log("🕴 Playing 'jump' animation");
                }
            }
        } else if (this.moveDir !== 0) {
            this.node.scaleX = this.moveDir > 0 ? 1 : -1;
            if (this.currentAnim !== "run") {
                if (!anim) {
                    console.warn("⚠️ Animation component not found on Mario node");
                } else if (!anim.getClips().some(c => c.name === "run")) {
                    console.warn("⚠️ 'run' animation clip not found in Animation component");
                } else {
                    anim.play("run");
                    this.currentAnim = "run";
                    console.log("🏃 Playing 'run' animation");
                }
            }
        } else {
            if (this.currentAnim !== "idle") {
                if (anim && anim.getAnimationState(this.currentAnim)?.isPlaying) {
                    anim.stop();
                    console.log("🛑 Stopping animation:", this.currentAnim);
                }
                this.currentAnim = "idle";
            }
        }

        if (this.node.y < -200) {
            this.die();
        }
    }
    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider) {
        if (otherCollider.node.name.includes("stage")){
            this.sendLobbySelection(0);
        }
    }

    async onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider) {
        if (otherCollider.node.name.includes("stage")){
            await this.sendLobbySelection(1);
            return;
        }
        const worldManifold = contact.getWorldManifold();

        if (worldManifold.normal.y < -0.5) {
            this.isGrounded = true;
            console.log("✅ Grounded on:", otherCollider.node.name);
        }
        
        if(Math.abs(worldManifold.normal.y) < 0.1 && Math.abs(worldManifold.normal.x) > 0.9){
            this.isGrounded = true;
        }

        console.log("✅ Grounded on:", otherCollider.node.name);

        if (otherCollider.node.name === "ironball_main") {
            this.die();
        }

        if (otherCollider.node.name === "bullet_stone") {
            this.die();
        }

        if (otherCollider.node.name === "bullet_light") {
            this.die();
        }
        if (otherCollider.node.name === "InnerCircle") {
            this.die();
        }
        
        if (otherCollider.node.name === "saw") {
            this.die();
        }
        
        if (otherCollider.node.name === "spike"){
            this.die();
        }

        if (otherCollider.node.name === "weight" && worldManifold.normal.y > 0.5) {
            this.die();
        }

        if (otherCollider.node.name === "dead") {
            console.log("💀 player die！");
            this.die();
        }

        if (otherCollider.node.name === "flag") {
            this.levelCleared();
        }
    }

    levelCleared() {
        this.enabled = false; 
        cc.director.getPhysicsManager().enabled = false;

        // 更新 Firebase: isFinished = true
        if (this.db && this.roomId && this.playerId) {
            this.db.ref(`rooms/active/${this.roomId}/players/${this.playerId}`).update({
                isFinished: true
            });
        }

        // 原地跳舞（或站立）
        const anim = this.getComponent(cc.Animation);
        if (anim && anim.getClips().some(c => c.name === "idle")) {
            anim.play("idle");
        }

        // 啟動完成檢查
        this.checkIfAllPlayersFinished();
    }


    born() {
        console.log("🔄 Player reborn");

        this.enabled = true;
        this.node.position = this.startPos.clone();  // 回到初始位置
        this.rb.linearVelocity = cc.v2(0, 0);        // 重設速度
        this.isGrounded = false;
        this.moveDir = 0;
        this.currentAnim = "";

        const collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) {
            collider.enabled = true;
        }

        const anim = this.getComponent(cc.Animation);
        if (anim && anim.getClips().some(c => c.name === "idle")) {
            anim.play("idle");
            this.currentAnim = "idle";
        }

        console.log("🧍 Respawn complete");
    }


   die() {
        console.log("💀 player died. Waiting for others...");

        this.enabled = false;
        const collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) {
            collider.enabled = false;
        }

        // 更新 Firebase: isDead = true
        if (this.db && this.roomId && this.playerId) {
            this.db.ref(`rooms/active/${this.roomId}/players/${this.playerId}`).update({
                isDead: true
            });
        }

        // 原地發呆
        const anim = this.getComponent(cc.Animation);
        if (anim && anim.getClips().some(c => c.name === "idle")) {
            anim.play("idle");
        }

        // 啟動完成檢查
        this.checkIfAllPlayersFinished();
    }
        //cc.audioEngine.playEffect(this.dieSound, false);
    
    async initFirebase() {
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
        if (this.auth.currentUser) {
            this.playerId = this.auth.currentUser.uid;
        }
        this.roomId = cc.game["currentRoomId"];
        // this.id
    }
    async initInfo() {
        if (!this.db || !this.auth || !this.roomId) return;
        const uid = this.auth.currentUser.uid;
        const playerRef = this.db.ref(`rooms/active/${this.roomId}/players/${uid}`);
        await playerRef.update({
            state:"build",
            x: this.node.x,
            y: this.node.y,
            scaleX: this.node.scaleX,
            scaleY: this.node.scaleY
        });
    }
    async sendLobbySelection(stage:number) {
        if (!this.db || !this.auth || !this.roomId) return;
        const uid = this.auth.currentUser.uid;
        const playerLobbyRef = this.db.ref(`rooms/active/${this.roomId}/players/${uid}/lobby`);
        await playerLobbyRef.update({
            selected: stage,
        });
    }
    async sendInfo() {
        if (!this.db || !this.auth || !this.roomId) return;
        const uid = this.auth.currentUser.uid;
        const playerRef = this.db.ref(`rooms/active/${this.roomId}/players/${uid}`);
        await playerRef.update({
            x: this.node.x,
            y: this.node.y,
            scaleX: this.node.scaleX,
            scaleY: this.node.scaleY
        });
    }
    
    checkIfAllPlayersFinished() {
        if (!this.db || !this.roomId) return;

        const playersRef = this.db.ref(`rooms/active/${this.roomId}/players`);
        playersRef.once("value", (snapshot) => {
            const players = snapshot.val();
            let allDone = true;
            for (const uid in players) {
                const p = players[uid];
                if (!p.isFinished && !p.isDead) {
                    allDone = false;
                    break;
                }
            }
            if (allDone) {
                console.log("🎉 所有玩家完成或死亡，準備跳轉場景！");
                cc.director.loadScene("SelectionMultiScene");
            } else {
                console.log("⏳ 還有玩家未完成...");
            }
        });
    }

    listenForEveryoneStatus() {
        if (!this.db || !this.roomId) return;
        const playersRef = this.db.ref(`rooms/active/${this.roomId}/players`);

        playersRef.on("value", (snapshot) => {
            const players = snapshot.val();
            let allDone = true;

            for (const uid in players) {
                const p = players[uid];
                if (!p.isFinished && !p.isDead) {
                    allDone = false;
                    break;
                }
            }

            if (allDone) {
                console.log("✅ 全部玩家完成或死亡，自動切換場景！");
                cc.director.loadScene("SelectionMultiScene");
            }
        });
    }

}
