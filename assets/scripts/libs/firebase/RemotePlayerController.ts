// RemotePlayerController.ts
// This script controls remote players based on data received from Firebase.

const { ccclass, property } = cc._decorator;

@ccclass
export default class RemotePlayerController extends cc.Component {

    @property(cc.Label)
    playerNameLabel: cc.Label = null; // Optional: A label to display the player's name

    private playerId: string = null;
    private currentAnim: string = "";

    /**
     * Initializes the remote player with its ID and initial state.
     * @param id The unique ID of the remote player.
     * @param initialState The initial state data from Firebase.
     */
    public init(id: string, initialState: any) {
        this.playerId = id;
        if (this.playerNameLabel) {
            this.playerNameLabel.string = initialState.name || `Player_${id.substring(0, 5)}`;
        }
        this.updateState(initialState);
        this.name = "p1 remote";
        cc.log(`👥 Remote player ${this.playerId} initialized.`);
    }

    /**
     * Updates the remote player's visual state based on new data from Firebase.
     * @param newState The latest state data from Firebase.
     */
    public updateState(newState: any) {
        if (!this.node) return; // Node might have been destroyed

        // Update position
        this.node.x = newState.positionX;
        this.node.y = newState.positionY;

        // Update facing direction (scaleX)
        this.node.scaleX = newState.scaleX;

        // Update animation
        this.updateAnimation(newState.currentAnim);

        // You can add more state updates here (e.g., health, blockHold, etc.)
        // cc.log(`👥 Remote player ${this.playerId} updated: Pos(${this.node.x}, ${this.node.y}), Anim: ${newState.currentAnim}`);
    }

    /**
     * Plays the specified animation for the remote player.
     * @param newAnim The name of the animation to play.
     */
    private updateAnimation(newAnim: string) {
        const anim = this.getComponent(cc.Animation);
        if (!anim) {
            // console.warn("⚠️ Animation component not found on remote player node");
            return;
        }

        if (newAnim !== this.currentAnim) {
            if (anim.getClips().some(c => c.name === newAnim)) {
                anim.play(newAnim);
                this.currentAnim = newAnim;
                // console.log(`👥 Remote player ${this.playerId} playing '${newAnim}' animation`);
            } else {
                // console.warn(`⚠️ '${newAnim}' animation clip not found for remote player ${this.playerId}.`);
                if (anim.getAnimationState(this.currentAnim)?.isPlaying) {
                    anim.stop();
                }
                this.currentAnim = ""; // Reset if animation not found
            }
        }
    }

    onDestroy() {
        cc.log(`👥 Remote player ${this.playerId} destroyed.`);
    }
}
