// Matter.js モジュールのエイリアスを設定
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Body = Matter.Body,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Constraint = Matter.Constraint,
      Events = Matter.Events,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint;

// --- 定数 ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const LETTER_SCALE = 0.8;
const WALL_THICKNESS = 50;
const NUM_INITIAL_LETTERS = 1;
const SWIPE_VELOCITY_SCALE = 1.8;

// 操作可能エリア（円）の定義
const INTERACTION_CIRCLE_X = 100; // 円の中心 X 座標 (左下)
const INTERACTION_CIRCLE_Y = CANVAS_HEIGHT - 100; // 円の中心 Y 座標 (左下)
const INTERACTION_CIRCLE_RADIUS = 80; // 円の半径
const INTERACTION_CIRCLE_RADIUS_SQ = INTERACTION_CIRCLE_RADIUS * INTERACTION_CIRCLE_RADIUS; // 半径の2乗 (計算用)

// --- Matter.js エンジンのセットアップ ---
const engine = Engine.create({
    // ★★★ スリープ機能を有効化 ★★★
    enableSleeping: true
});
const world = engine.world;
world.gravity.y = 0.3;

// レンダラーのセットアップ
const canvas = document.getElementById('gameCanvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        wireframes: false,
        background: '#ffffff'
    }
});

// --- 壁の作成 ---
const walls = [
    Bodies.rectangle(CANVAS_WIDTH / 2, -WALL_THICKNESS / 2, CANVAS_WIDTH, WALL_THICKNESS, { isStatic: true }),
    Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + WALL_THICKNESS / 2, CANVAS_WIDTH, WALL_THICKNESS, { isStatic: true }),
    Bodies.rectangle(-WALL_THICKNESS / 2, CANVAS_HEIGHT / 2, WALL_THICKNESS, CANVAS_HEIGHT, { isStatic: true }),
    Bodies.rectangle(CANVAS_WIDTH + WALL_THICKNESS / 2, CANVAS_HEIGHT / 2, WALL_THICKNESS, CANVAS_HEIGHT, { isStatic: true })
];
Composite.add(world, walls);

// --- 木の作成 ---
function createBareTree(rootX, rootY) {
    const trunkWidth = 20; const trunkHeight = CANVAS_HEIGHT * 0.55; const branchThickness = 12; const treeColor = '#8B4513'; const treeRenderStyle = { fillStyle: treeColor };
    const trunk = Bodies.rectangle(0, 0, trunkWidth, trunkHeight, { render: treeRenderStyle }); const branch1Length = 75; const branch1 = Bodies.rectangle(trunkWidth * 0.4 + branch1Length * 0.2, trunkHeight * 0.35, branch1Length, branchThickness, { angle: -Math.PI / 5.5, render: treeRenderStyle }); const branch2Length = 85; const branch2 = Bodies.rectangle(-trunkWidth * 0.4 - branch2Length * 0.2, trunkHeight * 0.1, branch2Length, branchThickness, { angle: Math.PI / 6, render: treeRenderStyle }); const branch3Length = 65; const branch3 = Bodies.rectangle(trunkWidth * 0.3 + branch3Length * 0.3, -trunkHeight * 0.2, branch3Length, branchThickness, { angle: -Math.PI / 4, render: treeRenderStyle }); const branch4Length = 60; const branch4 = Bodies.rectangle(-trunkWidth * 0.3 - branch4Length * 0.3, -trunkHeight * 0.38, branch4Length, branchThickness, { angle: Math.PI / 3.8, render: treeRenderStyle });
    const tree = Body.create({ parts: [trunk, branch1, branch2, branch3, branch4], isStatic: true }); Body.setPosition(tree, { x: rootX, y: rootY - trunkHeight / 2 }); return tree;
}
const treeRootX = CANVAS_WIDTH * 0.7; const treeRootY = CANVAS_HEIGHT; const bareTree = createBareTree(treeRootX, treeRootY); Composite.add(world, bareTree);

// --- 文字の形状定義 (Eのみ) ---
function createLetterE(x, y) {
    const scale = LETTER_SCALE;
    const partW = 10 * scale; const h = 50 * scale; const barW = 35 * scale;
    const stem = Bodies.rectangle(-15 * scale, 0, partW, h);
    const topBar = Bodies.rectangle(0, -h / 2 + partW / 2, barW, partW);
    const midBar = Bodies.rectangle(-2 * scale, 0, barW * 0.9, partW);
    const botBar = Bodies.rectangle(0, h / 2 - partW / 2, barW, partW);

    const letterE = Body.create({
        parts: [stem, topBar, midBar, botBar],
        frictionAir: 0.03,
        friction: 0.1,
        restitution: 0.4,
        // ★★★ 追加: 初期状態でスリープさせる ★★★
        isSleeping: true
    });

    Body.setPosition(letterE, { x: x, y: y });
    // ★★★ 変更: 初期角度を0に固定 ★★★
    Body.setAngle(letterE, 0);
    return letterE;
}

