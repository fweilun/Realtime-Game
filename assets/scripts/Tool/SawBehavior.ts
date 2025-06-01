const { ccclass, property } = cc._decorator;

@ccclass
export default class SawBehavior extends cc.Component {

    @property([cc.PhysicsBoxCollider])
    colliders: cc.PhysicsBoxCollider[] = [];

    @property(cc.Animation)
    anim: cc.Animation = null;

    @property()
    clipName: string = "saw";  // 對應 animation-clip 名稱

    private lastIndex: number = -1;

    onLoad() {
        this.node.name = "saw";
    }

    start() {
        if (this.anim) {
            this.anim.play(this.clipName); // 播放動畫
        }
    }

    update(dt: number) {
        if (!this.anim) return;

        const state = this.anim.getAnimationState(this.clipName);
        if (!state || state.duration === 0) return;

        const frameCount = this.colliders.length;
        const timeInCycle = state.time % state.duration; // 👈 loop 關鍵
        const frameIndex = Math.floor(timeInCycle / state.duration * frameCount);

        if (!isNaN(frameIndex) && frameIndex !== this.lastIndex && frameIndex < frameCount) {
            this.lastIndex = frameIndex;
            this.updateCollider(frameIndex);
        }
    }

    updateCollider(activeIndex: number) {
        this.colliders.forEach((col, idx) => {
            col.enabled = (idx === activeIndex);
        });
    }
}
