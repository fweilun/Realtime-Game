const { ccclass, property } = cc._decorator;

@ccclass
export default class TreadMill extends cc.Component {

    @property({ type: cc.AudioClip })
    soundEffect: cc.AudioClip = null;

    protected isTouched: boolean = false; // To ensure sound plays only once per touch

    private moveSpeed: number = 100;

    start() {
        // 可根據需求調整 treadMill 速度
        if (this.node.name === "TreadMill") {
            this.node.scaleX = 1;
            this.moveSpeed *= this.node.scaleX;
        }
    }

    // 只保留上下碰撞過濾
    private filterCollision(contact: cc.PhysicsContact, playerRigidbody: cc.RigidBody): boolean {
        const worldManifold = contact.getWorldManifold();
        const normal = worldManifold.normal;
        // 只允許玩家從上方落下時碰撞
        if (normal.y < -0.1) return false;
        if (playerRigidbody.linearVelocity.y > 5 && normal.y < 0.8) return false;
        return true;
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        const playerRigidBody = otherCollider.node.getComponent(cc.RigidBody);
        if (!playerRigidBody) return;

        // 播放音效
        if (!this.isTouched && this.soundEffect) {
            cc.audioEngine.playEffect(this.soundEffect, false);
            this.isTouched = true;
        }
    }

    onPreSolve(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        const playerRigidBody = otherCollider.node.getComponent(cc.RigidBody);
        if (!playerRigidBody) {
            contact.disabled = true;
            return;
        }

        if (!this.filterCollision(contact, playerRigidBody)) {
            contact.disabled = true;
            return;
        }

        // TreadMill conveyor 功能
        if (this.node.name === "TreadMill") {
            let currentVel = playerRigidBody.linearVelocity;
            // 給予一個向右的速度增量，讓玩家能感受到 treadMill 的推力
            const conveyorForce = 100; // 可調整，數值越大推力越強
            playerRigidBody.linearVelocity = cc.v2(currentVel.x + conveyorForce, currentVel.y);
        }
    }

    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // 可根據需求添加離開 treadMill 的行為
    }
}