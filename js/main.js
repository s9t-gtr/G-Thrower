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
    }); // DOMContentLoaded の終わり

})(window.GThrower, window.Matter); // IIFEを実行