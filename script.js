// Matter.js モジュールのエイリアスを設定
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Body = Matter.Body,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Constraint = Matter.Constraint,
      Events = Matter.Events; // Events を使用

// --- 定数 ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const LETTER_SCALE = 0.8;
// const LAUNCH_SPEED = 15; // ← 固定値は使わないので削除またはコメントアウト
const WALL_THICKNESS = 50;

// --- 発射パラメータ ---
const SPAWN_X = 50; // 初期生成 X座標 (左端から50px) - 変更なし
const SPAWN_Y = CANVAS_HEIGHT - 50; // 初期生成 Y座標 (下端から50px上に変更) ★★★ 変更点 ★★★
let currentLaunchAngleRad = 0; // 発射角度 (ラジアン単位) - 右向きが0
let currentLaunchStrength = 15; // 発射の強さ
const ANGLE_STEP = Math.PI / 36; // 角度の変更ステップ (5度ずつに変更: 180/36 = 5)
const STRENGTH_STEP = 1;         // 強さの変更ステップ
const MIN_STRENGTH = 1;          // 最小の強さ
const MAX_STRENGTH = 50;         // 最大の強さ

// --- Matter.js エンジンのセットアップ ---
const engine = Engine.create();
const world = engine.world;
// 重力はデフォルトで有効 (world.gravity.y = 1)
world.gravity.y = 0.5; // ← この行はコメントアウトまたは削除されたままにする

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
        wireframes: false, // ワイヤーフレーム表示をオフに
        background: '#ffffff'
    }
});

// --- 壁の作成 ---
const walls = [
    // 上壁
    Bodies.rectangle(CANVAS_WIDTH / 2, -WALL_THICKNESS / 2, CANVAS_WIDTH, WALL_THICKNESS, { isStatic: true }),
    // 下壁
    Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + WALL_THICKNESS / 2, CANVAS_WIDTH, WALL_THICKNESS, { isStatic: true }),
    // 左壁
    Bodies.rectangle(-WALL_THICKNESS / 2, CANVAS_HEIGHT / 2, WALL_THICKNESS, CANVAS_HEIGHT, { isStatic: true }),
    // 右壁
    Bodies.rectangle(CANVAS_WIDTH + WALL_THICKNESS / 2, CANVAS_HEIGHT / 2, WALL_THICKNESS, CANVAS_HEIGHT, { isStatic: true })
];
Composite.add(world, walls);


function createBareTree(rootX, rootY) {
    // --- サイズパラメータ (全体的に縮小) ---
    const trunkWidth = 20; // 幹の幅を細く
    const trunkHeight = CANVAS_HEIGHT * 0.55; // 幹の高さを低く
    const branchThickness = 12; // 枝の太さを細く
    const treeColor = '#8B4513'; // SaddleBrown (茶色)

    // パーツのレンダリング設定
    const treeRenderStyle = {
        fillStyle: treeColor,
    };

    // 幹パーツ (複合ボディの中心を基準にした相対位置)
    const trunk = Bodies.rectangle(0, 0, trunkWidth, trunkHeight, {
         render: treeRenderStyle
    });

    // 枝パーツ (幹の中心(0,0)からの相対位置と角度で定義 - 長さも短く)
    // 枝1 (右下向き)
    const branch1Length = 75; // 短く
    const branch1 = Bodies.rectangle(
        trunkWidth * 0.4 + branch1Length * 0.2, // X位置 (相対位置調整)
        trunkHeight * 0.35,                 // Y位置 (相対位置調整)
        branch1Length, branchThickness,     // サイズ
        { angle: -Math.PI / 5.5, render: treeRenderStyle } // 角度微調整
    );

    // 枝2 (左向き)
    const branch2Length = 85; // 短く
    const branch2 = Bodies.rectangle(
        -trunkWidth * 0.4 - branch2Length * 0.2, // X位置 (相対位置調整)
        trunkHeight * 0.1,                   // Y位置 (相対位置調整)
        branch2Length, branchThickness,      // サイズ
        { angle: Math.PI / 6, render: treeRenderStyle } // 角度
    );

    // 枝3 (右上向き)
    const branch3Length = 65; // 短く
    const branch3 = Bodies.rectangle(
        trunkWidth * 0.3 + branch3Length * 0.3,  // X位置 (相対位置調整)
        -trunkHeight * 0.2,                  // Y位置 (相対位置調整)
        branch3Length, branchThickness,      // サイズ
        { angle: -Math.PI / 4, render: treeRenderStyle } // 角度
    );

    // 枝4 (左上向き)
    const branch4Length = 60; // 短く
    const branch4 = Bodies.rectangle(
        -trunkWidth * 0.3 - branch4Length * 0.3, // X位置 (相対位置調整)
        -trunkHeight * 0.38,                 // Y位置 (相対位置調整)
        branch4Length, branchThickness,      // サイズ
        { angle: Math.PI / 3.8, render: treeRenderStyle } // 角度微調整
    );

    // 幹と枝をパーツとして持つ複合ボディを作成
    const tree = Body.create({
        parts: [trunk, branch1, branch2, branch3, branch4],
        isStatic: true, // 木全体を静的なオブジェクトにする
    });

    // 複合ボディ全体の位置を設定 (Y座標は幹の下端が rootY になるように調整)
    // trunkHeight が変わったので、Y位置は自動的に調整される
    Body.setPosition(tree, { x: rootX, y: rootY - trunkHeight / 2 });

    return tree;
}

