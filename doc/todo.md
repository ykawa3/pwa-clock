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
| フルスクリーン対応 | ✅ 完了 | Dashboard ヘッダーにボタン実装 |
| レスポンシブ (Portrait/Landscape) | ✅ 完了 | Dashboard でレイアウト切り替え |
| LocalStorage 設定保存 | ✅ 完了 | SettingsContext で永続化 |
| GitHub Pages デプロイ | ✅ 完了 | HashRouter + base パス設定 |
| ウィジェット配置編集 | ✅ 完了 | 3×3 グリッド・ドラッグ&ドロップ・LocalStorage 保存 |
| スリープ無効化 (Wake Lock) | ✅ 完了 | `useWakeLock` フック・ヘッダーボタン・設定画面トグル |
| バッテリー残量表示 | ✅ 完了 | `useBatteryStatus` フック・ヘッダー左側にアイコン＋% 表示 |

---

## 未実装・改善項目

### 機能追加

- [ ] **天気予報に本日の最高気温・最低気温を表示する**
  - OpenWeatherMap `/data/2.5/forecast` の当日分データから min/max を集計して表示する
  - 現在の WeatherWidget に「今日の最高/最低」として追加表示する

- [ ] **アプリの明示的なアップデート手段を実装する**
  - PWA の Service Worker キャッシュにより、ユーザーが古いバージョンを使い続けることがある
  - 新しい SW が待機中のとき「アップデートがあります」バナーを表示し、タップで即時適用する
  - `vite-plugin-pwa` の `useRegisterSW` フックで `needRefresh` / `updateServiceWorker` を利用する

- [ ] **天気: 位置情報の取得方法を選択できるようにする**
  - 現在は Geolocation (GPS) のみ
  - 設定画面で「GPS を使用する」/ 「地域を手動選択する」を切り替えられるようにする
  - 手動選択時は都市名またはテキスト入力で地域を指定する

- [ ] **ウィジェットの表示位置をユーザーが変更できるようにする**
  - 時計・カレンダー・天気の並び順と配置（左・中・右、上・下）を設定画面で変更できるようにする
  - 設定を LocalStorage に保存する

- [ ] **テーマ切り替え (ダーク / ライト)**
  - spec.md §3.5 に記載あり、Settings 画面に未実装
  - SettingsContext に `theme: 'dark' | 'light'` を追加し、App.tsx の `createTheme` を動的化する

- [ ] **天気予報表示 (今日以降の数日間)**
  - 現在は現在天気のみ (`/data/2.5/weather`)
  - OpenWeatherMap `/data/2.5/forecast` (3時間ごと5日間) を活用する

- [ ] **GitHub Actions による自動デプロイ**
  - `main` ブランチへの push 時に `npm run build` → `dist/` を gh-pages ブランチへデプロイ

### UI 改善

- [x] **天気ウィジェットのコンテンツを中央揃えにする**
  - 現在は左揃え (`display: flex` の初期値)
  - `justifyContent: 'center'` または `textAlign: 'center'` で中央に寄せる

- [x] **カレンダーの月切り替えボタンを追加する**
  - カレンダー上部に「◀ 前月 / 翌月 ▶」ボタンを追加
  - 表示月を state で管理し、今月以外の場合は「今月に戻る」ボタンも表示する

### コード品質改善

- [ ] **`useIsOnline()` フックの共通化**
  - 現在 `Dashboard.tsx` と `OfflineBanner.tsx` で同じロジックが重複している
  - `src/hooks/useIsOnline.ts` に切り出して再利用する

- [ ] **PWA アイコン画像の用意**
  - `public/pwa-192x192.png` / `pwa-512x512.png` が SVG ファイルになっている
  - 実際の PNG ファイルを用意してインストール時のアイコン表示を正しくする

---

## 進行中の設計・実装タスク

### 天気ウィジェット: APIキー不要モード対応

**方針:** 設定画面にトグルを追加し、ON/OFF で天気 API を切り替える。

| トグル | 使用 API | 備考 |
|---|---|---|
| OFF (デフォルト) | [Open-Meteo](https://open-meteo.com/) | 無料・キー不要 |
| ON | OpenWeatherMap | 現行実装、APIキー入力が必要 |

**実装ステップ:**

- [ ] `SettingsContext` に `useApiKey: boolean` を追加 (デフォルト: `false`)
- [ ] `Settings.tsx` に「OpenWeatherMap APIキーを使用する」スイッチを追加
  - OFF 時は APIキー入力欄を非表示にする
- [ ] `WeatherWidget.tsx` を分岐
  - `useApiKey === false` → Open-Meteo API で取得
  - `useApiKey === true` → 従来の OpenWeatherMap で取得
- [ ] Open-Meteo レスポンス → `WeatherData` 型へのマッピング実装
  - 天気コードは WMO 形式 (OpenWeatherMap の `icon` 文字列とは別体系)
  - `WeatherIcon` コンポーネントのアイコンマッピングを WMO コードに対応させる
- [ ] 都市名の取得: Open-Meteo は都市名を返さないため、Nominatim (OSM Reverse Geocoding) を使用
  - エンドポイント: `https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json`

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
