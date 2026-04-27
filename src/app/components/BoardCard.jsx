// Sub-component for individual Board Cards
import { FileText, Clock, Trash2, ExternalLink, } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import Link from "next/link";

function BoardCard({ board }) {
    const date = new Date(board.updatedAt);
    return (
        <div className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all cursor-pointer relative">
            <Link href={`boards/${board.id}`}>
            <div className="bg-slate-50 w-full h-32 rounded-xl mb-4 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                <FileText className="text-slate-300 group-hover:text-indigo-200 transition-colors" size={40} />
            </div>
            </Link>

            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {board.title}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-400 text-sm mt-1">
                        <Clock size={14} />
                        Created on {format(date, 'MMM do, yyyy')}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <ExternalLink size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
export default BoardCard