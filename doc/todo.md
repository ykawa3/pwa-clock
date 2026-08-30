# ToDo / 作業状況

## 実装済み機能

| 機能 | 状態 | 備考 |
|---|---|---|
| デジタル時計ウィジェット | ✅ 完了 | 12h/24h・秒表示・日付・フルスクリーン |
| カレンダーウィジェット | ✅ 完了 | 当月表示・今日ハイライト・ローカル計算。卓上カレンダー風UI |
| 天気予報ウィジェット | ✅ 完了 | APIキー不要モード、Geolocation・30分更新。本日の最高/最低気温表示 |
| オフライン対応 (PWA) | ✅ 完了 | Service Worker・OfflineBanner・明示的アップデートバナー (`UpdateBanner.tsx`) |
| ウィジェット・マネージャー | ✅ 完了 | 設定画面でトグル切り替え |
| フルスクリーン対応 | ✅ 完了 | Dashboard ヘッダーにボタン実装 |
| レスポンシブ (Portrait/Landscape) | ✅ 完了 | Dashboard でレイアウト切り替え |
| LocalStorage 設定保存 | ✅ 完了 | SettingsContext で永続化 |
| GitHub Pages デプロイ | ✅ 完了 | HashRouter + base パス設定 |
| ウィジェット配置編集 | ✅ 完了 | 3×3 グリッド・ドラッグ&ドロップ・モバイルタッチドラッグ対応 |
| スリープ無効化 (Wake Lock) | ✅ 完了 | `useWakeLock` フック・ヘッダーボタン・設定画面トグル |
| バッテリー残量表示 | ✅ 完了 | `useBatteryStatus` フック・ヘッダー左側にアイコン＋% 表示 |
| 表示サイズ設定 | ✅ 完了 | 小/中/大トグル・各ウィジェットに反映 |

---

## 未実装・改善項目

### 機能追加

- [ ] **ウィジェット追加: 日めくりカレンダー**
  - 今日の日付・曜日・祝日名を大きく表示する日めくりカレンダー風ウィジェット
  - 毎日 00:00 に自動で日付が切り替わる
  - 既存の CalendarWidget とは独立した新規コンポーネントとして実装する

- [ ] **ウィジェット追加: アナログ時計**
  - SVG で描画するアナログ時計ウィジェット
  - 秒針・分針・時針をアニメーション表示する
  - 既存の ClockWidget（デジタル）と同様に useSettings で 12h/24h 設定を参照する
  - Dashboard の 3×3 グリッドに追加できるように WidgetRenderer に登録する

- [ ] **テーマ切り替え (ダーク / ライト)**
  - SettingsContext に `theme: 'dark' | 'light'` を追加し、App.tsx の `createTheme` を動的化する

- [ ] **GitHub Actions による自動デプロイ**
  - `main` ブランチへの push 時に `npm run build` → `dist/` を gh-pages ブランチへデプロイ

### コード品質改善

- [ ] **`useIsOnline()` フックの共通化**
  - 現在 `Dashboard.tsx` と `OfflineBanner.tsx` で同じロジックが重複している
  - `src/hooks/useIsOnline.ts` に切り出して再利用する

- [ ] **PWA アイコン画像の用意**
  - `public/pwa-192x192.png` / `pwa-512x512.png` が SVG ファイルになっている
  - 実際の PNG ファイルを用意してインストール時のアイコン表示を正しくする

---

## 将来の拡張 (spec.md §6)

優先度は未定。

- [ ] **Google Calendar API 連携**
  - カレンダーウィジェットに予定を重ねて表示
  - OAuth 認証フローが必要

- [ ] **アラーム・タイマー機能**
  - 設定した時刻に通知 (Web Notifications API)
  - カウントダウンタイマー UI

- [ ] **背景画像カスタマイズ**
  - Unsplash API からランダム取得
  - ユーザーが画像 URL または検索キーワードを入力
