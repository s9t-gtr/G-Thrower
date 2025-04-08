// constants.js

// --- キャンバス・表示関連 ---
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const WALL_THICKNESS = 50;
export const BACKGROUND_COLOR = '#ffffff';

// --- 文字関連 ---
export const LETTER_SCALE = 0.8;
export const NUM_INITIAL_LETTERS = 1; // 初期文字数
export const SWIPE_VELOCITY_SCALE = 1.8; // スワイプ速度倍率

// --- 操作エリア関連 ---
export const INTERACTION_CIRCLE_X = 100; // 円の中心 X 座標 (左下)
export const INTERACTION_CIRCLE_Y = CANVAS_HEIGHT - 100; // 円の中心 Y 座標 (左下)
export const INTERACTION_CIRCLE_RADIUS = 80; // 円の半径
export const INTERACTION_CIRCLE_RADIUS_SQ = INTERACTION_CIRCLE_RADIUS * INTERACTION_CIRCLE_RADIUS; // 半径の2乗 (計算用)

// --- 環境・物理関連 ---
export const GRAVITY_Y = 0.3;
export const ENABLE_SLEEPING = true; // スリープ機能の有効化

// --- 木関連 ---
export const TRUNK_WIDTH = 20;
export const TRUNK_HEIGHT_RATIO = 0.55; // キャンバス高さに対する比率
export const BRANCH_THICKNESS = 12;
export const TREE_COLOR = '#8B4513';
export const TREE_ROOT_X_RATIO = 0.7; // キャンバス幅に対する比率

// --- その他 ---
export const OBJECT_CLEANUP_INTERVAL = 5000; // 画面外オブジェクト削除の間隔(ms)
export const OBJECT_CLEANUP_MARGIN = 100; // 画面外判定のマージン
