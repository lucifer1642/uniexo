'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Wallet, CheckCircle, Clock, XCircle, LayoutDashboard, 
  BarChart3, FileText, Car, Home, Shirt, AlertTriangle, CalendarCheck 
} from 'lucide-react';
import { 
  useVendorAnalyticsOverview, 
  useVendorSalesBreakdown, 
  useVendorLedger, 
  useVendorDues, 
  useVendorBookingTrends,
  useVendorRoomOccupancy 
} from '@/hooks/use-dashboard';
import { useVehicleFleet, useReturnVehicle, useToggleMaintenance, useVehicleOperations } from '@/hooks/use-fleet';
import { useVendorLaundryOrders, useUpdateVendorOrderStatus } from '@/hooks/use-laundry-services';
import { VehicleDispatchModal } from '@/components/vehicle-dispatch-modal';
import { toast } from 'sonner';

// Elegant Color Scheme
const BURGUNDY = '#8B004A';
const MUTED_BURGUNDY = '#A93226';
const CREAM = '#f8fafc';
const COLORS = [BURGUNDY, '#5B2C6F', MUTED_BURGUNDY, '#D2B4DE'];

export function VendorAnalyticsDashboard() {
  const [section, setSection] = useState('overview');
  const [isPending, startTransition] = useTransition();

  const { data: overview, isLoading: loadingOverview } = useVendorAnalyticsOverview();
  const { data: dues } = useVendorDues();

  const serviceType = overview?.serviceType || 'all';

  const navItems = [
    { id: 'overview', label: 'Analytics Overview', icon: LayoutDashboard },
    { id: 'revenue', label: 'Revenue & Sales', icon: BarChart3 },
    { id: 'ledger', label: 'Ledger Book', icon: FileText },
    ...(serviceType === 'vehicle' ? [{ id: 'fleet', label: 'Vehicle Fleet', icon: Car }] : []),
    ...(serviceType === 'house' || serviceType === 'pg' ? [{ id: 'rooms', label: 'Room & PG Manager', icon: Home }] : []),
    ...(serviceType === 'laundry' ? [{ id: 'laundry', label: 'Laundry Pipeline', icon: Shirt }] : []),
  ];

  if (loadingOverview) return <div className="p-8 text-center animate-pulse text-[#8B004A]">Loading Analytics Engine...</div>;

  const handleTabChange = (id: string) => {
    startTransition(() => {
      setSection(id);
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 min-h-screen p-4 rounded-xl">
      {/* 🔔 Animated Due Alert Banner */}
      {dues?.totalDue > 0 && (
        <div className="fixed top-20 right-8 z-50 animate-bounce bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-bold">₹{dues.totalDue.toLocaleString()} Due!</span>
          <Button variant="outline" size="sm" className="text-red-600 border-white h-7" onClick={() => toast.success('Reminders sent to all customers!')}>
            Send Reminders
          </Button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="lg:w-64 shrink-0">
        <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                section === item.id
                  ? 'bg-[#8B004A] text-zinc-100 shadow-lg shadow-[#8B004A]/30 scale-105'
                  : 'text-slate-600 hover:bg-[#8B004A]/10 hover:text-[#8B004A]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content Area */}
      <div className="flex-1 space-y-6 w-full overflow-hidden">
        {section === 'overview' && <OverviewSection overview={overview} />}
        {section === 'revenue' && <RevenueSection />}
        {section === 'ledger' && <LedgerSection />}
        {section === 'fleet' && <FleetSection />}
        {section === 'rooms' && <RoomsSection />}
        {section === 'laundry' && <LaundrySection />}
      </div>
    </div>
  );
}

// ─── OVERVIEW SECTION ──────────────────────────────────────────────────
export function OverviewSection({ overview }: { overview: any }) {
  const { data: trends } = useVendorBookingTrends(30);
  const { data: ledger } = useVendorLedger(1, 5); // Fetch recent 5 for activity feed

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 p-8 rounded-[2.5rem] border border-white/60 shadow-inner">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 leading-none mb-2">
            Analytics Engine <span className="text-[#8B004A]">v2.0</span>
          </h2>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Real-time performance synchronized for your {overview.serviceType || 'business'}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/50 p-2 rounded-2xl border border-white/20">
          <Badge className="bg-[#8B004A] text-white hover:bg-[#8B004A] border-0 px-4 py-2 rounded-xl font-black tracking-widest text-[10px]">
            {overview.bookingsToday || 0} NEW BOOKINGS
          </Badge>
          <div className="h-8 w-px bg-slate-200 mx-1" />
          <div className="flex flex-col items-end px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Status</span>
            <span className="text-xs font-black text-green-600 leading-none">LIVE STREAM</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Net Earnings" 
          value={`₹${(overview.netEarnings || 0).toLocaleString()}`} 
          icon={Wallet} 
          trend={`${overview.momGrowth || 0}%`} 
          trendLabel="MoM Growth"
          description="Net after commission"
          gradient="from-[#8B004A] to-[#5B2C6F]"
        />
        <KPICard 
          title="Conversion" 
          value={`${overview.conversionRate || 0}%`} 
          icon={CheckCircle} 
          description="Booking completion rate"
          gradient="from-emerald-600 to-teal-600"
        />
        <KPICard 
          title="Total Volume" 
          value={overview.totalBookings || 0} 
          icon={TrendingUp} 
          subtitle={`${overview.confirmedBookings || 0} Confirmed`}
          description="All-time booking volume"
          gradient="from-blue-600 to-indigo-600"
        />
        <KPICard 
          title="Avg Order" 
          value={`₹${(overview.avgBookingValue || 0).toLocaleString()}`} 
          icon={BarChart3} 
          description="Average transaction value"
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* Charts & Activity Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="xl:col-span-2 border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-slate-100">
            <div className="flex justify-between items-center">
               <CardTitle className="text-xl font-bold flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-[#8B004A]" />
                 30-Day Booking Velocity
               </CardTitle>
               <select className="text-xs font-bold bg-slate-50 border-0 rounded-lg px-2 py-1 outline-none">
                 <option>Last 30 Days</option>
                 <option>Last 7 Days</option>
               </select>
            </div>
          </CardHeader>
          <CardContent className="pt-8 h-[350px]">
            {trends ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B004A" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8B004A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#8B004A" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#8B004A', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B004A]"></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {ledger?.entries?.slice(0, 5).map((entry: any, i: number) => (
                <div key={entry.id} className="flex items-start gap-4 animate-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`p-2 rounded-xl shrink-0 ${
                    entry.paymentStatus === 'completed' ? 'bg-green-100 text-green-600' : 
                    entry.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {entry.serviceType === 'vehicle' ? <Car className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{entry.customerName}</p>
                    <p className="text-xs text-slate-500">{new Date(entry.bookingDate).toLocaleDateString()} · {entry.serviceType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#8B004A]">₹{entry.totalAmount}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400">{entry.paymentStatus}</p>
                  </div>
                </div>
              ))}
              {(!ledger?.entries || ledger.entries.length === 0) && (
                <div className="text-center py-12 text-slate-400 font-medium">
                  No recent activity found.
                </div>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-[#8B004A] font-bold hover:bg-[#8B004A]/5" onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'ledger' }))}>
              View Full Ledger
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg">Volume Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex justify-center items-center pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: overview.completedBookings || 0 },
                    { name: 'Pending', value: overview.pendingBookings || 0 },
                    { name: 'Cancelled', value: overview.cancelledBookings || 0 },
                  ]}
                  cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value"
                >
                  <Cell fill="#8B004A" strokeWidth={0} />
                  <Cell fill="#D2B4DE" strokeWidth={0} />
                  <Cell fill="#f1f5f9" strokeWidth={0} />
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl bg-[#8B004A] text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="text-white/80 font-medium uppercase tracking-widest text-xs">Wallet Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-8">
            <div>
              <p className="text-5xl font-black">₹{(overview.netEarnings || 0).toLocaleString()}</p>
              <p className="text-white/60 text-sm mt-2 font-medium">Available for immediate withdrawal</p>
            </div>
            <div className="flex gap-4">
              <Button className="bg-white text-[#8B004A] hover:bg-white/90 font-bold px-8 rounded-2xl">Withdraw Funds</Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold px-8 rounded-2xl">Statements</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-2xl border border-slate-800 text-xs font-bold animate-in zoom-in duration-200">
        <p className="mb-1 text-slate-400">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function KPICard({ title, value, icon: Icon, trend, trendLabel, subtitle, description, gradient }: any) {
  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 group">
      <CardContent className="p-0">
        <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform duration-500`}>
              <Icon className="w-6 h-6 text-slate-600" />
            </div>
            {trend && (
              <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-xs font-black">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
          </div>
          {description && (
            <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase tracking-tighter">{description}</p>
          )}
          {subtitle && (
            <p className="text-xs text-slate-400 font-bold mt-2">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── REVENUE SECTION ────────────────────────────────────────────────────
export function RevenueSection() {
  const { data: sales } = useVendorSalesBreakdown('year');
  const { data: overview } = useVendorAnalyticsOverview();
  const serviceType = overview?.serviceType;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold tracking-tight">Revenue & Sales</h2>
      {sales && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Monthly Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sales.monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                {(!serviceType || serviceType === 'vehicle') && <Bar dataKey="vehicle" stackId="a" fill="#8B004A" radius={[0, 0, 4, 4]} />}
                {(!serviceType || serviceType === 'house') && <Bar dataKey="house" stackId="a" fill="#5B2C6F" />}
                {(!serviceType || serviceType === 'laundry') && <Bar dataKey="laundry" stackId="a" fill="#D2B4DE" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── LEDGER SECTION ─────────────────────────────────────────────────────
export function LedgerSection() {
  const { data: ledger, isLoading } = useVendorLedger(1, 50);

  if (isLoading) return <div>Loading ledger...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Ledger Book</h2>
        <div className="flex gap-4">
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 text-sm py-1">Total Earned: ₹{ledger?.totals?.totalNetEarned.toLocaleString()}</Badge>
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 text-sm py-1">Total Due: ₹{ledger?.totals?.totalDue.toLocaleString()}</Badge>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-white uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Net Earned</th>
                <th className="px-6 py-4 text-right">Due</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {ledger?.entries?.map((row: any) => {
                const rowDate = new Date(row.bookingDate);
                const formattedDate = `${rowDate.toLocaleDateString()} ${rowDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                return (
                <tr key={row.id} className={`hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors
                  ${row.colorCode === 'green' ? 'bg-emerald-50' : ''}
                  ${row.colorCode === 'red' ? 'bg-red-50' : ''}
                  ${row.colorCode === 'amber' ? 'bg-amber-50' : ''}
                `}>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">{formattedDate}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{row.customerName}</td>
                  <td className="px-6 py-4 text-gray-500">{row.serviceName}</td>
                  <td className="px-6 py-4 text-right font-medium">₹{row.totalAmount}</td>
                  <td className="px-6 py-4 text-right text-green-600 font-semibold">₹{row.netEarned}</td>
                  <td className="px-6 py-4 text-right text-red-600 font-semibold">{row.dueAmount > 0 ? `₹${row.dueAmount}` : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${row.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      ${row.paymentStatus === 'pending' ? 'bg-orange-100 text-orange-800' : ''}
                      ${row.paymentStatus === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                      ${row.paymentStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                    `}>
                      {row.paymentStatus}
                    </span>
                  </td>
                </tr>
              )})}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right">PAGE TOTALS:</td>
                <td className="px-6 py-4 text-right">₹{ledger?.totals?.totalRevenue.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-green-600">₹{ledger?.totals?.totalNetEarned.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-red-600">₹{ledger?.totals?.totalDue.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── FLEET SECTION (Real-Time) ──────────────────────────────────────────
export function FleetSection() {
  const { data: fleet } = useVehicleFleet();
  const returnVehicle = useReturnVehicle();
  const toggleMaintenance = useToggleMaintenance();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Car className="w-8 h-8 text-blue-600" /> Live Fleet Board
        </h2>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-muted-foreground">Live Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {fleet?.map((v: any) => (
          <Card key={v._id} className={`overflow-hidden border-l-4 transition-all hover:shadow-lg ${
            v.currentStatus === 'available' ? 'border-l-green-500' : 
            v.currentStatus === 'dispatched' ? (v.isOverdue ? 'border-l-red-600 shadow-red-100' : 'border-l-orange-500') : 
            v.currentStatus === 'maintenance' ? 'border-l-purple-500 shadow-purple-100' :
            'border-l-gray-500'
          }`}>
            <CardContent className="p-0">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{v.name}</h3>
                    <p className="text-xs text-muted-foreground">{v.registrationNumber}</p>
                  </div>
                  <Badge variant="outline" className={`
                    ${v.currentStatus === 'available' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    ${v.currentStatus === 'dispatched' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                    ${v.currentStatus === 'maintenance' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                  `}>
                    {v.currentStatus.toUpperCase()}
                  </Badge>
                </div>

                {v.currentStatus === 'dispatched' && v.currentBooking ? (
                  <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">{v.currentBooking.userId?.name}</span>
                    </div>
                    {v.expectedReturnAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Return in:</span>
                        <span className={`font-bold ${v.isOverdue ? 'text-red-600 animate-pulse' : 'text-orange-600'}`}>
                          {v.minutesUntilReturn > 60 
                            ? `${Math.floor(v.minutesUntilReturn/60)}h ${v.minutesUntilReturn%60}m` 
                            : `${v.minutesUntilReturn}m`}
                          {v.isOverdue && ' (OVERDUE)'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : v.currentStatus === 'maintenance' ? (
                  <div className="h-[84px] mb-4 flex items-center justify-center border-2 border-dashed border-purple-200 rounded-lg bg-purple-50/50">
                    <span className="text-sm text-purple-700 font-medium">Currently in maintenance</span>
                  </div>
                ) : (
                  <div className="h-[84px] mb-4 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    <span className="text-sm text-muted-foreground font-medium">Ready for dispatch</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {v.currentStatus === 'available' ? (
                    <>
                      <VehicleDispatchModal vehicle={v} />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={() => toggleMaintenance.mutate({ id: v._id, isEntering: true })}
                        disabled={toggleMaintenance.isPending}
                      >
                        Send to Maintenance
                      </Button>
                    </>
                  ) : v.currentStatus === 'maintenance' ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => toggleMaintenance.mutate({ id: v._id, isEntering: false })}
                      disabled={toggleMaintenance.isPending}
                    >
                      Make Available
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                      onClick={() => returnVehicle.mutate({ id: v._id, data: {} })}
                      disabled={returnVehicle.isPending}
                    >
                      {returnVehicle.isPending ? 'Processing...' : 'Mark Returned'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <VehicleOperationsHistory />
    </div>
  );
}

function VehicleOperationsHistory() {
  const { data: operations, isLoading } = useVehicleOperations();

  if (isLoading) return <div>Loading history...</div>;

  return (
    <div className="mt-12 space-y-4">
      <h3 className="text-xl font-bold tracking-tight">Operations Ledger</h3>
      <Card className="border-0 shadow-lg overflow-hidden bg-white/80 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium">Operation</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Odometer</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {operations?.map((op: any) => (
                <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(op.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {op.vehicle?.name}
                    <span className="block text-[10px] text-muted-foreground">{op.vehicle?.registration_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`
                      ${op.operation_type === 'dispatch' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                      ${op.operation_type === 'return' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                      ${op.operation_type?.startsWith('maintenance') ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                    `}>
                      {op.operation_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {op.booking?.user?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {op.odometer ? `${op.odometer} km` : '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                    {op.notes || '-'}
                  </td>
                </tr>
              ))}
              {(!operations || operations.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No operations history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── ROOMS SECTION ──────────────────────────────────────────────────────
export function RoomsSection() {
  const { data: rooms } = useVendorRoomOccupancy();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-extrabold tracking-tight">Room Occupancy Grid</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map((room: any) => (
          <Card key={room.houseId} className="relative overflow-hidden">
            <div className={`absolute top-0 w-full h-2 
              ${room.occupancyColor === 'green' ? 'bg-green-500' : ''}
              ${room.occupancyColor === 'amber' ? 'bg-amber-500' : ''}
              ${room.occupancyColor === 'red' ? 'bg-red-500' : ''}
            `} />
            <CardHeader className="pt-6">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{room.title}</CardTitle>
                <div className="text-center">
                  <div className="text-2xl font-black">{room.occupancyPct}%</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Occupied</div>
                </div>
              </div>
              <CardDescription>{room.propertyType.toUpperCase()} • {room.capacity} beds total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Currently Occupied</span>
                  <span className="font-bold">{room.occupied} beds</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Upcoming Vacancies (7d)</span>
                  <span className="font-bold text-orange-600">{room.upcomingVacancies}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Interest</span>
                  <span className="font-bold text-blue-600">{room.pendingInterest}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── LAUNDRY PIPELINE SECTION ───────────────────────────────────────────
export function LaundrySection() {
  const { data: laundry } = useVendorLaundryOrders(1, 100);
  const updateStatus = useUpdateVendorOrderStatus();

  const stages = [
    { id: 'placed', label: 'New Orders', color: 'bg-blue-100 border-blue-200' },
    { id: 'processing', label: 'Washing', color: 'bg-indigo-100 border-indigo-200' },
    { id: 'in_progress', label: 'Ironing/Folding', color: 'bg-purple-100 border-purple-200' },
    { id: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-orange-100 border-orange-200' },
    { id: 'delivered', label: 'Completed', color: 'bg-green-100 border-green-200' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Laundry Kanban Pipeline</h2>
        {laundry && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            Total Revenue: ₹{laundry.totalRevenue.toLocaleString()}
          </Badge>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {stages.map(stage => {
          const stageOrders = laundry?.orders?.filter((o: any) => o.status === stage.id) || [];
          return (
            <div key={stage.id} className="w-[300px] shrink-0 snap-center flex flex-col h-[calc(100vh-200px)]">
              <div className={`p-3 rounded-t-xl border-t border-l border-r font-bold flex justify-between ${stage.color}`}>
                <span>{stage.label}</span>
                <span className="bg-white/50 px-2 rounded-full text-xs flex items-center">{stageOrders.length}</span>
              </div>
              <div className="bg-slate-50 border p-3 flex-1 overflow-y-auto rounded-b-xl space-y-3">
                {stageOrders.map((order: any) => (
                  <Card key={order._id} className="shadow-sm cursor-grab hover:border-blue-300 transition-colors">
                    <CardContent className="p-3">
                      <div className="font-semibold text-sm mb-1">{order.userId?.name}</div>
                      <div className="text-xs text-muted-foreground mb-3">{order.items.length} items • {order.pickupType}</div>
                      
                      {/* Quick Action Buttons to move forward */}
                      <div className="flex gap-1 mt-2">
                        {stage.id === 'placed' && <Button size="sm" variant="secondary" className="w-full h-7 text-xs" onClick={() => updateStatus.mutate({ id: order._id, status: 'processing' })}>Start Wash</Button>}
                        {stage.id === 'processing' && <Button size="sm" variant="secondary" className="w-full h-7 text-xs" onClick={() => updateStatus.mutate({ id: order._id, status: 'in_progress' })}>To Ironing</Button>}
                        {stage.id === 'in_progress' && <Button size="sm" variant="secondary" className="w-full h-7 text-xs" onClick={() => updateStatus.mutate({ id: order._id, status: 'out_for_delivery' })}>Send Out</Button>}
                        {stage.id === 'out_for_delivery' && <Button size="sm" className="w-full h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus.mutate({ id: order._id, status: 'delivered' })}>Mark Delivered</Button>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {stageOrders.length === 0 && (
                  <div className="text-center p-4 text-xs text-muted-foreground font-medium border-2 border-dashed border-slate-200 rounded-lg">
                    No orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
