// js/sceneManager.js
window.GThrower = window.GThrower || {};

(function(G, Matter) {
    // 依存関係チェック (より詳細なエラーメッセージ)
    if (!Matter) { console.error('Error: Matter.js library is not loaded before sceneManager.js.'); return; }
    if (!G.config) { console.error('Error: GThrower.config is not loaded. Ensure constants.js is loaded before sceneManager.js.'); return; }
    if (!G.setupEngine || !G.setupRenderer || !G.createWalls || !G.setupMouseInteraction) { console.error('Error: Environment functions (setupEngine, etc.) not found. Ensure environment.js is loaded before sceneManager.js.'); return; }
    // if (!G.addDefaultTree) { console.error('Error: Obstacle function (addDefaultTree) not found. Ensure obstacle.js is loaded before sceneManager.js.'); return; }
    if (!G.initializeLetters || !G.setupSwipeMotion) { console.error('Error: Letter functions (initializeLetters, etc.) not found. Ensure letter.js is loaded before sceneManager.js.'); return; }

    console.log("sceneManager.js: Dependencies checked."); // 依存関係チェック通過ログ

    const config = G.config;
    const { Engine, Render, Runner, Events, Composite, Body } = Matter;

    // --- Scene Management & Game State ---
    G.scenes = {};
    G.currentScene = null;
    G.gameCleanupIntervalId = null;
    G.gameIsRunning = false;
    G.runner = null;
    G.activeLetters = [];
    G.isGameCleared = false;
    // G.pinContactInfo = ...; // ← 削除
    G.pinBodies = []; // ★★★ ピンのボディ参照を保持する配列 ★★★
    G.nearPinStartTime = null; // ★★★ ピンの近くにいる開始時刻 ★★★


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

// --- ★★★ 近接判定用関数 (afterUpdateイベントハンドラ) ★★★ ---
G.handleAfterUpdate = function(event) {
    // クリア済み、ゲーム中でない、文字Gやピン、エンジンがない場合は処理中断
    if (G.isGameCleared || !G.gameIsRunning || !G.activeLetters || G.activeLetters.length === 0 || !G.pinBodies || G.pinBodies.length === 0 || !G.engine || !G.engine.timing) { // G.engine と G.engine.timing の存在もチェック
        if (G.nearPinStartTime !== null) {
                // console.log("Resetting near pin timer (pre-checks failed)."); // デバッグ用
                G.nearPinStartTime = null;
        }
        return;
    }

    const letterBody = G.activeLetters[0];
    if (!letterBody || !letterBody.position) return; // 念のためチェック

    let isNearAnyPin = false;
    const letterRadius = (38 * config.LETTER_SCALE); // 文字のおおよその半径
    const pinRadius = 7; // obstacle.js で定義したピンの半径 (本当は config にあるべき)
    const proximityMargin = 10; // 「近く」と判定する追加のマージン (ピクセル)
    const distanceThreshold = letterRadius + pinRadius + proximityMargin;
    const distanceThresholdSq = distanceThreshold * distanceThreshold; // 比較用の2乗値

    // --- 1. 床に接触していないかチェック ---
    const floorSurfaceY = config.CANVAS_HEIGHT - (config.WALL_THICKNESS / 2);
    const bodyBottomY = letterBody.position.y + letterRadius * 1.1; // 下端を推定 (マージン込)
    const clearFloorThreshold = floorSurfaceY - 5; // 床の少し上
    const isAboveFloor = bodyBottomY < clearFloorThreshold;

    if (!isAboveFloor) {
         // 床に触れている場合はタイマーリセット
         if (G.nearPinStartTime !== null) {
              console.log("[Clear Check] Resetting near pin timer (Touching floor).");
              G.nearPinStartTime = null;
         }
         return; // クリア判定に進まない
    }

    // --- 2. ピンとの近接判定 ---
    let nearestPinDistSq = Infinity; // 最も近いピンとの距離の2乗
    let nearPinId = null;            // 最も近いピンのID

    for (let i = 0; i < G.pinBodies.length; i++) {
        const pinBody = G.pinBodies[i];
        if (!pinBody || !pinBody.position) continue;

        const dx = letterBody.position.x - pinBody.position.x;
        const dy = letterBody.position.y - pinBody.position.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < distanceThresholdSq) {
            isNearAnyPin = true;
            if (distSq < nearestPinDistSq) { // 最も近いピンを更新
                nearestPinDistSq = distSq;
                nearPinId = pinBody.id;
            }
            // ★★★ デバッグログ ★★★
            // 頻繁に出力されるため、必要に応じてコメント解除
            // console.log(`[Debug] Letter G is near Pin ${i} (ID: ${pinBody.id}). DistSq: ${distSq.toFixed(0)}`);
        }
    }

    // デバッグ用に最も近いピン情報を出力（近くにいる場合のみ）
    if (isNearAnyPin) {
        console.log(`[Clear Check] Letter G is near Pin ID: ${nearPinId}. Measuring time...`);
    }


    // --- 3. 時間計測とクリア判定 ---
    if (isNearAnyPin) {
        // ピンの近くにいる状態が始まった場合
        if (G.nearPinStartTime === null) {
            console.log("[Clear Check] Letter G entered near pin zone. Starting timer.");
            // ↓↓↓ Matter.Engine.now を G.engine.timing.timestamp に変更 ↓↓↓
            G.nearPinStartTime = G.engine.timing.timestamp; // ★修正★
            console.log(`   -> Start time set to: ${G.nearPinStartTime.toFixed(0)}`);
        } else {
            // ピンの近くにいる状態が継続している場合
            const currentTime = G.engine.timing.timestamp;
            const elapsedTime = currentTime - G.nearPinStartTime;
            const requiredTime = 3000; // 3秒 (ミリ秒)

             // console.log(`[Debug] Elapsed near pin time: ${elapsedTime.toFixed(0)}ms`);

            if (elapsedTime >= requiredTime) {
                console.log(`[Clear Check] Clear condition met: Near pin for >= ${requiredTime}ms!`);
                G.isGameCleared = true;
                G.nearPinStartTime = null; // タイマーリセット

                // クリア画面へ遷移
                setTimeout(() => {
                    if(G.currentScene === 'game' && G.isGameCleared) {
                       console.log("Changing scene to 'clear'.");
                       G.changeScene('clear');
                    }
                }, 300); // 少し遅延
            }
        }
    } else {
        // ピンの近くにいない場合はタイマーリセット
        if (G.nearPinStartTime !== null) {
            console.log("[Clear Check] Letter G left near pin zone. Resetting timer.");
            G.nearPinStartTime = null;
        }
    }
};
// ★★★ ハンドラ定義ここまで ★★★

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
        G.isGameCleared = false; // フラグリセット
        G.pinBodies = []; // ★★★ ピン配列初期化 ★★★
        G.nearPinStartTime = null; // ★★★ タイマー初期化 ★★★

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

            // ★★★ ステージ背景クラスを設定 ★★★
            if (G.scenes.game) { // #game-container 要素
                const currentStage = 1; // 現在はステージ1固定
                // 既存のステージクラスがあれば削除 (安全のため)
                const existingClasses = G.scenes.game.className.match(/stage-\d+-background/g);
                if (existingClasses) {
                    G.scenes.game.classList.remove(...existingClasses);
                }
                // 新しいステージクラスを追加
                const stageClassName = `stage-${currentStage}-background`;
                G.scenes.game.classList.add(stageClassName);
                console.log(`Applied background class: ${stageClassName}`);
            } else {
                console.error("Game container element not found for setting background.");
            }

            console.log("Adding obstacles and letters...");
            if (G.engine) {
                // Collision リスナー削除 (不要)
                Events.off(G.engine, 'collisionStart');
                Events.off(G.engine, 'collisionActive');
                Events.off(G.engine, 'collisionEnd');
                // afterUpdate リスナー登録/更新
                Events.off(G.engine, 'afterUpdate', G.handleAfterUpdate); // 既存削除(念のため)
                Events.on(G.engine, 'afterUpdate', G.handleAfterUpdate);
                console.log("afterUpdate listener added for clear check.");
           } else {
                console.error("Cannot add afterUpdate listener because G.engine is not defined!");
           }
           console.log("Adding obstacles and letters...");
            // 配置したい座標と半径を指定 (例: 画面右側の中央やや上)
            const pinX = 629; // ★★★ 指定された X 座標 ★★★
            const pinY = 437; // ★★★ 指定された Y 座標 ★★★
            const pinRadius = 6; // 半径を少し大きくする例

            // 新しい関数を呼び出し、戻り値を受け取る
            const createdPin = G.addSinglePin(pinX, pinY, pinRadius);

            // 戻り値が有効なら G.pinBodies 配列に格納
            if (createdPin) {
                G.pinBodies = [createdPin]; // ★★★ 配列に単一のピンを入れる ★★★
                console.log(`Stored reference to the single pin (ID: ${createdPin.id}) at (${pinX}, ${pinY}).`);
            } else {
                G.pinBodies = []; // ピン作成失敗時は空にする
                console.warn("Failed to create the single pin.");
            }
           // ↑↑↑ 変更ここまで ↑↑↑
           G.initializeLetters('G', config.NUM_INITIAL_LETTERS);
           G.setupSwipeMotion();
           console.log("Objects added and motion setup complete.");

       } catch (error) { console.error("Error during Matter.js setup:", error); return; }

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
            return;
        }
        console.log("Stopping game sequence...");
        G.gameIsRunning = false;

        // Runner停止
        try { if (G.runner) Runner.stop(G.runner); } catch (e) { console.error("Error stopping Runner:", e); } finally { G.runner = null; }

        if (G.scenes.game) {
            const existingClasses = G.scenes.game.className.match(/stage-\d+-background/g);
            if (existingClasses) {
                 G.scenes.game.classList.remove(...existingClasses);
                 console.log("Removed stage background classes.");
            }
       }

        // Render停止とリスナー削除
        try {
            if (G.engine) {
                Events.off(G.engine, 'afterUpdate', G.handleAfterUpdate); // afterUpdate を解除
                console.log("afterUpdate listener removed.");
            }
       } catch (e) { console.error("Error removing collision listeners:", e); }

        // タイマー停止
        if (G.gameCleanupIntervalId) clearInterval(G.gameCleanupIntervalId); G.gameCleanupIntervalId = null;

        // --- ★★★ マウス操作関連のリスナー削除を追加 ★★★ ---
        try {
             // mouseConstraint に紐づく mousedown リスナーを削除
             if (G.mouseConstraint && typeof G.handleMouseDown === 'function') { // G.handleMouseDown が存在するか確認
                  Events.off(G.mouseConstraint, 'mousedown', G.handleMouseDown); // 定義した関数を指定
                  console.log("Mousedown listener removed.");
             }
             // engine に紐づく beforeUpdate リスナーを削除
             if (G.engine && typeof G.handleBeforeUpdate === 'function') { // G.handleBeforeUpdate が存在するか確認
                  Events.off(G.engine, 'beforeUpdate', G.handleBeforeUpdate); // 定義した関数を指定
                  console.log("BeforeUpdate listener removed.");
             }
        } catch (e) {
             console.error("Error removing mouse/engine listeners:", e);
        }
        try {
            if (G.engine) {
                 Events.off(G.engine, 'sleepStart', G.handleSleepStart);
                 console.log("sleepStart listener removed.");
            }
       } catch (e) { console.error("Error removing sleepStart listener:", e); }

       G.pinBodies = []; // ピンの参照をクリア
       G.nearPinStartTime = null; // タイマーをリセット
       console.log("Pin references and near timer reset.");

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

    // initializeLetters が既存削除と新規追加を行うので、それを呼び出すだけ
    G.resetLetter = function() {
        // ゲームが実行中でなければリセットしない (必要なら条件変更)
        if (!G.gameIsRunning || !G.world) {
             console.log("Cannot reset letter: Game not running or world not ready.");
             return;
        }
        console.log("R key pressed - Resetting letter...");
        // 'G' を1つ再生成 (既存削除もこの中で行われる)
        G.initializeLetters('G', config.NUM_INITIAL_LETTERS);
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


            // Clear Screen
            const backToSelectButton = document.getElementById('back-to-select-button');
            if (backToSelectButton) {
                backToSelectButton.addEventListener('click', () => G.changeScene('stageSelect')); // 遷移先は 'stageSelect'
            } else { console.error("Back to select button (id: back-to-select-button) not found"); }
            console.log("Event listeners setup complete.");

            console.log("Setting up keyboard listener for 'R' key...");
            window.addEventListener('keydown', function(event) {
                // 'R' または 'r' キーが押された場合 かつ ゲーム画面が表示中の場合
                if (G.currentScene === 'game' && event.key.toLowerCase() === 'g') {
                    // 他の修飾キー（Shift, Ctrl, Alt）が押されていないことも確認（オプション）
                    if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                        console.log("Detected 'R' key press in game scene.");
                        G.resetLetter(); // リセット関数を呼び出す
                    }
                }
                // 他のキー入力処理が必要ならここに追加
            });
            console.log("Keyboard listener setup complete.");

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
