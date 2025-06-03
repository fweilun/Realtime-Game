const { ccclass, property } = cc._decorator;
declare const firebase: any;

@ccclass
export default class RemotePlayerController extends cc.Component {

    private playerId: string = "";
    private currentAnim: string = "";
    private targetPos: cc.Vec3 = null;  // 可選：平滑移動

    public init(id: string, initialState: any) {
        this.playerId = id;
        this.updateState(initialState);
        this.node["uid"] = id;

        const rb = this.getComponent(cc.RigidBody);
        if (rb) rb.enabled = true;

        const col = this.getComponent(cc.PhysicsBoxCollider);
        if (col) col.enabled = true;
    }

    public updateState(state: any) {
        if (!this.node || !state) return;

        // ✅ 處理死亡動畫
        if (state.status === "dead") {
            this.playDead();
            return;
        }

        // ✅ 平滑移動（可選）或直接設位置
        this.node.setPosition(state.positionX || 0, state.positionY || 0);

        // ✅ 面向與動畫更新
        this.node.scaleX = state.scaleX || 1;
        this.updateAnimation(state.currentAnim);

        // ✅ 處理被撞推力
        if (
            state.pushForce &&
            typeof state.pushForce.x === "number" &&
            typeof state.pushForce.y === "number"
        ) {
            const rb = this.getComponent(cc.RigidBody);
            if (rb) {
                const impulse = cc.v2(state.pushForce.x, state.pushForce.y);
                rb.applyLinearImpulse(impulse, this.node.getPosition(), true);
                console.log(`💨 Remote ${this.playerId} 受到推力：`, impulse);
            }

            // ❌ 清掉 pushForce，避免重複施力
            firebase.database()
                .ref(`games/defaultGameRoom/players/${this.playerId}/pushForce`)
                .remove()
                .catch((err: any) => console.error("❌ 無法移除 pushForce:", err));
        }
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

        const rb = this.getComponent(cc.RigidBody);
        if (rb) rb.enabled = false;
    }
}
