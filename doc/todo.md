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
| 天気: 位置情報の手動選択 | ✅ 完了 | GPS / 都市名検索 / プリセット12都市をダイアログで切り替え |
| 天気予報表示 (5日間) | ✅ 完了 | `/data/2.5/forecast` で最高/最低気温つき5日間表示 |
| カレンダーの月切り替え | ✅ 完了 | 前月/翌月ボタン・今日に戻るボタン実装済み |

---

## 未実装・改善項目

### 機能追加

- [ ] **天気予報に本日の最高気温・最低気温を表示する**
  - 5日間予報は実装済みだが、現在天気セクションに今日の最高/最低が表示されていない
  - `/data/2.5/forecast` の当日分データ（00:00〜21:00 の 3h スロット）から min/max を集計して現在天気欄に追加表示する

- [ ] **アプリの明示的なアップデート手段を実装する**
  - PWA の Service Worker キャッシュにより、ユーザーが古いバージョンを使い続けることがある
  - 新しい SW が待機中のとき「アップデートがあります」バナーを表示し、タップで即時適用する
  - `vite-plugin-pwa` の `useRegisterSW` フックで `needRefresh` / `updateServiceWorker` を利用する

- [ ] **表示サイズ設定（スマホ / タブレット / デスクトップ）**
  - タブレットと小型スマホで最適なアイコンサイズ・文字サイズが異なる
  - 設定画面に「表示サイズ」セレクター（小 / 中 / 大）を追加し、SettingsContext に保存する
  - 各ウィジェットのフォントサイズ・アイコンサイズ・余白をテーマ変数で切り替える

- [ ] **ウィジェット編集のモバイル対応（タッチドラッグ）**
  - 現在の実装は HTML5 Drag & Drop API を使用しており、タブレット・スマホでは動作しない
  - Pointer Events API または `touch` イベントでドラッグ処理を再実装してモバイルファーストにする
  - 代替案: 編集モード中にウィジェットを長押しで選択 → タップで移動先スロットを指定する UI も検討する

- [ ] **カレンダーウィジェットの UI 改善（卓上カレンダー風）**
  - 現在の祝日表示はホバー（`title` 属性）でのみ確認でき、モバイルでは視認できない
  - 祝日名をセル内に直接テキスト表示し、ホバーなしで一目でわかるようにする
  - 目標: 卓上カレンダーのように、各日付・曜日・祝日名が常時表示される UI

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
  - Settings 画面に未実装
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
