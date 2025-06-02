const { ccclass, property } = cc._decorator;

@ccclass
export default class GunBehavior extends cc.Component {

    @property(cc.Animation)
    anim: cc.Animation = null;

    @property(cc.Prefab)
    bulletPrefab: cc.Prefab = null;

    @property()
    clipName: string = "gun";

    @property()
    fireFrameIndex: number = 70;  // 動畫 timeline 上的第幾幀（例如 1:10 = 第70幀）

    @property()
    speedPerSecond: number = 400;

    private fireTime: number = 0;
    private hasFiredInCycle: boolean = false;

    onLoad() {
        this.node.name = "gun";
    }

    start() {
        if (this.anim) {
            const clip = this.anim.getClips().find(c => c.name === this.clipName);
            if (clip) {
                const sample = clip.sample || 60;
                this.fireTime = this.fireFrameIndex / sample;
                this.anim.play(this.clipName);
            } else {
                cc.warn("找不到動畫剪輯：" + this.clipName);
            }
        }
    }

    update(dt: number) {
        if (!this.anim) return;

        const state = this.anim.getAnimationState(this.clipName);
        if (!state || state.duration === 0) return;

        const currentTime = state.time % state.duration;

        if (!this.hasFiredInCycle && currentTime >= this.fireTime) {
            this.onShoot();
            this.hasFiredInCycle = true;
        }

        if (currentTime < this.fireTime && this.hasFiredInCycle) {
            this.hasFiredInCycle = false;
        }
    }

    onShoot() {
        if (!this.bulletPrefab) return;

        const bullet = cc.instantiate(this.bulletPrefab);
        bullet.parent = this.node.parent;

        const startPos = this.node.position;
        bullet.setPosition(startPos);

        // ✅ 子彈向右飛，持續 5 秒
        //const speedPerSecond = 400; // 可調整成你想要的速度
        const duration = 5;
        const move = cc.moveBy(duration, cc.v2(this.speedPerSecond * duration, 0));
        const destroy = cc.callFunc(() => bullet.destroy());
        bullet.runAction(cc.sequence(move, destroy));
    }

}
