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
        // ステージボタンのコンテナID
        const containerId = 'stage-buttons-container';
        // 画像ファイルのベースパス
        const iconsBasePath = 'Assets/images/icons/';

        // 1. コロッセオ (Colosseum)
        createIphoneLikeButton(
            containerId,
            '1', // ステージ番号
            iconsBasePath + 'colosseum.png',
            () => {
                console.log('ステージ 1 開始！ (Colosseum)');
                // G.sceneManager.startGame(1); のような処理
            }
        );

        // 2. エッフェル塔 (Eiffel Tower)
        createIphoneLikeButton(
            containerId,
            '2',
            iconsBasePath + 'eiffel_tower.png',
            () => {
                console.log('ステージ 2 開始！ (Eiffel Tower)');
                // G.sceneManager.startGame(2); のような処理
            }
        );

        // 3. 五重塔 (Five-storied Pagoda)
        createIphoneLikeButton(
            containerId,
            '3',
            iconsBasePath + 'Five-storied_pagoda.png',
            () => {
                console.log('ステージ 3 開始！ (Five-storied Pagoda)');
                // G.sceneManager.startGame(3); のような処理
            }
        );

        // 4. 清水寺 (Kiyomizu Temple)
        createIphoneLikeButton(
            containerId,
            '4',
            iconsBasePath + 'kiyomizu_temple.png',
            () => {
                console.log('ステージ 4 開始！ (Kiyomizu Temple)');
                // G.sceneManager.startGame(4); のような処理
            }
        );

        // 5. モアイ (Moai) - 例にもありましたがリストに含まれていたため再掲
        createIphoneLikeButton(
            containerId,
            '5',
            iconsBasePath + 'moai.png',
            () => {
                console.log('ステージ 5 開始！ (Moai)');
                // G.sceneManager.startGame(5); のような処理
            }
        );

        // 6. モン・サン＝ミシェル (Mont Saint-Michel)
        createIphoneLikeButton(
            containerId,
            '6',
            iconsBasePath + 'mont_saint-michel.png',
            () => {
                console.log('ステージ 6 開始！ (Mont Saint-Michel)');
                // G.sceneManager.startGame(6); のような処理
            }
        );

        // 7. スフィンクス (Sphinx)
        createIphoneLikeButton(
            containerId,
            '7',
            iconsBasePath + 'sphinx.png',
            () => {
                console.log('ステージ 7 開始！ (Sphinx)');
                // G.sceneManager.startGame(7); のような処理
            }
        );

        // 8. 自由の女神 (Statue of Liberty)
        createIphoneLikeButton(
            containerId,
            '8',
            iconsBasePath + 'statue_of_liberty.png',
            () => {
                console.log('ステージ 8 開始！ (Statue of Liberty)');
                // G.sceneManager.startGame(8); のような処理
            }
        );
    }); // DOMContentLoaded の終わり

})(window.GThrower, window.Matter); // IIFEを実行