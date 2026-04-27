"use client";
import {
  ArrowLeft, Eraser, MousePointer2, Pencil,
  Square, Circle, Image as ImageIcon, PanelLeft,
  Copy, Check, Trash2, Download,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BoardToolbar({
  boardTitle, boardId, activeTool, setActiveTool,
  color, setColor,
  onAddRect, onAddCircle, onImageUpload, onClearBoard, onExport,
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyBoardId = () => {
    navigator.clipboard.writeText(boardId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50 gap-4">
      {/* LEFT */}
      <div className="flex items-center gap-2 min-w-0">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <PanelLeft size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-slate-400 uppercase text-xs tracking-widest">
                Board Assets
              </SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4">
              <ShapeBtn onClick={onAddRect}   icon={<Square size={20}/>}  label="Square" />
              <ShapeBtn onClick={onAddCircle} icon={<Circle size={20}/>}  label="Circle" />
              <label className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border-2 border-dashed hover:border-indigo-400 cursor-pointer transition-all group">
                <ImageIcon size={20} className="text-slate-400 group-hover:text-indigo-600" />
                <span className="text-[10px] mt-2 font-bold text-slate-400 group-hover:text-indigo-600">IMAGE</span>
                <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
              </label>
              <ShapeBtn onClick={onClearBoard} icon={<Trash2 size={20} className="text-red-400"/>} label="Clear" danger />
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push("/dashboard")}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="font-semibold text-sm truncate max-w-[180px] text-slate-800">{boardTitle}</h1>
      </div>

      {/* CENTER: tools */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <ToolBtn active={activeTool === "pointer"} onClick={() => setActiveTool("pointer")} icon={<MousePointer2 size={16}/>} title="Select" />
        <ToolBtn active={activeTool === "pencil"}  onClick={() => setActiveTool("pencil")}  icon={<Pencil size={16}/>}        title="Draw"   />
        <ToolBtn active={activeTool === "eraser"}  onClick={() => setActiveTool("eraser")}  icon={<Eraser size={16}/>}        title="Eraser" />
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <label
          className="w-7 h-7 rounded-md border-2 border-white shadow cursor-pointer overflow-hidden"
          style={{ backgroundColor: color }}
          title="Pick color"
        >
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="opacity-0 w-0 h-0 absolute" />
        </label>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={copyBoardId}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-md border border-slate-200"
        >
          {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
          {copied ? "Copied!" : "Share ID"}
        </button>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm" onClick={onExport}>
          <Download size={14} className="mr-1.5" /> Export
        </Button>
      </div>
    </header>
  );
}

function ToolBtn({ active, onClick, icon, title }) {
  return (
    <button onClick={onClick} title={title}
      className={`p-2 rounded-md transition-all ${active ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}>
      {icon}
    </button>
  );
}

function ShapeBtn({ onClick, icon, label, danger }) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center p-4 rounded-xl transition-all border border-transparent group ${
        danger ? "bg-red-50 hover:bg-red-100 hover:border-red-100"
               : "bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100"}`}>
      <div className={danger ? "text-red-400" : "text-slate-500 group-hover:text-indigo-600"}>{icon}</div>
      <span className="text-[10px] mt-2 font-bold uppercase">{label}</span>
    </button>
  );
}