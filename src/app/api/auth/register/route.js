
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma} from "@/lib/db"


export async function POST(request) {
  try {
    const data = await request.json();
    // Check if the email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(data.password, 10); // 10 is the salt rounds

    // Create the new user with the hashed password
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    if (newUser) {
      return NextResponse.json({ message: "User created successfully" }, { status: 201 });
    }
  } catch (error) {
    console.log("Error creating user:", error);
    return NextResponse.json({ message: "Error creating user" }, { status: 500 });
  }
}




