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

    // 文字作成関数を格納する内部オブジェクト (グローバルには公開しない)
    const letterCreators = {};

    // 文字 'E' の作成関数
    letterCreators['E'] = function(x, y) {
        const scale = config.LETTER_SCALE;
        const partW = 10 * scale; const h = 50 * scale; const barW = 35 * scale;
        const stem = Bodies.rectangle(-15 * scale, 0, partW, h);
        const topBar = Bodies.rectangle(0, -h / 2 + partW / 2, barW, partW);
        const midBar = Bodies.rectangle(-2 * scale, 0, barW * 0.9, partW);
        const botBar = Bodies.rectangle(0, h / 2 - partW / 2, barW, partW);

        const letterE = Body.create({
            parts: [stem, topBar, midBar, botBar],
            frictionAir: 0.03,
            friction: 0.1,
            restitution: 0.4,
            isSleeping: true // 初期状態でスリープ
        });

        Body.setPosition(letterE, { x: x, y: y });
        Body.setAngle(letterE, 0); // 初期角度
        return letterE;
    };
    // 他の文字を追加する場合はここに letterCreators['A'] = function(...) {} を追加

    // 文字を初期配置する関数を GThrower オブジェクトに追加
    G.initializeLetters = function(letterChar, count) {
        if (!G.world) { console.error('World not setup.'); return; }
        const creator = letterCreators[letterChar];
        if (!creator) {
            console.error(`Letter '${letterChar}' creator function not found!`);
            return;
        }
        // 初期位置を config から取得
        const initialX = config.INTERACTION_CIRCLE_X;
        const initialY = config.INTERACTION_CIRCLE_Y;
        for (let i = 0; i < count; i++) {
            const letterBody = creator(initialX, initialY);
            if (letterBody) {
                Composite.add(G.world, letterBody);
            }
        }
    };

    // スワイプモーション（速度適用）のイベントリスナーを設定する関数を GThrower オブジェクトに追加
    G.setupSwipeMotion = function() {
        if (!G.mouseConstraint) { console.error('MouseConstraint not setup.'); return; }
        Events.on(G.mouseConstraint, 'mouseup', (event) => {
            const body = G.mouseConstraint.body; // mouseup時に掴んでいたボディ
            if (body) {
                // G.mouseConstraint.mouse から現在のマウス速度を取得
                const velocity = G.mouseConstraint.mouse.velocity;
                const finalVelocity = {
                    x: velocity.x * config.SWIPE_VELOCITY_SCALE,
                    y: velocity.y * config.SWIPE_VELOCITY_SCALE
                };
                Body.setSleeping(body, false); // スリープを解除
                Body.setVelocity(body, finalVelocity); // 速度を設定
            }
        });
    };

})(window.GThrower, window.Matter); // IIFEを実行