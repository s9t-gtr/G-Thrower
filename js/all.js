// js/constants.js

// グローバルな GThrower オブジェクトがなければ作成
window.GThrower = window.GThrower || {};

GThrower.config = {
    // --- キャンバス・表示関連 ---
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    WALL_THICKNESS: 50,
    BACKGROUND_COLOR: '#ffffff',

    // --- 文字関連 ---
    LETTER_SCALE: 0.8,
    NUM_INITIAL_LETTERS: 1, // 初期文字数
    SWIPE_VELOCITY_SCALE: 1.8, // スワイプ速度倍率

    // --- 操作エリア関連 ---
    INTERACTION_CIRCLE_X: 100, // 円の中心 X 座標 (左下)
    INTERACTION_CIRCLE_Y: 600 - 100, // 円の中心 Y 座標 (左下) - CANVAS_HEIGHT は使わず直接計算
    INTERACTION_CIRCLE_RADIUS: 80, // 円の半径
    INTERACTION_CIRCLE_RADIUS_SQ: 80 * 80, // 半径の2乗 (計算用)

    // --- 環境・物理関連 ---
    GRAVITY_Y: 0.5,
    ENABLE_SLEEPING: true, // スリープ機能の有効化

    // --- 木関連 ---
    TRUNK_WIDTH: 20,
    TRUNK_HEIGHT_RATIO: 0.55, // キャンバス高さに対する比率
    BRANCH_THICKNESS: 12,
    TREE_COLOR: '#8B4513',
    TREE_ROOT_X_RATIO: 0.7, // キャンバス幅に対する比率

    // --- その他 ---
    OBJECT_CLEANUP_INTERVAL: 5000, // 画面外オブジェクト削除の間隔(ms)
    OBJECT_CLEANUP_MARGIN: 100 // 画面外判定のマージン
};
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
// js/main.js (修正後)
window.GThrower = window.GThrower || {};

(function(G, Matter) {
    // 依存関係の基本的なチェック (sceneManager自体もチェック)
    if (!Matter || !G.config || !G.initScenes ) { // G.initScenes が存在するかチェック
        console.error('GThrower or required functions/config/Matter.js or sceneManager.js are not loaded correctly.');
        return;
    }

    // --- DOM Ready 処理 ---
    // DOM要素が利用可能になってからシーンの初期化を実行
    document.addEventListener('DOMContentLoaded', function() {
        // Scene Manager の初期化を実行 (これによりイベントリスナー等が設定され、最初のシーンが表示される)
        G.initScenes();
    }); // DOMContentLoaded の終わり

})(window.GThrower, window.Matter); // IIFEを実行// js/obstacle.js
window.GThrower = window.GThrower || {};

(function(G, Matter) { // IIFE: G=GThrower, Matter=Matter
    // 依存関係チェック
    if (!Matter) { console.error('Matter.js is not loaded.'); return; }
    if (!G.config) { console.error('GThrower.config is not loaded.'); return; }

    const config = G.config;
    const Body = Matter.Body;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;

    // 木を作成する内部関数 (グローバルには公開しない)
    function createBareTree(rootX, rootY) {
        const trunkHeight = config.CANVAS_HEIGHT * config.TRUNK_HEIGHT_RATIO;
        const treeRenderStyle = { fillStyle: config.TREE_COLOR };

        const trunk = Bodies.rectangle(0, 0, config.TRUNK_WIDTH, trunkHeight, { render: treeRenderStyle });
        const branch1Length = 75;
        const branch1 = Bodies.rectangle(config.TRUNK_WIDTH * 0.4 + branch1Length * 0.2, -trunkHeight * 0.15, branch1Length, config.BRANCH_THICKNESS, { angle: -Math.PI / 5.5, render: treeRenderStyle });
        const branch2Length = 85;
        const branch2 = Bodies.rectangle(-config.TRUNK_WIDTH * 0.4 - branch2Length * 0.2, -trunkHeight * 0.4, branch2Length, config.BRANCH_THICKNESS, { angle: Math.PI / 6, render: treeRenderStyle });
        const branch3Length = 65;
        const branch3 = Bodies.rectangle(config.TRUNK_WIDTH * 0.3 + branch3Length * 0.3, -trunkHeight * 0.7, branch3Length, config.BRANCH_THICKNESS, { angle: -Math.PI / 4, render: treeRenderStyle });
        const branch4Length = 60;
        const branch4 = Bodies.rectangle(-config.TRUNK_WIDTH * 0.3 - branch4Length * 0.3, -trunkHeight * 0.88, branch4Length, config.BRANCH_THICKNESS, { angle: Math.PI / 3.8, render: treeRenderStyle });

        const tree = Body.create({
            parts: [trunk, branch1, branch2, branch3, branch4],
            isStatic: true
        });
        Body.setPosition(tree, { x: rootX, y: rootY - trunkHeight / 2 });
        return tree;
    }

    // デフォルトの木を追加する関数を GThrower オブジェクトに追加
    G.addDefaultTree = function() {
        if (!G.world) { console.error('World not setup.'); return; }
        const treeRootX = config.CANVAS_WIDTH * config.TREE_ROOT_X_RATIO;
        const treeRootY = config.CANVAS_HEIGHT;
        const bareTree = createBareTree(treeRootX, treeRootY);
        Composite.add(G.world, bareTree);
    };

})(window.GThrower, window.Matter); // IIFEを実行
// js/sceneManager.js
window.GThrower = window.GThrower || {};

