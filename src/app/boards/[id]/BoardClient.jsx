"use client";
import { useEffect, useRef, useState } from "react";
import BoardToolbar from "@/app/components/BoardToolbar";
import { io } from "socket.io-client";

// ── Module-level singletons ──────────────────────────────────────────────────
let _socket  = null;
let _canvas  = null;
let _boardId = null;
let _isRemote = false;
let _saveTimer = null;

function getSocket() {
  if (!_socket) {
    _socket = io("http://localhost:3001", { transports: ["websocket"] });
    _socket.on("connect",    () => console.log("[socket] connected ✓", _socket.id));
    _socket.on("disconnect", (r) => console.warn("[socket] disconnected:", r));
  }
  return _socket;
}

function doSyncAndSave() {
  // Skip if we're applying a remote update — prevents echo loop
  if (_isRemote || !_canvas || !_boardId) return;

  const canvasData = _canvas.toJSON();
  console.log("[sync] emitting, objects:", canvasData.objects?.length ?? 0);
  getSocket().emit("draw", { id: _boardId, canvasData });

  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      const res = await fetch(`/api/boards/${_boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: canvasData }),
      });
      const j = await res.json();
      console.log("[save]", res.ok ? "✓" : "✗", j);
    } catch (e) {
      console.error("[save] error:", e);
    }
  }, 1000);
}

function doApplyJSON(json) {
  if (!_canvas) return;
  _isRemote = true;

  const safetyReset = setTimeout(() => {
    if (_isRemote) { _isRemote = false; console.warn("[remote] safety reset"); }
  }, 3000);

  try {
    _canvas.loadFromJSON(json, () => {
      _canvas.renderAll();
      clearTimeout(safetyReset);
      // Use setTimeout so all the object:added events that loadFromJSON
      // fires synchronously have already been processed before we unblock
      setTimeout(() => {
        _isRemote = false;
        console.log("[remote] applied ✓, _isRemote = false");
      }, 50);
    });
  } catch (e) {
    console.error("[remote] error:", e);
    clearTimeout(safetyReset);
    _isRemote = false;
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function BoardClient({ id: boardId }) {
  const containerRef = useRef(null);
  const canvasElRef  = useRef(null);

  const [boardTitle, setBoardTitle] = useState("Loading...");
  const [activeTool, setActiveTool] = useState("pencil");
  const [color, setColor]           = useState("#4f46e5");

  useEffect(() => {
    _boardId = boardId;
    const container = containerRef.current;
    const el        = canvasElRef.current;
    if (!container || !el || _canvas) return;

    import("fabric").then((mod) => {
      const fabric = mod.default ?? mod;

      _canvas = new fabric.Canvas(el, {
        backgroundColor: "white",
        isDrawingMode: true,
        width:  container.clientWidth,
        height: container.clientHeight,
      });

      const brush = new fabric.PencilBrush(_canvas);
      brush.width = 5;
      brush.color = "#4f46e5";
      _canvas.freeDrawingBrush = brush;

      // path:created is the correct event for freehand drawing —
      // it fires ONCE after the stroke is complete.
      // object:added fires for programmatic additions (shapes).
      // We do NOT use object:added for drawing because loadFromJSON
      // fires object:added for every deserialized object, and even
      // though _isRemote guards it, using path:created is cleaner.
      _canvas.on("path:created",    doSyncAndSave);
      _canvas.on("object:modified", doSyncAndSave);
      // Only sync object:added for non-path objects (shapes/images)
      _canvas.on("object:added", (e) => {
        if (e.target?.type !== "path") doSyncAndSave();
      });

      const ro = new ResizeObserver(() => {
        _canvas?.setDimensions({ width: container.clientWidth, height: container.clientHeight });
        _canvas?.renderAll();
      });
      ro.observe(container);

      // Socket
      const socket = getSocket();
      socket.emit("join-board", boardId);
      socket.on("connect",       () => socket.emit("join-board", boardId));
      socket.on("canvas-update", (data) => {
        console.log("[socket] canvas-update from other client ✓");
        doApplyJSON(data);
      });
      socket.on("clear-canvas",  () => {
        _isRemote = true;
        _canvas?.clear();
        if (_canvas) _canvas.backgroundColor = "white";
        _canvas?.renderAll();
        _isRemote = false;
      });

      // Load saved data
      fetch(`/api/boards/${boardId}`)
        .then(r => r.json())
        .then(board => {
          setBoardTitle(board.title ?? "Untitled Board");
          if (board.data) {
            const json = typeof board.data === "string"
              ? JSON.parse(board.data) : board.data;
            doApplyJSON(json);
          } else {
            _isRemote = false;
          }
        })
        .catch(e => { console.error("[board] fetch error:", e); _isRemote = false; });

    }).catch(e => console.error("[fabric] import failed:", e));

    return () => {
      getSocket().off("canvas-update");
      getSocket().off("clear-canvas");
      clearTimeout(_saveTimer);
      if (_canvas) { _canvas.dispose(); _canvas = null; }
      _isRemote = false;
    };
  }, [boardId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!_canvas) return;
    const drawing = activeTool === "pencil" || activeTool === "eraser";
    _canvas.isDrawingMode = drawing;
    if (drawing) {
      _canvas.freeDrawingBrush.color = activeTool === "eraser" ? "#ffffff" : color;
      _canvas.freeDrawingBrush.width = activeTool === "eraser" ? 30 : 5;
      _canvas.selection = false;
    } else {
      _canvas.selection = true;
    }
  }, [activeTool, color]);

  const addShape = (type) => {
    import("fabric").then((mod) => {
      const fabric = mod.default ?? mod;
      const shape = type === "rect"
        ? new fabric.Rect({ left: 120, top: 120, fill: color, width: 100, height: 100, cornerStyle: "circle" })
        : new fabric.Circle({ left: 120, top: 120, fill: color, radius: 50, cornerStyle: "circle" });
      _canvas?.add(shape);
      setActiveTool("pointer");
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const mod = await import("fabric");
      const fabric = mod.default ?? mod;
      const img = await fabric.Image.fromURL(ev.target.result);
      img.set({ left: 100, top: 100, selectable: true, hasControls: true, cornerStyle: "circle" });
      img.scaleToWidth(200);
      _canvas?.add(img);
      _canvas?.setActiveObject(img);
      _canvas?.renderAll();
      setActiveTool("pointer");
    };
    reader.readAsDataURL(file);
  };

  const clearBoard = () => {
    if (!_canvas) return;
    _canvas.clear();
    _canvas.backgroundColor = "white";
    _canvas.renderAll();
    getSocket().emit("clear-board", boardId);
    doSyncAndSave();
  };

  const handleExport = () => {
    if (!_canvas) return;
    const url = _canvas.toDataURL({ format: "png", multiplier: 2 });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${boardTitle}.png`;
    a.click();
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <BoardToolbar
        boardTitle={boardTitle}
        boardId={boardId}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        color={color}
        setColor={setColor}
        onAddRect={() => addShape("rect")}
        onAddCircle={() => addShape("circle")}
        onImageUpload={handleImageUpload}
        onClearBoard={clearBoard}
        onExport={handleExport}
      />
      <main ref={containerRef} className="flex-1 bg-white relative overflow-hidden">
        <canvas ref={canvasElRef} />
      </main>
    </div>
  );
}