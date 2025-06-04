// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class AudioController extends cc.Component {
    
    //@property(cc.AudioClip)
    bgm_normal: cc.AudioClip = null;
    //@property(cc.AudioClip)
    bgm_ingame: cc.AudioClip = null;
    //@property(cc.AudioClip)
    bgm_ingame_roundoff: cc.AudioClip = null;
    //@property(cc.AudioClip)
    bgm_ingame_gameend: cc.AudioClip = null;

    //@property(cc.AudioClip)
    sfx_jump: cc.AudioClip = null;
    //雖然step是sfx，但這是長時間的音效，所以請在走路結束時停止播放
    //@property(cc.AudioClip)
    sfx_step: cc.AudioClip = null;
    //@property(cc.AudioClip)
    sfx_dead: cc.AudioClip = null;
    //@property(cc.AudioClip)
    sfx_click: cc.AudioClip = null;
    //@property(cc.AudioClip)
    sfx_swap: cc.AudioClip = null;
    //@property(cc.AudioClip)
    sfx_test: cc.AudioClip = null;
    //@property(cc.AudioClip)
    sfx_put: cc.AudioClip = null;

    private static _instance: AudioController = null;
    private static _SFX_walk_id: number = -19890604;
    private static _SFX_test_id: number = -19890604;
    static BGM_vol:number;
    static SFX_vol:number;
    private static isReady:boolean = false;
    private static audiomap = {
        bgm_normal: "audio/07 Dance Party",
        bgm_ingame: "audio/12 Party Mode",
        bgm_ingame_roundoff: "audio/roundoff",
        bgm_ingame_gameend: "audio/gg",
        sfx_jump: "audio/jump",
        sfx_step: "audio/walk",
        sfx_dead: "audio/walk",
        sfx_click: "audio/mouseclick",
        sfx_swap: "audio/swoosh",
        sfx_test: "audio/sfxtest",
        sfx_put: "audio/place",
    }
    
    async onLoad() {
        if(AudioController.BGM_vol == undefined){AudioController.SetVolumeBGM(50)}
        if(AudioController.SFX_vol == undefined){AudioController.SetVolumeSFX(50)}

        if (AudioController._instance == null) {
            AudioController._instance = this;
            //exist forever
            cc.game.addPersistRootNode(this.node);
            await this._initAsync();
            //console.log(AudioController.getInstance().bgm_normal);
        } else {
            console.log("delete node")
            this.node.destroy();
            return;
        }
    }

    async _initAsync(){
        await this._preloadAllAudio();
        AudioController.isReady = true;
        cc.audioEngine.playMusic(this.bgm_normal, true);
        console.log("✅ 全部音效載入完成");
    }

    private async _preloadAllAudio():Promise<void>{
        const keys = Object.keys(AudioController.audiomap);
        const loadPromises = keys.map((key) => {
            const path = AudioController.audiomap[key];
            return new Promise<void>((resolve, reject) => {
                cc.resources.load(path, cc.AudioClip, (err, clip: cc.AudioClip) => {
                    if (err) {
                        console.error(`[AudioController] 載入失敗: ${path}`, err);
                        resolve();
                    } else {
                        this[key] = clip;
                        console.log(`[AudioController] 載入成功: ${key}`);
                        resolve();
                    }
                });
            });
        });
        await Promise.all(loadPromises);
    }

    static getInstance(){
        return AudioController._instance;
    }

    static PLAY(name: string){
        if(name == "BGM_normal") {this._playBGM(AudioController.getInstance().bgm_normal); }
        else if(name == "BGM_ingame") {this._playBGM(AudioController.getInstance().bgm_ingame); }
        else if(name == "BGM_ingame_roundoff") {this._playBGM(AudioController.getInstance().bgm_ingame_roundoff); }
        else if(name == "BGM_ingame_gameend") {this._playBGM(AudioController.getInstance().bgm_ingame_gameend); }
        else if(name == "SFX_walk") {
            if(this._SFX_walk_id == -19890604){
                this._SFX_walk_id = setInterval(() => {
                    cc.audioEngine.play(AudioController.getInstance().sfx_step, false, this.SFX_vol/100);
                }, 250);
            }
            //this._SFX_walk_id = cc.audioEngine.play(AudioController.getInstance().sfx_step, true, this.SFX_vol/100);
        }else if(name == "SFX_jump"){ cc.audioEngine.playEffect(AudioController.getInstance().sfx_jump, false); }
        else if(name == "SFX_adjust"){ cc.audioEngine.playEffect(AudioController.getInstance().sfx_test, false); }
        else if(name == "SFX_put"){ cc.audioEngine.playEffect(AudioController.getInstance().sfx_put, false); }
        else if(name == "SFX_jump"){ cc.audioEngine.playEffect(AudioController.getInstance().sfx_jump, false); }
        else if(name == "SFX_dead"){ cc.audioEngine.playEffect(AudioController.getInstance().sfx_dead, false); }
        else if(name == "SFX_click"){ cc.audioEngine.playEffect(AudioController.getInstance().sfx_click, false); }
        else if(name == "SFX_test"){
            //console.log("here");
            //console.log(AudioController.getInstance().sfx_test);
            //console.log("hi")
            if(this._SFX_test_id == -19890604){
                //console.log("hi2")
                this._SFX_test_id = setInterval(() => {
                    cc.audioEngine.play(AudioController.getInstance().sfx_test, false, this.SFX_vol/100);
                }, 40);
            }
            //this._SFX_test_id = cc.audioEngine.play(AudioController.getInstance().sfx_test, true, this.SFX_vol/100);
        }
        else if(name == "SFX_test_short"){ cc.audioEngine.playEffect(AudioController.getInstance().sfx_test, false); }
    }
    static SFX_walk_end(){
        //cc.audioEngine.stop(this._SFX_walk_id);
        clearInterval(this._SFX_walk_id)
        this._SFX_walk_id = -19890604;
    }
    static SFX_test_end(){
        //cc.audioEngine.stop(this._SFX_test_id);
        //console.log(this._SFX_test_id)
        clearInterval(this._SFX_test_id)
        //console.log("clear")
        this._SFX_test_id = -19890604;
    }

    static _playBGM(clip: cc.AudioClip) {
        cc.audioEngine.stopMusic();
        cc.audioEngine.playMusic(clip, true);
    }

    static SetVolumeBGM(volume: number) {
        AudioController.BGM_vol = volume;
        cc.audioEngine.setMusicVolume(volume/100); // 改變音量
    }
    static SetVolumeSFX(volume: number) {
        AudioController.SFX_vol = volume;
        cc.audioEngine.setEffectsVolume(volume/100); // 改變音量
    }
    
}
