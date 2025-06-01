// LocalPlayerController.ts
// This script controls the local player and sends its state to Firebase.

const { ccclass, property } = cc._decorator;

// Declare the global 'firebase' object to satisfy TypeScript
declare const firebase: any;

@ccclass
export default class LocalPlayerController extends cc.Component {

    @property
    playerSpeed: number = 250;

    @property
    jumpForce: number = 300;

    public blockHold: string = "box";

    private defaultPlayerSpeed=200;
    private defaultJumpForce=750;
    private isInvincible: boolean = false;
    private rb: cc.RigidBody = null;
    private isGrounded: boolean = true;
    private moveDir: number = 0;
    private startPos: cc.Vec3 = null;
    private currentAnim: string = "";
    private rightDown = false;
    private leftDown = false;

    private firebasePlayerRef: firebase.database.Reference = null; // Firebase reference for this player's state

    onLoad() {
        this.startPos = this.node.position.clone();
        cc.director.getPhysicsManager().enabled = true;
        this.rb = this.getComponent(cc.RigidBody);
        if (!this.rb) {
            this.rb = this.node.addComponent(cc.RigidBody);
        }
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.fixedRotation = true;
        let box = this.getComponent(cc.PhysicsBoxCollider);
        if (!box) {
            box = this.node.addComponent(cc.PhysicsBoxCollider);
        }
        box.apply();

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        cc.game.on(cc.game.EVENT_HIDE, this.onAppHide, this);
        cc.game.on(cc.game.EVENT_SHOW, this.onAppShow, this);
        console.log("🧍 Local player initialized.");
        this.playerSpeed = this.defaultPlayerSpeed;
        this.jumpForce = this.defaultJumpForce;
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        console.log("🧍 Local player destroyed.");
    }

    /**
     * Sets the Firebase Realtime Database reference for this player's state.
     * This should be called by the GameManager after spawning the player.
     * @param ref The Firebase database reference.
     */
    public setFirebaseRef(ref: firebase.database.Reference) {
        this.firebasePlayerRef = ref;
        cc.log("🧍 LocalPlayerController: Firebase ref set.");
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        let changed = false;
        if (event.keyCode === cc.macro.KEY.a) {
            this.leftDown = true;
            this.moveDir = -1;
            changed = true;
        } else if (event.keyCode === cc.macro.KEY.d) {
            this.rightDown = true;
            this.moveDir = 1;
            changed = true;
        } else if (event.keyCode === cc.macro.KEY.space) {
            console.log("🔼 Space pressed | isGrounded:", this.isGrounded);
            if (this.isGrounded) {
                this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce);
                this.isGrounded = false;
                changed = true; // Grounded state changed
                console.log("🕴 Jumped!");
            } else {
                console.log("🚫 Jump blocked. Not grounded.");
            }
        }