// 木を配置する座標 (変更なし)
const treeRootX = CANVAS_WIDTH * 0.7;
const treeRootY = CANVAS_HEIGHT;

// 木を作成してワールドに追加 (変更なし)
const bareTree = createBareTree(treeRootX, treeRootY);
Composite.add(world, bareTree);
// --- ★★★ 葉っぱのない木の作成ここまで ★★★ ---


// --- 文字の形状定義 ---
// (createLetterA, createLetterJ, createLetterG, createCircleVertices, createLetterO 関数は変更なし)
/**
 * 文字 'A' の物理ボディを作成する関数
 * @param {number} x - 中心 X 座標
 * @param {number} y - 中心 Y 座標
 * @returns {Matter.Body} 文字 'A' の複合ボディ
 */
function createLetterA(x, y) {
    const scale = LETTER_SCALE;
    const partWidth = 10 * scale;
    const legHeight = 50 * scale;
    const crossbarHeight = 10 * scale;
    const angle = Math.PI / 9; // 20度

    const leg1 = Bodies.rectangle(-15 * scale, 0, partWidth, legHeight, { angle: -angle });
    const leg2 = Bodies.rectangle(15 * scale, 0, partWidth, legHeight, { angle: angle });
    const crossbar = Bodies.rectangle(0, 0, 30 * scale, crossbarHeight);

    const letterA = Body.create({
        parts: [leg1, leg2, crossbar],
        frictionAir: 0.01, friction: 0.1, restitution: 0.6,
    });
    Body.setPosition(letterA, { x: x, y: y });
    Body.setAngle(letterA, Math.random() * Math.PI * 2);
    return letterA;
}

/**
 * 文字 'J' の物理ボディを作成する関数
 * @param {number} x - 中心 X 座標
 * @param {number} y - 中心 Y 座標
 * @returns {Matter.Body} 文字 'J' の複合ボディ
 */
function createLetterJ(x, y) {
    const scale = LETTER_SCALE;
    const partWidth = 10 * scale;
    const stemHeight = 50 * scale;
    const hookWidth = 25 * scale;
    const hookHeight = 10 * scale;

    const stem = Bodies.rectangle(5 * scale, -10 * scale, partWidth, stemHeight);
    const hook = Bodies.rectangle(-3 * scale, 15 * scale, hookWidth, hookHeight);

    const letterJ = Body.create({
        parts: [stem, hook],
        frictionAir: 0.01, friction: 0.1, restitution: 0.6,
    });
    Body.setPosition(letterJ, { x: x, y: y });
    Body.setAngle(letterJ, Math.random() * Math.PI * 2);
    return letterJ;
}

/**
 * 文字 'G' の物理ボディを作成する関数 (複合ボディバージョン)
 * @param {number} x - 中心 X 座標
 * @param {number} y - 中心 Y 座標
 * @returns {Matter.Body} 文字 'G' の複合ボディ
 */
