const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    @property
    playerSpeed: number = 80;

    @property
    jumpForce: number = 1000;

    @property
    forceMagnitude: number = 2500;

    public blockHold: string = "box";
     
    private isInvincible: boolean = false;
    private rb: cc.RigidBody = null;
    private isGrounded: boolean = false;
    private moveDir: number = 0;
    private startPos: cc.Vec3 = null;
    private currentAnim: string = "";
    private rightDown = false;
    private leftDown = false;
    private isInOuterRing: boolean = false;
    private outerRingCollider: cc.Collider = null;
    
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

        // 不需要註冊 PhysicsCircleCollider 事件，onBeginContact 由引擎自動調用
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        console.log("🧍 player initialized.");
    }

    start() {
        this.born();  // 👈 初始重生
    }


    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        // 不需要 PhysicsCircleCollider 的 off 註冊
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

        // OuterRing 吸引力持續施加
        if (this.isInOuterRing && this.outerRingCollider) {
            let playerRigidBody = this.getComponent(cc.RigidBody);
            if (playerRigidBody) {
                let circleNodeWorldPos = this.outerRingCollider.node.convertToWorldSpaceAR(cc.v2(0,0));
                let playerNodeWorldPos = this.node.convertToWorldSpaceAR(cc.v2(0,0));
                let circleCenter = cc.v2(circleNodeWorldPos.x, circleNodeWorldPos.y);
                let playerCenter = cc.v2(playerNodeWorldPos.x, playerNodeWorldPos.y);
                let forceDirection = circleCenter.sub(playerCenter);
                forceDirection.normalizeSelf();
                let force = forceDirection.mul(this.forceMagnitude);
                playerRigidBody.applyForceToCenter(force, true);
            }
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
        if (otherCollider.node.name === "OuterRing") {
            this.isInOuterRing = true;
            this.outerRingCollider = otherCollider;
            // 原本的吸引力邏輯可刪除，改由 update 處理
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

    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider) {
        if (otherCollider.node.name === "OuterRing") {
            this.isInOuterRing = false;
            this.outerRingCollider = null;
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
}
