// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

import CharacterStats from "../Character/CharacterStats";

@ccclass
export default class PlayerStats extends cc.Component {

    private static _instance: PlayerStats = null;
    static animal:string = null;
    static JumpHeight:number = null;
    static Speed:number = null;
    static MaxHP:number = null;
    static NowHP:number = null;
    static playerName:string = null;
    static animalID = null;

    onLoad () {
        if (PlayerStats._instance == null) {
            PlayerStats._instance = this;
            //exist forever
            cc.game.addPersistRootNode(this.node);
            PlayerStats.playerName = "player";
            PlayerStats.animalID = 0;
            PlayerStats.animal = "chicken";
            PlayerStats.Speed = 6;
            PlayerStats.MaxHP = 40;
            PlayerStats.NowHP = 40;
            PlayerStats.JumpHeight = 70;


        } else {
            console.log("delete node")
            this.node.destroy();
            return;
        }
    }

    static changeID(newID:number){
        this.animalID = newID;
        let data = CharacterStats.getdata(newID);
        this.Speed = data.speed;
        this.JumpHeight = data.jumpheight;
        this.MaxHP = data.hp;
        this.NowHP = data.hp;
        this.animal = data.name;
    }

    start () {

    }

    // update (dt) {}
}
