const { ccclass, property } = cc._decorator;

@ccclass
export default class RemotePlayerController extends cc.Component {

    private playerId: string = "";
    private currentAnim: string = "";

    public init(id: string, initialState: any) {
        this.playerId = id;
        this.updateState(initialState);

        // 確保 RigidBody 和 Collider 存在
        const rb = this.getComponent(cc.RigidBody);
        if (rb) rb.enabled = true;

        const col = this.getComponent(cc.PhysicsBoxCollider);
        if (col) col.enabled = true;
    }
    
    public updateState(state: any) {
        if (!this.node) return;
        if (state.status === "dead") {
            this.playDead();
            return;
        }
        if (state.pushForce) {
            const rb = this.getComponent(cc.RigidBody);
            if (rb) {
                rb.applyLinearImpulse(cc.v2(state.pushForce.x, state.pushForce.y), this.node.getPosition(), true);
            }

            // 清除推力，避免重複觸發
            firebase.database().ref(`games/defaultGameRoom/players/${this.playerId}/pushForce`).remove();
        }
        this.node.setPosition(state.positionX || 0, state.positionY || 0);
        this.node.scaleX = state.scaleX || 1;
        this.updateAnimation(state.currentAnim);
    }

    private updateAnimation(newAnim: string) {
        if (newAnim === this.currentAnim) return;
        const anim = this.getComponent(cc.Animation);
        if (anim?.getClips().some(c => c.name === newAnim)) {
            anim.play(newAnim);
            this.currentAnim = newAnim;
        }
    }

    private playDead() {
        const anim = this.getComponent(cc.Animation);
        if (anim?.getClips().some(c => c.name === "die")) {
            anim.play("die");
        }
        this.node.opacity = 150;
        this.node.getComponent(cc.RigidBody).enabled = false;
    }

    onBeginContact(contact: cc.PhysicsContact, self: cc.Collider, other: cc.Collider) {
        if (other.node.name === "spike" || other.node.name === "deadCollision") {
            console.log(`☠️ Remote ${this.playerId} hit spike!`);
            this.markDead();
        }
    }

    private markDead() {
        const db = firebase.database();
        db.ref(`games/defaultGameRoom/players/${this.playerId}/status`).set("dead");
    }
}
