<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Field;
use App\Models\Product;
use App\Models\TaskType;
use App\Models\WorkLog;
use App\Models\ItemMovement;
use App\Models\User;
use Illuminate\Http\Request;

class MasterDataController extends Controller
{
    public function index()
    {
        return response()->json([
            'fields' => Field::query()->select('id', 'name')->orderBy('id')->get(),
            'products' => Product::query()->select('id', 'name')->orderBy('id')->get(),
            'task_types' => TaskType::query()->select('id', 'name')->orderBy('id')->get(),
            'units' => WorkLog::query()->whereNotNull('unit')->distinct()->orderBy('unit')->pluck('unit'),
        ]);
    }

    public function items()
    {
        return response()->json([
            'items' => \App\Models\Item::query()
                ->select('id', 'name', 'unit', 'quantity')
                ->orderBy('id')
                ->get(),
        ]);
    }

    public function movements(Request $request)
    {
        $data = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);
        $limit = $data['limit'] ?? 10;

        ItemMovement::query()
            ->where('created_at', '<', now()->subMonths(2))
            ->delete();

        $query = ItemMovement::query()
            ->with(['item:id,name,unit', 'user:id,name'])
            ->orderByDesc('created_at');

        if (!empty($data['date'])) {
            $start = \Carbon\Carbon::createFromFormat('Y-m-d', $data['date'])->startOfDay();
            $end = \Carbon\Carbon::createFromFormat('Y-m-d', $data['date'])->endOfDay();
            $query->whereBetween('created_at', [$start, $end]);
        } else {
            $query->limit($limit);
        }

        $movements = $query->get()->map(function (ItemMovement $movement) {
                return [
                    'id' => $movement->id,
                    'type' => $movement->type,
                    'quantity' => $movement->quantity,
                    'before_quantity' => $movement->before_quantity,
                    'after_quantity' => $movement->after_quantity,
                    'created_at' => $movement->created_at,
                    'item' => $movement->item,
                    'user' => $movement->user,
                ];
            });

        return response()->json([
            'movements' => $movements,
        ]);
    }

    public function stockIn(Request $request)
    {
        $data = $request->validate([
            'item_id' => ['required', 'exists:items,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $item = \App\Models\Item::findOrFail($data['item_id']);
        $before = $item->quantity ?? 0;
        $item->quantity = ($item->quantity ?? 0) + $data['quantity'];
        $item->save();

        $userId = $data['user_id'] ?? User::query()->value('id');
        ItemMovement::create([
            'item_id' => $item->id,
            'user_id' => $userId,
            'type' => 'in',
            'quantity' => $data['quantity'],
            'before_quantity' => $before,
            'after_quantity' => $item->quantity,
        ]);

        return response()->json([
            'id' => $item->id,
            'quantity' => $item->quantity,
        ]);
    }

    public function stockOut(Request $request)
    {
        $data = $request->validate([
            'item_id' => ['required', 'exists:items,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $item = \App\Models\Item::findOrFail($data['item_id']);
        $before = $item->quantity ?? 0;
        $next = ($item->quantity ?? 0) - $data['quantity'];
        if ($next < 0) {
            return response()->json(['message' => 'insufficient stock'], 422);
        }

        $item->quantity = $next;
        $item->save();

        $userId = $data['user_id'] ?? User::query()->value('id');
        ItemMovement::create([
            'item_id' => $item->id,
            'user_id' => $userId,
            'type' => 'out',
            'quantity' => $data['quantity'],
            'before_quantity' => $before,
            'after_quantity' => $item->quantity,
        ]);

        return response()->json([
            'id' => $item->id,
            'quantity' => $item->quantity,
        ]);
    }

    public function stockAdjust(Request $request)
    {
        $data = $request->validate([
            'item_id' => ['required', 'exists:items,id'],
            'quantity' => ['required', 'numeric', 'min:0'],
            'user_id' => ['nullable', 'exists:users,id'],
        ]);

        $item = \App\Models\Item::findOrFail($data['item_id']);
        $before = $item->quantity ?? 0;
        $item->quantity = $data['quantity'];
        $item->save();

        $userId = $data['user_id'] ?? User::query()->value('id');
        ItemMovement::create([
            'item_id' => $item->id,
            'user_id' => $userId,
            'type' => 'adjust',
            'quantity' => $data['quantity'],
            'before_quantity' => $before,
            'after_quantity' => $item->quantity,
        ]);

        return response()->json([
            'id' => $item->id,
            'quantity' => $item->quantity,
        ]);
    }
}
