// FirebaseManager.ts
// This script initializes Firebase and provides access to its services.
// It assumes Firebase SDK v8 UMD files are loaded globally (e.g., via index.html or as Cocos Creator plugins).

// Declare the global 'firebase' object to satisfy TypeScript,
// as it's loaded via script tags and not directly imported.
declare const firebase: any;

const { ccclass, property } = cc._decorator;

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAJX-c19ArCHmiRl5gWKw2Da8NkBmnbah4",
    authDomain: "software-final-7fb6f.firebaseapp.com",
    databaseURL: "https://software-final-7fb6f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "software-final-7fb6f",
    storageBucket: "software-final-7fb6f.firebasestorage.app",
    messagingSenderId: "974237513033",
    appId: "1:974237513033:web:38aa4ab92371d706511698",
    measurementId: "G-VF4W1K36LX"
};

@ccclass
export default class FirebaseManager extends cc.Component {
    private static _instance: FirebaseManager | null = null; // Static instance for singleton
    private _database: firebase.database.Database | null = null; // Internal reference for Firebase Realtime Database
    private _auth: firebase.auth.Auth | null = null; // Internal reference for Firebase Auth
    private _userId: string | null = null; // Store the current user's ID

    private _isInitialized: boolean = false; // Flag to indicate completion of Firebase initialization
    private _initPromise: Promise<void> | null = null; // Promise to await initialization

    // Static method to get the singleton instance
    public static getInstance(): FirebaseManager {
        //cc.log("[FirebaseManager.getInstance()] Called. Current _instance:", FirebaseManager._instance ? FirebaseManager._instance.node.name : "null");

        if (!FirebaseManager._instance) {
            // If the static instance is null, try to find it among the persistent root nodes
            const persistRootNodes = cc.game.getPersistRootNodes();
            for (const node of persistRootNodes) {
                const component = node.getComponent(FirebaseManager);
                if (component) {
                    FirebaseManager._instance = component;
                    //cc.log("[FirebaseManager.getInstance()] Found and set _instance from persist root node:", node.name);
                    break; // Found it, no need to check other nodes
                }
            }

            if (!FirebaseManager._instance) {
                // If still null, log a critical error. This means the persist root setup failed.
                cc.error("[FirebaseManager.getInstance()] ERROR: _instance is still null. Cannot find it. Ensure FirebaseManager is attached to a persist root node and its onLoad has executed.");
            }
        }
        return FirebaseManager._instance;
    }

    onLoad() {
        //cc.log("🚨 FirebaseManager onLoad initiated! Node name:", this.node.name, "Current static _instance:", FirebaseManager._instance ? FirebaseManager._instance.node.name : "null");

        // Prevent duplicate instances if this script is added to multiple nodes
        if (FirebaseManager._instance && FirebaseManager._instance !== this) {
            //cc.warn("[FirebaseManager.onLoad] WARN: Duplicate instance detected, destroying. This node:", this.node.name, "Existing static instance node:", FirebaseManager._instance.node.name);
            this.node.destroy();
            return;
        }

        FirebaseManager._instance = this; // Set the static instance to THIS instance
        cc.game.addPersistRootNode(this.node); // Make this node persist across scenes
        //cc.log("[FirebaseManager.onLoad] Set static _instance to THIS instance:", this.node.name, ". Added to persist root.");

        cc.log("[FirebaseManager.onLoad] Initializing Firebase App.");

        // Initialize Firebase asynchronously via a promise
        this._initPromise = new Promise((resolve, reject) => {
            if (!firebase.apps.length) {
                // Only initialize if no Firebase app has been initialized yet
                try {
                    firebase.initializeApp(firebaseConfig);
                    cc.log("[FirebaseManager.onLoad] Firebase App initialized (first time).");

                    this._auth = firebase.auth();
                    this._database = firebase.database();
                    cc.log("[FirebaseManager.onLoad] Auth and DB assigned (first time init). Auth exists:", !!this._auth, "DB exists:", !!this._database);

                    // --- EMULATOR-SPECIFIC CODE REMOVED ---
                    // The 'if (cc.sys.isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))' block and its contents
                    // have been removed to ensure direct connection to production Firebase.
                    // ----------------------------------------

                    this._isInitialized = true;
                    resolve(); // Resolve the promise once initialization is complete
                } catch (e) {
                    cc.error("[FirebaseManager.onLoad] ERROR during Firebase initialization:", e);
                    reject(e);
                }
            } else {
                // If Firebase is already initialized (e.g., persistent node from previous scene), just get references
                cc.warn("[FirebaseManager.onLoad] Firebase App already initialized (likely from a persistent node or prior scene). Getting references.");
                this._auth = firebase.auth();
                this._database = firebase.database();
                cc.log("[FirebaseManager.onLoad] Auth and DB assigned (already init). Auth exists:", !!this._auth, "DB exists:", !!this._database);
                this._isInitialized = true;
                resolve(); // Resolve the promise
            }
        });
    }

    // Public methods to get the initialized Firebase instances
    public getAuth(): firebase.auth.Auth | null {
        cc.log("[FirebaseManager.getAuth()] Called. Auth instance:", this._auth ? "exists" : "null");
        return this._auth;
    }

    public getDatabase(): firebase.database.Database | null {
        cc.log("[FirebaseManager.getDatabase()] Called. DB instance:", this._database ? "exists" : "null");
        return this._database;
    }

    // Method to check if Firebase is initialized
    public isInitialized(): boolean {
        return this._isInitialized;
    }

    // Method to await Firebase initialization
    public async awaitInitialization(): Promise<void> {
        cc.log("[FirebaseManager.awaitInitialization()] Called.");
        if (this._initPromise) {
            await this._initPromise;
            cc.log("[FirebaseManager.awaitInitialization()] _initPromise resolved.");
        } else if (!this._isInitialized) {
            // Fallback for unexpected cases (should ideally be resolved by _initPromise)
            cc.warn("[FirebaseManager.awaitInitialization()] WARN: _initPromise is null, but not yet initialized. Using polling fallback.");
            return new Promise(resolve => {
                const check = () => {
                    if (this._isInitialized) {
                        resolve();
                    } else {
                        setTimeout(check, 50); // Check again after a small delay
                    }
                };
                check();
            });
        } else {
            cc.log("[FirebaseManager.awaitInitialization()] Already initialized, no promise to await.");
        }
    }
}