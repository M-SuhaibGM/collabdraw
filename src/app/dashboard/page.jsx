"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, FileText, X, Link as LinkIcon, ArrowRight } from "lucide-react"; // Added icons
import Navbar from "../components/Navbar";
import BoardCard from "../components/BoardCard"

export default function Dashboard() {
    const { data: session } = useSession();
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [joinId, setJoinId] = useState(""); // State for the pasted ID
    const [loading, setLoading] = useState(false);
    const [boards, setBoards] = useState([]);

    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const response = await fetch("/api/boards");
                const data = await response.json();
                if (response.ok) setBoards(data);
            } catch (error) {
                console.error("Error fetching boards:", error);
            } finally {
                setLoading(false);
            }
        };

        if (session) fetchBoards();
    }, [session]);

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        try {
            const response = await fetch("/api/boards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            });
            if (response.ok) {
                const board = await response.json();
                router.push(`/boards/${board.id}`);
            }
        } catch (error) {
            console.error("Failed to create board:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- NEW: Join Board Function ---
    const handleJoinBoard = (e) => {
        e.preventDefault();
        if (!joinId.trim()) return;
        router.push(`/boards/${joinId.trim()}`);
    };

    if (loading && boards.length === 0) return <div className="p-10 text-center">Loading boards...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar isLoggedIn={true} user={session?.user} />

            <main className="max-w-6xl mx-auto px-8 py-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Whiteboards</h1>
                        <p className="text-slate-500 mt-1">Manage your collaborative spaces</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* JOIN BOARD INPUT */}
                        <form onSubmit={handleJoinBoard} className="relative flex-1 sm:w-64">
                            <input 
                                type="text"
                                placeholder="Paste Board ID..."
                                value={joinId}
                                onChange={(e) => setJoinId(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                            />
                            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <button 
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                                <ArrowRight size={16} />
                            </button>
                        </form>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                        >
                            <Plus size={20} />
                            Create New
                        </button>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards.map((board) => (
                        <BoardCard key={board.id} board={board} />
                    ))}

                    {boards.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">No boards yet. Start by creating one!</p>
                        </div>
                    )}
                </div>

                {/* CREATE BOARD MODAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800">New Whiteboard</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateBoard}>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Board Title</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Marketing Flowchart"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6 text-slate-800"
                                    required
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-4 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all"
                                    >
                                        {loading ? "Creating..." : "Create Board"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}