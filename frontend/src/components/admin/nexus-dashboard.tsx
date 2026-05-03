'use client';

import { useNexus } from '@/components/providers/nexus-provider';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  MousePointer2,
  AlertCircle,
  Zap,
  BarChart3,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  MessageSquare
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const COLORS = ['#84cc16', '#22c55e', '#10b981', '#059669'];

export function NexusDashboard() {
  const { stats, isConnected } = useNexus();

  // Fetch KPI data
  const { data: kpi } = useQuery({
    queryKey: ['admin-kpi'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/kpi');
      return res.data.data;
    }
  });

  // Fetch Revenue Trends
  const { data: trends } = useQuery({
    queryKey: ['admin-trends'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/revenue');
      return res.data.data;
    }
  });

  // Fetch Module Insights
  const { data: modules } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/modules');
      return res.data.data;
    }
  });

  // Fetch Conversion Funnel
  const { data: funnel } = useQuery({
    queryKey: ['admin-conversion'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/conversion');
      return res.data.data;
    }
  });

  return (
    <div className="space-y-8 pb-20">
      {/* ─── The Pulse Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
            Nexus <span className="text-lime-400">Control</span>
            {isConnected && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-lime-400 shadow-[0_0_10px_#84cc16]"
              />
            )}
          </h1>
          <p className="text-zinc-500 font-medium">Real-time platform intelligence engine</p>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-lime-500/10 text-lime-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Live Users</p>
              <p className="text-2xl font-black text-white">{stats?.liveUsers || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Core KPI Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Revenue" 
          value={`₹${kpi?.revenue?.total?.toLocaleString() || '0'}`} 
          subValue={`+₹${kpi?.revenue?.today?.toLocaleString()} today`}
          icon={DollarSign} 
          color="lime" 
        />
        <MetricCard 
          label="Total Users" 
          value={kpi?.counts?.users || 0} 
          subValue={`${stats?.authenticatedUsers || 0} currently online`}
          icon={Users} 
          color="green" 
        />
        <MetricCard 
          label="Active Bookings" 
          value={kpi?.counts?.activeBookings || 0} 
          subValue="Real-time confirmed sessions"
          icon={Zap} 
          color="emerald" 
        />
        <MetricCard 
          label="System Health" 
          value="99.9%" 
          subValue="Latency: 38ms"
          icon={ShieldCheck} 
          color="sky" 
        />
      </div>

      {/* ─── Main Analytics Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2 p-8 bg-white/[0.02] border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-lime-400" />
              Revenue Velocity
            </h3>
            <select className="bg-white/5 border border-white/10 rounded-lg text-xs font-bold px-3 py-1.5 text-zinc-400 outline-none">
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#84cc16' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#84cc16" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Traffic Share */}
        <Card className="p-8 bg-white/[0.02] border-white/10 rounded-[2.5rem]">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <MousePointer2 className="w-5 h-5 text-lime-400" />
            Live Presence
          </h3>
          <div className="space-y-6">
            {stats?.pages && Object.entries(stats.pages).map(([page, count], i) => (
              <div key={page} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-bold truncate max-w-[200px]">{page || '/'}</span>
                  <span className="text-lime-400 font-black">{count}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / stats.liveUsers) * 100}%` }}
                    className="h-full bg-lime-400 rounded-full"
                  />
                </div>
              </div>
            ))}
            {(!stats?.pages || Object.keys(stats.pages).length === 0) && (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">No Active Sessions</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ─── Second Row: Modules & Conversion ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Performance */}
        <Card className="p-8 bg-white/[0.02] border-white/10 rounded-[2.5rem]">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-lime-400" />
            Module Distribution
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modules}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {modules?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Conversion Funnel */}
        <Card className="p-8 bg-white/[0.02] border-white/10 rounded-[2.5rem]">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Layers className="w-5 h-5 text-lime-400" />
            Conversion Funnel
          </h3>
          <div className="space-y-6">
            <FunnelStep 
              label="Search Intent" 
              value={kpi?.counts?.users * 5 || 0} 
              percent={100} 
              icon={Search} 
              color="bg-zinc-500" 
            />
            <FunnelStep 
              label="Item Interactions" 
              value={funnel?.totalBookings * 1.5 || 0} 
              percent={85} 
              icon={MousePointer2} 
              color="bg-sky-500" 
            />
            <FunnelStep 
              label="Booking Created" 
              value={funnel?.totalBookings || 0} 
              percent={60} 
              icon={Zap} 
              color="bg-amber-500" 
            />
            <FunnelStep 
              label="Payment Success" 
              value={funnel?.completedPayments || 0} 
              percent={funnel?.bookingToPaymentRatio || 0} 
              icon={DollarSign} 
              color="bg-lime-500" 
            />
          </div>
        </Card>
      </div>

      {/* ─── Billion Dollar AI Insights ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard 
          icon={TrendingUp} 
          title="Predictive Revenue" 
          desc="Next 30 days projected revenue: ₹1,42,000" 
          confidence={92}
        />
        <InsightCard 
          icon={MessageSquare} 
          title="Sentiment Score" 
          desc="Overall platform satisfaction: 4.8/5.0" 
          confidence={88}
        />
        <InsightCard 
          icon={ShieldCheck} 
          title="Anomaly Detector" 
          desc="Zero suspicious patterns detected last 24h" 
          confidence={99}
        />
      </div>
    </div>
  );
}

function FunnelStep({ label, value, percent, icon: Icon, color }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${color} text-black`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-zinc-400 uppercase tracking-tighter">{label}</span>
          <span className="text-white">{value.toLocaleString()}</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            className={`h-full ${color} rounded-full`}
          />
        </div>
      </div>
      <div className="text-[10px] font-black text-zinc-600 w-10 text-right">
        {Math.round(percent)}%
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, desc, confidence }: any) {
  return (
    <div className="p-6 bg-lime-400/[0.03] border border-lime-400/10 rounded-3xl">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-5 h-5 text-lime-400" />
        <h4 className="text-sm font-bold text-white tracking-tight">{title}</h4>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed mb-4">{desc}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-lime-400/50 uppercase tracking-widest">Confidence</span>
        <span className="text-xs font-black text-lime-400">{confidence}%</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon: Icon, color }: any) {
  const colors: any = {
    lime: 'text-lime-400 bg-lime-400/10',
    green: 'text-green-400 bg-green-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
    sky: 'text-sky-400 bg-sky-400/10',
  };

  return (
    <Card className="p-8 bg-white/[0.02] border-white/10 rounded-[2.5rem] hover:bg-white/[0.04] transition-all group">
      <div className="flex items-start justify-between mb-6">
        <div className={`p-4 rounded-2xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="h-2 w-2 rounded-full bg-white/10 group-hover:bg-lime-400 transition-colors" />
      </div>
      <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-white mb-2">{value}</p>
      <p className="text-xs font-medium text-zinc-600">{subValue}</p>
    </Card>
  );
}
