---
name: pwa-clock-tasks
description: >-
  pwa-clock プロジェクトの開発・テスト・ビルド・リント等の定型タスクを実行するためのスキルです。
  ユーザーがテスト実行、型チェック、ビルド、リントなどを依頼した際に使用します。
---

# PWA Clock 開発・検証タスク

このプロジェクト（`pwa-clock`）は React 19 + TypeScript + Vite + Vitest で構成されています。

## 定型コマンド一覧

1. **テストの実行**:
   ```bash
   npm test
   ```
   テストフレームワークは Vitest を使用しています。

2. **リントチェック**:
   ```bash
   npm run lint
   ```
   ESLint によるコード検証を行います。

3. **型チェックおよびビルド**:
   ```bash
   npm run build
   ```
   TypeScript コンパイラによる型チェック（`tsc -b`）と Vite による本番ビルドを実行します。

4. **開発サーバー起動**:
   ```bash
   npm run dev
   ```
