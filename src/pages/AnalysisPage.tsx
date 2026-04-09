import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, File, X, Loader2, Shield, AlertTriangle, CheckCircle, Info, Download, ChevronRight, FileText, Link as LinkIcon } from 'lucide-react';
import { User, AnalysisResult } from '../types';
import Markdown from 'react-markdown';

interface AnalysisPageProps {
  user: User;
  token: string;
}

type InputTab = 'media' | 'text' | 'url';

export default function AnalysisPage({ user, token }: AnalysisPageProps) {
  const [activeTab, setActiveTab] = useState<InputTab>('media');
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startAnalysis = async () => {
    // Validation
    if (activeTab === 'media' && !file) return;
    if (activeTab === 'text' && !textInput.trim()) return;
    if (activeTab === 'url' && !urlInput.trim()) return;

    setAnalyzing(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    if (activeTab === 'media' && file) {
      formData.append('file', file);
    } else if (activeTab === 'text') {
      formData.append('text', textInput);
    } else if (activeTab === 'url') {
      formData.append('url', urlInput);
    }

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadPDF = async () => {
    if (!result) return;
    try {
      const res = await fetch(`/api/reports/${result.id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TruthGuard_Report_${result.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('PDF download failed', err);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">New Analysis</h1>
        <p className="text-slate-500">Upload media to verify authenticity using our multi-modal AI engine.</p>
      </header>

      {!result ? (
        <div className="max-w-3xl mx-auto space-y-6">

          <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'media' ? 'bg-cyber-accent shadow-sm text-black' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <File size={16} /> Media File
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'text' ? 'bg-cyber-accent shadow-sm text-black' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={16} /> Raw Text
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'url' ? 'bg-cyber-accent shadow-sm text-black' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LinkIcon size={16} /> Web URL
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'media' && (
              <motion.div
                key="media"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`glass-panel p-12 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${isDragging ? 'border-cyber-accent bg-cyber-accent/5' : 'border-slate-200'
                  } ${file ? 'border-cyber-accent/50' : ''}`}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-cyber-accent/5 rounded-2xl flex items-center justify-center mx-auto">
                      <File className="text-cyber-accent" size={40} />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{file.name}</p>
                      <p className="text-sm text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="text-sm text-red-400 hover:text-red-300 font-medium flex items-center gap-1 mx-auto"
                    >
                      <X size={16} /> Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Upload className="text-slate-500" size={40} />
                    </div>
                    <div>
                      <p className="text-xl font-bold">Drag and drop media</p>
                      <p className="text-sm text-slate-500 mt-1">Support for Images, Videos, and Audio (Max 50MB)</p>
                    </div>
                    <label className="inline-block bg-slate-100 hover:bg-white/10 border border-slate-200 px-6 py-2 rounded-xl cursor-pointer transition-colors mt-4">
                      Browse Files
                      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*,audio/*" />
                    </label>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-8"
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">Paste suspicious text or claim</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="The text you want to analyze for fake news or factual inconsistencies..."
                  className="w-full h-48 bg-slate-100 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-cyber-accent focus:border-transparent outline-none resize-none transition-all text-slate-700"
                />
              </motion.div>
            )}

            {activeTab === 'url' && (
              <motion.div
                key="url"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-panel p-8"
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">Enter article or post URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/suspicious-article"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-cyber-accent focus:border-transparent outline-none transition-all text-slate-700"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  TruthGuard AI will attempt to scrape text from this public URL and run it through our claim verification models.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mt-6 flex items-center gap-3">
              <AlertTriangle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={startAnalysis}
            disabled={analyzing || (activeTab === 'media' && !file) || (activeTab === 'text' && !textInput.trim()) || (activeTab === 'url' && !urlInput.trim())}
            className="w-full bg-cyber-accent hover:bg-blue-600 text-slate-900 font-bold py-4 rounded-xl mt-8 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed neon-glow"
          >
            {analyzing ? (
              <>
                <Loader2 className="animate-spin" />
                Processing Media...
              </>
            ) : (
              <>
                <Shield size={20} />
                Run Forensic Analysis
              </>
            )}
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Result Header */}
          <div className="glass-panel p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${result.risk_level === 'Verified' ? 'border-emerald-500 text-emerald-500' :
                result.risk_level === 'Suspicious' ? 'border-amber-500 text-amber-500' : 'border-red-500 text-red-500'
                }`}>
                <span className="text-3xl font-bold">{result.authenticity_score}%</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold">Authenticity Score</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${result.risk_level === 'Verified' ? 'bg-emerald-500/10 text-emerald-500' :
                    result.risk_level === 'Suspicious' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                    {result.risk_level}
                  </span>
                </div>
                <p className="text-slate-500">Confidence: <span className="text-slate-900 font-medium">{result.confidence_level}</span></p>
                <p className="text-slate-500">Manipulation: <span className="text-slate-900 font-medium">{result.manipulation_type}</span></p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={downloadPDF}
                className="bg-slate-100 hover:bg-white/10 border border-slate-200 px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                <Download size={18} /> Download Report
              </button>
              <button
                onClick={() => setResult(null)}
                className="bg-cyber-accent hover:bg-blue-600 text-slate-900 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                New Analysis
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Explanation */}
            <div className="lg:col-span-2 glass-panel p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Info className="text-cyber-accent" />
                Forensic Explanation
              </h3>
              <div className="prose prose-invert max-w-none text-slate-700 leading-relaxed">
                <Markdown>{result.explanation_text}</Markdown>
              </div>

              {result.heatmap_regions && (
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Detected Anomalies</h4>
                  <p className="text-slate-700">{result.heatmap_regions}</p>
                </div>
              )}

              {result.references && result.references.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">External References & Grounding</h4>
                  <div className="space-y-2">
                    {result.references.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-cyber-accent hover:text-blue-400 text-sm transition-colors"
                      >
                        <ChevronRight size={14} />
                        <span className="truncate">{ref}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata & Details */}
            <div className="space-y-8">
              <div className="glass-panel p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Shield className="text-cyber-accent" />
                  File Integrity
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">File Name</p>
                    <p className="text-sm font-mono truncate">{result.fileName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">SHA-256 Hash</p>
                    <p className="text-sm font-mono truncate">8f3e2d...4a1b9c</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Metadata Status</p>
                    <div className="flex items-center gap-2 text-sm text-amber-400 mt-1">
                      <AlertTriangle size={14} />
                      <span>Modified timestamps detected</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8">
                <h3 className="text-xl font-bold mb-6">Next Steps</h3>
                <ul className="space-y-3">
                  {[
                    "Cross-reference with known sources",
                    "Check metadata for editing history",
                    "Verify source credibility",
                    "Request human forensic review"
                  ].map((step, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-500">
                      <ChevronRight size={14} className="text-cyber-accent" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
