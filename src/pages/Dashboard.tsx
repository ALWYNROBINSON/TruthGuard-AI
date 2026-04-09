import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, AlertTriangle, CheckCircle, FileText, TrendingUp, Activity } from 'lucide-react';
import { User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    suspicious: 0,
    highRisk: 0
  });

  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    // Fetch data from API
    const fetchData = async () => {
      try {
        const res = await fetch('/api/reports', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setRecentReports(data.slice(0, 5));

        const counts = data.reduce((acc: any, report: any) => {
          acc.total++;
          if (report.risk_level === 'Verified') acc.verified++;
          else if (report.risk_level === 'Suspicious') acc.suspicious++;
          else if (report.risk_level === 'High Risk') acc.highRisk++;
          return acc;
        }, { total: 0, verified: 0, suspicious: 0, highRisk: 0 });

        setStats(counts);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const chartData = [
    { name: 'Verified', value: stats.verified, color: '#10B981' },
    { name: 'Suspicious', value: stats.suspicious, color: '#F59E0B' },
    { name: 'High Risk', value: stats.highRisk, color: '#EF4444' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-slate-500">Welcome back, {user.name}. Here's your verification activity.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Analyses', value: stats.total, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Verified Safe', value: stats.verified, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Suspicious', value: stats.suspicious, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'High Risk', value: stats.highRisk, icon: Shield, color: 'text-red-400', bg: 'bg-red-400/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <TrendingUp className="text-slate-600" size={20} />
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 glass-panel p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-cyber-accent" />
              Risk Distribution
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#151B28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel p-8">
          <h3 className="text-xl font-bold mb-6">Recent Reports</h3>
          <div className="space-y-4">
            {recentReports.length > 0 ? recentReports.map((report, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate('/dashboard/reports')}
              >
                <div className={`w-2 h-10 rounded-full ${report.risk_level === 'Verified' ? 'bg-emerald-500' :
                    report.risk_level === 'Suspicious' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{report.file_name}</p>
                  <p className="text-xs text-slate-500">{new Date(report.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{report.authenticity_score}%</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{report.risk_level}</p>
                </div>
              </div>
            )) : (
              <p className="text-slate-500 text-center py-10">No reports found.</p>
            )}
          </div>
          <button
            className="w-full mt-6 py-2 text-sm text-cyber-accent hover:text-blue-400 font-medium transition-colors"
            onClick={() => navigate('/dashboard/reports')}
          >
            View All Reports
          </button>
        </div>
      </div>
    </div>
  );
}
