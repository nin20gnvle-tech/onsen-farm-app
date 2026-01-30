# 農園業務Webアプリ（farm-app）

フルーツ農園の現場で起きている「情報共有・記録の混乱」を、Webアプリで解決するプロジェクト。  
主に **作業ログ（誰が/何を/いつ/どこで）** を軸に、在庫・温湿度・チャット（画像/動画）まで一体化していく。

---

## 1. 解決したい課題

### 現場の痛み
- 誰が・何を・何時に・どこまで作業したか分からない（引き継ぎが曖昧）
- 在庫管理が手書きで、入出庫の履歴が残りづらい
- 温度/湿度などの測定が手書きで、後から追いにくい
- 情報共有が口頭/LINE依存で、後から検索できない

---

## 2. 目標（MVP → 拡張）

### MVP（最優先）
- 作業ログを「開始 / 一時停止 / 再開 / 完了」で記録（時刻自動）
- ダッシュボードで「今動いてる作業」「今日完了した作業」を圃場ごとに一覧
- “いつ” が直感で分かるタイムライン（ガント風）

### 拡張
- 在庫の入出庫履歴（棚卸し調整含む）
- 温湿度などの測定ログ（作業ログに紐付け）
- 全体1部屋のチャット（画像/動画アップ、動画は60秒まで）
- 会員登録・権限（管理者/作業者）＋招待制

---

## 3. 技術スタック
### Backend
- Laravel 12.x
- DB: SQLite（開発）→ 将来 MySQL/PostgreSQL
- API: JSON（React から fetch）
- リアルタイム: WebSocket（最初からリアルタイムを想定）

### Frontend
- React（Vite）
- API通信: fetch
- 表示: スマホ優先（レスポンシブは後で最適化するが、設計はスマホ基準）

---

## 4. 全体アーキテクチャ（概念）

- React（UI）  
  → Laravel API を叩く  
  → タイムライン表示 / ダッシュボード表示

- Laravel（API + 認証 + データ）  
  → 作業ログ/在庫/測定/チャットを一元管理  
  → WebSocketでチャットや作業状態をリアルタイム更新（将来）

---

## 5. データベース設計（確定案）

> 方針：DBは「最低限の整合性」、複雑な条件（例：測定タスクだけ必須など）は **APIバリデーション** で担保。

### 5.1 マスタ系（基本はシンプル）

#### products（作物）
- id
- name **NOT NULL**
- is_active **NOT NULL** default true
- timestamps

#### fields（圃場）
- id
- name **NOT NULL**
- default_product_id **NULL可**（作物未確定の圃場がある）
- is_active **NOT NULL** default true
- timestamps

#### task_types（作業種別）
- id
- name **NOT NULL**
- is_active **NOT NULL** default true
- timestamps

#### items（在庫品目）
- id
- name **NOT NULL**
- unit **NOT NULL**（単位が無いと数量の意味が壊れる）
- is_active **NOT NULL** default true
- timestamps

---

### 5.2 タスク管理（最重要：work_logs / pause_events）

#### work_logs（作業ログ）
**FK**
- user_id **NOT NULL**
- field_id **NOT NULL**
- task_type_id **NOT NULL**
- product_id **NULL可**

**状態**
- status **NOT NULL** enum: `running | paused | done`

**時間**
- started_at **NOT NULL**
- paused_at **NULL可**（paused時のみ）
- ended_at **NULL可**（done時のみ）

**任意**
- quantity **NULL可**
- unit **NULL可**（quantityがある時だけ意味）
- memo **NULL可**

**測定系（WorkLogに入れる前提）**
- measure_type **NULL可**
- measure_value **NULL可**
- measured_at **NULL可**

> 例：task_type が「測定」のときだけ  
> measure_type / measure_value を必須化（DBでNOT NULLにはしない）

**Index推奨**
- (status, started_at)
- (field_id, started_at)
- (user_id, started_at)