// --- 文字生成関数マップ (Eのみ) ---
const letterCreators = { 'E': createLetterE };

// --- 初期文字配置関数 (Eのみ配置) ---
function initializeLetters(count) {
    const creator = letterCreators['E'];
    if (!creator) { console.error("Letter 'E' creator function not found!"); return; }
    for (let i = 0; i < count; i++) {
        // 初期位置を操作可能円の中心に配置
        const letterBody = creator(INTERACTION_CIRCLE_X, INTERACTION_CIRCLE_Y);
        if (letterBody) {
            Composite.add(world, letterBody);
        }
    }
}

// --- マウス操作の設定 ---
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: { visible: false }
    }
});
Composite.add(world, mouseConstraint);
render.mouse = mouse;

// --- マウスダウン時に操作エリアをチェック ---
Events.on(mouseConstraint, 'mousedown', (event) => {
    const mousePosition = event.mouse.position;
    const dx = mousePosition.x - INTERACTION_CIRCLE_X;
    const dy = mousePosition.y - INTERACTION_CIRCLE_Y;
    const distanceSquared = dx * dx + dy * dy;

    // 円の外でクリックされた場合、掴む対象 (body) を null にしてドラッグを開始させない
    // (isSleeping中のボディをクリックしても、円内なら自動で起きるはず)
    if (distanceSquared > INTERACTION_CIRCLE_RADIUS_SQ) {
        mouseConstraint.body = null;
    }
});

// --- mousemove リスナーは削除 ---

// --- ★★★ 追加/変更: エンジン更新前にドラッグ状態とマウス位置をチェック ★★★ ---
Events.on(engine, 'beforeUpdate', (event) => {
    // マウスConstraintがボディを掴んでいる（ドラッグ中）かチェック
    if (mouseConstraint.body) {
        // 現在のマウス座標を取得 (mouseConstraint.mouse を使う)
        const mousePosition = mouseConstraint.mouse.position;
        const dx = mousePosition.x - INTERACTION_CIRCLE_X;
        const dy = mousePosition.y - INTERACTION_CIRCLE_Y;
        const distanceSquared = dx * dx + dy * dy;

        // マウスカーソルが円の外に出た場合
        if (distanceSquared > INTERACTION_CIRCLE_RADIUS_SQ) {
            // 掴んでいるボディを解放する
            mouseConstraint.body = null;
            // Constraintの接続情報もクリアする (より確実に離すため)
            if (mouseConstraint.constraint) { // constraintが存在するか確認
               mouseConstraint.constraint.bodyB = null;
               // constraintのpointBなどもリセットした方が良い場合もあるが、
               // bodyB=nullで通常は十分
            }
            // console.log("Released outside circle"); // デバッグ用
        }
    }
});


// --- スワイプの勢いを適用するイベントリスナー ---
Events.on(mouseConstraint, 'mouseup', (event) => {
    const body = mouseConstraint.body; // mouseup発生時に掴んでいたボディを取得

    // bodyがnullでない、つまり意図的に円の中で離した場合のみ速度を適用
    // (円外で自動リリースされた場合は body は null になっているはず)
    if (body) {
        let velocity = mouse.velocity;
        const finalVelocity = {
            x: velocity.x * SWIPE_VELOCITY_SCALE,
            y: velocity.y * SWIPE_VELOCITY_SCALE
        };
        Body.setVelocity(body, finalVelocity);
    }
});


// --- エンジンとレンダラーの実行 ---
const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);


// --- レンダリング後に操作可能エリアの円を描画 ---
Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    ctx.beginPath();
    ctx.arc(INTERACTION_CIRCLE_X, INTERACTION_CIRCLE_Y, INTERACTION_CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
});


// --- 初期文字 'E' を配置 ---
initializeLetters(NUM_INITIAL_LETTERS);

// --- 画面外のオブジェクトを削除 ---
setInterval(() => {
    const allBodies = Composite.allBodies(world);
    allBodies.forEach(body => {
        // スリープ中のオブジェクトは削除しないようにチェックを追加
        if (body.isStatic || body.isSleeping) return;
        const pos = body.position; const margin = 100;
        if (pos.x < -margin || pos.x > CANVAS_WIDTH + margin ||
            pos.y < -margin || pos.y > CANVAS_HEIGHT + margin) {
            // console.log("Removing object outside bounds", body); // デバッグ用
            Composite.remove(world, body);
        }
    });
}, 5000);