// GameManager.ts
// This script manages game rooms, player joining/leaving, and synchronizes player states.

// Correct import paths based on your project structure
// Assuming FirebaseManager is in 'Firebase' folder relative to 'scripts'
import FirebaseManager from './FirebaseManager'; // If FirebaseManager.ts is in the same folder as GameManager.ts
// OR: import FirebaseManager from '../Firebase/FirebaseManager'; // If GameManager is in 'scripts/Game' and FirebaseManager is in 'scripts/Firebase'
// OR: import FirebaseManager from 'FirebaseManager'; // If FirebaseManager.ts is directly under assets/scripts/

// Assuming LocalPlayerController and RemotePlayerController are in the same folder as GameManager.ts
import LocalPlayerController from './LocalPlayerController';
import RemotePlayerController from '././RemotePlayerController'; // Corrected path if they are in the same folder

import WeightPlacer from '../../Tool/WeightPlacer';
import BoxPlacer from '../../Tool/BoxPlacer';
import Camera from '../../Player/Camera';
import SpikePlacer from '../../Tool/SpikePlacer';
import InventoryUI from '../../UI/InventoryUI';


const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    @property(cc.Prefab)
    localPlayerPrefab: cc.Prefab = null; // Assign your player prefab here in the editor

    @property(cc.Prefab)
    remotePlayerPrefab: cc.Prefab = null; // A prefab for other players (can be the same as local or simpler)

    @property(cc.String)
    gameRoomId: string = "defaultGameRoom"; // A fixed room ID for simplicity, or make it dynamic

    @property(Camera)
    mainCamera: Camera = null;

    @property(WeightPlacer)
    weightPlacer: WeightPlacer = null;

    @property(BoxPlacer)
    boxPlacer: BoxPlacer = null;

    @property(SpikePlacer)
    spikePlacer: SpikePlacer = null;

    @property(InventoryUI)
    inventoryUI: InventoryUI = null;


    private firebaseManager: FirebaseManager | null = null;
    private db: firebase.database.Database | null = null;
    private auth: firebase.auth.Auth | null = null;
    private currentUserId: string | null = null;

    private localPlayerNode: cc.Node | null = null;
    private remotePlayers: { [key: string]: cc.Node } = {}; // Map of userId to remote player node

    onLoad() {
        cc.log("GameManager.ts onLoad");
        // Any other initializations that do NOT depend on Firebase
    }

    // Make start() an async function so we can use await
    async start() {
        cc.log("GameManager start initiated! Attempting Firebase setup.");

        this.firebaseManager = FirebaseManager.getInstance();

        if (!this.firebaseManager) {
            cc.error("GameManager: FirebaseManager instance not found via getInstance(). Aborting Firebase setup.");
            return;
        }
        //cc.log("GameManager: Retrieved FirebaseManager instance from:", this.firebaseManager.node.name);

        // *** CRITICAL: Wait for FirebaseManager to complete its initialization ***
        await this.firebaseManager.awaitInitialization();
        cc.log("GameManager: FirebaseManager reported ready (awaitInitialization finished).");

        // Now, try to get the auth and db instances from the *retrieved* FirebaseManager instance
        this.db = this.firebaseManager.getDatabase();
        this.auth = this.firebaseManager.getAuth();

        if (!this.auth || !this.db) {
            cc.error("GameManager: Firebase Auth or Database instance is null even after FirebaseManager reported ready. This is an unexpected state.");
            cc.error("GameManager: firebaseManager.isInitialized() = " + this.firebaseManager.isInitialized());
            // Direct check of firebase.auth() might still be null if the global 'firebase' object itself isn't fully ready
            // or if the UMD files didn't load correctly.
            cc.error("GameManager: Direct check of global firebase.auth() = " + (typeof firebase !== 'undefined' && firebase.auth() !== null));
            return;
        }

        // Now that auth is guaranteed to be valid, set up the state changed listener
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUserId = user.uid;
                cc.log(`🎮 GameManager: Current user ID is ${this.currentUserId}`);
                this.joinGameRoom();
            } else {
                cc.warn("🎮 GameManager: User not authenticated yet. Attempting anonymous sign-in.");
                // Automatically sign in anonymously if not authenticated
                this.auth.signInAnonymously()
                    .then((userCredential) => {
                        cc.log("🎮 GameManager: Signed in anonymously after onAuthStateChanged. User ID:", userCredential.user.uid);
                    })
                    .catch((error) => {
                        cc.error("🎮 GameManager: Anonymous sign-in failed:", error.code, error.message);
                    });
            }
        });

        // If you want to force an anonymous sign-in at the very beginning of the game,
        // you can call it here. The onAuthStateChanged listener above will then catch the state change.
        // If the user is already signed in (e.g., from a previous session), onAuthStateChanged will fire immediately.
        // Forcing a sign-in here ensures that if no user is found, it attempts to get one.
        if (!this.auth.currentUser) { // Check if there's no current user (useful after cold start)
            this.auth.signInAnonymously().catch(error => {
                cc.error("Error signing in anonymously at start():", error.code, error.message);
            });
        }

    }

    /**
     * Joins or creates a game room and sets up listeners for player data.
     */
    private joinGameRoom() {
        if (!this.db || !this.currentUserId) {
            cc.error("🎮 GameManager: Firebase database or user ID not available for joinGameRoom.");
            return;
        }

        const gameRoomRef = this.db.ref(`games/${this.gameRoomId}`);
        const playersRef = gameRoomRef.child('players');

        // 1. Add local player to the game room
        const localPlayerStateRef = playersRef.child(this.currentUserId);
        localPlayerStateRef.onDisconnect().remove().then(() => {
            cc.log(`🎮 GameManager: OnDisconnect set for ${this.currentUserId}`);
        }).catch((error) => {
            cc.error("🎮 GameManager: Failed to set onDisconnect:", error);
        });

        // Set initial state for the local player.
        // This will be updated by LocalPlayerController.
        localPlayerStateRef.set({
            name: `Player_${this.currentUserId.substring(0, 5)}`, // A simple name
            positionX: this.localPlayerPrefab.data.x, // Initial position from prefab
            positionY: this.localPlayerPrefab.data.y,
            moveDir: 0,
            isGrounded: false,
            currentAnim: "idle",
            lastUpdate: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            cc.log(`🎮 GameManager: Local player ${this.currentUserId} joined game room ${this.gameRoomId}`);
            this.spawnLocalPlayer();
        }).catch((error) => {
            cc.error("🎮 GameManager: Failed to add local player to room:", error);
        });

        // 2. Listen for all player changes in the room
        playersRef.on('child_added', (snapshot) => {
            const playerId = snapshot.key;
            const playerData = snapshot.val();
            if (playerId !== this.currentUserId) {
                cc.log(`🎮 GameManager: Remote player ${playerId} joined.`);
                this.spawnRemotePlayer(playerId, playerData);
            }
        });

        playersRef.on('child_changed', (snapshot) => {
            const playerId = snapshot.key;
            const playerData = snapshot.val();
            if (playerId !== this.currentUserId) {
                this.updateRemotePlayer(playerId, playerData);
            }
        });

        playersRef.on('child_removed', (snapshot) => {
            const playerId = snapshot.key;
            if (playerId !== this.currentUserId) {
                cc.log(`🎮 GameManager: Remote player ${playerId} left.`);
                this.despawnRemotePlayer(playerId);
            }
        });
    }

    /**
     * Spawns the local player from the prefab and attaches LocalPlayerController.
     */
    private spawnLocalPlayer() {
        if (!this.localPlayerPrefab) {
            cc.error("GameManager: Local Player Prefab is not assigned!");
            return;
        }
        if (!this.currentUserId) {
            cc.error("GameManager: Cannot spawn local player, user ID is not available!");
            return;
        }

        cc.log("🎮 GameManager: Attempting to spawn local player.");

        this.localPlayerNode = cc.instantiate(this.localPlayerPrefab);
        // Set initial position (e.g., from prefab data or a fixed point)
        // Ensure this.localPlayerPrefab.data.x and .y are valid or set a default.
        this.localPlayerNode.setPosition(new cc.Vec2(200, 700)); // Example: start at origin
        this.node.parent.addChild(this.localPlayerNode); // Add to the scene's canvas

        cc.log(`🎮 GameManager: Local player node instantiated and added to scene at position: (${this.localPlayerNode.x}, ${this.localPlayerNode.y})`);

        // Assuming LocalPlayerController needs a reference to playersRef.child(this.currentUserId)
        const localPlayerController = this.localPlayerNode.getComponent(LocalPlayerController);
        if (localPlayerController) {
            // Ensure LocalPlayerController has an 'init' method that accepts userId and firebaseRef
            localPlayerController.setFirebaseRef(this.db!.ref(`games/${this.gameRoomId}/players/${this.currentUserId}`)); // Use non-null assertion as we've checked db
            cc.log("🎮 GameManager: Local player spawned and linked to Firebase.");
        } else {
            cc.error("🎮 GameManager: LocalPlayerController component not found on local player prefab!");
        }

        this.node.name = "p1";
        this.mainCamera.target = this.localPlayerNode;
        this.weightPlacer.player = this.localPlayerNode;
        this.boxPlacer.player = this.localPlayerNode;
        this.spikePlacer.player = this.localPlayerNode;
        this.inventoryUI.playerNode = this.localPlayerNode;
        this.localPlayerNode.getComponent("LocalPlayerController").blockHold = cc.game["selectedBlockTypes"][0];
    
    }

    /**
     * Spawns a remote player from the prefab and attaches RemotePlayerController.
     * @param playerId The ID of the remote player.
     * @param playerData Initial data for the remote player.
     */
    private spawnRemotePlayer(playerId: string, playerData: any) {
        if (!this.remotePlayerPrefab) {
            cc.error("GameManager: Remote Player Prefab is not assigned!");
            return;
        }
        if (this.remotePlayers[playerId]) {
            cc.warn(`🎮 GameManager: Remote player ${playerId} already exists. Skipping spawn.`);
            return;
        }

        const remotePlayerNode = cc.instantiate(this.remotePlayerPrefab);
        remotePlayerNode.name = `remotePlayer_${playerId}`; // Give it a unique name
        remotePlayerNode.setPosition(new cc.Vec3(playerData.positionX || 0, playerData.positionY || 0, 0));
        this.node.parent.addChild(remotePlayerNode); // Add to the scene's canvas
        this.remotePlayers[playerId] = remotePlayerNode; // Store reference

        const remotePlayerController = remotePlayerNode.getComponent(RemotePlayerController);
        if (remotePlayerController) {
            // Ensure RemotePlayerController has an 'init' method that accepts playerId and playerData
            remotePlayerController.init(playerId, playerData); // Pass initial data
            cc.log(`🎮 GameManager: Remote player ${playerId} spawned.`);
        } else {
            cc.error("🎮 GameManager: RemotePlayerController component not found on remote player prefab!");
        }
    }

    /**
     * Updates a remote player's state based on Firebase data.
     * @param playerId The ID of the remote player.
     * @param playerData The updated data for the remote player.
     */
    private updateRemotePlayer(playerId: string, playerData: any) {
        const remotePlayerNode = this.remotePlayers[playerId];
        if (remotePlayerNode) {
            const remotePlayerController = remotePlayerNode.getComponent(RemotePlayerController);
            if (remotePlayerController) {
                // Ensure RemotePlayerController has an 'updateState' method
                remotePlayerController.updateState(playerData);
            } else {
                cc.warn(`🎮 GameManager: RemotePlayerController not found on node for ${playerId}. Manually updating position.`);
                remotePlayerNode.setPosition(new cc.Vec3(playerData.positionX || 0, playerData.positionY || 0, 0)); // Fallback
            }
        } else {
            cc.warn(`🎮 GameManager: Node for remote player ${playerId} not found during update.`);
            // This might happen if 'child_added' hasn't fired yet, or 'child_removed' already fired.
            // Consider re-spawning if this is a persistent issue.
        }
    }

    /**
     * Removes a remote player's node from the scene.
     * @param playerId The ID of the remote player to despawn.
     */
    private despawnRemotePlayer(playerId: string) {
        const remotePlayerNode = this.remotePlayers[playerId];
        if (remotePlayerNode) {
            remotePlayerNode.destroy();
            delete this.remotePlayers[playerId]; // Remove from map
            cc.log(`🎮 GameManager: Remote player ${playerId} despawned.`);
        } else {
            cc.warn(`🎮 GameManager: Attempted to despawn remote player ${playerId}, but node not found.`);
        }
    }

    onDestroy() {
        if (this.db) {
            // Detach all listeners when the game manager is destroyed
            this.db.ref(`games/${this.gameRoomId}/players`).off();
            cc.log("🎮 GameManager: Firebase listeners detached.");
        }
    }
}
