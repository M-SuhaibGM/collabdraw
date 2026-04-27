"use client";
// components/SessionWrapper.js
import { SessionProvider } from "next-auth/react";

export default function SessionWrapper({ children }) {
  return (
    // refetchInterval: 0 disables background polling completely.
    // refetchOnWindowFocus: false stops it re-fetching when you
    // switch browser tabs (another common source of re-renders).
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}