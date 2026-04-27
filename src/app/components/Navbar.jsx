import Link from 'next/link';
import { LayoutDashboard, LogIn, Brush } from 'lucide-react';

export default function Navbar({ isLoggedIn }) {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Brush className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800">CollabDraw</span>
      </div>

      <div className="flex items-center gap-6">
        <Link href="#features" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
          Features
        </Link>
        <Link href="#pricing" className="text-slate-600 hover:text-indigo-600 transition-colors font-medium">
          Pricing
        </Link>
        
        {isLoggedIn ? (
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-all shadow-md"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
        ) : (
          <Link 
            href="/auth/login" 
            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2 rounded-full font-semibold hover:bg-slate-900 transition-all shadow-md"
          >
            <LogIn size={18} />
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}