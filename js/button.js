/**
 * iPhone風のカスタムボタンを作成してページに追加する関数
 * (この関数は前回のコードから変更ありません)
 * @param {string} containerId - ボタンを追加するコンテナ要素のID
 * @param {string} numberText - ボタン内に表示する数字（文字列）
 * @param {function} onClickAction - ボタンクリック時に実行する関数
 */
function createIphoneLikeButton(containerId, numberText, onClickAction) {
    // ボタン要素を作成
    const button = document.createElement('button');
    button.classList.add('iphone-like-button');
    button.type = 'button';

    // 数字を表示する要素を作成
    const numberSpan = document.createElement('span');
    numberSpan.classList.add('number-circle');
    numberSpan.textContent = numberText;

    // 数字要素をボタンに追加
    button.appendChild(numberSpan);

    // クリック時のアクションを設定
    if (onClickAction && typeof onClickAction === 'function') {
        button.addEventListener('click', onClickAction);
    } else {
        // デフォルトのアクション
        button.addEventListener('click', () => {
            console.log(`ボタン ${numberText} がクリックされました。`);
        });
    }

    // 指定されたコンテナ要素にボタンを追加
    const container = document.getElementById(containerId);
    if (container) {
        container.appendChild(button);
    } else {
        console.error(`IDが "${containerId}" のコンテナ要素が見つかりません。`);
        // document.body.appendChild(button); // コンテナがない場合の代替
    }
}


// --- ここから変更 ---
// ページの読み込み完了後にボタンを作成
document.addEventListener('DOMContentLoaded', () => {
    const containerId = 'button-container'; // ボタンを追加するコンテナのID

    // 1から10までのボタンを作成するループ
    for (let i = 1; i <= 10; i++) {
        // ループの現在の数値 (i) を文字列に変換して numberText として使用
        const currentNumber = i.toString();

        // createIphoneLikeButton 関数を呼び出してボタンを生成
        createIphoneLikeButton(
            containerId,     // ボタンを追加する場所
            currentNumber,   // 表示する数字 (1, 2, ..., 10)
            () => {          // クリックされたときのアクション
                // クリックされたボタンの番号をアラートで表示
                alert(`ボタン ${currentNumber} がクリックされました！`);
            }
        );
    }
});