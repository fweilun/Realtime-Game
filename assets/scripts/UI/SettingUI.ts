// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Button)
    ChooseCharacterL: cc.Button = null;
    @property(cc.Button)
    ChooseCharacterR: cc.Button = null;
    @property(cc.Button)
    BGMSoundL: cc.Button = null;
    @property(cc.Button)
    BGMSoundR: cc.Button = null;
    @property(cc.Button)
    SFXSoundL: cc.Button = null;
    @property(cc.Button)
    SFXSoundR: cc.Button = null;

    @property(cc.Slider)
    BGMSlider:cc.Slider = null;
    @property(cc.Slider)
    SFXSlider:cc.Slider = null;

    @property(cc.Label)
    MoveSpeedLbl: cc.Label = null;
    @property(cc.Label)
    JumpHeightLbl: cc.Label = null;
    @property(cc.Label)
    HPLbl: cc.Label = null;

    @property(cc.Sprite)
    MoveSpeedPic: cc.Sprite = null;
    @property(cc.Sprite)
    JumpHeightPic: cc.Sprite = null;
    @property(cc.Sprite)
    HPPic: cc.Sprite = null;

    @property(cc.Button)
    Back: cc.Button = null;

    BGMVolume: number = 50;
    SFXVolume: number = 50;
    MoveSpeed: number = 0;
    JumpHeight: number = 0;
    HP: number = 0;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {

    }

    start () {

    }

    // update (dt) {}
}