        if (changed) {
            this.sendPlayerStateToFirebase();
        }
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        let changed = false;
        if (event.keyCode === cc.macro.KEY.a) {
            this.leftDown = false;
            if (this.rightDown) {
                this.moveDir = 1;
            }else{
                this.moveDir = 0;
            }
        }else if (event.keyCode === cc.macro.KEY.d) {
            this.rightDown = false;
            if (this.leftDown) {
                this.moveDir = -1;
            }else{
                this.moveDir = 0;
            }
        }
        if (changed) {
            this.sendPlayerStateToFirebase();
        }
    }

    update(dt: number) {
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(this.playerSpeed * this.moveDir, this.rb.linearVelocity.y);
        }

        // Update animation based on current state
        this.updateAnimation();

        // Send state to Firebase periodically or when significant changes occur
        // For physics-based movement, sending every frame might be too much.
        // Consider a throttling mechanism or only sending when position/animation actually changes.
        this.sendPlayerStateToFirebase(); // Sending every frame for simplicity, optimize later.

        if (this.node.y < -200) {
            this.die();
        }
    }

    /**
     * Updates the player's animation based on movement and grounded state.
     */
    private updateAnimation() {
        const anim = this.getComponent(cc.Animation);
        if (!anim) {
            // console.warn("⚠️ Animation component not found on player node");
            return;
        }

        let newAnim = this.currentAnim;

        if (!this.isGrounded) {
            this.node.scaleX = this.moveDir >= 0 ? 1 : -1;
            newAnim = "jump";
        } else if (this.moveDir !== 0) {
            this.node.scaleX = this.moveDir > 0 ? 1 : -1;
            newAnim = "run";
        } else {
            newAnim = "idle";
        }

        if (newAnim !== this.currentAnim) {
            if (anim.getClips().some(c => c.name === newAnim)) {
                anim.play(newAnim);
                this.currentAnim = newAnim;
                // console.log(`🏃 Playing '${newAnim}' animation`);
            } else {
                // console.warn(`⚠️ '${newAnim}' animation clip not found.`);
                if (anim.getAnimationState(this.currentAnim)?.isPlaying) {
                    anim.stop();
                }
                this.currentAnim = ""; // Reset if animation not found
            }
            this.sendPlayerStateToFirebase(); // Animation changed, send update
        }
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider) {
        console.log(selfCollider.name);
        console.log(otherCollider.name);
        if (otherCollider.name.includes("Player") && selfCollider.name.includes("p1")) {
            contact.disabled=true;
            return;
        }
        // Check if the contact is with the ground
        const worldManifold = contact.getWorldManifold();
        const normal = worldManifold.normal; // Normal vector of the collision

        // Check if the collision normal is pointing upwards (indicating ground contact)
        // A small tolerance (e.g., 0.7) can account for sloped surfaces
        if (normal.y > 0.7) {
            if (!this.isGrounded) {
                this.isGrounded = true;
                this.sendPlayerStateToFirebase(); // Grounded state changed, send update
                console.log("✅ Grounded on:", otherCollider.node.name);
            }
        }
        
        this.isGrounded = true;

        if (otherCollider.node.name === "ironball_main") {
            this.die();
        }

        if (otherCollider.node.name === "bullet_stone") {
            this.die();
        }

        if (otherCollider.node.name === "bullet_light") {
            this.die();
        }
        
        if (otherCollider.node.name === "saw") {
            this.die();
        }
        
        if (otherCollider.node.name === "spike"){
            this.die();
        }

        if (otherCollider.node.name === "weight" && normal.y > 0.5) {
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

    onPreSolve(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider) {
        console.log(selfCollider.name);
        console.log(otherCollider.name);
        if (selfCollider.name.includes("p1") && otherCollider.name.includes("Player")) contact.disabled=true;
    }

    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.Collider, otherCollider: cc.Collider) {
        // This is a simple way to detect leaving ground.
        // For more robust ground detection, consider raycasting downwards.
        // For now, if we leave contact with something, assume we might not be grounded.
        // This might need refinement based on your game's specific physics.
        if (this.rb.linearVelocity.y > 0.1) { // If moving upwards after contact ends
            if (this.isGrounded) {
                this.isGrounded = false;
                this.sendPlayerStateToFirebase(); // Grounded state changed, send update
            }
        }
    }

    private onAppHide() {
        console.log("🚪 App 被隱藏了（切換到其他視窗）");
    }

    private onAppShow() {
        console.log("👀 App 回來了（切回遊戲）");
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
                if (anim) anim.stop();
            })
            .start();

        // Inform Firebase that this player cleared the level (optional)
        if (this.firebasePlayerRef) {
            this.firebasePlayerRef.update({
                status: "levelCleared",
                lastUpdate: firebase.database.ServerValue.TIMESTAMP
            }).catch(error => cc.error("Failed to update levelCleared status:", error));
        }

        this.scheduleOnce(() => {
            cc.director.loadScene("StartScene")
        }, 3)
    }

    die() {
        console.log("💀 player died. Restarting scene...");

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

        // Inform Firebase that this player died
        if (this.firebasePlayerRef) {
            this.firebasePlayerRef.update({
                status: "dead",
                lastUpdate: firebase.database.ServerValue.TIMESTAMP
            }).catch(error => cc.error("Failed to update death status:", error));
        }

        this.scheduleOnce(() => {
            const currentScene = cc.director.getScene().name;
            let nextScene = "";

            if (currentScene === "Scene1_dirt") {
                nextScene = "Scene1_dirt";
            }

            cc.director.loadScene("Scene1_dirt");
        }, 1);
    }

    /**
     * Sends the current player's state to Firebase.
     * This should be called whenever a significant state change occurs.
     */
    private sendPlayerStateToFirebase() {
        if (!this.firebasePlayerRef) {
             cc.warn("Firebase player ref not set for local player.");
            return;
        }

        const playerState = {
            positionX: this.node.x,
            positionY: this.node.y,
            scaleX: this.node.scaleX, // Include scale for facing direction
            moveDir: this.moveDir,
            isGrounded: this.isGrounded,
            currentAnim: this.currentAnim,
            lastUpdate: firebase.database.ServerValue.TIMESTAMP // Use server timestamp for consistency
        };

        this.firebasePlayerRef.update(playerState)
            .catch((error) => {
                cc.error("❌ Failed to update local player state to Firebase:", error);
            });
    }
}
