<?php

namespace Database\Seeders;

use App\Models\Field;
use App\Models\Product;
use App\Models\Item;
use App\Models\TaskType;
use App\Models\User;
use App\Models\WorkLog;
use App\Models\TemperatureLocation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User', 'role' => 'admin', 'password' => Hash::make('bbbbbbbb')]
        );
        $user->update([
            'role' => 'admin',
            'password' => Hash::make('bbbbbbbb'),
        ]);

        $fieldNames = [
            '2連右棟',
            '2連左棟',
            '3連右棟',
            '3連中棟',
            '3連左棟',
            '単連',
            '椎茸場',
            'ブルーベリー場',
        ];

        $taskTypeNames = [
            '灌水',
            '定植',
            '収穫',
            '虫取り',
            '加工(裁断・冷凍・パック・肥料作成)',
            '補修',
            '配送・買出',
            '剪定',
            '施肥',
            '防除',
        ];

        $productNames = [
            'バナナ',
            'パイナップル',
            'ライチ・マンゴー・リュウガン・サポジラ',
            '椎茸',
            'ブルーベリー',
        ];

        $itemNames = [
            '農薬a',
            '農薬b',
            '農薬c',
            '農薬d',
            'あいうえお農薬',
            'かきくけこ農薬',
            'さしすせそ農薬',
            'わをん農薬',
        ];

        $removedFieldIds = Field::query()->whereNotIn('name', $fieldNames)->pluck('id');
        $removedTaskTypeIds = TaskType::query()->whereNotIn('name', $taskTypeNames)->pluck('id');
        $removedProductIds = Product::query()->whereNotIn('name', $productNames)->pluck('id');

        // 外部キー制約を避けるため、関連する作業ログを先に削除
        WorkLog::query()
            ->whereIn('field_id', $removedFieldIds)
            ->orWhereIn('task_type_id', $removedTaskTypeIds)
            ->orWhereIn('product_id', $removedProductIds)
            ->delete();

        Field::query()->whereNotIn('name', $fieldNames)->delete();
        TaskType::query()->whereNotIn('name', $taskTypeNames)->delete();
        Product::query()->whereNotIn('name', $productNames)->delete();
        Item::query()->whereNotIn('name', $itemNames)->delete();

        foreach ($fieldNames as $name) {
            Field::firstOrCreate(['name' => $name]);
        }

        foreach ($taskTypeNames as $name) {
            TaskType::firstOrCreate(['name' => $name]);
        }

        foreach ($productNames as $name) {
            Product::firstOrCreate(['name' => $name]);
        }

        foreach ($itemNames as $name) {
            Item::firstOrCreate(['name' => $name], ['unit' => null, 'is_active' => true]);
        }

        $locations = [
            ['name' => 'バナナ庫', 'type' => 'room'],
            ['name' => '外気温', 'type' => 'outdoor'],
            ['name' => '2連棟', 'type' => 'field'],
            ['name' => '3連右棟', 'type' => 'field'],
            ['name' => '3連中棟', 'type' => 'field'],
            ['name' => '3連左棟', 'type' => 'field'],
            ['name' => '単連', 'type' => 'field'],
        ];

        foreach ($locations as $index => $location) {
            TemperatureLocation::firstOrCreate(
                ['name' => $location['name']],
                [
                    'type' => $location['type'],
                    'sort_order' => $index,
                    'is_active' => true,
                ]
            );
        }
    }
}
