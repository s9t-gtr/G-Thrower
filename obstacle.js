// obstacle.js
import { Body, Bodies } from './matter-alias.js'; // エイリアスファイルをインポート
import {
    CANVAS_WIDTH, CANVAS_HEIGHT,
    TRUNK_WIDTH, TRUNK_HEIGHT_RATIO, BRANCH_THICKNESS, TREE_COLOR, TREE_ROOT_X_RATIO
} from './constants.js';

/**
 * 指定された位置に静的な木を作成します。
 * @param {number} rootX - 木の根元のX座標
 * @param {number} rootY - 木の根元のY座標
 * @returns {Matter.Body} 作成された木の複合ボディ
 */
export function createBareTree(rootX, rootY) {
    const trunkHeight = CANVAS_HEIGHT * TRUNK_HEIGHT_RATIO;
    const treeRenderStyle = { fillStyle: TREE_COLOR };

    // 幹
    const trunk = Bodies.rectangle(0, 0, TRUNK_WIDTH, trunkHeight, {
        render: treeRenderStyle
    });

    // 枝 (位置と角度は幹の中心からの相対座標/角度)
    const branch1Length = 75;
    const branch1 = Bodies.rectangle(
        TRUNK_WIDTH * 0.4 + branch1Length * 0.2, // Xオフセット
        -trunkHeight * 0.15,                      // Yオフセット (幹の上部から)
        branch1Length, branch1Length, BRANCH_THICKNESS,
        { angle: -Math.PI / 5.5, render: treeRenderStyle }
    );
    const branch2Length = 85;
    const branch2 = Bodies.rectangle(
        -TRUNK_WIDTH * 0.4 - branch2Length * 0.2,
        -trunkHeight * 0.4,                       // Yオフセット
        branch2Length, BRANCH_THICKNESS,
        { angle: Math.PI / 6, render: treeRenderStyle }
    );
    const branch3Length = 65;
    const branch3 = Bodies.rectangle(
        TRUNK_WIDTH * 0.3 + branch3Length * 0.3,
        -trunkHeight * 0.7,                      // Yオフセット
        branch3Length, BRANCH_THICKNESS,
        { angle: -Math.PI / 4, render: treeRenderStyle }
    );
     const branch4Length = 60;
    const branch4 = Bodies.rectangle(
        -TRUNK_WIDTH * 0.3 - branch4Length * 0.3,
        -trunkHeight * 0.88,                     // Yオフセット (最も上)
        branch4Length, BRANCH_THICKNESS,
        { angle: Math.PI / 3.8, render: treeRenderStyle }
    );

    // 複合ボディを作成
    const tree = Body.create({
        parts: [trunk, branch1, branch2, branch3, branch4],
        isStatic: true // 木全体を静的オブジェクトに
    });

    // 複合ボディ全体の位置を設定 (Y座標は幹の高さの半分を考慮)
    Body.setPosition(tree, { x: rootX, y: rootY - trunkHeight / 2 });

    return tree;
}

/**
 * デフォルトの位置に木を作成してワールドに追加します。
 * @param {Matter.World} world - 木を追加するワールド
 * @returns {Matter.Body} 作成された木のボディ
 */
export function addDefaultTree(world, Composite) {
    const treeRootX = CANVAS_WIDTH * TREE_ROOT_X_RATIO;
    const treeRootY = CANVAS_HEIGHT; // 地面に根付かせる
    const bareTree = createBareTree(treeRootX, treeRootY);
    Composite.add(world, bareTree);
    return bareTree;
}
