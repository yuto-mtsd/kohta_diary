# Kohta Diary Website

`diary-app.jsx` をそのままアプリ本体として公開するための構成です。

## Local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Publish (GitHub Pages)

`main` への push で `.github/workflows/deploy-pages.yml` が実行され、`dist` が GitHub Pages にデプロイされます。

公開 URL:

`https://yuto-mtsd.github.io/kohta_diary/`

## Note

- 日記の保存データはブラウザの `localStorage` に保存されます。
- AI 機能は `/api/claude` エンドポイントが存在する環境でのみ動作します。
