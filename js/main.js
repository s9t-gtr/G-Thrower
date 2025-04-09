// js/main.js (修正後)
window.GThrower = window.GThrower || {};

(function(G, Matter) {
    // 依存関係の基本的なチェック (sceneManager自体もチェック)
    if (!Matter || !G.config || !G.initScenes ) { // G.initScenes が存在するかチェック
        console.error('GThrower or required functions/config/Matter.js or sceneManager.js are not loaded correctly.');
        return;
    }

    // --- DOM Ready 処理 ---
    // DOM要素が利用可能になってからシーンの初期化を実行
    document.addEventListener('DOMContentLoaded', function() {

        // Scene Manager の初期化を実行 (これによりイベントリスナー等が設定され、最初のシーンが表示される)
        G.initScenes();
        // ステージ1ボタン（モアイ画像付き）
        createIphoneLikeButton(
            'stage-buttons-container',
            '1',
            'Assets/images/moai.png', // 画像パスを指定
            () => {
                console.log('ステージ 1 開始！');
                // G.sceneManager.startGame(1); のような処理
            }
        );

        // ステージ2ボタン（画像なし、デフォルト背景）
        createIphoneLikeButton(
            'stage-buttons-container',
            '2',
            null, // 画像パスなし
            () => {
                console.log('ステージ 2 開始！');
                // G.sceneManager.startGame(2); のような処理
            }
        );

        // ステージ3ボタン（別の画像付き）
        createIphoneLikeButton(
            'stage-buttons-container',
            '3',
            'Assets/icons/star.svg', // 別の画像パス
            () => {
                console.log('ステージ 3 開始！');
                // G.sceneManager.startGame(3); のような処理
            }
        );
    }); // DOMContentLoaded の終わり

})(window.GThrower, window.Matter); // IIFEを実行