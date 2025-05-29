const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerController extends cc.Component {

    @property
    playerSpeed: number = 80;

    @property
    jumpForce: number = 300;

    public blockHold: string = "box";
     
    private isInvincible: boolean = false;
    private rb: cc.RigidBody = null;
    private isGrounded: boolean = false;
    private moveDir: number = 0;
    private startPos: cc.Vec3 = null;
    private currentAnim: string = "";
    
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

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        if (event.keyCode === cc.macro.KEY.a) {
            this.moveDir = -1;
        } else if (event.keyCode === cc.macro.KEY.d) {
            this.moveDir = 1;
        } else if (event.keyCode === cc.macro.KEY.space) {
            console.log("🔼 Space pressed | isGrounded:", this.isGrounded);
            if (this.isGrounded) {
                this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce);
                this.isGrounded = false;
               // cc.audioEngine.playEffect(this.jumpSound, false);
                console.log("🕴 Jumped!");
            } else {
                console.log("🚫 Jump blocked. Not grounded.");
            }
        }
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        if (event.keyCode === cc.macro.KEY.a || event.keyCode === cc.macro.KEY.d) {
            this.moveDir = 0;
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
        }, 3)
    }

    die() {
        console.log("💀 player died. Restarting scene...");

        this.rb.linearVelocity = cc.v2(0, 100);
        // 播放死亡動畫（需先設好 "die" clip）
        const anim = this.getComponent(cc.Animation);
        if (anim && anim.getClips().some(c => c.name === "die")) {
            anim.play("die");
            this.currentAnim = "die";
            console.log("☠️ Playing 'die' animation");
        } else {
            console.warn("⚠️ 'die' animation not found");
        }

        this.enabled = false; // 停用腳本內部邏輯（如 update）
        //this.rb.linearVelocity = cc.v2(0, 0); // 重設初始速度

        const collider = this.getComponent(cc.PhysicsBoxCollider);
        if (collider) {
            collider.enabled = false;
        }

        this.scheduleOnce(() => {
            const currentScene = cc.director.getScene().name;
            let nextScene = "";

            if (currentScene === "Scene1_dirt") {
                nextScene = "Scene1_dirt"; 
            } 

            cc.director.loadScene("Scene1_dirt");
        }, 1); 
        //cc.audioEngine.playEffect(this.dieSound, false);

    }
}