function createLetterG(x, y) {
    const scale = LETTER_SCALE;
    const partW = 10 * scale;
    const outerH = 50 * scale;
    const outerW = 42 * scale;

    const topBar = Bodies.rectangle(0, -outerH/2 + partW/2, outerW - partW, partW);
    const leftBar = Bodies.rectangle(-outerW/2 + partW/2, 0, partW, outerH);
    const bottomBar = Bodies.rectangle(5 * scale, outerH/2 - partW/2, outerW - 1.5 * partW, partW);
    const rightUpperBar = Bodies.rectangle(outerW/2 - partW/2, -outerH/4, partW, outerH/2 + partW);
    const innerBar = Bodies.rectangle(outerW/4 - partW, 0, outerW/2, partW);

    const letterG = Body.create({
        parts: [topBar, leftBar, bottomBar, rightUpperBar, innerBar],
        frictionAir: 0.01, friction: 0.1, restitution: 0.5,
    });
    Body.setPosition(letterG, { x: x, y: y });
    Body.setAngle(letterG, Math.random() * Math.PI * 2);
    return letterG;
}

/**
 * 円周上の頂点を生成するヘルパー関数
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} radius - 半径
 * @param {number} numVertices - 頂点の数
 * @param {boolean} clockwise - 時計回りか？ (falseなら反時計回り)
 * @returns {Array<{x: number, y: number}>} 頂点座標の配列
 */
function createCircleVertices(cx, cy, radius, numVertices, clockwise = false) {
    const vertices = [];
    const angleStep = (Math.PI * 2) / numVertices;
    for (let i = 0; i < numVertices; i++) {
        const angle = clockwise ? cx + angleStep * (numVertices - 1 - i) : cy + angleStep * i;
        vertices.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
    }
    return vertices;
}

/**
 * 文字 'O' の物理ボディを作成する関数 (リング形状)
 * @param {number} x - 中心 X 座標
 * @param {number} y - 中心 Y 座標
 * @returns {Matter.Body} 文字 'O' のリングボディ
 */
function createLetterO(x, y) {
    const scale = LETTER_SCALE;
    const outerRadius = 25 * scale;
    const innerRadius = 15 * scale;
    const numVertices = 16;

    const outerVertices = createCircleVertices(0, 0, outerRadius, numVertices, false);
    const innerVerticesCw = createCircleVertices(0, 0, innerRadius, numVertices, true);

    const letterO = Bodies.fromVertices(x, y, [outerVertices, innerVerticesCw], {
        frictionAir: 0.005, friction: 0.05, restitution: 0.6,
    }, true, 0.01, 10);

    if (!letterO) {
        console.error("Failed to create letter O body from vertices.");
        return Bodies.rectangle(x, y, 50 * scale, 50 * scale, {
             frictionAir: 0.01, friction: 0.1, restitution: 0.6
        });
    }
    Body.setPosition(letterO, { x: x, y: y }); // Oは初期位置だけ設定
    // Body.setAngle(letterO, Math.random() * Math.PI * 2); // Oは角度不要かも
    return letterO;
}

/**
 * 文字 'R' の物理ボディを作成する関数
 * @param {number} x - 中心 X 座標
 * @param {number} y - 中心 Y 座標
 * @returns {Matter.Body} 文字 'R' の複合ボディ
 */
function createLetterR(x, y) {
    const scale = LETTER_SCALE;
    const partW = 10 * scale;
    const h = 50 * scale;
    const w = 35 * scale; // 幅

    // Rの縦棒 (左寄り)
    const stem = Bodies.rectangle(-15 * scale, 0, partW, h);
    // RのP部分 (上半分)
    const pTop = Bodies.rectangle(0, -h / 4, w / 1.8, partW);
    const pRight = Bodies.rectangle((w / 1.8)/2 - partW/2, -h / 8, partW, h / 2.5);
    const pBottom = Bodies.rectangle(0, 0, w / 1.8, partW);
    // Rの右下の脚
    const leg = Bodies.rectangle(5 * scale, h / 4, partW, h / 1.8, {
        angle: Math.PI / 6, // 30度傾ける
        // 衝突判定を考慮して少しだけコリジョンフィルタを設定 (オプション)
        // collisionFilter: { group: Body.nextGroup(true) }
    });

    const letterR = Body.create({
        parts: [stem, pTop, pRight, pBottom, leg],
        frictionAir: 0.01, friction: 0.1, restitution: 0.6,
    });

    Body.setPosition(letterR, { x: x, y: y });
    Body.setAngle(letterR, Math.random() * Math.PI * 2);
    return letterR;
}

