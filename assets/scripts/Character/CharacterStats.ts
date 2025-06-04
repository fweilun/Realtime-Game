// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

type CharacterData = {
    speed: number,
    hp: number,
    name: string,
    jumpheight: number,
};

@ccclass
export default class CharacterStats extends cc.Component {

    private static datas: CharacterData[] = [
        { speed: 6 , hp: 40 , name: "chicken", jumpheight: 7  },
        { speed: 5 , hp: 70 , name: "horse"  , jumpheight: 5  },
        { speed: 5 , hp: 20 , name: "bunny"  , jumpheight: 10 },
        { speed: 10, hp: 40 , name: "raccoon", jumpheight: 3  },
        { speed: 4 , hp: 90 , name: "sheep"  , jumpheight: 4  },
    ];
    private static MaxID = 5;
    static getMaxID(){return CharacterStats.MaxID;}
    static getdata(num:number){return CharacterStats.datas[num];}
}
