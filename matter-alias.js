// matter-alias.js

// Matter.js のグローバルオブジェクトが存在するか確認
if (typeof Matter === 'undefined') {
    throw new Error('Matter.js library is not loaded.');
    // もしくは CDN などから動的にロードする処理を追加
}

// 必要なモジュールをエイリアスとしてエクスポート
export const Engine = Matter.Engine;
export const Render = Matter.Render;
export const Runner = Matter.Runner;
export const Body = Matter.Body;
export const Bodies = Matter.Bodies;
export const Composite = Matter.Composite;
export const Constraint = Matter.Constraint;
export const Events = Matter.Events;
export const Mouse = Matter.Mouse;
export const MouseConstraint = Matter.MouseConstraint;
export const World = Matter.World; // World も追加しておくと便利
