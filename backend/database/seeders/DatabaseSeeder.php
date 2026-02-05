<?php

namespace Database\Seeders;

use App\Models\Field;
use App\Models\Product;
use App\Models\TaskType;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test User']
        );

        foreach (['第1圃場', '第2圃場', '第3圃場', '第4圃場'] as $name) {
            Field::firstOrCreate(['name' => $name]);
        }

        foreach (['剪定', '収穫', '施肥', '防除'] as $name) {
            TaskType::firstOrCreate(['name' => $name]);
        }

        foreach (['いちご', 'みかん', 'ぶどう', 'りんご'] as $name) {
            Product::firstOrCreate(['name' => $name]);
        }
    }
}
