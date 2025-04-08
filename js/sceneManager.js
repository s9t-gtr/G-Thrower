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
    G.startGame = function() {
        if (G.gameIsRunning) {
            console.warn("startGame called but game is already running.");
            return;
        }
        // gameCanvas 要素が存在するか確認
        if (!G.scenes.gameCanvas) {
            console.error("gameCanvas element not found in G.scenes. Cannot start game.");
            return;
        }

        console.log("Starting game sequence...");

        // Matter.jsのインスタンスを初期化
        try {
            console.log("Setting up Engine, Renderer, Walls, Mouse...");
            G.setupEngine();
            G.setupRenderer(G.scenes.gameCanvas);
            G.createWalls();
            G.setupMouseInteraction();
            console.log("Matter environment setup complete.");

            console.log("Adding obstacles and letters...");
            G.addDefaultTree();
            G.initializeLetters('E', config.NUM_INITIAL_LETTERS);
            G.setupSwipeMotion();
            console.log("Objects added and motion setup complete.");

        } catch (error) {
            console.error("Error during Matter.js setup:", error);
            return; // エラーが発生したらゲームを開始しない
        }


        // RunnerとRenderを開始
        if (!G.engine || !G.render) {
             console.error('Engine or Render failed to initialize before starting Runner/Render.');
             return;
        }
        console.log("Starting Runner and Render...");
        if (G.runner) { // 前のrunnerが残っていれば停止
             Runner.stop(G.runner);
        }
        G.runner = Runner.create();
        Runner.run(G.runner, G.engine);
        Render.run(G.render);
        console.log("Runner and Render started.");

        // 画面外オブジェクト削除のタイマーを開始
        console.log("Starting cleanup interval timer...");
        if (G.gameCleanupIntervalId) { // 前のタイマーが残っていればクリア
            clearInterval(G.gameCleanupIntervalId);
        }
        G.gameCleanupIntervalId = setInterval(() => {
            // ゲームが停止していたり、worldがなければタイマー解除
            if (!G.gameIsRunning || !G.world) {
                if (G.gameCleanupIntervalId) clearInterval(G.gameCleanupIntervalId);
                G.gameCleanupIntervalId = null;
                return;
            }
            const allBodies = Composite.allBodies(G.world);
            allBodies.forEach(body => {
                if (!body || body.isStatic || body.isSleeping) return;
                const pos = body.position;
                if(!pos) return;
                const margin = config.OBJECT_CLEANUP_MARGIN;
                if (pos.x < -margin || pos.x > config.CANVAS_WIDTH + margin ||
                    pos.y < -margin || pos.y > config.CANVAS_HEIGHT + margin) {
                    // console.log("Removing object outside bounds:", body.id); // デバッグ用
                    Composite.remove(G.world, body);
                }
            });
        }, config.OBJECT_CLEANUP_INTERVAL);

        // 操作円描画イベントリスナーを追加
        if (G.render) {
            Events.off(G.render, 'afterRender', G.drawInteractionCircle); // 念のため既存を削除
            Events.on(G.render, 'afterRender', G.drawInteractionCircle);
            console.log("Interaction circle draw listener added.");
        }

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
