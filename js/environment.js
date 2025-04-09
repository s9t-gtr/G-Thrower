// js/environment.js
window.GThrower = window.GThrower || {};

(function(G, Matter) { // IIFE: G=GThrower, Matter=Matter
    // 依存関係チェック
    if (!Matter) { console.error('Matter.js is not loaded.'); return; }
    if (!G.config) { console.error('GThrower.config is not loaded. Make sure constants.js is loaded first.'); return; }

    const config = G.config;
    // Matter.js モジュールへのエイリアス (IIFEスコープ内)
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          World = Matter.World, // World も取得
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Events = Matter.Events;

    // --- Engine & World Setup ---
    G.setupEngine = function() {
        G.engine = Engine.create({ // GThrowerオブジェクトにengineを格納
            enableSleeping: config.ENABLE_SLEEPING
        });
        G.world = G.engine.world; // GThrowerオブジェクトにworldを格納
        G.world.gravity.y = config.GRAVITY_Y;
    };

   // --- ★★★ setupRenderer 関数 (SyntaxError修正) ★★★ ---
   G.setupRenderer = function(canvas) {
    // 1. エンジンの存在チェック
    if (!G.engine) {
        console.error('Engine not setup before setupRenderer.');
        G.render = null;
        return;
    }
    // 2. 引数 canvas の有効性チェック
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        console.error(`Invalid canvas element passed to setupRenderer:`, canvas);
        G.render = null;
        return;
    }
    console.log("Canvas element received in setupRenderer:", canvas.id);

    canvas.width = config.CANVAS_WIDTH;
    canvas.height = config.CANVAS_HEIGHT;

    // 3. Render.create の実行と結果確認
    try { // ← try ブロック開始
        console.log("Attempting to create Render...");
        G.render = Render.create({
             canvas: canvas,
             engine: G.engine,
             options: {
                 width: config.CANVAS_WIDTH,
                 height: config.CANVAS_HEIGHT,
                 wireframes: false,
                 background: 'transparent', // 背景は透明
                 showSleeping: false
             }
        });

        if (G.render) {
             console.log("Render object created successfully. ID:", G.render.id);
             if (G.render.canvas && G.render.canvas instanceof HTMLCanvasElement) {
                  console.log("Render.canvas is correctly set:", G.render.canvas.id);
             } else {
                  console.error("CRITICAL: Render object created BUT render.canvas is missing or invalid!");
                  G.render = null;
             }
        } else {
             console.error("CRITICAL: Render.create did not return a render object!");
             G.render = null;
        }
    // ↓↓↓ 不足していた catch ブロックを追加 ↓↓↓
    } catch (e) {
         console.error("Error occurred during Render.create:", e);
         G.render = null; // エラー発生時は null を設定
    }
    // ↑↑↑ catch ブロック終了 ↑↑↑
};

    // --- Wall Creation ---
    G.createWalls = function() {
        if (!G.world) { console.error('World not setup.'); return; }
        const wallOptions = { isStatic: true };
        const groundOptions = {
            isStatic: true,
            friction: 0.8,
            frictionStatic: 1.2,
            restitution: 0.05,
            label: 'ground' // ★★★ このラベルが必要 ★★★
        };
        const walls = [
            Bodies.rectangle(config.CANVAS_WIDTH / 2, -config.WALL_THICKNESS / 2, config.CANVAS_WIDTH, config.WALL_THICKNESS, { isStatic: true }),
            Bodies.rectangle(config.CANVAS_WIDTH / 2, config.CANVAS_HEIGHT + config.WALL_THICKNESS / 2, config.CANVAS_WIDTH, config.WALL_THICKNESS, { isStatic: true }),
            Bodies.rectangle(-config.WALL_THICKNESS / 2, config.CANVAS_HEIGHT / 2, config.WALL_THICKNESS, config.CANVAS_HEIGHT, { isStatic: true }),
            Bodies.rectangle(config.CANVAS_WIDTH + config.WALL_THICKNESS / 2, config.CANVAS_HEIGHT / 2, config.WALL_THICKNESS, config.CANVAS_HEIGHT, { isStatic: true })
        ];
        Composite.add(G.world, walls);
    };

    // --- ★★★ マウスダウン時の処理関数 ★★★ ---
    G.handleMouseDown = (event) => {
        // G.mouseConstraint が存在しないか、イベント情報がなければ何もしない
        if (!G.mouseConstraint || !event || !event.mouse || !event.mouse.position) return;
        const mousePosition = event.mouse.position;
        const dx = mousePosition.x - config.INTERACTION_CIRCLE_X;
        const dy = mousePosition.y - config.INTERACTION_CIRCLE_Y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared > config.INTERACTION_CIRCLE_RADIUS_SQ) {
            // console.log("Mousedown outside circle - preventing grab.");
            G.mouseConstraint.body = null; // 円の外なら掴ませない
        }
    };

    // --- ★★★ ドラッグ中の処理関数 ★★★ ---
    G.handleBeforeUpdate = (event) => {
        // mouseConstraintと掴んでいるbodyが存在するか確認
        if (G.mouseConstraint && G.mouseConstraint.body && G.mouseConstraint.mouse) {
            const mousePosition = G.mouseConstraint.mouse.position;
            if (!mousePosition) return;
            const dx = mousePosition.x - config.INTERACTION_CIRCLE_X;
            const dy = mousePosition.y - config.INTERACTION_CIRCLE_Y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared > config.INTERACTION_CIRCLE_RADIUS_SQ) {
                // console.log("Mouse left interaction circle while dragging, releasing object.");
                G.mouseConstraint.body = null;
                if (G.mouseConstraint.constraint) {
                   G.mouseConstraint.constraint.bodyB = null;
                }
            }
        }
    };

    // --- Mouse Interaction Setup ---
    G.setupMouseInteraction = function() {
        if (!G.engine || !G.render || !G.world) { console.error('Engine, Render or World not setup for mouse interaction.'); return; }

        // マウスオブジェクト作成 (なければ)
        if (!G.mouse) {
            G.mouse = Mouse.create(G.render.canvas);
        }
        // マウス制約オブジェクト作成 (なければ)
        if (!G.mouseConstraint) {
            G.mouseConstraint = MouseConstraint.create(G.engine, {
                mouse: G.mouse,
                constraint: { stiffness: 0.2, render: { visible: false } }
            });
            Composite.add(G.world, G.mouseConstraint); // ワールドへの追加は初回のみ
            console.log("MouseConstraint created and added to world.");
        } else {
             console.log("MouseConstraint already exists.");
             // 既存の制約に対してマウスを再設定 (必要なら)
             G.mouseConstraint.mouse = G.mouse;
        }

        // レンダラーにマウスを関連付け (毎回行うのが安全)
        if(G.render) G.render.mouse = G.mouse;

        // --- ★★★ イベントリスナー設定 (Events.on のみ) ★★★ ---
        // stopGameでoffするので、ここでは既存のoffは不要
        if (G.mouseConstraint) {
             console.log("Adding mouse interaction listeners ('mousedown' and 'beforeUpdate')...");
             // 既存のリスナーを削除してから追加する方がより安全な場合もあるが、
             // stopGameで確実に削除する前提で、ここではonのみ行う
             Events.on(G.mouseConstraint, 'mousedown', G.handleMouseDown); // 定義した関数を使用
             Events.on(G.engine, 'beforeUpdate', G.handleBeforeUpdate);    // 定義した関数を使用
             console.log("Mouse interaction listeners added.");
        } else {
             console.error("Cannot add mouse listeners because G.mouseConstraint is not defined.");
        }
    };

})(window.GThrower, window.Matter); // IIFEを実行し、グローバルオブジェクトを渡す
