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

    // --- ★★★ 小さな円（ピン）の障害物を追加する関数 ★★★ ---
    G.addPinObstacles = function(count = 12, pinRadius = 7, minXRatio = 0.6, maxXRatio = 0.9, minY = 80, maxY = config.CANVAS_HEIGHT - 120) {
        if (!G.world) {
            console.error('World not setup for adding pin obstacles.');
            return;
        }

        const pinOptions = {
            isStatic: true,
            restitution: 0.4,
            friction: 0.3,
            render: { fillStyle: '#595959' }
        };

        console.log(`Adding up to ${count} pin obstacles...`);
        const pins = [];
        let attempts = 0;
        const maxAttempts = count * 10;

        // ↓↓↓ minDistSq の定義を while ループの外に移動 ↓↓↓
        // pinRadius はこのスコープで利用可能
        const minDistSq = (pinRadius * 8) ** 2; // ピン同士の最小距離の2乗 (半径の8倍)

        while (pins.length < count && attempts < maxAttempts) {
            attempts++;
            const x = config.CANVAS_WIDTH * (minXRatio + Math.random() * (maxXRatio - minXRatio));
            const y = minY + Math.random() * (maxY - minY);

            let tooClose = false;
            // const minDistSq = ...; // ← ここから移動した

            // 他の既に配置が決まったピンと近すぎないかチェック
            for (let i = 0; i < pins.length; i++) {
                if (!pins[i] || !pins[i].position) continue;
                const existingPinPos = pins[i].position;
                const dx = x - existingPinPos.x;
                const dy = y - existingPinPos.y;
                // ここで minDistSq を参照 (スコープ内なのでOK)
                if (dx * dx + dy * dy < minDistSq) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                const pin = Bodies.circle(x, y, pinRadius, pinOptions);
                pins.push(pin);
            }
        } // while ループ終了

        // 作成したピンを一括してワールドに追加
        if (pins.length > 0) {
            Composite.add(G.world, pins);
            // ↓↓↓ ここで minDistSq を参照 (スコープ内になったのでOK) ↓↓↓
            console.log(`${pins.length} pin obstacles added to the world (distance check: ${Math.sqrt(minDistSq).toFixed(1)}px).`);
        } else if (attempts >= maxAttempts) {
            console.warn("Could not place the desired number of pins without overlap after maximum attempts.");
        } else {
             console.log("No pin obstacles were added.");
        }
    };
    // ★★★ 関数定義ここまで ★★★

})(window.GThrower, window.Matter);