(function(G, Matter) {
    // 依存関係チェック (より詳細なエラーメッセージ)
    if (!Matter) { console.error('Error: Matter.js library is not loaded before sceneManager.js.'); return; }
    if (!G.config) { console.error('Error: GThrower.config is not loaded. Ensure constants.js is loaded before sceneManager.js.'); return; }
    if (!G.setupEngine || !G.setupRenderer || !G.createWalls || !G.setupMouseInteraction) { console.error('Error: Environment functions (setupEngine, etc.) not found. Ensure environment.js is loaded before sceneManager.js.'); return; }
    if (!G.addDefaultTree) { console.error('Error: Obstacle function (addDefaultTree) not found. Ensure obstacle.js is loaded before sceneManager.js.'); return; }
    if (!G.initializeLetters || !G.setupSwipeMotion) { console.error('Error: Letter functions (initializeLetters, etc.) not found. Ensure letter.js is loaded before sceneManager.js.'); return; }

    console.log("sceneManager.js: Dependencies checked."); // 依存関係チェック通過ログ

    const config = G.config;
    const { Engine, Render, Runner, Events, Composite, Body } = Matter;

    // --- Scene Management ---
    G.scenes = {};
    G.currentScene = null;
    G.gameCleanupIntervalId = null;
    G.gameIsRunning = false;
    G.runner = null; // Matter.js Runner instance

    // シーンを切り替える関数
    G.changeScene = function(newSceneId) {
        console.log(`Attempting to change scene to: ${newSceneId}`);

        // 現在のシーンを非表示にする & 終了処理
        if (G.currentScene && G.scenes[G.currentScene]) {
            console.log(`Hiding current scene: ${G.currentScene}`);
            G.scenes[G.currentScene].classList.remove('active');
            // ゲーム画面から離れる場合はゲームを停止
            if (G.currentScene === 'game') {
                G.stopGame();
            }
        } else if (G.currentScene) {
            console.warn(`Current scene "${G.currentScene}" element not found in G.scenes during hide.`);
        }

        // 新しいシーンを表示する & 初期化処理
        // G.scenes[newSceneId] が存在するかどうかをチェック
        if (G.scenes[newSceneId]) {
            console.log(`Showing new scene: ${newSceneId}`);
            G.scenes[newSceneId].classList.add('active');
            G.currentScene = newSceneId; // 現在のシーンを更新

            // ゲーム画面に入る場合はゲームを開始
            if (newSceneId === 'game') {
                G.startGame(); // ゲームの開始処理を呼び出す
            }
            // 他のシーンの初期化処理が必要ならここに追加
            // else if (newSceneId === 'stageSelect') { /* ステージ選択固有の初期化 */ }
            // else if (newSceneId === 'clear') { /* クリア画面固有の初期化 */ }

        } else {
            // エラーメッセージをより具体的に
            console.error(`Failed to change scene: Scene element for id "${newSceneId}" not found in G.scenes object.`);
            // デバッグ用に現在の G.scenes の内容を出力
            console.error('Current G.scenes object:', JSON.stringify(G.scenes)); // DOM要素は表示できないが、キーの存在はわかる
        }
    };

    // --- Game Start/Stop Logic ---
    // --- Game Start/Stop Logic ---
    G.startGame = function() {
        if (G.gameIsRunning) {
            console.warn("startGame called but game is already running.");
            return;
        }
        if (!G.scenes.gameCanvas) {
            console.error("gameCanvas element not found in G.scenes. Cannot start game.");
            return;
        }
        console.log("Starting game sequence...");
        try {
            console.log("Setting up Engine, Renderer, Walls, Mouse...");
            G.setupEngine();
            G.setupRenderer(G.scenes.gameCanvas);
            if (!G.render) {
                throw new Error("G.setupRenderer failed to set G.render.");
            }
            G.createWalls();
            G.setupMouseInteraction();
            console.log("Matter environment setup complete.");

            console.log("Adding obstacles and letters...");
            G.addDefaultTree();
            G.initializeLetters('G', config.NUM_INITIAL_LETTERS); // 文字は'G'のまま
            G.setupSwipeMotion();
            console.log("Objects added and motion setup complete.");

        } catch (error) {
            console.error("Error during Matter.js setup:", error);
            return;
        }

        if (!G.engine) {
             console.error('Engine failed to initialize before starting Runner.');
             return;
        }
        console.log("Starting Runner and Render...");
        if (G.runner) { Runner.stop(G.runner); }
        G.runner = Runner.create();
        Runner.run(G.runner, G.engine);
        Render.run(G.render);
        console.log("Runner and Render started.");

        console.log("Starting cleanup interval timer...");
        if (G.gameCleanupIntervalId) { clearInterval(G.gameCleanupIntervalId); }
        G.gameCleanupIntervalId = setInterval(() => { /* ... cleanup logic ... */ }, config.OBJECT_CLEANUP_INTERVAL);


        // --- ★★★ イベントリスナー設定部分の修正 ★★★ ---
        console.log("Checking G.render before setting up 'afterRender' listener:", G.render);
        if (G.render && typeof G.render === 'object' && G.render.canvas) {
            try {
                // ★★★ Events.off を一時的にコメントアウト ★★★
                // console.log("Attempting Events.off for 'afterRender' on render object:", G.render.id);
                // Events.off(G.render, 'afterRender', G.drawInteractionCircle); // ← コメントアウト
                // console.log("Events.off call skipped for debugging."); // ログ変更

                // 新しく追加 (または常に上書き)
                console.log("Attempting Events.on for 'afterRender' on render object:", G.render.id);
                // Events.on は既存のリスナーがあっても問題ない場合が多い
                Events.on(G.render, 'afterRender', G.drawInteractionCircle);
                console.log("Events.on successful. Interaction circle draw listener added.");

            } catch (e) {
                console.error("Error during Events.on for 'afterRender':", e);
                console.error("G.render object at the time of error:", G.render);
            }
        } else {
            console.error("G.render is unexpectedly undefined or null before setting 'afterRender' listener.");
            console.error("Current value of G.render:", G.render);
        }
        // --- ★★★ 修正ここまで ★★★

        G.gameIsRunning = true;
        console.log("Game started successfully.");
    };

    G.stopGame = function() {
        if (!G.gameIsRunning) {
            // console.log("stopGame called but game is not running."); // 頻繁に出る可能性があるのでコメントアウト
            return;
        }
        console.log("Stopping game sequence...");

        // RunnerとRenderを停止
        try {
            if (G.runner) {
                Runner.stop(G.runner);
                console.log("Runner stopped.");
                G.runner = null;
            }
            if (G.render) {
                Events.off(G.render, 'afterRender', G.drawInteractionCircle);
                Render.stop(G.render);
                console.log("Render stopped.");
                if (G.render.context) {
                     G.render.context.clearRect(0, 0, G.render.canvas.width, G.render.canvas.height);
                }
                G.render = null;
            }
        } catch (error) {
            console.error("Error stopping Runner or Render:", error);
        }

        // 画面外オブジェクト削除のタイマーを停止
        if (G.gameCleanupIntervalId) {
            clearInterval(G.gameCleanupIntervalId);
            G.gameCleanupIntervalId = null;
            console.log("Cleanup interval timer stopped.");
        }

        // ワールドの内容をクリアし、エンジンをクリア
        try {
            if (G.world) {
                Composite.clear(G.world, false);
                G.world = null;
                console.log("World cleared.");
            }
            if (G.engine) {
                Engine.clear(G.engine);
                G.engine = null;
                console.log("Engine cleared.");
            }
        } catch (error) {
             console.error("Error clearing World or Engine:", error);
        }

        // マウス関連の参照クリア
        G.mouse = null;
        G.mouseConstraint = null;

        G.gameIsRunning = false;
        console.log("Game stopped successfully.");
    };

    // 操作円を描画する関数
    G.drawInteractionCircle = function() {
        if (!G.render || !G.render.context) return; // Render停止後に呼ばれる可能性があるのでチェック
        const ctx = G.render.context;
        ctx.beginPath();
        ctx.arc(config.INTERACTION_CIRCLE_X, config.INTERACTION_CIRCLE_Y, config.INTERACTION_CIRCLE_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
    };


    // --- Scene Initialization ---
    G.initScenes = function() {
        console.log("Initializing scenes...");
        // 各要素を確実に取得できているか確認
        G.scenes.title = document.getElementById('title-screen');
        G.scenes.stageSelect = document.getElementById('stage-select-screen');
        G.scenes.game = document.getElementById('game-container'); // キー名は 'game'
        G.scenes.gameCanvas = document.getElementById('gameCanvas'); // Canvas要素
        G.scenes.clear = document.getElementById('clear-screen');

        // 取得できなかった要素がないかチェック
        let missingElement = false;
        // チェックするキー名を明示的にリスト化
        const sceneKeys = ['title', 'stageSelect', 'game', 'gameCanvas', 'clear'];
        sceneKeys.forEach(key => {
            if (!G.scenes[key]) {
                 // エラーメッセージで期待されるIDも表示
                 let expectedId = '';
                 if (key === 'game') expectedId = 'game-container';
                 else if (key === 'gameCanvas') expectedId = 'gameCanvas';
                 else expectedId = key + '-screen'; // title-screen, stageSelect-screen, clear-screen
                 console.error(`HTML element for scene key "${key}" (expected id: "${expectedId}") not found!`);
                missingElement = true;
            }
        });

        if (missingElement) {
             console.error("Aborting scene initialization due to missing HTML elements. Please check your index.html file.");
             return; // 要素が足りない場合は初期化を中断
        }

        console.log("All required scene elements found in HTML.");


        // --- Event Listeners ---
        try {
            console.log("Setting up event listeners...");
            // Title Screen
            const startButton = document.getElementById('start-button');
            if (startButton) {
                startButton.addEventListener('click', () => G.changeScene('stageSelect')); // 遷移先は 'stageSelect'
            } else { console.error("Start button (id: start-button) not found"); }

            // Stage Select Screen
            const stage1Button = document.getElementById('stage-1-button');
            if (stage1Button) {
                stage1Button.addEventListener('click', () => G.changeScene('game')); // 遷移先は 'game'
            } else { console.error("Stage 1 button (id: stage-1-button) not found"); }
            
            const backToTitleButton = document.getElementById('back-to-title-button');
            if (backToTitleButton) {
                backToTitleButton.addEventListener('click', () => G.changeScene('title')); // クリックでタイトル画面へ
            } else { console.error("Back to title button (id: back-to-title-button) not found"); }

            // Game Screen (仮のクリアボタン)
            const clearTriggerButton = document.getElementById('clear-trigger-button');
            if (clearTriggerButton) {
                clearTriggerButton.addEventListener('click', () => G.changeScene('clear')); // 遷移先は 'clear'
            } else { console.error("Clear trigger button (id: clear-trigger-button) not found"); }

            // Clear Screen
            const backToSelectButton = document.getElementById('back-to-select-button');
            if (backToSelectButton) {
                backToSelectButton.addEventListener('click', () => G.changeScene('stageSelect')); // 遷移先は 'stageSelect'
            } else { console.error("Back to select button (id: back-to-select-button) not found"); }
            console.log("Event listeners setup complete.");

        } catch (error) {
            console.error("Error setting up event listeners:", error);
            return; // イベントリスナー設定でエラーがあれば中断
        }


        // --- Initial Scene ---
        console.log("Setting initial scene to 'title'.");
        // 初期表示する画面を設定 ('title' から開始)
        G.changeScene('title'); // ここで最初の画面表示が行われる
        console.log("Scene initialization complete.");
    };

})(window.GThrower, window.Matter);
