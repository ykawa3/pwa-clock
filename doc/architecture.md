# アーキテクチャ設計書: 多機能デジタル時計 PWA

## 1. システム概要

常時表示を想定した「置き時計」PWA。スマートフォン・タブレットの横置き/縦置きに対応し、オフライン環境でも時計機能が損なわれないように設計されている。

---

## 2. 技術スタック

| カテゴリ | ライブラリ / ツール | バージョン |
|---|---|---|
| フレームワーク | React | ^19.2 |
| ビルドツール | Vite | ^8.0 |
| UI ライブラリ | Material UI (MUI) | ^9.0 |
| PWA | vite-plugin-pwa (Workbox) | ^1.2 |
| ルーティング | react-router-dom | ^7.14 |
| 言語 | TypeScript | ~6.0 |
| 祝日データ | @holiday-jp/holiday_jp | ^2.5 |
| 天気 API (標準) | Open-Meteo | キー不要 |
| 天気 API (オプション) | OpenWeatherMap API v2.5 | APIキー必要 |

---

## 3. ディレクトリ構成

```
/
├── doc/                              ← ドキュメント
│   ├── spec.md                       ← 要件定義
│   ├── architecture.md               ← 本文書
│   └── todo.md                       ← 作業状況・残タスク
├── public/                           ← 静的アセット (favicon, PWA icons)
├── src/
│   ├── App.tsx                       ← ルート: Provider ツリー + Router
│   ├── main.tsx                      ← エントリーポイント
│   ├── index.css                     ← グローバルスタイル
│   ├── components/
│   │   ├── ClockWidget.tsx           ← デジタル時計
│   │   ├── AnalogClockWidget.tsx     ← アナログ時計 (SVG)
│   │   ├── CalendarWidget.tsx        ← 月間カレンダー
│   │   ├── DailyCalendarWidget.tsx   ← 日めくりカレンダー
│   │   ├── WeatherWidget.tsx         ← 天気予報
│   │   ├── BatteryWidget.tsx         ← バッテリー大表示
│   │   ├── OfflineBanner.tsx         ← オフライン通知
│   │   └── UpdateBanner.tsx          ← SW 更新通知
│   ├── context/
│   │   ├── SettingsContext.tsx       ← 設定 (LocalStorage 永続化)
│   │   └── SizeScaleContext.ts       ← 表示スケール値の配布
│   ├── hooks/
│   │   ├── useWakeLock.ts            ← Screen Wake Lock API
│   │   ├── useBatteryStatus.ts       ← Battery Status API
│   │   └── usePwaUpdate.ts           ← PWA 手動更新・キャッシュクリア
│   ├── pages/
│   │   ├── Dashboard.tsx             ← メイン画面 (ウィジェット配置)
│   │   └── Settings.tsx              ← 設定画面
│   └── test/
│       ├── setup.ts                  ← @testing-library/jest-dom
│       └── mocks/pwa-register-react.ts
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.app.json
└── package.json
```

---

## 4. Provider ツリーとデータフロー

```
App.tsx
 └─ SettingsProvider          ← LocalStorage ↔ Context (settings / updateSetting)
     └─ ThemeWrapper
         ├─ ThemeProvider     ← displaySize に応じて MUI テーマを動的生成
         ├─ SizeScaleContext  ← スケール値 (0.85 / 1.0 / 1.2) を全子孫に配布
         ├─ CssBaseline
         ├─ UpdateBanner      ← SW needRefresh を検知して更新バナー表示
         └─ HashRouter
             ├─ OfflineBanner ← online/offline イベント購読
             └─ Routes
                 ├─ Dashboard (/)
                 │   ├─ useWakeLock(settings.keepAwake)
                 │   ├─ useBatteryStatus()        ← ヘッダーアイコン用
                 │   └─ WidgetRenderer(id)        ← 各ウィジェットに委譲
                 └─ Settings (/settings)
                     └─ updateSetting() → SettingsContext → LocalStorage
```

---

## 5. ウィジェットシステム

