const { ccclass, property } = cc._decorator;

@ccclass
export default class StartUI extends cc.Component {
    @property(cc.Button)
    startButton: cc.Button = null;

    @property(cc.Button)
    multiplayerButton: cc.Button = null;

    @property(cc.Button)
    settingButton: cc.Button = null;

    @property(cc.Button)
    quitButton: cc.Button = null;

    onLoad() {
        if (this.startButton) {
            this.startButton.node.on('click', this.onClickStart, this);
        }
        if (this.multiplayerButton) {
            this.multiplayerButton.node.on('click', this.onClickMultiplayer, this);
        }
        if (this.settingButton) {
            this.settingButton.node.on('click', this.onClickSetting, this);
        }
        if (this.quitButton) {
            this.quitButton.node.on('click', this.onClickQuit, this);
        }
    }

    onClickStart() {
        console.log("▶️ 單人模式啟動！");
        cc.director.loadScene("SelectionScene");
    }

    onClickMultiplayer() {
        console.log("🧑‍🤝‍🧑 多人模式啟動！");
        // cc.director.loadScene("RoomScene"); // 實作後可導向房間
    }

    onClickSetting() {
        console.log("⚙️ 設定畫面打開！");
        cc.director.loadScene("SettingScene");
        // 可打開設定面板
    }

    onClickQuit() {
        console.log("🛑 離開遊戲！");
        cc.game.end();
        // window.close(); // 僅原生 App 有效
    }
}
