"use client";
import { useEffect, useRef, useState } from "react";
import BoardToolbar from "@/app/components/BoardToolbar";
import { io } from "socket.io-client";

let _socket      = null;
let _canvas      = null;
let _fabric      = null;
let _boardId     = null;
let _saveTimer   = null;
let _syncedCount = 0;
let _remoteAdd   = false;

function getSocket() {
  if (!_socket) {
    _socket = io("http://localhost:3001", { transports: ["websocket"] });
    _socket.on("connect",    () => console.log("[socket] ✓", _socket.id));
    _socket.on("disconnect", (r) => console.warn("[socket] disconnected:", r));
  }
  return _socket;
}

function emitNewObjects() {
  if (_remoteAdd || !_canvas || !_boardId) return;
  const fullJson = _canvas.toJSON();
  const all = fullJson.objects ?? [];
  const newObjs = all.slice(_syncedCount);
  if (newObjs.length === 0) return;
  _syncedCount = all.length;
  newObjs.forEach(obj => {
    console.log("[emit] add-object type:", obj.type);
    getSocket().emit("add-object", { id: _boardId, obj });
  });
  scheduleSave(fullJson);
}

// Emit all objects with their current positions (for move/resize)
function emitFullObjects() {
  if (_remoteAdd || !_canvas || !_boardId) return;
  const fullJson = _canvas.toJSON();
  console.log("[emit] update-all, objects:", fullJson.objects?.length);
  getSocket().emit("update-all", { id: _boardId, objects: fullJson.objects ?? [] });
  scheduleSave(fullJson);
}

