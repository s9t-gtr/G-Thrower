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

    // --- ★★★ 文字 'G' の作成関数 (円弧部分のみ回転) ★★★ ---
    letterCreators['G'] = function(x, y) {
        const scale = config.LETTER_SCALE;
        const radius = 38 * scale;
        const partThickness = 8 * scale;
        const partOptions = {};

        const parts = [];

        // --- 円弧部分の生成 (18 セグメント) ---
        const arcSegments = 18;
        const startAngle = -Math.PI / 3.5;
        const endAngle = Math.PI * 1.3;
        const angleStep = (endAngle - startAngle) / arcSegments;
        const segmentLength = radius * angleStep * 1.15;
        // ↓↓↓ 時計回り90度の回転角度を定義 ↓↓↓
        const rotationAngle = Math.PI / 2;
        // ↑↑↑ 定義ここまで ↑↑↑

        console.log(`Creating ${arcSegments} rotated arc segments for G...`);
        for (let i = 0; i < arcSegments; i++) {
            const currentAngle = startAngle + (i + 0.5) * angleStep;

            // ↓↓↓ 中心座標計算用の角度に回転を加える ↓↓↓
            const rotatedCurrentAngle = currentAngle + rotationAngle;
            // ↓↓↓ 回転後の角度で座標を計算 ↓↓↓
            const cx = radius * Math.cos(rotatedCurrentAngle);
            const cy = radius * Math.sin(rotatedCurrentAngle);

            // ↓↓↓ パーツ自体の角度も回転させる ↓↓↓
            // 元のセグメント角度 (接線方向)
            const segmentAngle = currentAngle + Math.PI / 2;
            // 回転後のセグメント角度
            const rotatedSegmentAngle = segmentAngle + rotationAngle;
            // ↑↑↑ 変更ここまで ↑↑↑

            parts.push(Bodies.rectangle(cx, cy, segmentLength, partThickness, {
                ...partOptions,
                angle: rotatedSegmentAngle // 回転後の角度を設定
            }));
        }
        // これで回転された円弧 18 本

        // --- 直線部分の生成 (2本) ---
        // ★★★ 直線部分の座標・角度計算は変更しない ★★★
        console.log("Creating straight segments for G (original position)...");
        // 19. 右縦棒 (1本)
        const rightBarHeight = radius * 0.9;
        const rightBarAngle = Math.PI / 2;
        const rightBarCx = radius * 0.9; // 固定的なX
        const rightBarCy = radius * 0.4; // 固定的なY
        parts.push(Bodies.rectangle(rightBarCx, rightBarCy, rightBarHeight, partThickness, {
            ...partOptions,
            angle: rightBarAngle
        })); // 19本目

        // 20. 内側横棒 (クロスバー, 1本)
        const innerBarLength = radius * 1.0;
        const innerBarAngle = 0;
        const innerBarCx = (rightBarCx - partThickness / 2) - innerBarLength / 2 + (partThickness * 0.2);
        const innerBarCy = radius * 0.1;
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

        // 重心補正 (パーツの頂点データに基づいて行われる)
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
                // console.log("Letter G centered based on vertices (arc rotated).");
            } else {
                console.warn("Could not calculate center for Letter G (arc rotated), vertices not found or empty.");
            }
        } catch (e) {
            console.error("Error centering Letter G (arc rotated):", e);
        }

        // 最終的な位置と角度を設定 (ボディ全体の初期角度は0)
        Body.setPosition(letterG, { x: x, y: y });
        Body.setAngle(letterG, 0);
        console.log(`Created 20-segment Letter G body (Arc rotated ID: ${letterG.id})`);
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