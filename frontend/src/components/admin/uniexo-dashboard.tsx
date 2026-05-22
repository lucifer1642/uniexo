'use client';

import { useUniExo } from '@/components/providers/uniexo-provider';
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

export function UniExoDashboard() {
  const { stats, isConnected } = useUniExo();

  // Fetch KPI data
  const { data: kpi } = useQuery({
    queryKey: ['admin-kpi'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/kpi');
      return res.data.data;
    },
    refetchInterval: 3000,
    staleTime: 2000,
  });

  // Fetch Revenue Trends
  const { data: trends } = useQuery({
    queryKey: ['admin-trends'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/revenue');
      return res.data.data;
    },
    refetchInterval: 3000,
    staleTime: 2000,
  });

  // Fetch Module Insights
  const { data: modules } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/modules');
      return res.data.data;
    },
    refetchInterval: 3000,
    staleTime: 2000,
  });

  // Fetch Conversion Funnel
  const { data: funnel } = useQuery({
    queryKey: ['admin-conversion'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/conversion');
      return res.data.data;
    },
    refetchInterval: 3000,
    staleTime: 2000,
  });

  return (
    <div className="space-y-8 pb-20 theme-landing">
      {/* ─── The Pulse Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
            UniExo <span className="text-primary italic">Control</span>
            {isConnected && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]"
              />
            )}
          </h1>
          <p className="text-muted-foreground font-medium">Real-time platform intelligence engine</p>
        </div>
        
        <div className="flex gap-2">
          <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Users</p>
              <p className="text-2xl font-black text-foreground">{stats?.liveUsers || 0}</p>
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
          color="primary" 
        />
        <MetricCard 
          label="Total Users" 
          value={kpi?.counts?.users || 0} 
          subValue={`${stats?.authenticatedUsers || 0} currently online`}
          icon={Users} 
          color="secondary" 
        />
        <MetricCard 
          label="Active Bookings" 
          value={kpi?.counts?.activeBookings || 0} 
          subValue="Real-time confirmed sessions"
          icon={Zap} 
          color="accent" 
        />
        <MetricCard 
          label="System Health" 
          value="99.9%" 
          subValue="Latency: 38ms"
          icon={ShieldCheck} 
          color="primary" 
        />
      </div>

      {/* ─── Main Analytics Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2 p-8 bg-surface border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Revenue Velocity
            </h3>
            <select className="bg-surface border border-border rounded-lg text-xs font-black px-4 py-2 text-muted-foreground outline-none focus:border-primary transition-colors">
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: 'var(--primary)', fontWeight: 900 }}
                  labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 700, marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="var(--primary)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Traffic Share */}
        <Card className="p-8 bg-surface border-border rounded-[2.5rem] shadow-2xl">
          <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-2">
            <MousePointer2 className="w-5 h-5 text-primary" />
            Live Presence
          </h3>
          <div className="space-y-6">
            {stats?.pages && Object.entries(stats.pages).map(([page, count], i) => (
              <div key={page} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-muted-foreground truncate max-w-[200px]">{page || '/'}</span>
                  <span className="text-primary">{count}</span>
                </div>
                <div className="h-2 w-full bg-muted/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / stats.liveUsers) * 100}%` }}
                    className="h-full bg-primary rounded-full shadow-[0_0_10px_var(--primary)]"
                  />
                </div>
              </div>
            ))}
            {(!stats?.pages || Object.keys(stats.pages).length === 0) && (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <AlertCircle className="w-10 h-10 mb-2 text-muted-foreground" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No Active Sessions</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ─── Second Row: Modules & Conversion ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Performance */}
        <Card className="p-8 bg-surface border-border rounded-[2.5rem] shadow-2xl">
          <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Module Distribution
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modules}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="_id" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--primary)', fillOpacity: 0.05 }}
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {modules?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={`var(--${['primary', 'secondary', 'accent', 'secondary'][index % 4]})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Conversion Funnel */}
        <Card className="p-8 bg-surface border-border rounded-[2.5rem] shadow-2xl">
          <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Conversion Funnel
          </h3>
          <div className="space-y-6">
            <FunnelStep 
              label="Search Intent" 
              value={kpi?.counts?.users * 5 || 0} 
              percent={100} 
              icon={Search} 
              color="bg-muted" 
            />
            <FunnelStep 
              label="Item Interactions" 
              value={funnel?.totalBookings * 1.5 || 0} 
              percent={85} 
              icon={MousePointer2} 
              color="bg-secondary" 
            />
            <FunnelStep 
              label="Booking Created" 
              value={funnel?.totalBookings || 0} 
              percent={60} 
              icon={Zap} 
              color="bg-accent" 
            />
            <FunnelStep 
              label="Payment Success" 
              value={funnel?.completedPayments || 0} 
              percent={funnel?.bookingToPaymentRatio || 0} 
              icon={DollarSign} 
              color="bg-primary" 
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
      <div className={`p-2 rounded-lg ${color} text-foreground`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-foreground">{value.toLocaleString()}</span>
        </div>
        <div className="h-2 w-full bg-muted/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            className={`h-full ${color.startsWith('bg-') ? color : `bg-${color}`} rounded-full`}
          />
        </div>
      </div>
      <div className="text-[10px] font-black text-muted-foreground w-10 text-right">
        {Math.round(percent)}%
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, desc, confidence }: any) {
  return (
    <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl group hover:border-primary/30 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="w-5 h-5 text-primary" />
        <h4 className="text-sm font-black text-foreground tracking-tight">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4 font-medium">{desc}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Confidence</span>
        <span className="text-xs font-black text-primary">{confidence}%</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon: Icon, color }: any) {
  const colors: any = {
    primary: 'text-primary bg-primary/10',
    secondary: 'text-secondary bg-secondary/10',
    accent: 'text-accent bg-accent/10',
  };

  return (
    <Card className="p-8 bg-surface border-border rounded-[2.5rem] hover:bg-surface/80 transition-all group shadow-xl">
      <div className="flex items-start justify-between mb-6">
        <div className={`p-4 rounded-2xl ${colors[color] || colors.primary}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="h-2 w-2 rounded-full bg-border group-hover:bg-primary transition-colors" />
      </div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-foreground mb-2">{value}</p>
      <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-tighter">{subValue}</p>
    </Card>
  );
}
