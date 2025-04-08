// environment.js
import { Engine, Render, Bodies, Composite, Mouse, MouseConstraint, Events } from './matter-alias.js'; // エイリアスファイルをインポート
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, WALL_THICKNESS, GRAVITY_Y,
    ENABLE_SLEEPING, BACKGROUND_COLOR,
    INTERACTION_CIRCLE_X, INTERACTION_CIRCLE_Y, INTERACTION_CIRCLE_RADIUS_SQ
} from './constants.js';

/**
 * Matter.js のエンジンとワールドを作成・設定します。
 * @returns {{engine: Matter.Engine, world: Matter.World}} エンジンとワールドオブジェクト
 */
export function setupEngine() {
    const engine = Engine.create({
        enableSleeping: ENABLE_SLEEPING
    });
    const world = engine.world;
    world.gravity.y = GRAVITY_Y;
    return { engine, world };
}

/**
 * Matter.js のレンダラーを作成・設定します。
 * @param {HTMLElement} canvas - 描画対象のCanvas要素
 * @param {Matter.Engine} engine - 使用するMatter.jsエンジン
 * @returns {Matter.Render} レンダラーオブジェクト
 */
export function setupRenderer(canvas, engine) {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            wireframes: false,
            background: BACKGROUND_COLOR
        }
    });
    return render;
}

/**
 * 画面を囲む壁を作成し、ワールドに追加します。
 * @param {Matter.World} world - 壁を追加するワールド
 * @returns {Matter.Body[]} 作成された壁の配列
 */
export function createWalls(world) {
    const walls = [
        // 上壁
        Bodies.rectangle(CANVAS_WIDTH / 2, -WALL_THICKNESS / 2, CANVAS_WIDTH, WALL_THICKNESS, { isStatic: true }),
        // 下壁 (地面)
        Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + WALL_THICKNESS / 2, CANVAS_WIDTH, WALL_THICKNESS, { isStatic: true }),
        // 左壁
        Bodies.rectangle(-WALL_THICKNESS / 2, CANVAS_HEIGHT / 2, WALL_THICKNESS, CANVAS_HEIGHT, { isStatic: true }),
        // 右壁
        Bodies.rectangle(CANVAS_WIDTH + WALL_THICKNESS / 2, CANVAS_HEIGHT / 2, WALL_THICKNESS, CANVAS_HEIGHT, { isStatic: true })
    ];
    Composite.add(world, walls);
    return walls;
}

/**
 * マウス操作のための設定を行い、マウス制約を作成します。
 * @param {Matter.Engine} engine - 使用するMatter.jsエンジン
 * @param {Matter.Render} render - 使用するMatter.jsレンダラー
 * @param {Matter.World} world - マウス制約を追加するワールド
 * @returns {Matter.MouseConstraint} 作成されたマウス制約オブジェクト
 */
export function setupMouseInteraction(engine, render, world) {
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: { visible: false } // 制約自体は非表示
        }
    });
    Composite.add(world, mouseConstraint);
    render.mouse = mouse; // レンダラーにもマウスを関連付け

    // --- マウスダウン時に操作エリアをチェック ---
    Events.on(mouseConstraint, 'mousedown', (event) => {
        const mousePosition = event.mouse.position;
        const dx = mousePosition.x - INTERACTION_CIRCLE_X;
        const dy = mousePosition.y - INTERACTION_CIRCLE_Y;
        const distanceSquared = dx * dx + dy * dy;

        // 円の外でクリックされた場合、掴む対象 (body) を null にしてドラッグを開始させない
        if (distanceSquared > INTERACTION_CIRCLE_RADIUS_SQ) {
            mouseConstraint.body = null;
        }
        // 円内であれば、寝ているオブジェクトもクリックで起きる（Matter.jsのデフォルト挙動）
    });

    // --- ドラッグ中に円の外に出たら離す処理 ---
    Events.on(engine, 'beforeUpdate', (event) => {
        if (mouseConstraint.body) {
            const mousePosition = mouseConstraint.mouse.position;
            const dx = mousePosition.x - INTERACTION_CIRCLE_X;
            const dy = mousePosition.y - INTERACTION_CIRCLE_Y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared > INTERACTION_CIRCLE_RADIUS_SQ) {
                // 掴んでいるボディを解放
                mouseConstraint.body = null;
                if (mouseConstraint.constraint) {
                    mouseConstraint.constraint.bodyB = null;
                    // 必要であれば constraint の他のプロパティもリセット
                }
            }
        }
    });

    return mouseConstraint;
}
