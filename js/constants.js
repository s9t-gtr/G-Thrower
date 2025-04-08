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
