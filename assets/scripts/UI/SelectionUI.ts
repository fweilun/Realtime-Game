const { ccclass, property } = cc._decorator;

@ccclass
export default class SelectionMultiUI extends cc.Component {
    @property(cc.Button) boxButton: cc.Button = null;
    @property(cc.Button) weightButton: cc.Button = null;
    @property(cc.Button) spikeButton: cc.Button = null;
    @property(cc.Button) sawButton: cc.Button = null;
    @property(cc.Button) gunButton: cc.Button = null;
    @property(cc.Button) cannonButton: cc.Button = null;
    @property(cc.Button) ironballButton: cc.Button = null;
    @property(cc.Button) BlackHoleButton: cc.Button = null;
    @property(cc.Button) TheadmillButton: cc.Button = null;
    @property(cc.Button) WoodHorizontalButton: cc.Button = null;
    @property(cc.Button) WoodVerticalButton: cc.Button = null;

    private selected: string = null;

    onLoad() {
        this.boxButton.node.on('click', () => this.select("box"), this);
        this.weightButton.node.on('click', () => this.select("weight"), this);
        this.spikeButton.node.on('click', () => this.select("spike"), this);
        this.sawButton.node.on('click', () => this.select("saw"), this);
        this.gunButton.node.on('click', () => this.select("gun"), this);
        this.cannonButton.node.on('click', () => this.select("cannon"), this);
        this.ironballButton.node.on('click', () => this.select("ironball"), this);
        this.BlackHoleButton.node.on('click', () => this.select("BlackHole"), this);
        this.TheadmillButton.node.on('click', () => this.select("Theadmill"), this);
        this.WoodHorizontalButton.node.on('click', () => this.select("WoodHorizontal"), this);
        this.WoodVerticalButton.node.on('click', () => this.select("WoodVertical"), this);

    }

    select(type: string) {
        this.selected = type;
        cc.game["selectedBlockType"] = this.selected;
        cc.director.loadScene("GameRunScene");
    }
}
