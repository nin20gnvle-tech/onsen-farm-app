<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invite;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InviteController extends Controller
{
    public function show(string $token)
    {
        $invite = Invite::query()->where('token', $token)->first();
        if (!$invite) {
            return response()->json(['message' => 'invite not found'], 404);
        }
        if (!$invite->is_active || $invite->used_at) {
            return response()->json(['message' => 'invite already used'], 410);
        }
        if ($invite->expires_at && $invite->expires_at->isPast()) {
            return response()->json(['message' => 'invite expired'], 410);
        }

        return response()->json([
            'message' => 'invite is valid',
            'role' => $invite->role,
            'expires_at' => $invite->expires_at,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'role' => ['nullable', 'in:admin,worker'],
        ]);

        $invitedBy = User::query()->value('id');
        if (!$invitedBy) {
            return response()->json(['message' => 'no users available'], 422);
        }

        $token = Str::random(40);
        $invite = Invite::create([
            'token' => $token,
            'role' => $data['role'] ?? 'worker',
            'email' => null,
            'expires_at' => now()->addDays(7),
            'invited_by_user_id' => $invitedBy,
            'is_active' => true,
        ]);

        $baseUrl = rtrim($request->getSchemeAndHttpHost(), '/');

        return response()->json([
            'token' => $invite->token,
            'invite_url' => $baseUrl . '/invite/' . $invite->token,
            'expires_at' => $invite->expires_at,
        ], 201);
    }
}