/**
 * 文字 'E' の物理ボディを作成する関数
 * @param {number} x - 中心 X 座標
 * @param {number} y - 中心 Y 座標
 * @returns {Matter.Body} 文字 'E' の複合ボディ
 */
function createLetterE(x, y) {
    const scale = LETTER_SCALE;
    const partW = 10 * scale;
    const h = 50 * scale;
    const barW = 35 * scale; // 横棒の長さ

    // Eの縦棒 (左寄り)
    const stem = Bodies.rectangle(-15 * scale, 0, partW, h);
    // Eの3本の横棒
    const topBar = Bodies.rectangle(0, -h / 2 + partW / 2, barW, partW);
    const midBar = Bodies.rectangle(-2 * scale, 0, barW * 0.9, partW); // 真ん中は少し短く
    const botBar = Bodies.rectangle(0, h / 2 - partW / 2, barW, partW);

    const letterE = Body.create({
        parts: [stem, topBar, midBar, botBar],
        frictionAir: 0.01, friction: 0.1, restitution: 0.6,
    });

    Body.setPosition(letterE, { x: x, y: y });
    Body.setAngle(letterE, Math.random() * Math.PI * 2);
    return letterE;
}

/**
 * 文字 'Z' の物理ボディを作成する関数
 * @param {number} x - 中心 X 座標
 * @param {number} y - 中心 Y 座標
 * @returns {Matter.Body} 文字 'Z' の複合ボディ
 */
function createLetterZ(x, y) {
    const scale = LETTER_SCALE;
    const partW = 10 * scale;
    const h = 50 * scale;
    const barW = 40 * scale;
    const angle = Math.PI / 3.8; // 斜めの角度 (約47度)
    const diagonalLength = Math.sqrt(h*h + barW*barW) * 0.9; // 斜め部分の長さ調整

    // Zの上下の横棒
    const topBar = Bodies.rectangle(0, -h / 2 + partW / 2, barW, partW);
    const botBar = Bodies.rectangle(0, h / 2 - partW / 2, barW, partW);
    // Zの斜め部分
    const diagonal = Bodies.rectangle(0, 0, partW, diagonalLength, { angle: -angle }); // 右肩下がり

    const letterZ = Body.create({
        parts: [topBar, botBar, diagonal],
        frictionAir: 0.01, friction: 0.1, restitution: 0.6,
    });

    Body.setPosition(letterZ, { x: x, y: y });
    Body.setAngle(letterZ, Math.random() * Math.PI * 2);
    return letterZ;
}

/**
 * 文字 'N' の物理ボディを作成する関数
 * @param {number} x - 中心 X 座標
 * @param {number} y - 中心 Y 座標
 * @returns {Matter.Body} 文字 'N' の複合ボディ
 */
function createLetterN(x, y) {
    const scale = LETTER_SCALE;
    const partW = 10 * scale;
    const h = 50 * scale;
    const w = 35 * scale; // 縦棒間の幅
    const diagonalAngle = Math.atan2(h, w); // 縦棒と斜め線のなす角度(の補角に近い)
    const diagonalLength = Math.sqrt(h * h + w * w); // 斜め線の長さ

    // Nの左右の縦棒
    const leftStem = Bodies.rectangle(-w / 2, 0, partW, h);
    const rightStem = Bodies.rectangle(w / 2, 0, partW, h);
    // Nの斜め部分
    const diagonal = Bodies.rectangle(0, 0, partW, diagonalLength, {
        angle: -diagonalAngle // 右肩下がりの角度
     });

    const letterN = Body.create({
        parts: [leftStem, rightStem, diagonal],
        frictionAir: 0.01, friction: 0.1, restitution: 0.6,
    });

    Body.setPosition(letterN, { x: x, y: y });
    Body.setAngle(letterN, Math.random() * Math.PI * 2);
    return letterN;
}


// --- 文字生成関数マップ (更新) ---
const letterCreators = {
    'A': createLetterA,
    'J': createLetterJ,
    'G': createLetterG,
    'O': createLetterO, // 既存
    'R': createLetterR, // 追加
    'E': createLetterE, // 追加
    'Z': createLetterZ, // 追加
    'N': createLetterN, // 追加
    // 他の文字もここに追加していく
};

// --- 追加: 表示要素への参照 ---
// (HTML側に <span id="angleDisplay"></span> と <span id="strengthDisplay"></span> が必要)
const angleDisplay = document.getElementById('angleDisplay');
const strengthDisplay = document.getElementById('strengthDisplay');