### 5.1 WidgetConfig と 3×3 グリッド

`Dashboard.tsx` はウィジェット配置を `WidgetConfig[]` で管理する。

```typescript
interface WidgetConfig {
  id: string        // 'clock' | 'analog-clock' | 'calendar' | 'daily-calendar'
                    // | 'weather' | 'battery'
  label: string     // 編集モードで表示するラベル
  slot: SlotPosition  // 'top-left' | 'top-center' | ... | 'bottom-right' (9種)
}
```

- LocalStorage キー: `dashboard_widget_layout_v4`
- `loadLayout()` は保存値を検証し、`DEFAULT_LAYOUT` の全 ID が含まれなければリセット
- **新ウィジェット追加時はキーをインクリメントすること**

### 5.2 ウィジェット追加の手順

1. `src/components/XxxWidget.tsx` を作成
2. `Dashboard.tsx` の `DEFAULT_LAYOUT` にエントリ追加
3. `Dashboard.tsx` の `WidgetRenderer` に `case 'xxx':` を追加
4. `Dashboard.tsx` の `isWidgetVisible` に可視性ロジックを追加
5. `SettingsContext.tsx` に `showXxx: boolean` を追加（デフォルト `true`）
6. `Settings.tsx` の「ウィジェット表示」セクションにトグルを追加
7. `LAYOUT_STORAGE_KEY` を `vN+1` にインクリメント

### 5.3 デフォルトレイアウト

| スロット | ウィジェット |
|---|---|
| `top-left` | バッテリー |
| `top-center` | デジタル時計 |
| `top-right` | 日めくりカレンダー |
| `middle-center` | アナログ時計 |
| `bottom-left` | カレンダー |
| `bottom-right` | 天気 |

---

## 6. 状態管理

### 6.1 SettingsContext

**ファイル:** `src/context/SettingsContext.tsx`

```typescript
interface Settings {
  show24Hour: boolean       // 24時間表記
  showSeconds: boolean      // 秒表示
  showClock: boolean        // デジタル時計ウィジェット
  showCalendar: boolean     // カレンダーウィジェット
  showWeather: boolean      // 天気ウィジェット
  showBattery: boolean      // バッテリーウィジェット
  showDailyCalendar: boolean // 日めくりカレンダーウィジェット
  showAnalogClock: boolean  // アナログ時計ウィジェット
  weatherApiKey: string     // OpenWeatherMap API キー
  keepAwake: boolean        // スリープ無効化
  displaySize: 'small' | 'medium' | 'large'
  useApiKey: boolean        // OpenWeatherMap 使用フラグ
}
```

- LocalStorage キー: `'pwa-clock-settings'`
- 読み込み時に `{ ...DEFAULTS, ...JSON.parse(raw) }` でマージ（新フィールドの後方互換）

### 6.2 SizeScaleContext

**ファイル:** `src/context/SizeScaleContext.ts`

- `displaySize` から数値スケール（small: 0.85 / medium: 1.0 / large: 1.2）に変換した値を配布
- 各ウィジェットは `useSizeScale()` でスケールを取得し、`fontSize: { xs: \`${N * scale}vw\` }` のように掛け合わせる

---

## 7. コンポーネント仕様

### ClockWidget

- `setInterval` で毎秒 `Date` を更新
- `show24Hour` / `showSeconds` を `useSettings` で参照
- 日付フォーマット: `YYYY年M月D日（曜日）`

### AnalogClockWidget

- `setInterval` で毎秒 `Date` を更新
- SVG `viewBox="0 0 200 200"`、`width` を `vw × scale` でレスポンシブ対応
- `show24Hour=false`: 12目盛り、時針が12時間で1回転
- `show24Hour=true`: 24目盛り、時針が24時間で1回転

### CalendarWidget

- 外部 API 不要のローカル計算
- `@holiday-jp/holiday_jp` の `holidaysData.between(start, end)` で祝日を取得
- `getHolidaysForMonth(year, month): Map<number, string>` をエクスポート（DailyCalendarWidget が再利用）
- 卓上カレンダー風 UI: 各セルを上下2段構成（上: 日付サークル、下: 祝日名テキスト）

