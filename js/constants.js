// js/constants.js

// グローバルな GThrower オブジェクトがなければ作成
window.GThrower = window.GThrower || {};

// --- 新しいキャンバスサイズを定義 ---
const newCanvasWidth = 1280;  // 16:9 の幅 (例)
const newCanvasHeight = 720; // 16:9 の高さ (例)

GThrower.config = {
    // --- キャンバス・表示関連 ---
    // ↓↓↓ サイズを変更 ↓↓↓
    CANVAS_WIDTH: newCanvasWidth,
    CANVAS_HEIGHT: newCanvasHeight,
    // ↑↑↑ 変更ここまで ↑↑↑
    WALL_THICKNESS: 50,
    // ↓↓↓ 背景設定に合わせて更新 (レンダラーが透明なので不要かも) ↓↓↓
    BACKGROUND_COLOR: 'transparent', // '#ffffff' から変更
    // ↑↑↑ 変更ここまで ↑↑↑

    // --- 文字関連 ---
    LETTER_SCALE: 0.8,
    NUM_INITIAL_LETTERS: 1,
    SWIPE_VELOCITY_SCALE: 1.8,

    // --- 操作エリア関連 ---
    INTERACTION_CIRCLE_X: 100,
    // ↓↓↓ Y座標はオブジェクト定義後に計算するため、一旦仮の値（またはコメントアウト）↓↓↓
    INTERACTION_CIRCLE_Y: 0, // 仮の値 (後で下の行で上書きします)
    // INTERACTION_CIRCLE_Y: 600 - 100, // ← 元の行
    // ↑↑↑ 変更ここまで ↑↑↑
    INTERACTION_CIRCLE_RADIUS: 80,
    INTERACTION_CIRCLE_RADIUS_SQ: 80 * 80,

    // --- 環境・物理関連 ---
    GRAVITY_Y: 0.5, // 例: 0.3 から 0.6 に変更 (値を大きくすると重力が強くなる)
    ENABLE_SLEEPING: true,

    // --- 木関連 (現在は使用されていないためコメントアウトまたは削除推奨) ---
    /*
    TRUNK_WIDTH: 20,
    TRUNK_HEIGHT_RATIO: 0.55,
    BRANCH_THICKNESS: 12,
    TREE_COLOR: '#8B4513',
    TREE_ROOT_X_RATIO: 0.7,
    */

    // --- その他 ---
    OBJECT_CLEANUP_INTERVAL: 5000,
    OBJECT_CLEANUP_MARGIN: 100,

    // --- ピン関連のデフォルト値 (参考として追加) ---
    // sceneManager.js で addSinglePin を呼び出す際に使われる値
    PIN_DEFAULT_RADIUS: 10,
    PIN_DEFAULT_X: newCanvasWidth * 0.8,
    PIN_DEFAULT_Y: newCanvasHeight * 0.4
};

// --- オブジェクト定義後に、CANVAS_HEIGHTに依存する値を計算して設定 ---
// GThrower.config オブジェクト内で自身のプロパティを参照できないため、ここで計算します。
GThrower.config.INTERACTION_CIRCLE_Y = GThrower.config.CANVAS_HEIGHT - 100;

// --- 確認用ログ (任意) ---
// console.log("Constants loaded. Interaction Circle Y:", GThrower.config.INTERACTION_CIRCLE_Y);
