const { ccclass } = cc._decorator;

@ccclass
export default class WeightBehavior extends cc.Component {

    private grounded: boolean = false;

    onLoad() {
        this.schedule(this.checkAutoDestroy, 0.2);
    }

    onBeginContact(contact: cc.PhysicsContact, self: cc.Collider, other: cc.Collider) {
        console.log("🧩 碰撞偵測 (DeadZone):", self.node.name, "⇄", other.node.name);

        if (other.node.name === "p1") {
            // 🧭 取得碰撞法線（是 DeadZone 相對於 player 的方向）
            const normal = contact.getWorldManifold().normal;

            console.log("📐 碰撞法線：", normal);

            // 🔽 如果是從上往下壓（DeadZone 下壓 player），normal.y 通常會是負值
            if (normal.y < -0.5) {
                const player = other.node.getComponent("PlayerController");
                if (player && player.enabled) {
                    console.log("💀 玩家被 weight 壓死（從上方）");
                    player.die();
                }
            } else {
                console.log("⛔ 被撞擊，但不是從上往下，忽略");
            }
        }
    }


    checkAutoDestroy() {
        const rigid = this.getComponent(cc.RigidBody);
        const worldY = this.node.convertToWorldSpaceAR(cc.v2(0, 0)).y;

        if (worldY < -100) {
            console.log("💨 weight 掉到底線，銷毀");
            this.node.destroy();
            return;
        }

        if (!this.grounded && rigid && Math.abs(rigid.linearVelocity.y) < 1) {
            this.grounded = true;
            console.log("🪨 weight 停止，5 秒後自動銷毀");
            this.scheduleOnce(() => {
                if (this.node && this.node.isValid) {
                    this.node.destroy();
                    console.log("🧹 weight 靜止後自動銷毀");
                }
            }, 4);
        }
    }
}
