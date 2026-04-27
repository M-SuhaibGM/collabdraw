// app/api/boards/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";   // adjust to your prisma client path

// GET /api/boards/:id  — returns title + data
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const board = await prisma.board.findUnique({
      where: { id },
      select: { id: true, title: true, data: true },
    });
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }
    return NextResponse.json(board);
  } catch (err) {
    console.error("[GET /api/boards/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/boards/:id  — updates `data` (canvas JSON) and/or `title`
export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();

    // Accept { data: canvasJSON } or { title: string } or both
    const updatePayload = {};
    if (body.data  !== undefined) updatePayload.data  = body.data;
    if (body.title !== undefined) updatePayload.title = body.title;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.board.update({
      where: { id },
      data:  updatePayload,
      select: { id: true, updatedAt: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/boards/:id]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}