### DailyCalendarWidget

- 年・月・日・曜日・祝日名を大きく表示
- `setTimeout` で次の深夜0時を計算し、日付を正確に切り替える
- 日曜・祝日: `error.main`（赤）、土曜: `info.main`（青）

### WeatherWidget

- Open-Meteo（デフォルト）または OpenWeatherMap（`useApiKey=true`）を使用
- 30 分間隔で自動更新
- Nominatim (OSM) で逆ジオコーディング（都市名表示）
- GPS / 都市名検索 / プリセット12都市の切り替えに対応

### BatteryWidget

- `useBatteryStatus()` でバッテリー残量・充電状態を取得
- 大きなアイコン＋パーセンテージを中央表示
- `level === null` の場合は「バッテリー非対応」を表示

### OfflineBanner

- `window` の `online` / `offline` イベントを購読
- MUI `Collapse` でスライドイン/アウトアニメーション

### UpdateBanner

- PWAの新しい Service Worker がインストールされたことを検知して表示
- `registerType: 'prompt'` に対応
- ユーザーが「今すぐ更新」をクリックするとアプリをリロードして最新化

---

## 8. フック

### useWakeLock

```typescript
export function useWakeLock(enabled: boolean): boolean
```

- `enabled=true` かつ `'wakeLock' in navigator` のとき `navigator.wakeLock.request('screen')`
- `visibilitychange` でバックグラウンド復帰時にロックを再取得

### useBatteryStatus

```typescript
interface BatteryStatus { level: number | null; charging: boolean }
export function useBatteryStatus(): BatteryStatus
```

- `navigator.getBattery?.()` で `BatteryManager` を取得
- `levelchange` / `chargingchange` イベントを購読
- 非対応環境: `{ level: null, charging: false }`

### usePwaUpdate

```typescript
export function usePwaUpdate(): {
  checking: boolean
  result: UpdateCheckResult | null
  checkForUpdate: () => Promise<UpdateCheckResult>
  clearCacheAndReload: () => Promise<void>
}
```

- `checkForUpdate()`: SW の更新を手動チェック → 結果を返す
- `clearCacheAndReload()`: 全キャッシュ削除 → SW 登録解除 → リロード（LocalStorage は保持）

---

## 9. ルーティング

`HashRouter` を採用（GitHub Pages サブパス `/pwa-clock/` での直接 URL アクセス対策）。

| パス | ページ |
|---|---|
| `/#/` | Dashboard（メイン画面） |
| `/#/settings` | Settings（設定画面） |

---

## 10. レスポンシブ設計

`window.matchMedia('(orientation: landscape)')` でデバイス向きを検出しレイアウトを切り替える。

- **Portrait**: ウィジェットを行順に縦スタック
- **Landscape**: 行ごとに横並び、複数ウィジェットは同一行内で flex 配置

編集モードは常に 3×3 CSS Grid（`gridTemplateColumns: '1fr 1fr 1fr'`）で全スロットを表示。

---

## 11. PWA 設定

| 項目 | 値 |
|---|---|
| registerType | `prompt`（自動適用しない） |
| 更新検知 | `UpdateBanner.tsx` が `needRefresh` を監視し「今すぐ更新」バナーを表示 |
| 手動更新 | Settings 画面の「最新版を確認」「キャッシュクリア」ボタン |
| テーマカラー | `#121212` |
| 表示名 | デジタル時計 |

---

## 12. ビルド・デプロイ

```bash
npm run dev       # 開発サーバー (0.0.0.0 バインド)
npm run build     # tsc -b && vite build → dist/
npm run preview   # ビルド結果をローカルでプレビュー
npx vitest run    # テスト一括実行
npx tsc --noEmit  # 型チェックのみ
```

- `base: '/pwa-clock/'` で GitHub Pages サブパス対応
