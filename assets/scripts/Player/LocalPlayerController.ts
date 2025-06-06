import FirebaseManager from '../libs/firebase/FirebaseManager';
const { ccclass, property } = cc._decorator;

@ccclass
export default class LocalPlayerController extends cc.Component {

    @property
    playerSpeed: number = 80;

    @property
    jumpForce: number = 1000;

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
    
    onLoad() {
        this.startPos = this.node.position.clone();
        cc.director.getPhysicsManager().enabled = true;

        this.rb = this.getComponent(cc.RigidBody);
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.fixedRotation = true;

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
        } else if (event.keyCode === cc.macro.KEY.space) {
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


    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider) {
        const worldManifold = contact.getWorldManifold();

        this.isGrounded = true;
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

        const targetNode = cc.find("Canvas/EndTarget");
        const targetPos = targetNode.getPosition();

        const anim = this.getComponent(cc.Animation);
        if (anim && anim.getClips().some(c => c.name === "run")) {
            anim.play("run");
        }
        this.node.scaleX = 1; 

        cc.tween(this.node)
            .to(2, { x: targetPos.x, y: targetPos.y }) 
            .call(() => {
                if(anim) anim.stop(); 
            })
            .start();
        
        this.scheduleOnce(() => {
            cc.director.loadScene("StartScene")
            cc.game["placedItems"] = [];
        }, 3)
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
        console.log("💀 player died. Respawning...");

        this.rb.linearVelocity = cc.v2(0, 100);

        const anim = this.getComponent(cc.Animation);
        if (anim && anim.getClips().some(c => c.name === "die")) {
            anim.play("die");
            this.currentAnim = "die";
            console.log("☠️ Playing 'die' animation");
        } else {
            console.warn("⚠️ 'die' animation not found");
        }

        this.enabled = false;

        const collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) {
            collider.enabled = false;
        }

        // 延遲 1 秒後復活
        this.scheduleOnce(() => {
            cc.game["selectedBlockType"] = null; 
            cc.director.loadScene("SelectionScene"); 
        }, 1);
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
}
