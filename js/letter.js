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

       // --- ★★★ 文字 'G' の作成関数 (色を白に変更 - 修正版) ★★★ ---
       letterCreators['G'] = function(x, y) {
        const scale = config.LETTER_SCALE;
        const radius = 38 * scale;
        const partThickness = 8 * scale;
        // ↓↓↓ 各パーツに適用する共通のレンダーオプションを定義 (色を白に！) ↓↓↓
        const partRenderOptions = {
            fillStyle: '#FFFFFF',   // ★★★ 塗りつぶし色: 白 ★★★
            strokeStyle: '#FFFFFF', // ★★★ 輪郭線の色: 白 (または '#000000' など) ★★★
            lineWidth: 1
        };
        // ↑↑↑ 定義ここまで ↑↑↑
        const partOptions = {}; // 物理特性など、render以外の共通オプション用 (現在空)

        const parts = [];

        // --- 円弧部分の生成 (18 セグメント) ---
        const arcSegments = 18;
        const startAngle = -Math.PI / 3.5;
        const endAngle = Math.PI * 1.3;
        const angleStep = (endAngle - startAngle) / arcSegments;
        const segmentLength = radius * angleStep * 1.15;
        const rotationAngle = Math.PI / 2; // 反時計回り90度回転

        for (let i = 0; i < arcSegments; i++) {
            const currentAngle = startAngle + (i + 0.5) * angleStep;
            const rotatedCurrentAngle = currentAngle + rotationAngle;
            const cx = radius * Math.cos(rotatedCurrentAngle);
            const cy = radius * Math.sin(rotatedCurrentAngle);
            const segmentAngle = currentAngle + Math.PI / 2;
            const rotatedSegmentAngle = segmentAngle + rotationAngle;
            parts.push(Bodies.rectangle(cx, cy, segmentLength, partThickness, {
                ...partOptions, // render を含まないオプション
                angle: rotatedSegmentAngle,
                render: partRenderOptions // ★★★ 各パーツに render 設定を適用 ★★★
            }));
        }

        // --- 直線部分の生成 (2本) ---
        const rightBarHeight = radius * 0.9;
        const rightBarAngle = Math.PI / 2;
        const rightBarCx = radius * 0.9;
        const rightBarCy = radius * 0.4;
        parts.push(Bodies.rectangle(rightBarCx, rightBarCy, rightBarHeight, partThickness, {
             ...partOptions,
             angle: rightBarAngle,
             render: partRenderOptions // ★★★ 各パーツに render 設定を適用 ★★★
        }));
        const innerBarLength = radius * 1.0;
        const innerBarAngle = 0;
        const innerBarCx = (rightBarCx - partThickness / 2) - innerBarLength / 2 + (partThickness * 0.2);
        const innerBarCy = radius * 0.1;
        parts.push(Bodies.rectangle(innerBarCx, innerBarCy, innerBarLength, partThickness, {
             ...partOptions,
             angle: innerBarAngle,
             render: partRenderOptions // ★★★ 各パーツに render 設定を適用 ★★★
        }));

        // --- 複合ボディの作成 ---
        const letterG = Body.create({
            parts: parts,
            frictionAir: 0.035,
            friction: 0.6,
            frictionStatic: 1.0,
            restitution: 0.05,
            isSleeping: true,
            density: 0.0009,
            // ★★★ 複合ボディ全体に render オプションを設定 (白色) ★★★
            // render: {
            //     fillStyle: '#FFFFFF',   // 塗りつぶし色: 白
            //     strokeStyle: '#FFFFFF', // 輪郭線の色: 白 (見えなくなるので注意)
            //     // strokeStyle: '#000000', // 輪郭線は黒にする場合
            //     lineWidth: 1
            // }
        });

        // 重心補正 (変更なし)
        try {
             let allVertices = [];
             if (letterG.parts && letterG.parts.length > 1) {
                  for (let i = 1; i < letterG.parts.length; i++) { // i=1 から開始
                       if (letterG.parts[i] && letterG.parts[i].vertices) {
                           allVertices = allVertices.concat(letterG.parts[i].vertices);
                       }
                  }
             }
             if (allVertices.length > 0) {
                  let center = Vertices.centre(allVertices);
                  Body.translate(letterG, { x: -center.x, y: -center.y });
             } else {
                  console.warn("Could not calculate center for Letter G (white), vertices not found.");
             }
        } catch (e) {
            console.error("Error centering Letter G (white):", e);
        }

        // 最終的な位置と角度を設定 (変更なし)
        Body.setPosition(letterG, { x: x, y: y });
        Body.setAngle(letterG, 0);
        console.log(`Created 20-segment Letter G body with white color (ID: ${letterG.id})`);
        return letterG;
    };

    // --- 文字を初期配置する関数 (変更なし) ---
    G.initializeLetters = function(letterChar, count) {
        if (!G.world) { console.error('World not setup for initializing letters.'); return; }

        // G.activeLetters 配列がなければ初期化
        G.activeLetters = G.activeLetters || [];

        // 1. ★★★ 既存の文字があればワールドから削除 ★★★
        if (G.activeLetters.length > 0) {
             console.log(`Removing ${G.activeLetters.length} existing letters from world.`);
             // ワールドからボディを削除
             Composite.remove(G.world, G.activeLetters);
             // 参照配列をクリア
             G.activeLetters = [];
        }

        // 2. 新しい文字を作成・追加
        const creator = letterCreators[letterChar];
        if (!creator) {
            console.error(`Letter '${letterChar}' creator function not found! Check letter.js.`);
            return;
        }
        const initialX = config.INTERACTION_CIRCLE_X;
        const initialY = config.INTERACTION_CIRCLE_Y;

        console.log(`Initializing ${count} of letter '${letterChar}'...`);
        for (let i = 0; i < count; i++) {
            const letterBody = creator(initialX, initialY);
            if (letterBody) {
                Composite.add(G.world, letterBody);
                // 3. ★★★ 作成したボディの参照を保持 ★★★
                G.activeLetters.push(letterBody);
                console.log(`Added new letter body (ID: ${letterBody.id})`);
            }
        }
    };
    // ★★★ 修正ここまで ★★★



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