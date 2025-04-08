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

    // 文字作成関数を格納する内部オブジェクト
    const letterCreators = {};

    // --- 文字 'E' の作成関数 (変更なし) ---
    letterCreators['E'] = function(x, y) {
        const scale = config.LETTER_SCALE;
        const partW = 10 * scale; const h = 50 * scale; const barW = 35 * scale;
        const stem = Bodies.rectangle(-15 * scale, 0, partW, h);
        const topBar = Bodies.rectangle(0, -h / 2 + partW / 2, barW, partW);
        const midBar = Bodies.rectangle(-2 * scale, 0, barW * 0.9, partW);
        const botBar = Bodies.rectangle(0, h / 2 - partW / 2, barW, partW);

        const letterE = Body.create({
            parts: [stem, topBar, midBar, botBar],
            frictionAir: 0.03, friction: 0.1, restitution: 0.4,
            isSleeping: true
        });
        Body.setPosition(letterE, { x: x, y: y });
        Body.setAngle(letterE, 0);
        return letterE;
    };

    // --- ★★★ 文字 'G' の作成関数 (見た目調整版) ★★★ ---
    letterCreators['G'] = function(x, y) {
        const scale = config.LETTER_SCALE; // configから取得 (例: 0.8)

        // ↓↓↓ サイズと太さを調整 ↓↓↓
        const radius = 35 * scale;        // サイズを大きく (以前: 25 * scale)
        const partThickness = 8 * scale; // パーツを細く (以前: 12 * scale)
        const chamfer = { radius: 1.5 * scale }; // 角の丸みも調整 (以前: 2 * scale)
        // ↑↑↑ 調整ここまで ↑↑↑

        // Gの形状を構成するパーツ (座標はボディの中心が(0,0)になるように調整)
        const outerHeight = radius * 2; // 全体の高さの目安
        const outerWidth = radius * 1.8; // 全体の幅の目安 (少し横長)

        // 長方形ベースのG (位置とサイズを新しい radius と partThickness で計算)
        const leftBar = Bodies.rectangle(
            -outerWidth / 2 + partThickness / 2, // X: 左端
            0,                                   // Y: 中央
            partThickness,                       // 幅: 細くした太さ
            outerHeight * 0.9,                   // 高さ: 全体の高さより少し短い
            { chamfer: chamfer }
        );
        const topBar = Bodies.rectangle(
            0,                                   // X: 中央
            -outerHeight / 2 + partThickness / 2, // Y: 上端
            outerWidth * 0.8,                    // 幅: 全体の幅より少し短い
            partThickness,                       // 高さ: 細くした太さ
            { chamfer: chamfer }
        );
        const bottomBar = Bodies.rectangle(
            -outerWidth * 0.1,                   // X: 少し左寄りから開始
            outerHeight / 2 - partThickness / 2, // Y: 下端
            outerWidth * 0.8,                    // 幅: 全体の幅より少し短い
            partThickness,                       // 高さ: 細くした太さ
            { chamfer: chamfer }
        );
        const rightBar = Bodies.rectangle(
            outerWidth / 2 - partThickness / 2, // X: 右端
            radius * 0.2,                        // Y: 中央より少し下から開始
            partThickness,                       // 幅: 細くした太さ
            outerHeight * 0.6,                   // 高さ: 全体の高さの60%程度
            { chamfer: chamfer }
        );
        const innerBar = Bodies.rectangle(
            radius * 0.1,                        // X: 中央より少し右から開始
            0,                                   // Y: 中央 (高さの中心)
            radius * 0.8,                        // 幅: 半径の80%程度
            partThickness,                       // 高さ: 細くした太さ
            { chamfer: chamfer }
        );

        // 複合ボディを作成
        const letterG = Body.create({
            parts: [leftBar, topBar, bottomBar, rightBar, innerBar],
            frictionAir: 0.03,
            friction: 0.1,
            restitution: 0.4,
            isSleeping: true
            // 必要に応じて質量や密度を調整
            // density: 0.0008 // 例: 少し軽くする場合
        });

        Body.setPosition(letterG, { x: x, y: y });
        Body.setAngle(letterG, 0);
        // console.log("Created Scaled Letter G body:", letterG); // デバッグ用ログ
        return letterG;
    };
    // ★★★ 修正ここまで ★★★


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