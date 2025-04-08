# 文字投げゲーム (個別ロード版)

## 概要

このプロジェクトは、物理演算ライブラリ Matter.js を使用した簡単なWebブラウザゲームです。画面左下の円の中から文字（現在は 'E' のみ）をドラッグ＆ドロップ（スワイプ）して投げ、画面内の木などのオブジェクトに当てて遊ぶことができます。

このバージョンは、特別なビルドツールやローカルWebサーバーを必要とせず、`index.html` ファイルを直接ブラウザで開くことで動作するように構成されています。

## 主な技術

* HTML5
* CSS3
* JavaScript (ES5 準拠、IIFEパターン使用)
* Matter.js (v0.19.0 - CDN経由で読み込み)

## ファイル構造

```
.
├── index.html         # アプリケーションのメインHTMLファイル
└── js/
    ├── constants.js     # ゲーム全体の設定定数
    ├── environment.js   # Matter.jsの環境設定（エンジン、壁、マウス等）
    ├── obstacle.js      # 障害物（木）の作成
    ├── letter.js        # 投げる文字オブジェクトの作成と操作
    └── main.js          # アプリケーション全体の初期化と実行
```

## 各ファイルの説明

### `index.html`

* ゲーム画面の基本的なHTML構造を定義します。
* ゲームの描画領域となる `<canvas id="gameCanvas">` 要素を含みます。
* 簡単な操作説明を表示します。
* Matter.js ライブラリ本体をCDNから読み込みます。
* `js/` ディレクトリ内の各 JavaScript ファイルを、依存関係を考慮した**正しい順序**で `<script>` タグを使って読み込みます。**`type="module"` 属性は使用しません。**

### `js/constants.js`

* ゲーム全体で使用される設定値（定数）を定義します。
* キャンバスのサイズ、物理エンジンの設定（重力、スリープ）、オブジェクトの色やサイズ、操作エリアの位置などが含まれます。
* すべての定数は、グローバルな `GThrower.config` オブジェクトのプロパティとして格納され、他のファイルから参照されます。
* **最初に読み込まれる必要があります。**

### `js/environment.js`

* Matter.js の物理エンジン (`Engine`) と描画エンジン (`Render`) のセットアップを行います。
* 画面を囲む壁を作成し、ワールドに追加します。
* マウス操作（ドラッグ＆ドロップ）のための `MouseConstraint` を設定します。
    * 操作可能なエリア（左下の円）を定義し、その外ではオブジェクトを掴めないように、またドラッグ中に円の外に出たら自動的に離すように制御します。
* 主要な関数 (`setupEngine`, `setupRenderer`, `createWalls`, `setupMouseInteraction`) や、生成されたインスタンス (`GThrower.engine`, `GThrower.world`, `GThrower.render` など）は、グローバルな `GThrower` オブジェクトに追加されます。
* `constants.js` と Matter.js 本体に依存します。

### `js/obstacle.js`

* ゲーム内の静的な障害物（現在は木のみ）を作成するロジックを含みます。
* `createBareTree` (内部関数) で木の形状を定義し、`addDefaultTree` 関数でデフォルトの位置に木を作成してワールドに追加します。
* `addDefaultTree` 関数は `GThrower` オブジェクトに追加されます。
* `constants.js`, `environment.js` (G.worldが設定されていること), Matter.js 本体に依存します。

### `js/letter.js`

* プレイヤーが投げる対象となる文字オブジェクト（現在は 'E' のみ）に関するロジックを含みます。
* `letterCreators` (内部オブジェクト) で文字の形状を作成する関数を管理します。
* `initializeLetters` 関数で、指定された文字を指定された数だけ初期位置（操作エリアの中心）に配置します。
* `setupSwipeMotion` 関数で、マウスの `mouseup` イベントを監視し、操作エリア内でオブジェクトが離された際に、スワイプの勢いに応じた速度をオブジェクトに与えるイベントリスナーを設定します。
* `initializeLetters` と `setupSwipeMotion` 関数は `GThrower` オブジェクトに追加されます。
* `constants.js`, `environment.js` (G.world, G.mouseConstraintが設定されていること), Matter.js 本体に依存します。

### `js/main.js`

* アプリケーション全体のエントリーポイントとなるスクリプトです。
* `DOMContentLoaded` イベントを待ってから、初期化処理を開始します。
* `GThrower` オブジェクトに格納された各セットアップ関数 (`setupEngine`, `setupRenderer` など) を呼び出して、ゲーム環境を構築します。
* `GThrower.addDefaultTree` と `GThrower.initializeLetters` を呼び出して、オブジェクトを配置します。
* `GThrower.setupSwipeMotion` を呼び出して、投げる操作のイベントリスナーを設定します。
* Matter.js の `Runner` と `Render` を開始し、物理演算と描画ループをスタートさせます。
* 追加機能として、操作可能エリアの円を描画するイベントリスナーと、画面外に出たオブジェクトを定期的に削除するタイマーを設定します。
* **他のすべての `js` ファイルと Matter.js 本体に依存するため、最後に読み込まれる必要があります。**

## 実行方法

1.  このリポジトリ（またはファイル一式）をダウンロードします。
2.  **`index.html` ファイルを任意のモダンな Web ブラウザで直接開きます。** (例: ファイルをダブルクリックする、ブラウザのアドレスバーに `file:///.../index.html` のようなパスを入力する)

特別なビルド手順やローカルWebサーバーの起動は不要です。

## コードの構造について

* **ES Modules 不使用:** このプロジェクトでは、`import`/`export` 構文（ES Modules）を使用していません。代わりに、HTML 内で `<script>` タグを順番に読み込むことでファイル間の依存関係を解決しています。
* **グローバル名前空間:** グローバルスコープの汚染を最小限に抑えるため、アプリケーション固有の関数やデータは `window.GThrower` という単一のグローバルオブジェクト（名前空間）に格納されています。
* **IIFE パターン:** `constants.js` を除く各 `js` ファイルは、IIFE (Immediately Invoked Function Expression) `(function(G, Matter){ ... })(window.GThrower, window.Matter);` で囲まれています。これにより、ファイル内のローカル変数がグローバルスコープに漏れるのを防ぎつつ、必要なグローバルオブジェクト (`GThrower`, `Matter`) を安全に参照しています。

```