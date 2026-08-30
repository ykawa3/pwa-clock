# セキュリティおよび権限ルール (Security & Permission Rules)

## 許可コマンド
- `npm install`, `npm run *`, `npm test`
- `npx tsc`, `npx prettier`, `npx eslint`
- `git status`, `git diff`, `git log`
- `ls`, `cat`, `grep`

## 禁止操作
- `rm` やファイル削除コマンド
- `curl`, `wget`, `nc`, `ssh` 等の外部通信
- `git push`
- `.env*` ファイル（`.env`, `.env.local` 等）および `~/.ssh/`, `~/.aws/` などの認証・機密ファイルの読み込み
- `~/.bashrc`, `~/.zshrc` 等のシェル設定ファイルの編集

## 確認対象操作
- `git commit`, `git checkout` 等の変更を伴う Git 操作
