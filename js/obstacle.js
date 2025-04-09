// js/obstacle.js
window.GThrower = window.GThrower || {};

(function(G, Matter) { // IIFE: G=GThrower, Matter=Matter
    // 依存関係チェック
    if (!Matter) { console.error('Matter.js is not loaded.'); return; }
    if (!G.config) { console.error('GThrower.config is not loaded.'); return; }

    const config = G.config;
    const { Bodies, Composite } = Matter; // 使用するモジュール

    // --- 木の作成関数 (削除またはコメントアウト済みのはず) ---
    /* ... */

 // --- 小さな円（ピン）の障害物を追加する関数 ---
    /**
         * 指定された位置に円形の静的障害物（ピン）を1つ配置します。
         * @param {number} x - ピンの中心 X 座標
         * @param {number} y - ピンの中心 Y 座標
         * @param {number} [radius=10] - ピンの半径 (デフォルト値を10に変更)
         * @returns {Matter.Body | null} 作成されたピンのボディ、またはエラー時は null
         */
    G.addSinglePin = function(x, y, radius = 10) {
        if (!G.world) {
            console.error('World not setup for adding single pin.');
            return null;
        }
        // x, y, radius が有効な数値か基本的なチェック
        if (typeof x !== 'number' || typeof y !== 'number' || typeof radius !== 'number' || radius <= 0) {
            console.error(`Invalid parameters for addSinglePin: x=${x}, y=${y}, radius=${radius}`);
            return null;
        }

        // ピンの物理的・見た目の設定
        const pinOptions = {
            isStatic: true,
            restitution: 0.4,
            friction: 0.3,
            label: 'pin', // ラベルは判定で使うので維持
            render: {
                fillStyle: '#333333' // 色は維持 (濃い灰色)
            }
        };

        console.log(`Adding single pin at (${x.toFixed(0)}, ${y.toFixed(0)}) with radius ${radius}...`);
        // 指定された座標と半径でピンを作成
        const pin = Bodies.circle(x, y, radius, pinOptions);

        // ワールドに追加
        Composite.add(G.world, pin);
        console.log(`Single pin (ID: ${pin.id}) added to the world.`);

        // 作成したピンのボディオブジェクトを返す
        return pin;
    };

})(window.GThrower, window.Matter);
    
