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
| 天気 API | OpenWeatherMap API v2.5 | — |

---

## 3. ディレクトリ構成

```
/
├── doc/                        ← ドキュメント
│   ├── spec.md                 ← 要件定義
│   ├── architecture.md         ← 本文書
│   └── todo.md                 ← 作業状況・残タスク
├── public/                     ← 静的アセット (favicon, PWA icons)
├── src/
│   ├── App.tsx                 ← ルート: ThemeProvider + Router
│   ├── main.tsx                ← エントリーポイント
│   ├── index.css               ← グローバルスタイル
│   ├── components/
│   │   ├── ClockWidget.tsx     ← 時計表示
│   │   ├── CalendarWidget.tsx  ← 月間カレンダー
│   │   ├── WeatherWidget.tsx   ← 天気予報
│   │   └── OfflineBanner.tsx   ← オフライン通知
│   ├── context/
│   │   └── SettingsContext.tsx ← 設定 (LocalStorage 永続化)
│   ├── hooks/
│   │   └── useWakeLock.ts      ← Screen Wake Lock API 管理
│   └── pages/
│       ├── Dashboard.tsx       ← メイン画面
│       └── Settings.tsx        ← 設定画面
├── index.html
├── vite.config.ts
├── tsconfig.app.json
└── package.json
```

---

## 4. コンポーネント仕様

### 4.1 ClockWidget

**ファイル:** `src/components/ClockWidget.tsx`

- `setInterval` で毎秒 `Date` オブジェクトを更新
- `settings.show24Hour` に応じて 12h/24h フォーマットを切り替え
- `settings.showSeconds` で秒表示をトグル
- 日付は日本語フォーマット: `YYYY年M月D日（曜日）`
- フルスクリーンボタン: `document.documentElement.requestFullscreen()` / `document.exitFullscreen()`
- タイポグラフィ: Roboto Mono、`15vw` → `9vw`（md ブレークポイント）でレスポンシブ

### 4.2 CalendarWidget

**ファイル:** `src/components/CalendarWidget.tsx`

- 外部 API 不要。純粋にローカル日付から当月カレンダーを計算
- `useMemo` でカレンダー日付配列をキャッシュ
- 月初の曜日に応じて先頭に `null` パディングを挿入
- 今日の日付を primary カラーの円でハイライト
- 日曜: 赤、土曜: 青（日本式配色）

### 4.3 WeatherWidget

**ファイル:** `src/components/WeatherWidget.tsx`

- `navigator.geolocation.getCurrentPosition()` で位置情報を取得
- OpenWeatherMap API エンドポイント:
  ```
  https://api.openweathermap.org/data/2.5/weather
    ?lat={lat}&lon={lon}&appid={key}&units=metric&lang=ja
  ```
- 30 分間隔（`UPDATE_INTERVAL = 1_800_000ms`）で自動更新
- API キー未設定時は設定画面へ誘導するメッセージを表示
- 天気アイコンコード (`01*`〜`13*`) を MUI Icons にマッピング

### 4.4 OfflineBanner

**ファイル:** `src/components/OfflineBanner.tsx`

- `window` の `online` / `offline` イベントを購読
- MUI `Collapse` でスライドイン/アウトアニメーション
- `"Offline Mode — カレンダー・天気は利用できません"` を表示

---

## 5. 状態管理

### SettingsContext

**ファイル:** `src/context/SettingsContext.tsx`

```typescript
interface Settings {
  show24Hour: boolean      // 24時間表記
  showSeconds: boolean     // 秒表示
  showCalendar: boolean    // カレンダーウィジェット表示
  showWeather: boolean     // 天気ウィジェット表示
  weatherApiKey: string    // OpenWeatherMap API キー
  keepAwake: boolean       // スリープ無効化 (Wake Lock)
}
```

- LocalStorage キー: `'pwa-clock-settings'`
- 読み込み時に保存値とデフォルト値をマージ（キー追加時の後方互換）
- `updateSetting<K>(key: K, value: Settings[K])` でタイプセーフに更新
- JSON パース失敗時はデフォルト値にサイレントフォールバック

---

## 6. データフロー

```
App.tsx
 └─ ThemeProvider (ダークテーマ固定)
     └─ SettingsProvider (LocalStorage ↔ Context)
         └─ HashRouter
             ├─ OfflineBanner     ← online/offline イベント
             └─ Routes
                 ├─ Dashboard (/)
                 │   ├─ useWakeLock()   ← settings.keepAwake
                 │   ├─ ClockWidget     ← useSettings()
                 │   ├─ CalendarWidget  ← useSettings() + isOnline
                 │   └─ WeatherWidget   ← useSettings() + isOnline + Geolocation
                 └─ Settings (/settings)
                     └─ updateSetting() → SettingsContext → LocalStorage
```

---

## 6.5 useWakeLock フック

**ファイル:** `src/hooks/useWakeLock.ts`

```typescript
export function useWakeLock(enabled: boolean): boolean
```

- `enabled=true` かつ `'wakeLock' in navigator` のとき `navigator.wakeLock.request('screen')` を呼び出す
- `visibilitychange` イベントを購読し、タブが再表示されたときにロックを再取得する（バックグラウンドで OS が自動解放するため）
- アンマウント時または `enabled=false` 時に `lock.release()` でロックを解放
- 戻り値: ロックが現在有効かどうか (`boolean`)

---

## 7. ルーティング

`HashRouter` を採用。理由: GitHub Pages はサブパス (`/pwa-clock/`) にデプロイされており、`BrowserRouter` では直接 URL アクセス時やリロード時に 404 が発生するため。

| パス | ページ |
|---|---|
| `/#/` | Dashboard (メイン時計画面) |
| `/#/settings` | Settings (設定画面) |

---

## 8. レスポンシブ設計

`window.matchMedia('(orientation: landscape)')` でデバイス向きを検出し、レイアウトを切り替える。

**Portrait (縦持ち):**
```
┌─────────────────┐
│  [Settings ⚙]  │
│                 │
│   🕐 12:34:56  │
│   2026年5月4日  │
│                 │
│  [カレンダー]   │
│  [天気予報]     │
└─────────────────┘
```

**Landscape (横持ち):**
```
┌──────────────────────────────┐
│                    [⚙]       │
│  🕐 12:34:56  │ [カレンダー] │
│  2026年5月4日  │ [天気予報]  │
└──────────────────────────────┘
```

カレンダー・天気が非表示の場合は時計が全幅で表示される。

---

## 9. PWA 設定

**ファイル:** `vite.config.ts`

| 項目 | 値 |
|---|---|
| registerType | `autoUpdate` |
| テーマカラー | `#121212` |
| 表示名 | デジタル時計 |
| ショート名 | Clock |
| アイコン | 192×192, 512×512 (maskable) |

Service Worker は Workbox が自動生成。静的アセットをキャッシュし、オフラインでも時計・カレンダーが動作する。

---

## 10. ビルド・デプロイ

```bash
npm run build   # TypeScript チェック + Vite ビルド → dist/
npm run preview # ビルド結果をローカルでプレビュー
```

- `base: '/pwa-clock/'` で GitHub Pages サブパス対応
- `dist/` を GitHub Pages の公開ディレクトリに設定
