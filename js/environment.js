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

    // --- Renderer Setup ---
    G.setupRenderer = function(canvas) {
        if (!G.engine) { console.error('Engine not setup.'); return; }
        canvas.width = config.CANVAS_WIDTH;
        canvas.height = config.CANVAS_HEIGHT;
        G.render = Render.create({ // GThrowerオブジェクトにrenderを格納
            canvas: canvas,
            engine: G.engine,
            options: {
                width: config.CANVAS_WIDTH,
                height: config.CANVAS_HEIGHT,
                wireframes: false,
                background: config.BACKGROUND_COLOR,
                showSleeping: false
            }
        });
    };

    // --- Wall Creation ---
    G.createWalls = function() {
        if (!G.world) { console.error('World not setup.'); return; }
        const walls = [
            Bodies.rectangle(config.CANVAS_WIDTH / 2, -config.WALL_THICKNESS / 2, config.CANVAS_WIDTH, config.WALL_THICKNESS, { isStatic: true }),
            Bodies.rectangle(config.CANVAS_WIDTH / 2, config.CANVAS_HEIGHT + config.WALL_THICKNESS / 2, config.CANVAS_WIDTH, config.WALL_THICKNESS, { isStatic: true }),
            Bodies.rectangle(-config.WALL_THICKNESS / 2, config.CANVAS_HEIGHT / 2, config.WALL_THICKNESS, config.CANVAS_HEIGHT, { isStatic: true }),
            Bodies.rectangle(config.CANVAS_WIDTH + config.WALL_THICKNESS / 2, config.CANVAS_HEIGHT / 2, config.WALL_THICKNESS, config.CANVAS_HEIGHT, { isStatic: true })
        ];
        Composite.add(G.world, walls);
    };

    // --- Mouse Interaction Setup ---
    G.setupMouseInteraction = function() {
        if (!G.engine || !G.render || !G.world) { console.error('Engine, Render or World not setup.'); return; }
        G.mouse = Mouse.create(G.render.canvas); // GThrowerオブジェクトにmouseを格納
        G.mouseConstraint = MouseConstraint.create(G.engine, { // GThrowerオブジェクトにmouseConstraintを格納
            mouse: G.mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        Composite.add(G.world, G.mouseConstraint);
        G.render.mouse = G.mouse;

        // マウスダウン時のエリアチェック
        Events.on(G.mouseConstraint, 'mousedown', (event) => {
            const mousePosition = event.mouse.position;
            const dx = mousePosition.x - config.INTERACTION_CIRCLE_X;
            const dy = mousePosition.y - config.INTERACTION_CIRCLE_Y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared > config.INTERACTION_CIRCLE_RADIUS_SQ) {
                G.mouseConstraint.body = null; // 円の外なら掴ませない
            }
        });

        // ドラッグ中に円の外に出たら離す
        Events.on(G.engine, 'beforeUpdate', (event) => {
            if (G.mouseConstraint.body) {
                const mousePosition = G.mouseConstraint.mouse.position;
                const dx = mousePosition.x - config.INTERACTION_CIRCLE_X;
                const dy = mousePosition.y - config.INTERACTION_CIRCLE_Y;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared > config.INTERACTION_CIRCLE_RADIUS_SQ) {
                    G.mouseConstraint.body = null;
                    if (G.mouseConstraint.constraint) {
                       G.mouseConstraint.constraint.bodyB = null;
                    }
                }
            }
        });
    };

})(window.GThrower, window.Matter); // IIFEを実行し、グローバルオブジェクトを渡す
