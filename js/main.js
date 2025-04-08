// js/main.js (修正後)
window.GThrower = window.GThrower || {};

(function(G, Matter) { // IIFE: G=GThrower, Matter=Matter
    // 必要な機能が GThrower オブジェクトに存在するか基本的なチェック
    if (!Matter || !G.config || !G.setupEngine || !G.setupRenderer || !G.createWalls || !G.setupMouseInteraction || !G.addDefaultTree || !G.initializeLetters || !G.setupSwipeMotion) {
        console.error('GThrower or required functions/config/Matter.js are not loaded correctly. Check script loading order and content in index.html.');
        return;
    }

    // Matter.js モジュールへのエイリアス (main.js スコープ内)
    const Runner = Matter.Runner;
    const Events = Matter.Events;
    const Composite = Matter.Composite;
    const Body = Matter.Body;
    const Render = Matter.Render; // ★★★ この行を追加 ★★★
    // GThrower オブジェクトから設定を取得
    const config = G.config;

    // --- 初期化処理 (DOM Ready 後に実行) ---
    document.addEventListener('DOMContentLoaded', function() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('Canvas element with id "gameCanvas" not found.');
            return;
        }

        // 1. 環境設定 (Engine, Renderer, Walls, Mouse Interaction)
        G.setupEngine();
        G.setupRenderer(canvas);
        G.createWalls();
        G.setupMouseInteraction();

        // 2. 障害物配置
        G.addDefaultTree();

        // 3. 対象物配置とモーション設定
        G.initializeLetters('E', config.NUM_INITIAL_LETTERS);
        G.setupSwipeMotion();

        // --- 実行 ---
        if (!G.engine || !G.render) {
            console.error('Engine or Render not initialized correctly by setup functions.');
            return;
        }
        const runner = Runner.create();
        Runner.run(runner, G.engine);
        Render.run(G.render); // ここで Render が参照できるようになる

        // --- 追加機能 ---

        // 操作可能エリアの円を描画
        Events.on(G.render, 'afterRender', () => {
             // G.render が存在し、context プロパティを持つか確認
            if (!G.render || !G.render.context) return;
            const ctx = G.render.context;
            ctx.beginPath();
            ctx.arc(config.INTERACTION_CIRCLE_X, config.INTERACTION_CIRCLE_Y, config.INTERACTION_CIRCLE_RADIUS, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // 画面外のオブジェクトを定期的に削除
        setInterval(() => {
            if (!G.world) return; // world が利用可能か確認
            const allBodies = Composite.allBodies(G.world);
            allBodies.forEach(body => {
                // 静的オブジェクトとスリープ中のオブジェクトは削除しない
                if (body.isStatic || body.isSleeping) return;

                const pos = body.position;
                const margin = config.OBJECT_CLEANUP_MARGIN;
                if (pos.x < -margin || pos.x > config.CANVAS_WIDTH + margin ||
                    pos.y < -margin || pos.y > config.CANVAS_HEIGHT + margin) {
                    Composite.remove(G.world, body);
                }
            });
        }, config.OBJECT_CLEANUP_INTERVAL);

    }); // DOMContentLoaded イベントリスナーの終わり

})(window.GThrower, window.Matter); // IIFEを実行
