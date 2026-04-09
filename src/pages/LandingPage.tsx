import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Waves } from '../components/ui/wave-background';

const FloatingNode = ({ label, x, y, delay }: { label: string, x: string, y: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1, delay }}
    className="absolute flex items-center gap-2 z-20 animate-float"
    style={{ left: x, top: y }}
  >
    <div className="connection-dot" />
    <div className="glass-panel px-3 py-1 text-xs text-slate-900/70 whitespace-nowrap">
      {label}
    </div>
  </motion.div>
);

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen relative overflow-hidden text-slate-900 font-sans selection:bg-cyber-accent selection:text-white">
      {/* Animated Wave Background */}
      <div className="absolute top-0 left-0 right-0 h-[80vh] z-0 opacity-50 pointer-events-auto">
        <Waves strokeColor="#FF5A00" backgroundColor="transparent" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-cyber-accent/20 blur-md rounded-full -z-10" />
            <img src="/logo.png" alt="TruthGuard AI Logo" className="w-8 h-8 object-contain drop-shadow-[0_2px_4px_rgba(255,90,0,0.4)]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">TruthGuard.</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-900/50">
          <Link to="/" className="text-slate-900 hover:text-cyber-accent transition-colors">Home</Link>
          <Link to="/reports" className="hover:text-cyber-accent transition-colors">Verify</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-start pt-20 min-h-[calc(100vh-80px)] pb-16">

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-4 leading-[1.1]">
            Meet! TruthGuard<br />
            Built for a secure <span className="font-semibold">AI future.</span>
          </h1>
          <p className="text-slate-900/50 max-w-2xl mx-auto mt-6 text-sm md:text-base leading-relaxed">
            Empowering verification networks with top-tier deepfake detection, FACT checks, and forensic APIs—built for decentralized scale.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 w-full"
        >
          <Link to="/login" className="w-full sm:w-auto text-center bg-slate-900 text-white px-8 py-3.5 rounded-full font-medium hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.1)]">
            Sign Up
          </Link>
        </motion.div>
        {/* Features Section */}
        <div className="w-full max-w-6xl mx-auto px-6 py-24 mt-20 relative z-10 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-orange-100 text-cyber-accent rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Bulletproof Verification</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Utilize multiple AI detection models to cross-reference forensic data and ensure complete content authenticity.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-orange-100 text-cyber-accent rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Analysis</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Process URLs, raw data strings, and complex media files instantly with our decentralized parsing engine.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-orange-100 text-cyber-accent rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Forensic Reports</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Generate cryptographically signed, detailed PDF breakdowns validating or debunking digital manipulation.
              </p>
            </motion.div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-8 relative z-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TruthGuard Icon" className="w-6 h-6 object-contain" />
            <span className="font-semibold text-slate-900">TruthGuard AI</span>
          </div>
          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} TruthGuard. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link to="#" className="hover:text-cyber-accent transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-cyber-accent transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
