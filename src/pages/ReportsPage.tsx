import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History, Search, Filter, Download, ExternalLink, Shield, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { AnalysisResult } from '../types';

interface ReportsPageProps {
  user: any;
  token: string;
}

export default function ReportsPage({ user, token }: ReportsPageProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/reports', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [token]);

  const downloadPDF = async (id: number) => {
    try {
      const res = await fetch(`/api/reports/${id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TruthGuard_Report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('PDF download failed', err);
    }
  };

  const filteredReports = reports.filter(r =>
    r.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.risk_level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report History</h1>
          <p className="text-slate-500">Access and manage all your forensic verification reports.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-cyber-accent transition-all w-full md:w-64"
            />
          </div>
          <button
            className="p-2 bg-slate-100 border border-slate-200 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => alert('Filter options coming soon!')}
          >
            <Filter size={20} />
          </button>
        </div>
      </header>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">File Details</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Risk Level</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Score</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading reports...</td>
              </tr>
            ) : filteredReports.length > 0 ? filteredReports.map((report) => (
              <tr key={report.id} className="hover:bg-white/[0.01] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium">{report.file_name}</p>
                      <p className="text-xs text-slate-500 uppercase">{report.file_type.split('/')[1]}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${report.risk_level === 'Verified' ? 'bg-emerald-500/10 text-emerald-500' :
                      report.risk_level === 'Suspicious' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                    {report.risk_level}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold">{report.authenticity_score}%</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-500">{new Date(report.created_at).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => downloadPDF(report.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                      title="Download PDF"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-cyber-accent transition-colors"
                      onClick={() => alert('Report details view coming soon!')}
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No reports found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
