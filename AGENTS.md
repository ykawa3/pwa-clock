# プロジェクト運用ルール & セキュリティガイドライン (pwa-clock)

本プロジェクトにおける Antigravity エージェントの動作ルールおよびセキュリティ・パーミッション方針です。

---

## 1. コマンド実行ポリシー (`run_command`)

### 許可されたコマンド (Allowed Commands)
以下のコマンドは通常実行が許可されています：
- パッケージ管理: `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm test` 等
- ビルド・型チェック: `npx tsc`, `npx prettier`, `npx eslint` 等
- 閲覧系 Git 操作: `git status`, `git diff`, `git log`
- ファイル閲覧・検索: `ls`, `cat`, `grep` 等

### 禁止されたコマンド (Denied Commands)
以下のコマンドは安全のため実行が禁止されています：
- 削除系コマンド: `rm`, `rmdir`, `Remove-Item`（明示的な指示がない限り危険な削除コマンドは禁止）
- 外部通信・リモート操作: `curl`, `wget`, `nc`, `ssh`
- リモートプッシュ: `git push`

### 確認が必要なコマンド (Ask for Permission)
- 変更を伴う Git コマンド（`git commit`, `git checkout`, `git merge`, `git rebase` 等）はユーザーへの確認を推奨します。

---

## 2. ファイルアクセス・編集ポリシー

### 閲覧制限 (Read Access Restrictions)
- **禁止**:
  - 環境変数ファイル: `.env*`（`.env`, `.env.local` 等の機密情報を含むファイル）
  - ユーザーディレクトリ直下の機密情報: `~/.ssh/**`, `~/.gnupg/**`, `~/.aws/**`, `~/.azure/**`, `~/.kube/**`, `~/.npmrc`, `~/.git-credentials`, `~/.config/gh/**`
- **許可**:
  - サンプルファイル: `.env.sample`, `.env.example` は閲覧可能

### 編集制限 (Edit Access Restrictions)
- シェル設定ファイル（`~/.bashrc`, `~/.bash_profile`, `~/.zshrc`, `~/.config/fish/**` 等）の編集は禁止です。

---

## 3. 開発および検証ガイドライン
- コード変更後は、適宜 `npm test` によるテスト実行や `npm run build` による型チェック・ビルド検証を行ってください。
- コミュニケーションおよびドキュメント作成は日本語を基本とします。
