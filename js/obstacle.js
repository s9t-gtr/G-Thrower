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
 G.addPinObstacles = function(count = 12, pinRadius = 7, minXRatio = 0.6, maxXRatio = 0.9, minY = 80, maxY = config.CANVAS_HEIGHT - 120) {
    if (!G.world) {
        console.error('World not setup for adding pin obstacles.');
        return []; // ★★★ 空配列を返すように変更 ★★★
    }

    const pinOptions = {
        isStatic: true,
        restitution: 0.4,
        friction: 0.3,
        label: 'pin', // ラベルは判定に使うかもしれないので残す
        render: { fillStyle: '#595959' }
    };

    console.log(`Adding up to ${count} pin obstacles...`);
    const pins = []; // 作成したピンを格納する配列
    let attempts = 0;
    const maxAttempts = count * 10;
    const minDistSq = (pinRadius * 8) ** 2; // 近接チェック距離

    while (pins.length < count && attempts < maxAttempts) {
        attempts++;
        const x = config.CANVAS_WIDTH * (minXRatio + Math.random() * (maxXRatio - minXRatio));
        const y = minY + Math.random() * (maxY - minY);

        let tooClose = false;
        for (let i = 0; i < pins.length; i++) {
            if (!pins[i] || !pins[i].position) continue;
            const existingPinPos = pins[i].position;
            const dx = x - existingPinPos.x;
            const dy = y - existingPinPos.y;
            if (dx * dx + dy * dy < minDistSq) {
                tooClose = true;
                break;
            }
        }

        if (!tooClose) {
            const pin = Bodies.circle(x, y, pinRadius, pinOptions);
            pins.push(pin);
        }
    }

    if (pins.length > 0) {
        Composite.add(G.world, pins);
        console.log(`${pins.length} pin obstacles added to the world.`);
    } else {
         console.log("No pin obstacles were added (or failed placement).");
    }

    return pins; // ★★★ 作成したピンのボディ配列を返す ★★★
};

})(window.GThrower, window.Matter);
    