function scheduleSave(data) {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    const canvasData = data ?? _canvas?.toJSON();
    if (!canvasData || !_boardId) return;
    try {
      const res = await fetch(`/api/boards/${_boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: canvasData }),
      });
      const j = await res.json();
      console.log("[save] ✓", j.updatedAt);
    } catch (e) { console.error("[save] error:", e); }
  }, 1500);
}

async function addRemoteObject(objData) {
  if (!_canvas || !_fabric || !objData?.type) return;
  const fabric = _fabric;
  const type = objData.type.toLowerCase();
  const map = {
    path: fabric.Path, rect: fabric.Rect, circle: fabric.Circle,
    ellipse: fabric.Ellipse, triangle: fabric.Triangle,
    line: fabric.Line, image: fabric.Image,
    textbox: fabric.Textbox, text: fabric.Text, polygon: fabric.Polygon,
  };
  const Klass = map[type];
  if (!Klass) { console.error("[remote] no class for:", type); return; }
  try {
    const obj = await Klass.fromObject(objData);
    _remoteAdd = true;
    _canvas.add(obj);
    _canvas.renderAll();
    _syncedCount = (_canvas.toJSON().objects ?? []).length;
    console.log("[remote] added", type, "total:", _syncedCount);
  } catch (e) {
    console.error("[remote] addRemoteObject error:", e.message);
  } finally {
    _remoteAdd = false;
  }
}

// Update existing objects in-place by matching index — no canvas wipe
async function updateAllObjects(objects) {
  if (!_canvas || !_fabric || !objects) return;
  const fabric = _fabric;
  const map = {
    path: fabric.Path, rect: fabric.Rect, circle: fabric.Circle,
    ellipse: fabric.Ellipse, triangle: fabric.Triangle,
    line: fabric.Line, image: fabric.Image,
    textbox: fabric.Textbox, text: fabric.Text, polygon: fabric.Polygon,
  };

  _remoteAdd = true;
  try {
    const existing = _canvas.getObjects();

    if (existing.length !== objects.length) {
      // Object count changed — need full reload (rare case)
      _canvas.loadFromJSON({ version: _fabric.version, objects }, () => {
        _canvas.renderAll();
        _syncedCount = objects.length;
        _remoteAdd = false;
      });
      return;
    }

    // Same count — update each object's properties in-place
    // This avoids any canvas wipe
    await Promise.all(existing.map(async (fabricObj, i) => {
      const data = objects[i];
      if (!data) return;
      // Set all numeric/string properties directly
      fabricObj.set({
        left:    data.left,
        top:     data.top,
        scaleX:  data.scaleX,
        scaleY:  data.scaleY,
        angle:   data.angle,
        flipX:   data.flipX,
        flipY:   data.flipY,
        opacity: data.opacity,
        fill:    data.fill,
        stroke:  data.stroke,
      });
      fabricObj.setCoords();
    }));

    _canvas.renderAll();
    console.log("[remote] updated", existing.length, "objects in-place ✓");
  } catch (e) {
    console.error("[remote] updateAllObjects error:", e);
  } finally {
    _remoteAdd = false;
  }
}

// Only used for initial page load — canvas is empty so wipe is fine
function applyInitialState(canvasData) {
  if (!_canvas) return;
  _remoteAdd = true;
  _canvas.loadFromJSON(canvasData, () => {
    _canvas.renderAll();
    _syncedCount = canvasData.objects?.length ?? 0;
    _remoteAdd = false;
    console.log("[init] loaded, objects:", _syncedCount);
  });
}

export default function BoardClient({ id: boardId }) {
  const containerRef = useRef(null);
  const canvasElRef  = useRef(null);

  const [boardTitle, setBoardTitle] = useState("Loading...");
  const [activeTool, setActiveTool] = useState("pencil");
  const [color, setColor]           = useState("#4f46e5");

  useEffect(() => {
    _boardId     = boardId;
    _syncedCount = 0;
    _remoteAdd   = false;

    const container = containerRef.current;
    const el        = canvasElRef.current;
    if (!container || !el || _canvas) return;

    import("fabric").then((mod) => {
      _fabric = mod.default ?? mod;
      const fabric = _fabric;

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

      _canvas.on("path:created", () => {
        if (_remoteAdd) return;
        emitNewObjects();
      });

      _canvas.on("object:added", (e) => {
        if (_remoteAdd) return;
        if (e.target?.type === "path") return;
        emitNewObjects();
      });

      // FIX: emit positions only, receiver updates in-place (no wipe)
      _canvas.on("object:modified", () => {
        if (_remoteAdd) return;
        emitFullObjects();
      });

      const ro = new ResizeObserver(() => {
        _canvas?.setDimensions({ width: container.clientWidth, height: container.clientHeight });
        _canvas?.renderAll();
      });
      ro.observe(container);

      const socket = getSocket();
      socket.emit("join-board", boardId);
      socket.on("connect", () => socket.emit("join-board", boardId));

      socket.on("add-object", (objData) => {
        console.log("[socket] add-object type:", objData?.type);
        addRemoteObject(objData);
      });

      // Receive position updates — update in-place, no wipe
      socket.on("update-all", (objects) => {
        console.log("[socket] update-all, count:", objects?.length);
        updateAllObjects(objects);
      });

      // Full state only for new joiners
      socket.on("full-state", (canvasData) => {
        console.log("[socket] full-state (new joiner), objects:", canvasData?.objects?.length);
        applyInitialState(canvasData);
      });

      socket.on("clear-canvas", () => {
        if (!_canvas) return;
        _remoteAdd = true;
        _canvas.clear();
        _canvas.backgroundColor = "white";
        _canvas.renderAll();
        _syncedCount = 0;
        _remoteAdd = false;
      });

      fetch(`/api/boards/${boardId}`)
        .then(r => r.json())
        .then(board => {
          setBoardTitle(board.title ?? "Untitled Board");
          if (board.data) {
            const json = typeof board.data === "string"
              ? JSON.parse(board.data) : board.data;
            applyInitialState(json);
          }
        })
        .catch(e => console.error("[board] fetch error:", e));

    }).catch(e => console.error("[fabric] import failed:", e));

    return () => {
      const s = getSocket();
      s.off("add-object");
      s.off("update-all");
      s.off("full-state");
      s.off("clear-canvas");
      clearTimeout(_saveTimer);
      if (_canvas) { _canvas.dispose(); _canvas = null; }
      _syncedCount = 0;
      _remoteAdd   = false;
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
    _remoteAdd = true;
    _canvas.clear();
    _canvas.backgroundColor = "white";
    _canvas.renderAll();
    _syncedCount = 0;
    _remoteAdd = false;
    getSocket().emit("clear-board", boardId);
    scheduleSave({ version: "6.0.0", objects: [] });
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