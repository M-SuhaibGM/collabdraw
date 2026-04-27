"use client";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useRealtimeCanvas({ boardId, fabricRef, onTitleLoad }) {
  const socketRef    = useRef(null);
  const saveTimerRef = useRef(null);
  const isRemoteRef  = useRef(false);
  const syncFnRef    = useRef(null);

  // Rebuilt every render — always latest closure
  const syncAndSave = () => {
    // Block echoes when we're applying a remote update
    if (isRemoteRef.current) return;

    const canvas = fabricRef.current;
    const socket = socketRef.current;

    if (!canvas) { console.warn("[sync] no canvas ref"); return; }
    if (!socket) { console.warn("[sync] no socket ref"); return; }
    // NOTE: removed socket.connected check — Socket.IO buffers
    // emits automatically until the connection is ready

    const canvasData = canvas.toJSON();
    console.log("[sync] emitting, objects:", canvasData.objects?.length ?? 0);
    socket.emit("draw", { id: boardId, canvasData });

    // Debounced DB save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        console.log("[save] PUT /api/boards/" + boardId);
        const res = await fetch(`/api/boards/${boardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: canvasData }),
        });
        const json = await res.json();
        if (!res.ok) console.error("[save] failed", res.status, json);
        else         console.log("[save] ✓", json.updatedAt);
      } catch (err) {
        console.error("[save] network error", err);
      }
    }, 1000);
  };
  syncFnRef.current = syncAndSave;

  // Fixed identity — canvas.on() holds this forever, reads syncFnRef at call-time
  const stableSyncAndSave = useRef(() => syncFnRef.current?.()).current;

  // Safe JSON loader — sets isRemoteRef so canvas events don't echo back
  const applyRemoteJSON = (json) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    isRemoteRef.current = true;
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      setTimeout(() => { isRemoteRef.current = false; }, 0);
    });
  };

  useEffect(() => {
    if (!boardId) return;

    // Create socket
    const socket = io("http://localhost:3001", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 500,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[socket] connected ✓", socket.id);
      socket.emit("join-board", boardId);
    });
    socket.on("disconnect", (r) => console.warn("[socket] disconnected:", r));
    socket.on("connect_error", (e) => console.error("[socket] error:", e.message));

    // Receive another client's canvas state
    socket.on("canvas-update", (canvasData) => {
      console.log("[socket] canvas-update received, objects:", canvasData.objects?.length ?? 0);
      applyRemoteJSON(canvasData);
    });

    socket.on("clear-canvas", () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      isRemoteRef.current = true;
      canvas.clear();
      canvas.backgroundColor = "white";
      canvas.renderAll();
      setTimeout(() => { isRemoteRef.current = false; }, 0);
    });

    // Load initial board data
    fetch(`/api/boards/${boardId}`)
      .then((r) => r.json())
      .then((board) => {
        onTitleLoad(board.title ?? "Untitled Board");
        if (board.data) {
          const json = typeof board.data === "string"
            ? JSON.parse(board.data) : board.data;
          applyRemoteJSON(json);
        }
      })
      .catch((e) => console.error("[board] fetch failed:", e));

    return () => {
      socket.disconnect();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearBoard = () => {
    const canvas = fabricRef.current;
    const socket = socketRef.current;
    if (!canvas || !socket) return;
    canvas.clear();
    canvas.backgroundColor = "white";
    canvas.renderAll();
    socket.emit("clear-board", boardId);
    syncFnRef.current?.();
  };

  return { stableSyncAndSave, clearBoard };
}