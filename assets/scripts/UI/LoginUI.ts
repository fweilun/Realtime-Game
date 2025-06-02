declare const firebase: any;
const { ccclass, property } = cc._decorator;
import FirebaseManager from '../libs/firebase/FirebaseManager';

@ccclass
export default class LoginUI extends cc.Component {
    @property(cc.EditBox)
    emailInput: cc.EditBox = null;

    @property(cc.EditBox)
    passwordInput: cc.EditBox = null;

    @property(cc.Button)
    registerButton: cc.Button = null;  // 原 loginButton 改名為 registerButton

    @property(cc.Button)
    loginButton: cc.Button = null;  // 新增 login 用的按鈕

    @property(cc.Button)
    quitButton: cc.Button = null;

    async onLoad() {
        const firebaseManager = FirebaseManager.getInstance();
        await firebaseManager.awaitInitialization();
        console.log("✅ Firebase 初始化完成");

        if (this.registerButton) {
            this.registerButton.node.on('click', this.onClickRegister, this);
        }
        if (this.loginButton) {
            this.loginButton.node.on('click', this.onClickLogin, this);
        }
        if (this.quitButton) {
            this.quitButton.node.on('click', () => {
                cc.director.loadScene('StartScene');
            }, this);
        }
    }

    async onClickRegister() {
        const email = this.emailInput.string.trim();
        const password = this.passwordInput.string.trim();

        if (!email || !password) {
            console.log("請輸入 Email 與密碼");
            return;
        }

        try {
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            console.log("✅ 註冊成功:", result.user.uid);
            cc.director.loadScene("RoomScene");
        } catch (signupError) {
            console.error("❌ 註冊失敗:", signupError.message);
        }
    }

    async onClickLogin() {
        const email = this.emailInput.string.trim();
        const password = this.passwordInput.string.trim();

        if (!email || !password) {
            console.log("請輸入 Email 與密碼");
            return;
        }

        try {
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            console.log("✅ 登入成功:", result.user.uid);
            cc.director.loadScene("RoomScene");
        } catch (loginError) {
            console.error("❌ 登入失敗:", loginError.message);
        }
    }
}
