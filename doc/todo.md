# ToDo / 作業状況

## 実装済み機能

spec.md の要件との対照表。

| 機能 | 状態 | 備考 |
|---|---|---|
| デジタル時計ウィジェット | ✅ 完了 | 12h/24h・秒表示・日付・フルスクリーン |
| カレンダーウィジェット | ✅ 完了 | 当月表示・今日ハイライト・ローカル計算 |
| 天気予報ウィジェット | ✅ 完了 | 現在天気・Geolocation・30分更新 |
| オフライン対応 (PWA) | ✅ 完了 | Service Worker・OfflineBanner |
| ウィジェット・マネージャー | ✅ 完了 | 設定画面でトグル切り替え |
| フルスクリーン対応 | ✅ 完了 | ClockWidget にボタン実装 |
| レスポンシブ (Portrait/Landscape) | ✅ 完了 | Dashboard でレイアウト切り替え |
| LocalStorage 設定保存 | ✅ 完了 | SettingsContext で永続化 |
| GitHub Pages デプロイ | ✅ 完了 | HashRouter + base パス設定 |

---

## 未実装・改善項目

### 機能追加

- [ ] **テーマ切り替え (ダーク / ライト)**
  - spec.md §3.5 に記載あり、Settings 画面に未実装
  - SettingsContext に `theme: 'dark' | 'light'` を追加し、App.tsx の `createTheme` を動的化する

- [ ] **天気予報表示 (今日以降の数日間)**
  - 現在は現在天気のみ (`/data/2.5/weather`)
  - OpenWeatherMap `/data/2.5/forecast` (3時間ごと5日間) を活用する

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