#### pause_events（一時停止/再開の履歴）
- id
- work_log_id **NOT NULL**
- user_id **NOT NULL**
- action **NOT NULL** enum: `pause | resume`
- at **NOT NULL**
- timestamps
- index: (work_log_id, at)

---

### 5.3 在庫管理（stock_txns）

#### stock_txns（入出庫履歴）
- id
- item_id **NOT NULL**
- user_id **NOT NULL**
- type **NOT NULL** enum: `in | out | adjust_in | adjust_out`
- quantity **NOT NULL**（正数）
- occurred_at **NOT NULL**
- memo **NULL可**
- timestamps

---

### 5.4 チャット（本文なし投稿OK）

#### chat_messages
- id
- user_id **NOT NULL**
- message **NULL可**（画像/動画だけ投稿OK）
- timestamps

> DBだけだと空投稿を防げないため、APIで必ず制御：  
> - messageが空なら attachments必須  
> - attachmentsが無いなら message必須

#### chat_attachments
- id
- message_id **NOT NULL**
- uploader_id **NOT NULL**
- type **NOT NULL**（image/video）
- storage_key **NOT NULL**（S3等を想定）
- url **NOT NULL**（生成するならNULL可でも可）
- mime_type **NOT NULL**
- size_bytes **NOT NULL**
- duration_seconds **NULL可**（動画のみ、最大60秒をバリデーション）
- timestamps

#### chat_message_reads（既読）
- id
- message_id **NOT NULL**
- user_id **NOT NULL**
- read_at **NOT NULL**
- UNIQUE(message_id, user_id)

#### chat_message_reactions（リアクション）
- id
- message_id **NOT NULL**
- user_id **NOT NULL**
- reaction **NOT NULL**（固定スタンプのみ許可＝APIで制御）
- UNIQUE(message_id, user_id, reaction)

---

### 5.5 招待・認証ログ

#### invites（招待制）
- id
- token **NOT NULL**
- role **NOT NULL** default worker（admin/worker）
- expires_at **NOT NULL**
- used_at **NULL可**
- used_by_user_id **NULL可**
- invited_by_user_id **NOT NULL**
- is_active **NOT NULL**
- timestamps

#### auth_logs（監査）
- id
- event **NOT NULL**
- at **NOT NULL**
- user_id **NULL可**（失敗ログ残すならNULL許可）
- ip_address **NULL可**
- user_agent **NULL可**
- meta **NULL可**
- timestamps

---

## 6. Eloquent リレーション（例）

### WorkLog
- belongsTo User
- belongsTo Field
- belongsTo TaskType（`taskType()`）
- belongsTo Product（nullable）

### PauseEvent
- belongsTo WorkLog
- belongsTo User

---

## 7. API設計（現状+予定）

### 7.1 作業ログ
- `POST /api/work-logs/start`
  - body: `{ user_id, field_id, task_type_id, product_id? }`
  - 二重計測防止：同一userで running/paused が存在したら 409

- `POST /api/work-logs/{id}/pause`
  - body: `{ user_id }`
  - status が running の時のみ

- `POST /api/work-logs/{id}/resume`
  - body: `{ user_id }`
  - status が paused の時のみ

- `POST /api/work-logs/{id}/stop`
  - body: `{ user_id }`
  - status が running/paused の時のみ

- `GET /api/work-logs`
  - `?date=YYYY-MM-DD` で started_at の日付絞り込み
  - デフォルトは最新20件など

- `GET /api/work-logs/{id}`
  - 1件取得（関連も含む）

- `GET /api/work-logs/active?date=YYYY-MM-DD`
  - その日の running/paused

- `GET /api/work-logs/dashboard?date=YYYY-MM-DD`
  - その日の
    - `active`: running/paused を圃場ごとにまとめ
    - `done`: done を圃場ごとにまとめ
  - UIでそのまま使える形を返す

