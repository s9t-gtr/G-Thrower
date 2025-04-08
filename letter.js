// letter.js
import { Body, Bodies, Composite, Events } from './matter-alias.js'; // エイリアスファイルをインポート
import {
    LETTER_SCALE, NUM_INITIAL_LETTERS, SWIPE_VELOCITY_SCALE,
    INTERACTION_CIRCLE_X, INTERACTION_CIRCLE_Y
} from './constants.js';

/**
 * 文字 'E' の複合ボディを作成します。
 * @param {number} x - 初期X座標
 * @param {number} y - 初期Y座標
 * @returns {Matter.Body} 文字 'E' のボディ
 */
function createLetterE(x, y) {
    const scale = LETTER_SCALE;
    const partW = 10 * scale; // パーツの幅（縦棒、横棒の太さ）
    const h = 50 * scale;     // 文字の高さ
    const barW = 35 * scale; // 横棒の長さ

    // パーツの定義 (中心からの相対位置で定義)
    const stem = Bodies.rectangle(-15 * scale, 0, partW, h);
    const topBar = Bodies.rectangle(0, -h / 2 + partW / 2, barW, partW);
    const midBar = Bodies.rectangle(-2 * scale, 0, barW * 0.9, partW); // 中央は少し短く
    const botBar = Bodies.rectangle(0, h / 2 - partW / 2, barW, partW);

    const letterE = Body.create({
        parts: [stem, topBar, midBar, botBar],
        frictionAir: 0.03, // 空気抵抗
        friction: 0.1,     // 摩擦
        restitution: 0.4,  // 反発係数
        isSleeping: true   // 初期状態でスリープさせる
    });

    Body.setPosition(letterE, { x: x, y: y });
    Body.setAngle(letterE, 0); // 初期角度を0に

    return letterE;
}

// 他の文字を追加する場合は、ここに関数を追加し、letterCreators に登録します
// function createLetterA(x, y) { ... }

// 生成関数をマップに登録 (キーは文字)
const letterCreators = {
    'E': createLetterE,
    // 'A': createLetterA,
};

/**
 * 指定された文字を指定された数だけ初期配置します。
 * @param {Matter.World} world - 文字を追加するワールド
 * @param {string} letterChar - 作成する文字 ('E' など)
 * @param {number} count - 作成する数
 * @param {number} initialX - 初期配置のX座標
 * @param {number} initialY - 初期配置のY座標
 */
export function initializeLetters(world, letterChar, count, initialX, initialY) {
    const creator = letterCreators[letterChar];
    if (!creator) {
        console.error(`Letter '${letterChar}' creator function not found!`);
        return;
    }
    for (let i = 0; i < count; i++) {
        const letterBody = creator(initialX, initialY);
        if (letterBody) {
            Composite.add(world, letterBody);
        }
    }
}

/**
 * マウスリリース時にオブジェクトにスワイプ速度を適用するイベントリスナーを設定します。
 * @param {Matter.MouseConstraint} mouseConstraint - 対象のマウス制約
 * @param {Matter.Mouse} mouse - マウスオブジェクト (速度取得用)
 */
export function setupSwipeMotion(mouseConstraint, mouse) {
    Events.on(mouseConstraint, 'mouseup', (event) => {
        const body = mouseConstraint.body; // mouseup時に掴んでいたボディ

        // body が null でない場合 (円の中で意図的に離した場合) のみ速度を適用
        if (body) {
            // mouseConstraint.mouse から現在のマウス速度を取得
            const velocity = mouseConstraint.mouse.velocity;
            const finalVelocity = {
                x: velocity.x * SWIPE_VELOCITY_SCALE,
                y: velocity.y * SWIPE_VELOCITY_SCALE
            };
            // 寝ているオブジェクトを起こしてから速度を設定
            Body.setSleeping(body, false);
            Body.setVelocity(body, finalVelocity);
             // 念のため角速度も少しつける場合（任意）
            // Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
        }
         // body が null の場合（円の外で自動リリースされた場合）は何もしない
    });
}
