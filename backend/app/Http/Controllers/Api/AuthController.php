<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invite;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'token' => ['required', 'string'],
        ]);

        $invite = Invite::query()->where('token', $data['token'])->first();
        if (!$invite) {
            throw ValidationException::withMessages([
                'token' => ['invite not found'],
            ]);
        }
        if (!$invite->is_active || $invite->used_at) {
            throw ValidationException::withMessages([
                'token' => ['invite already used'],
            ]);
        }
        if ($invite->expires_at && $invite->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'token' => ['invite expired'],
            ]);
        }
        $user = DB::transaction(function () use ($data, $invite) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $invite->role ?? 'worker',
            ]);

            $invite->update([
                'used_at' => now(),
                'used_by_user_id' => $user->id,
                'is_active' => false,
            ]);

            return $user;
        });

        return response()->json([
            'message' => 'registered',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['invalid credentials'],
            ]);
        }

        return response()->json([
            'message' => 'logged in',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }
}
