# 農園業務Webアプリ（farm-app）

フルーツ農園の現場で起きている「情報共有・記録の混乱」を、Webアプリで解決するプロジェクト。  
**作業ログ（誰が/何を/いつ/どこで）** を軸に、在庫・日報・温湿度・招待まで一体化しています。

---

## デモ
- 公開URL: （準備中）
- YouTubeデモ: （準備中）

---

## 主な機能
- 作業ログ（開始 / 中断 / 再開 / 完了）とタイムライン表示
- 在庫の入出庫・棚卸し、残量の可視化
- 日報作成（天気・出勤・作業内容・報連相）
- 温度計測（場所タブ / 月次入力）
- 招待制アカウント（管理者 / 作業者）

---

## 技術スタック
### Backend
- Laravel 12.x
- SQLite（開発）
- REST API（JSON）

### Frontend
- React（Vite）
- fetch による API 通信

---

## ローカル起動
### 前提
- PHP / Composer
- Node.js

### Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 初期データ / ログイン
- 管理者: `test@example.com` / `bbbbbbbb`
- 作業者: （必要なら追加）

---

## 複数端末での確認方法
- 同一LAN内の別端末から `http://<開発PCのIP>:5173` へアクセス
- 作業ログは **3秒ごと** に自動反映
- 在庫・日報・温度はタブ切替や再読み込みで反映

---

## 画面イメージ
（スクリーンショットを追加予定）

---

## 今後の改善
- WebSocket によるリアルタイム更新
- UIコンポーネント分割とコード整理
- 自動計測機器からの温度データ取り込み

---

## ライセンス / 素材
- ロゴ・画像は提供素材を使用
