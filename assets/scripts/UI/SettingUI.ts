// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import AudioController from "../Audio/AudioController";

const {ccclass, property} = cc._decorator;

type CharacterData = {
    speed: number,
    hp: number,
    name: string,
    jumpheight: number,
};

const CharacterStats: CharacterData[] = [
    { speed: 5, hp: 40 , name: "chicken", jumpheight: 6  },
    { speed: 8, hp: 100, name: "cow"    , jumpheight: 3  },
    { speed: 6, hp: 20 , name: "rabbit" , jumpheight: 10 },
];
const CharacterMaxID = 3;


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
    
    @property(cc.Texture2D)
    bars: cc.Texture2D = null;

    @property(cc.Sprite)
    CharacterPic: cc.Sprite = null;
    @property(cc.Label)
    CharacterName: cc.Label = null;

    BGMValue: number;
    SFXValue: number;
    MoveSpeed: number = 0;
    JumpHeight: number = 0;
    HP: number = 0;

    CharacterID = -1;

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        //左右按鈕
        if (this.ChooseCharacterL) {
            this.ChooseCharacterL.node.on('click', this.onClick_charL, this);
        }
        if (this.ChooseCharacterR) {
            this.ChooseCharacterR.node.on('click', this.onClick_charR, this);
        }
        if (this.BGMSoundL) {
            this.BGMSoundL.node.on('click', this.onClick_BGML, this);
        }
        if (this.BGMSoundR) {
            this.BGMSoundR.node.on('click', this.onClick_BGMR, this);
        }
        if (this.SFXSoundL) {
            this.SFXSoundL.node.on('click', this.onClick_SFXL, this);
        }
        if (this.SFXSoundR) {
            this.SFXSoundR.node.on('click', this.onClick_SFXR, this);
        }
        //返回按鈕
        if (this.Back) {
            this.Back.node.on('click', this.onClick_Back, this);
        }
        //滑條
        if (this.BGMSlider) {
            this.BGMSlider.node.on('slide', this.onSlide_BGM, this);
        }
        if (this.SFXSlider) {
            this.SFXSlider.node.on('slide', this.onSlide_SFX, this);
        }
        this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    start () {
        this.BGMValue = AudioController.BGM_vol;
        this.BGMSlider.handle.node.x = this.BGMValue * 4 - 200;
        this.SFXValue = AudioController.SFX_vol;
        this.SFXSlider.handle.node.x = this.SFXValue * 4 - 200;
        this.CharacterID = 0;
        this.set_character();
        this.show_setting_bars_and_lbls();
    }

    update (dt) {
    }
    set_character(){
        this.HPLbl.string = CharacterStats[this.CharacterID].hp.toString();
        this.JumpHeightLbl.string = CharacterStats[this.CharacterID].jumpheight.toString();
        this.MoveSpeedLbl.string = CharacterStats[this.CharacterID].speed.toString();
    }

    show_setting_bars_and_lbls(){
        this.show_setting_bar("m");
        this.show_setting_bar("j");
        this.show_setting_bar("h");
        this.CharacterName.string = CharacterStats[this.CharacterID].name;
    }
    show_setting_bar(which: string){

        const h = 30;
        const w = 300;
        let bar_index = 0;
        if(which == "m"){//move speed
            bar_index = CharacterStats[this.CharacterID].speed - 1;
        }if(which == "h"){//hp
            bar_index = CharacterStats[this.CharacterID].hp / 10 - 1;
        }if(which == "j"){//jump height
            bar_index = CharacterStats[this.CharacterID].jumpheight - 1;
        }

        let rect = new cc.Rect(0, bar_index * h, w, h);

        let spriteFrame = new cc.SpriteFrame();
        spriteFrame.setTexture(this.bars);
        spriteFrame.setRect(rect);

        if(which == "m"){//move speed
            this.MoveSpeedPic.spriteFrame = spriteFrame;
            this.MoveSpeedPic.node.setContentSize(300, 30);
        }if(which == "h"){//hp
            this.HPPic.spriteFrame = spriteFrame;
            this.HPPic.node.setContentSize(300, 30);
        }if(which == "j"){//jump height
            this.JumpHeightPic.spriteFrame = spriteFrame;
            this.JumpHeightPic.node.setContentSize(300, 30);
        }
    }

    //左右按鈕
    onClick_charR() {
        console.log("character +");
        this.CharacterID = (this.CharacterID + 1)%CharacterMaxID;
        this.set_character();
        this.show_setting_bars_and_lbls();
    }
    onClick_charL() {
        console.log("character -");
        this.CharacterID = (this.CharacterID - 1 + CharacterMaxID)%CharacterMaxID;
        this.set_character();
        this.show_setting_bars_and_lbls();
    }
    onClick_BGMR() {
        console.log("BGM +");
        this.BGMValue = Math.min(this.BGMValue + 10, 100);
        this.update_bgm_val();
    }
    onClick_BGML() {
        console.log("BGM -");
        this.BGMValue = Math.max(this.BGMValue - 10, 0);
        this.update_bgm_val();
    }
    onClick_SFXR() {
        console.log("SFX +");
        this.SFXValue = Math.min(this.SFXValue + 10, 100);
        this.update_sfx_val();
    }
    onClick_SFXL() {
        console.log("SFX -");
        this.SFXValue = Math.max(this.SFXValue - 10, 0);
        this.update_sfx_val();
    }
    //返回按鈕
    onClick_Back() {
        console.log("Back");
        cc.director.loadScene("StartScene");
    }
    //滑條
    onSlide_BGM(slider: cc.Slider){
        this.BGMValue = slider.progress * 100;
        console.log("BGM: " + this.BGMValue);
        AudioController.SetVolumeBGM(this.BGMValue);
    }

    onSlide_SFX(slider: cc.Slider){
        this.SFXValue = slider.progress * 100;
        console.log("SFX: " + this.SFXValue);
        AudioController.SetVolumeSFX(this.SFXValue);
        AudioController.PLAY("SFX_test");
    }

    //其他東西
    update_bgm_val(){
        this.BGMSlider.handle.node.x = this.BGMValue * 4 - 200;
        console.log("BGM: " + this.BGMValue);
        AudioController.SetVolumeBGM(this.BGMValue);
        
    }
    update_sfx_val(){
        this.SFXSlider.handle.node.x = this.SFXValue * 4 - 200;
        console.log("SFX: " + this.SFXValue);
        AudioController.SetVolumeSFX(this.SFXValue);
        AudioController.PLAY("SFX_test_short");
    }

    show_character_pic(){
        //還沒實作，但就換圖
    }

    onMouseUp(){
        AudioController.SFX_test_end();
    }
}
