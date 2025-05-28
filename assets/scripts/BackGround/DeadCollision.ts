const { ccclass, property } = cc._decorator;

@ccclass
export default class TilemapCollisionInit extends cc.Component {

    onLoad() {
        // ✅ 開啟物理系統
        const physicsMgr = cc.director.getPhysicsManager();
        physicsMgr.enabled = true;

        // ✅ 只在開發階段開啟 debug 線條
        if (CC_DEBUG) {
            physicsMgr.debugDrawFlags = 
                cc.PhysicsManager.DrawBits.e_aabbBit |
                cc.PhysicsManager.DrawBits.e_shapeBit;
        }
        // ✅ 載入 Tiled 地圖的 Object Layer
        let tiledMap = this.getComponent(cc.TiledMap);
        let collisionLayer = tiledMap.getObjectGroup("deadCollision");
        if (!collisionLayer) {
            cc.warn("沒有找到 deadCollision object layer！");
            return;
        }

        let objects = collisionLayer.getObjects();
        console.log("Collision objects:", objects.length); 
        for (let obj of objects) {
            console.log("Object:", obj.name, obj.width, obj.height, obj.x, obj.y);
        }

        for (let obj of objects) {
            let width = obj.width;
            let height = obj.height;
            let x = obj.x + width / 2 - 2100;
            let y = obj.y - height / 2 - 420;

            let worldPos = this.node.convertToWorldSpaceAR(cc.v2(x, y));
            let localPos = this.node.parent.convertToNodeSpaceAR(worldPos);

            let colliderNode = new cc.Node("dead");
            this.node.parent.addChild(colliderNode);
            colliderNode.setPosition(localPos);
            
            //colliderNode.group = "dead";

            let rigid = colliderNode.addComponent(cc.RigidBody);
            rigid.type = cc.RigidBodyType.Static;

            let box = colliderNode.addComponent(cc.PhysicsBoxCollider);
            box.size = cc.size(width, height);
            box.friction = 0;  
            box.apply();
        }
    }
}
