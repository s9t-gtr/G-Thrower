// js/letter.js
window.GThrower = window.GThrower || {};

(function(G, Matter) { // IIFE: G=GThrower, Matter=Matter
    // 依存関係チェック
    if (!Matter) { console.error('Matter.js is not loaded.'); return; }
    if (!G.config) { console.error('GThrower.config is not loaded.'); return; }

    const config = G.config;
    const Body = Matter.Body;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const Events = Matter.Events;
    const Vertices = Matter.Vertices; // Vertices モジュールも使うかも

    // 文字作成関数を格納する内部オブジェクト
    const letterCreators = {};

    // --- ★★★ 文字 'G' の作成関数 (直線位置修正・20 Rectangle版) ★★★ ---
    letterCreators['G'] = function(x, y) {
        const scale = config.LETTER_SCALE;
        const radius = 38 * scale;        // 全体のサイズ感
        const partThickness = 8 * scale; // 線の太さ
        const partOptions = {};

        const parts = [];

        // --- 円弧部分の生成 (18 セグメント) ---
        const arcSegments = 18;
        const startAngle = -Math.PI / 3.5; // 開始角度 (右上)
        const endAngle = Math.PI * 1.3;  // 終了角度 (右下の手前)
        const angleStep = (endAngle - startAngle) / arcSegments;
        const segmentLength = radius * angleStep * 1.15; // セグメント長

        console.log(`Creating ${arcSegments} arc segments for G...`);
        for (let i = 0; i < arcSegments; i++) {
            const currentAngle = startAngle + (i + 0.5) * angleStep;
            const cx = radius * Math.cos(currentAngle);
            const cy = radius * Math.sin(currentAngle);
            const segmentAngle = currentAngle + Math.PI / 2;
            parts.push(Bodies.rectangle(cx, cy, segmentLength, partThickness, {
                ...partOptions,
                angle: segmentAngle
            }));
        }
        // これで 18 本

        // --- 直線部分の生成 (2本) ---
        console.log("Creating straight segments for G...");

        // 19. 右縦棒 (1本) - 位置を修正
        const rightBarHeight = radius * 0.9; // 高さ調整
        const rightBarAngle = Math.PI / 2;    // 垂直
        // ↓↓↓ X座標: Gの右端として想定される位置に固定的に配置 (例: 半径の90%の位置) ↓↓↓
        const rightBarCx = radius * 0.9;
        // ↓↓↓ Y座標: 中心より少し下に配置 ↓↓↓
        const rightBarCy = radius * 0.4;
        // ↑↑↑ 修正ここまで ↑↑↑
        parts.push(Bodies.rectangle(rightBarCx, rightBarCy, rightBarHeight, partThickness, {
            ...partOptions,
            angle: rightBarAngle
        })); // 19本目

        // 20. 内側横棒 (クロスバー, 1本) - 位置を修正
        const innerBarLength = radius * 1.0; // 長さ調整
        const innerBarAngle = 0;             // 水平
        // ↓↓↓ X座標: 新しい右縦棒の左端から内側に伸びるように計算 ↓↓↓
        // 右縦棒の中心X - 半分の太さ = 右縦棒の左端のX
        // 横棒の中心X = 右縦棒の左端のX - 横棒の半分の長さ + 少し重ねるオフセット
        const innerBarCx = (rightBarCx - partThickness / 2) - innerBarLength / 2 + (partThickness * 0.2);
        // ↓↓↓ Y座標: 中心付近に配置 ↓↓↓
        const innerBarCy = radius * 0.1; // 中心より少し上
        // ↑↑↑ 修正ここまで ↑↑↑
        parts.push(Bodies.rectangle(innerBarCx, innerBarCy, innerBarLength, partThickness, {
            ...partOptions,
            angle: innerBarAngle
        })); // 20本目

        console.log(`Total parts created for G: ${parts.length}`);

        // --- 複合ボディの作成 ---
        const letterG = Body.create({
            parts: parts,
            frictionAir: 0.035,
            friction: 0.1,
            restitution: 0.35,
            isSleeping: true,
            density: 0.0009
        });

        // 重心補正
        try {
             let allVertices = [];
             if (letterG.parts && letterG.parts.length > 1) {
                  for (let i = 1; i < letterG.parts.length; i++) {
                       if (letterG.parts[i] && letterG.parts[i].vertices) {
                           allVertices = allVertices.concat(letterG.parts[i].vertices);
                       }
                  }
             }
             if (allVertices.length > 0) {
                  let center = Vertices.centre(allVertices);
                  Body.translate(letterG, { x: -center.x, y: -center.y });
             } else {
                  console.warn("Could not calculate center for Letter G (20 seg), vertices not found or empty.");
             }
        } catch (e) {
            console.error("Error centering Letter G (20 seg):", e);
        }

        // 最終的な位置と角度を設定
        Body.setPosition(letterG, { x: x, y: y });
        Body.setAngle(letterG, 0);
        console.log(`Created 20-segment Letter G body (ID: ${letterG.id}) - Adjusted straight parts`);
        return letterG;
    };

    // --- 文字を初期配置する関数 (変更なし) ---
    G.initializeLetters = function(letterChar, count) {
        if (!G.world) { console.error('World not setup.'); return; }
        const creator = letterCreators[letterChar];
        if (!creator) {
            console.error(`Letter '${letterChar}' creator function not found! Check letter.js.`);
            return;
        }
        const initialX = config.INTERACTION_CIRCLE_X;
        const initialY = config.INTERACTION_CIRCLE_Y;
        for (let i = 0; i < count; i++) {
            const letterBody = creator(initialX, initialY);
            if (letterBody) {
                Composite.add(G.world, letterBody);
            }
        }
    };

    // --- スワイプモーション設定関数 (変更なし) ---
    G.setupSwipeMotion = function() {
        if (!G.mouseConstraint) { console.error('MouseConstraint not setup.'); return; }
        Events.on(G.mouseConstraint, 'mouseup', (event) => {
            const body = G.mouseConstraint.body;
            if (body) {
                const velocity = G.mouseConstraint.mouse.velocity;
                const finalVelocity = {
                    x: velocity.x * config.SWIPE_VELOCITY_SCALE,
                    y: velocity.y * config.SWIPE_VELOCITY_SCALE
                };
                Body.setSleeping(body, false);
                Body.setVelocity(body, finalVelocity);
            }
        });
    };

})(window.GThrower, window.Matter);