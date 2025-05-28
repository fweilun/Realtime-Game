const { ccclass, property } = cc._decorator;

@ccclass
export default class Camera extends cc.Component {

    @property(cc.Node)
    target: cc.Node = null; 

    @property(cc.Node)
    mapNode: cc.Node = null; 

    @property
    halfWidth: number = 0; 

    @property
    halfHeight: number = 0;

    @property
    xOffset: number = 70;  
    
     update() {
        if (!this.target || !this.mapNode) return;

        const targetPos = this.target.position;
        const mapWidth = this.mapNode.width -640;

        const minX = this.halfWidth;
        const maxX = mapWidth - 640;

        const minY = this.halfHeight;
        const maxY = this.mapNode.height - this.halfHeight;

        const desiredX = targetPos.x + this.xOffset;  
        
        const clampedX = cc.misc.clampf(desiredX, minX, maxX);
        const clampedY = cc.misc.clampf(targetPos.y, minY, maxY);
        
        this.node.setPosition(clampedX, this.halfHeight);
    }

    setTarget(newTarget: cc.Node) {
        this.target = newTarget;
    }
}