#### dashboardレスポンス例
```json
{
  "date": "2026-02-01",
  "active": [
    {
      "field": { "id": 1, "name": "テスト圃場" },
      "logs": [ ... ]
    }
  ],
  "done": [
    {
      "field": { "id": 1, "name": "テスト圃場" },
      "logs": [ ... ]
    }
  ]
}

## 8. UI設計（現状の方向性）

### 8.1 画面一覧（MVP）

#### ダッシュボード
- 日付選択
- タブ切り替え
  - 進行中
  - 今日完了（件数表示を推奨）
- 圃場カード一覧表示
  - 各圃場カード内に横スクロールのタイムラインを表示

#### タイムライン（圃場単位）
- 表示時間帯：06:00〜18:00
  - 横スクロール前提で固定幅
- 現在時刻表示
  - 範囲内：`今` ラベルを表示
  - 範囲外：右端に `今 HH:mm（範囲外）` を表示
- 作業ログ表示（1行カード）
  - 左（固定）：作業者名（最大2行）
  - 右：作業種別 / 状態 / 時間（開始 → 終了）
  - 下部：時間バー（開始〜終了、または開始〜現在）

---

### 8.2 スマホ優先の考え方
- まずは横スクロールのタイムラインで成立させる（最短）
- レスポンシブ最適化は後回し
  - ただしコンポーネント分割設計は最初から行う
- 将来的な下部固定ボタン（予定）
  - 作業開始
  - チャット
  - 在庫
  - 設定（権限 / 招待）

---

## 9. リアルタイム方針（WebSocket）

### 対象候補
- チャット
  - 新規メッセージ
  - 既読
  - リアクション
- 作業ログ
  - 開始 / 停止時にダッシュボードへ即時反映
- 在庫
  - 入出庫の即時反映

### 方針の割り切り
- 開発初期は数秒更新でも成立する
- ただし本プロジェクトは最初からリアルタイム前提で設計する

---

## 10. ローカル開発手順（例）

## ディレクトリ構成
```text
farm-app/
├── backend/    # Laravel
├── frontend/   # React
└── README.md
```

## セットアップ

### 前提
- PHP（Homebrew）
- Composer
- Git

### 依存関係のインストール
```bash
cd backend
composer install
```

### 環境変数の設定
```bash
cp .env.example .env
php artisan key:generate
```

### Backend（Laravel）
# SQLite 利用（database/database.sqlite が存在する前提）
```bash
php artisan migrate

php artisan serve
# http://127.0.0.1:8000
```

## 11. 重要な実装方針（バリデーション & 例外処理）

### APIバリデーション方針
- DBで表現しきれない条件は API レイヤーで制御
  - task_type が「測定」のときのみ measure_* を必須
  - chat は message または attachments のどちらか必須
  - 動画は duration_seconds <= 60

### 作業ログの矛盾防止
- 同一ユーザーで running / paused が同時に存在しない
  - start 時に存在する場合は 409 Conflict
- pause / resume / stop は現在の status に応じて拒否
  - 422 Validation Error

---

## 12. 今後のTODO（ロードマップ）

### 近々
- React ファイル分割（App.jsx 肥大防止）
  - pages/DashboardPage.jsx
  - components/FieldTimeline.jsx
  - lib/time.js
- ダッシュボードUIを「誰が・何を・いつ」に最適化
- APIエラーハンドリング（UI表示）

### 次の段階
- 会員登録 / ログイン
- 管理者 / 作業者の権限分離
- 招待リンク（invites）による作業者追加
- チャット（画像 / 動画） + WebSocket 対応

---

## 13. 用語メモ（チーム内共有用）

- work_logs  
  作業の開始〜完了を記録する最重要データ

- pause_events  
  一時停止 / 再開の履歴  
  （監査・集計・正確な稼働時間算出のため）

- dashboard  
  圃場ごとの「進行中 / 完了」をまとめた UI 向け API

- timeline  
  「いつ」を直感的に把握できるガント風UI
