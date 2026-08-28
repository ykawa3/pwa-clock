# PWA Clock 🕒

React + Vite で構築された、オフラインでも動作する多機能デジタル時計（Progressive Web App）です。

**🔗 [公開ページ (GitHub Pages) はこちら](https://ykawa3.github.io/pwa-clock/)**

---

## 🌟 特徴

- **多機能ウィジェット**: デジタル時計を中心に、天気予報や日本の祝日対応カレンダーを一つの画面に統合。
- **フルPWA対応**: インストール可能で、一度アクセスすればオフライン環境でも時計やカレンダーとして機能し続けます。
- **カスタマイズ性**: ウィジェットのドラッグ＆ドロップ配置、表示サイズの切り替え、テーマやレイアウトの調整に対応。
- **バッテリー最適化**: Screen Wake Lock API を使用したスリープ無効化と、Battery Status API による残量表示機能を搭載。

---

## 📖 プロジェクト・ドキュメント

開発・仕様・全体像に関する詳細は、以下のドキュメント群を参照してください。

- **[要件定義書 (spec.md)](./doc/spec.md)**
  アプリケーションが満たすべき機能や要件の一覧。
- **[アーキテクチャ設計書 (architecture.md)](./doc/architecture.md)**
  コンポーネント構成、状態管理、ライフサイクルの設計について。
- **[コントリビューション・ガイドライン (CONTRIBUTING.md)](./CONTRIBUTING.md)**
  ローカル環境のセットアップ手順、使用できるコマンド、開発への参加方法。
- **[作業状況・ToDo (todo.md)](./doc/todo.md)**
  実装済みの機能と、将来追加予定の機能（未実装タスク）の管理。

---

## 🛠️ 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動 (localhost:5173)
npm run dev

# テストの実行
npm test

# ビルド
npm run build
```

詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) をご確認ください。