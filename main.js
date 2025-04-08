// main.js
import { Engine, Render, Runner, Composite, Events } from './matter-alias.js'; // エイリアスファイルをインポート
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, INTERACTION_CIRCLE_X, INTERACTION_CIRCLE_Y,
    INTERACTION_CIRCLE_RADIUS, NUM_INITIAL_LETTERS,
    OBJECT_CLEANUP_INTERVAL, OBJECT_CLEANUP_MARGIN
} from './constants.js';
import { setupEngine, setupRenderer, createWalls, setupMouseInteraction } from './environment.js';
import { addDefaultTree } from './obstacle.js';
import { initializeLetters, setupSwipeMotion } from './letter.js';

// --- 初期化 ---
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    throw new Error('Canvas element with id "gameCanvas" not found.');
}

// 1. 環境設定 (エンジン、レンダラー、壁、マウス操作)
const { engine, world } = setupEngine();
const render = setupRenderer(canvas, engine);
createWalls(world);
const mouseConstraint = setupMouseInteraction(engine, render, world); // mouseConstraint を受け取る

// 2. 障害物配置 (木)
addDefaultTree(world, Composite); // Composite を渡す必要あり

// 3. 対象物配置 (文字 'E') とモーション設定
initializeLetters(world, 'E', NUM_INITIAL_LETTERS, INTERACTION_CIRCLE_X, INTERACTION_CIRCLE_Y);
setupSwipeMotion(mouseConstraint, mouseConstraint.mouse); // mouseConstraint と mouse を渡す

// --- 実行 ---
const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);

// --- 追加機能 ---

// 操作可能エリアの円を描画
Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    ctx.beginPath();
    ctx.arc(INTERACTION_CIRCLE_X, INTERACTION_CIRCLE_Y, INTERACTION_CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
});

// 画面外のオブジェクトを定期的に削除
setInterval(() => {
    const allBodies = Composite.allBodies(world);
    allBodies.forEach(body => {
        // 静的オブジェクトとスリープ中のオブジェクトは削除しない
        if (body.isStatic || body.isSleeping) return;

        const pos = body.position;
        if (pos.x < -OBJECT_CLEANUP_MARGIN || pos.x > CANVAS_WIDTH + OBJECT_CLEANUP_MARGIN ||
            pos.y < -OBJECT_CLEANUP_MARGIN || pos.y > CANVAS_HEIGHT + OBJECT_CLEANUP_MARGIN) {
            // console.log("Removing object outside bounds:", body.id); // デバッグ用
            Composite.remove(world, body);
        }
    });
}, OBJECT_CLEANUP_INTERVAL); // 定義した間隔で実行
