<?php

namespace Database\Seeders;

use App\Models\Field;
use App\Models\Product;
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

        $fieldIds = Field::query()->whereIn('name', [
            'テスト園場',
            '第一園場',
            '第二園場',
            '第三園場',
            '第四園場',
        ])->pluck('id');

        $taskTypeIds = TaskType::query()->whereIn('name', [
            'テスト作業',
        ])->pluck('id');

        // 外部キー制約を避けるため、関連する作業ログを先に削除
        WorkLog::query()
            ->whereIn('field_id', $fieldIds)
            ->orWhereIn('task_type_id', $taskTypeIds)
            ->delete();

        Field::query()->whereIn('id', $fieldIds)->delete();
        TaskType::query()->whereIn('id', $taskTypeIds)->delete();

        Product::query()->whereIn('name', [
            'いちご',
            'みかん',
            'りんご',
            'ぶどう',
        ])->delete();

        foreach (['第1圃場', '第2圃場', '第3圃場', '第4圃場'] as $name) {
            Field::firstOrCreate(['name' => $name]);
        }

        foreach (['剪定', '収穫', '施肥', '防除'] as $name) {
            TaskType::firstOrCreate(['name' => $name]);
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
