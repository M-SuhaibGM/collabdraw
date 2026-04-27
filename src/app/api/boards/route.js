import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/db"

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title } = await req.json();

        const newBoard = await prisma.board.create({
            data: {
                title: title,
                userId: session.user.id, // Links board to the logged-in user
                data: {}, // Initialize with empty canvas data
            },
        });

        return NextResponse.json(newBoard);
    } catch (error) {
        console.error("Board Creation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req) {

    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }


        const newBoard = await prisma.board.findMany({
            where: {
                userId: session.user?.id
            }
        });

        return NextResponse.json(newBoard);
    } catch (error) {
        console.error("Board Creation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}