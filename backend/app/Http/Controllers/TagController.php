<?php

namespace App\Http\Controllers;

use App\Models\Tag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    /** قائمة كل الصفات (لملء قوائم الاختيار). متاحة لأي مستخدم موثّق. */
    public function index(Request $request)
    {
        $tags = Tag::orderBy('name')->get(['id', 'name']);

        return response()->json($tags);
    }
}
