"use client";
// app/boards/[id]/page.jsx
import dynamic from "next/dynamic";
import { use } from "react";

// ssr:false means this component only ever runs on the client,
// and is isolated from server-side re-renders and SessionProvider updates.
const BoardClient = dynamic(() => import("./BoardClient"), { ssr: false });

export default function BoardPage({ params: paramsPromise }) {
  const { id } = use(paramsPromise);
  return <BoardClient id={id} />;
}