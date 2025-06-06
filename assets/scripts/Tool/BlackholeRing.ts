// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    anim: cc.Animation = null;

    @property
    clipName: string = "blackhole";


    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.node.name = "OuterRing";
    }

    start () {

    }

    // update (dt) {}
}