// --- 追加: 表示更新関数 ---
// (重複した定義を削除し、こちらを有効にする)
function updateDisplay() {
    // チェック: HTML要素が存在するか確認
    if (!angleDisplay || !strengthDisplay) {
        console.warn("Display elements not found. Skipping update.");
        return;
    }
    // ラジアンを度に変換して表示 (0度を右向きとする)
    const angleDeg = Math.round(currentLaunchAngleRad * 180 / Math.PI);
    // 角度がマイナスにならないように調整 (0-359度)
    const displayAngle = (angleDeg % 360 + 360) % 360;
    angleDisplay.textContent = displayAngle;
    strengthDisplay.textContent = currentLaunchStrength;
}


// --- イベントリスナー (キー入力) ---
// 古い 'keypress' リスナーを削除し、新しい 'keydown' リスナーを使用
// document.removeEventListener('keypress', ...); // もしあれば

document.addEventListener('keydown', (event) => {
    const key = event.key;
    const upperKey = key.toUpperCase();
    let displayNeedsUpdate = false;

    // --- 文字キーが押された場合 ---
    if (letterCreators[upperKey]) {
        const creator = letterCreators[upperKey];

        // 文字ボディを作成 (新しいスポーン位置で)
        const letterBody = creator(SPAWN_X, SPAWN_Y);

        // nullチェック (特にfromVerticesを使う場合に備えて)
        if (!letterBody) return;

        // 設定された角度と強さで速度を計算
        const velocityX = Math.cos(currentLaunchAngleRad) * currentLaunchStrength;
        const velocityY = Math.sin(currentLaunchAngleRad) * currentLaunchStrength; // Y軸は下向きが正

        // 速度と角速度を設定
        Body.setVelocity(letterBody, { x: velocityX, y: velocityY });
        // 文字 'O' 以外は初期回転を与える
        if (upperKey !== 'O') {
            Body.setAngularVelocity(letterBody, (Math.random() - 0.5) * 0.2);
        }

        // ワールドに追加
        Composite.add(world, letterBody);

    // --- 矢印キーが押された場合 ---
    } else if (key === 'ArrowUp') {
        currentLaunchStrength = Math.min(MAX_STRENGTH, currentLaunchStrength + STRENGTH_STEP);
        displayNeedsUpdate = true;
        event.preventDefault(); // ページのスクロールを防ぐ
    } else if (key === 'ArrowDown') {
        currentLaunchStrength = Math.max(MIN_STRENGTH, currentLaunchStrength - STRENGTH_STEP);
        displayNeedsUpdate = true;
        event.preventDefault(); // ページのスクロールを防ぐ
    } else if (key === 'ArrowLeft') {
        currentLaunchAngleRad -= ANGLE_STEP;
        displayNeedsUpdate = true;
        event.preventDefault(); // ページのスクロールを防ぐ
    } else if (key === 'ArrowRight') {
        currentLaunchAngleRad += ANGLE_STEP;
        displayNeedsUpdate = true;
        event.preventDefault(); // ページのスクロールを防ぐ
    }

    // 表示を更新する必要があれば更新
    if (displayNeedsUpdate) {
        updateDisplay();
    }
});


// --- エンジンとレンダラーの実行 ---
const runner = Runner.create();
Runner.run(runner, engine); // エンジンを実行
Render.run(render); // レンダラーを実行

// --- 初期表示の更新 ---
updateDisplay(); // ページ読み込み時に最初の値を表示


// --- (オプション) 画面外のオブジェクトを削除 ---
// 定期的に画面外に出たオブジェクトを削除してパフォーマンスを維持
setInterval(() => {
    const allBodies = Composite.allBodies(world);
    allBodies.forEach(body => {
        // 静的な物体 (壁など) は削除しない
        if (body.isStatic) return;

        // 画面領域外に出たか判定
        const pos = body.position;
        const margin = 100; // 画面外判定の余裕
        if (pos.x < -margin || pos.x > CANVAS_WIDTH + margin ||
            pos.y < -margin || pos.y > CANVAS_HEIGHT + margin) {
            Composite.remove(world, body);
            // console.log("Removed off-screen body:", body.id);
        }
    });
}, 5000); // 5秒ごとにチェック