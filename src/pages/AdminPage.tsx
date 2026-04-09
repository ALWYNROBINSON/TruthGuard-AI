import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Users, Shield, Activity, AlertCircle, Database, Server, Clock } from 'lucide-react';

interface AdminPageProps {
  token: string;
}

export default function AdminPage({ token }: AdminPageProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
        <p className="text-slate-500">Monitor system performance, user activity, and model accuracy.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Database className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Total Database Entries</p>
              <h3 className="text-2xl font-bold">{stats?.totalUploads || 0}</h3>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl">
              <Server className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">System Status</p>
              <h3 className="text-2xl font-bold text-emerald-400">Operational</h3>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-amber-500/10 p-3 rounded-xl">
              <Activity className="text-amber-400" size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">Active Sessions</p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Logs */}
        <div className="glass-panel p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="text-cyber-accent" />
            Audit Logs
          </h3>
          <div className="space-y-4">
            {stats?.recentLogs?.map((log: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-slate-100 border border-slate-200">
                <div className="mt-1">
                  <AlertCircle size={16} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    <span className="text-cyber-accent">{log.name}</span> {log.action}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {!stats?.recentLogs?.length && (
              <p className="text-slate-500 text-center py-10">No recent activity logs.</p>
            )}
          </div>
        </div>

        {/* Model Performance */}
        <div className="glass-panel p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield className="text-cyber-accent" />
            Model Performance
          </h3>
          <div className="space-y-6">
            {[
              { label: 'Image Engine (EfficientNet-V2)', accuracy: 98.2 },
              { label: 'Video Temporal Analysis', accuracy: 94.5 },
              { label: 'Audio Clone Detection', accuracy: 91.8 },
              { label: 'Metadata Anomaly Engine', accuracy: 99.1 },
            ].map((model, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">{model.label}</span>
                  <span className="font-bold text-cyber-success">{model.accuracy}% Accuracy</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${model.accuracy}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-cyber-accent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
