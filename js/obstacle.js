// js/obstacle.js
window.GThrower = window.GThrower || {};

(function(G, Matter) { // IIFE: G=GThrower, Matter=Matter
    // 依存関係チェック
    if (!Matter) { console.error('Matter.js is not loaded.'); return; }
    if (!G.config) { console.error('GThrower.config is not loaded.'); return; }

    const config = G.config;
    const Body = Matter.Body;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;

    // 木を作成する内部関数 (グローバルには公開しない)
    function createBareTree(rootX, rootY) {
        const trunkHeight = config.CANVAS_HEIGHT * config.TRUNK_HEIGHT_RATIO;
        const treeRenderStyle = { fillStyle: config.TREE_COLOR };

        const trunk = Bodies.rectangle(0, 0, config.TRUNK_WIDTH, trunkHeight, { render: treeRenderStyle });
        const branch1Length = 75;
        const branch1 = Bodies.rectangle(config.TRUNK_WIDTH * 0.4 + branch1Length * 0.2, -trunkHeight * 0.15, branch1Length, config.BRANCH_THICKNESS, { angle: -Math.PI / 5.5, render: treeRenderStyle });
        const branch2Length = 85;
        const branch2 = Bodies.rectangle(-config.TRUNK_WIDTH * 0.4 - branch2Length * 0.2, -trunkHeight * 0.4, branch2Length, config.BRANCH_THICKNESS, { angle: Math.PI / 6, render: treeRenderStyle });
        const branch3Length = 65;
        const branch3 = Bodies.rectangle(config.TRUNK_WIDTH * 0.3 + branch3Length * 0.3, -trunkHeight * 0.7, branch3Length, config.BRANCH_THICKNESS, { angle: -Math.PI / 4, render: treeRenderStyle });
        const branch4Length = 60;
        const branch4 = Bodies.rectangle(-config.TRUNK_WIDTH * 0.3 - branch4Length * 0.3, -trunkHeight * 0.88, branch4Length, config.BRANCH_THICKNESS, { angle: Math.PI / 3.8, render: treeRenderStyle });

        const tree = Body.create({
            parts: [trunk, branch1, branch2, branch3, branch4],
            isStatic: true
        });
        Body.setPosition(tree, { x: rootX, y: rootY - trunkHeight / 2 });
        return tree;
    }

    // デフォルトの木を追加する関数を GThrower オブジェクトに追加
    G.addDefaultTree = function() {
        if (!G.world) { console.error('World not setup.'); return; }
        const treeRootX = config.CANVAS_WIDTH * config.TREE_ROOT_X_RATIO;
        const treeRootY = config.CANVAS_HEIGHT;
        const bareTree = createBareTree(treeRootX, treeRootY);
        Composite.add(G.world, bareTree);
    };

})(window.GThrower, window.Matter); // IIFEを実行
