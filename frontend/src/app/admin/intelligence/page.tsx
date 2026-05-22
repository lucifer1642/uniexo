'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  ShieldAlert, 
  Zap, 
  MapPin, 
  BarChart3, 
  Leaf, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard
} from 'lucide-react';
import { useLivePulse, usePredictiveMetrics, usePlatformKpis, useComputeSnapshot, useSettlements } from '@/hooks/use-intelligence';

export default function AdminIntelligencePage() {
  const { data: pulse } = useLivePulse();
  const { data: metrics } = usePredictiveMetrics();
  const { data: kpis } = usePlatformKpis();
  const { data: settlements } = useSettlements();
  const computeSnapshot = useComputeSnapshot();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const campusData = Object.entries(pulse || {}).map(([name, count]) => ({ name, count: count as number }));
  const totalLive = campusData.reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            UNIEXO INTELLIGENCE
          </h1>
          <p className="text-zinc-500 font-medium mt-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" /> Real-time operations & predictive command center
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Badge variant="outline" className="px-4 py-1 border-emerald-500/50 text-emerald-400 bg-emerald-500/5">
            LIVE NEXUS ACTIVE
          </Badge>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-zinc-700 bg-zinc-800 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700"
            onClick={() => computeSnapshot.mutate()}
            disabled={computeSnapshot.isPending}
          >
            {computeSnapshot.isPending ? 'Computing...' : 'Refresh Snapshot'}
          </Button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Sessions', value: totalLive, icon: Users, color: 'text-blue-400', trend: '+12%' },
          { label: 'Real-time GTV', value: `₹${(kpis?.gtv || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-400', trend: kpis?.gtvTrend || '+0%' },
          { label: 'System Latency', value: `${kpis?.latency || 0}ms`, icon: Activity, color: 'text-purple-400', trend: 'Stable' },
          { label: 'North Star', value: (kpis?.northStar || 0).toFixed(1), icon: Zap, color: 'text-amber-400', trend: 'Growing' }
        ].map((kpi, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl bg-zinc-800 group-hover:scale-110 transition-transform duration-500`}>
                  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
                <Badge className="bg-zinc-800 text-zinc-400 border-none">{kpi.trend}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-zinc-500 text-sm font-bold uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-3xl font-black mt-1 tracking-tight">{kpi.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Pulse Map Visualization */}
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800 shadow-2xl h-[500px] overflow-hidden relative">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Live Campus Pulse Map
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full flex items-center justify-center relative">
            {/* Map Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            <div className="relative w-full max-w-2xl h-64 border-2 border-zinc-800/50 rounded-full flex items-center justify-center">
              {campusData.map((c, i) => {
                const angle = (i / campusData.length) * 2 * Math.PI;
                const x = Math.cos(angle) * 200;
                const y = Math.sin(angle) * 100;
                return (
                  <div 
                    key={c.name}
                    className="absolute group"
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  >
                    <div className="relative">
                      <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                      <div className={`w-4 h-4 rounded-full bg-blue-400 border-4 border-zinc-900 shadow-xl relative z-10`} />
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-800 px-3 py-1 rounded-lg border border-zinc-700 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {c.name}: {c.count} active
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="text-center z-0">
                <p className="text-4xl font-black text-zinc-700">CORE</p>
                <p className="text-xs text-zinc-800 font-bold tracking-[0.5em] uppercase">University Grid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Predictive AI - Churn Risk Sentinel */}
        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              Churn Risk Sentinel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.churnRisk?.map((u: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-between group hover:bg-zinc-800 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-zinc-200">{u.profiles?.name || 'Anonymous'}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{u.profiles?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-red-400 uppercase tracking-tighter">
                      {(u.churn_risk_score * 100).toFixed(0)}% Risk
                    </p>
                    <div className="w-24 h-1.5 bg-zinc-700 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                        style={{ width: `${u.churn_risk_score * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {!metrics?.churnRisk?.length && <p className="text-center py-10 text-zinc-600 font-medium">All clear. No high-risk churn detected.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LTV Leaders */}
        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              High-Value Users (LTV)
            </CardTitle>
            <Button variant="ghost" className="text-zinc-500 hover:text-zinc-100 text-xs font-bold uppercase">Export View</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.topLtv?.map((u: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-800/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-zinc-500 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-all">
                    #{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-zinc-100">{u.profiles?.name}</p>
                    <p className="text-xs text-zinc-500">{u.profiles?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-400">₹{Number(u.ltv_score).toLocaleString()}</p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase">Life-to-date</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Operational Efficiency */}
        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Operational Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 py-6">
            {[
              { label: 'Discovery', count: kpis?.conversion?.search || 0, percent: 100, color: 'bg-zinc-700' },
              { label: 'Engagement', count: kpis?.conversion?.view || 0, percent: ((kpis?.conversion?.view / kpis?.conversion?.search) * 100) || 0, color: 'bg-zinc-600' },
              { label: 'Commitment', count: kpis?.conversion?.book || 0, percent: ((kpis?.conversion?.book / kpis?.conversion?.search) * 100) || 0, color: 'bg-emerald-500' },
              { label: 'Captured', count: kpis?.conversion?.pay || 0, percent: ((kpis?.conversion?.pay / kpis?.conversion?.search) * 100) || 0, color: 'bg-emerald-400' }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs font-black uppercase text-zinc-500 tracking-widest">{step.label}</p>
                  <p className="text-sm font-black text-zinc-200">{step.count}</p>
                </div>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${step.color} transition-all duration-1000 delay-300`} 
                    style={{ width: `${step.percent}%` }}
                  />
                </div>
                {i < 3 && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-zinc-700">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Automated Settlement Engine & ESG */}
      <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Automated Settlement Engine
            </CardTitle>
            <p className="text-xs text-zinc-500 font-medium mt-1">Trustless vendor-platform balancing & carbon ledger</p>
          </div>
          <Button variant="outline" className="border-zinc-700 bg-zinc-800 text-xs font-bold uppercase tracking-widest hover:bg-zinc-700">
            Process All Due
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-800/50 text-zinc-500 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Gross GTV</th>
                  <th className="px-6 py-4">Net Payout</th>
                  <th className="px-6 py-4">Carbon Impact</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {settlements?.map((s: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-200">{s.profiles?.name}</p>
                      <p className="text-[10px] text-zinc-500">{s.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-medium">
                      {new Date(s.period_start).toLocaleDateString()} - {new Date(s.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-black text-zinc-100">₹{Number(s.total_gtv).toLocaleString()}</td>
                    <td className="px-6 py-4 font-black text-blue-400">₹{Number(s.net_payout).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-green-400 font-bold">
                        <Leaf className="w-3 h-3" />
                        {Number(s.carbon_footprint_kg).toFixed(1)}kg
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={s.status === 'settled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}>
                        {s.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!settlements?.length && (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 font-medium italic">
                       No pending settlements in the current ledger cycle.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Safety & Fraud Alerts */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-black text-red-400 tracking-tight">Security Alert: Instant Churn Risk</h4>
          <p className="text-sm text-red-500/70 font-medium">Multiple high-value users dropped off mid-payment in South Campus. Potential Razorpay gateway latency detected.</p>
        </div>
        <Button className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl px-6">Investigate Flow</Button>
      </div>
    </div>
  );
}
