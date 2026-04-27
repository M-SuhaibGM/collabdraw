"use client";
import { useSession } from "next-auth/react";
import Navbar from './components/Navbar';
import { Users, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  // Get session status from NextAuth
  const { data: session, status } = useSession();
  
  // Determine if user is logged in based on session existence
  const isLoggedIn = status === "authenticated";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar isLoggedIn={isLoggedIn} user={session?.user} />

      <main>
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-8 pt-20 pb-32 text-center">
          <h1 className="text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Design together, <span className="text-indigo-600">in real-time.</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            The ultimate collaborative whiteboard for remote teams. Sketch ideas, 
            brainstorm workflows, and build faster with zero latency.
          </p>
          
          <div className="flex justify-center gap-4">
            <button className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-indigo-200">
              {isLoggedIn ? "Go to My Boards" : "Start Drawing Free"}
            </button>
            <button className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors">
              Watch Demo
            </button>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="bg-white py-24">
          <div className="max-w-6xl mx-auto px-8 grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Users className="text-indigo-600" />} 
              title="Team Collaboration" 
              desc="See live cursors and updates as your teammates draw on the canvas."
            />
            <FeatureCard 
              icon={<Zap className="text-indigo-600" />} 
              title="Instant Sync" 
              desc="Powered by WebSockets for sub-100ms latency across the globe."
            />
            <FeatureCard 
              icon={<Shield className="text-indigo-600" />} 
              title="Secure Boards" 
              desc="Private rooms with end-to-end encryption for your most sensitive ideas."
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-slate-50 transition-colors">
      <div className="bg-indigo-50 p-4 rounded-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600">{desc}</p>
    </div>
  );
}