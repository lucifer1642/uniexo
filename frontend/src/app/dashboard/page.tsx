'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarCheck, ShoppingBag, Wallet, Car, Home, Package,
  TrendingUp, Clock, CheckCircle, XCircle, LayoutDashboard,
  ListOrdered, Store, CreditCard, Shirt, Handshake, ShieldAlert, WashingMachine
} from 'lucide-react';
import { useMyOffers, useUpdateOfferStatus } from '@/hooks/use-offers';
import {
  useUserBookings, useVendorBookings, useWallet,
  useVendorVehicles, useVendorHouses, useUserLaundryOrders,
  useUserMarketplaceItems, useVendorProfile, useVendorDashboardStats, useVendorAnalyticsOverview,
} from '@/hooks/use-dashboard';
import { AddVehicleDialog } from '@/components/add-vehicle-dialog';
import { AddHouseDialog } from '@/components/add-house-dialog';
import { useUpdateBookingStatus } from '@/hooks/use-booking';
import { useDeleteVehicle } from '@/hooks/use-vehicles';
import { useVendorLaundryService, useUpdateVendorLaundryService } from '@/hooks/use-laundry-services';
import { VendorAnalyticsDashboard, OverviewSection, RevenueSection, LedgerSection, FleetSection, RoomsSection, LaundrySection } from './vendor-analytics';

// ─── Sidebar navigation ─────────────────────────────────────────────
import { BarChart3, FileText } from 'lucide-react';

const userSections = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'My Bookings', icon: CalendarCheck },
  { id: 'laundry', label: 'Laundry Orders', icon: Shirt },
  { id: 'marketplace', label: 'My Listings', icon: Store },
  { id: 'offers', label: 'My Offers', icon: Handshake },
];

const vendorSections = [
  { id: 'overview', label: 'Analytics Overview', icon: LayoutDashboard },
  { id: 'revenue', label: 'Revenue & Sales', icon: BarChart3 },
  { id: 'ledger', label: 'Ledger Book', icon: FileText },
  { id: 'vehicles', label: 'Manage Vehicles', icon: Car, serviceType: 'vehicle' },
  { id: 'fleet', label: 'Live Fleet Board', icon: Car, serviceType: 'vehicle' },
  { id: 'houses', label: 'Manage Houses', icon: Home, serviceType: 'house' },
  { id: 'rooms', label: 'Room Occupancy Grid', icon: Home, serviceType: 'house' },
  { id: 'laundry-settings', label: 'My Laundry Service', icon: WashingMachine, serviceType: 'laundry' },
  { id: 'laundry-pipeline', label: 'Laundry Pipeline', icon: Shirt, serviceType: 'laundry' },
  { id: 'bookings', label: 'Booking Requests', icon: CalendarCheck },
  { id: 'offers', label: 'Offers Received', icon: Handshake, serviceType: 'marketplace' },
];

// ─── Status badge helper ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    picked_up: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
}

// ─── USER DASHBOARD ─────────────────────────────────────────────────
function UserDashboard() {
  const [section, setSection] = useState('overview');
  const { data: bookingsData, isLoading: loadingBookings } = useUserBookings();
  const { data: wallet, isLoading: loadingWallet } = useWallet();
  const { data: laundryData, isLoading: loadingLaundry } = useUserLaundryOrders();
  const { data: marketplaceData, isLoading: loadingMarketplace } = useUserMarketplaceItems();
  const { data: offersData, isLoading: loadingOffers } = useMyOffers('buyer');

  const bookings = bookingsData?.bookings || [];
  const laundryOrders = laundryData?.orders || [];
  const marketplaceItems = marketplaceData?.items || [];
  const myOffers = offersData?.data?.data || offersData?.data || [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <aside className="lg:w-56 shrink-0">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {userSections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                section === s.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 space-y-6">
        {section === 'overview' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                  <CalendarCheck className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingBookings ? '...' : bookings.filter((b: any) => b.status === 'confirmed' || b.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Vehicle & Room rentals</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Laundry Orders</CardTitle>
                  <Shirt className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingLaundry ? '...' : laundryOrders.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total orders placed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Marketplace Listings</CardTitle>
                  <Store className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingMarketplace ? '...' : marketplaceItems.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Items listed for sale</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            {bookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((b: any) => (
                      <div key={b._id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium text-sm">{b.serviceType === 'vehicle' ? '🚗' : '🏠'} {b.serviceId?.name || b.serviceId?.title || 'Booking'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">₹{b.totalAmount}</span>
                          <StatusBadge status={b.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {section === 'bookings' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight">My Bookings</h2>
            {loadingBookings ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6 animate-pulse"><div className="h-4 bg-muted rounded w-48" /></Card>)}</div>
            ) : bookings.length === 0 ? (
              <Card className="p-12 text-center">
                <CalendarCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No bookings yet</h3>
                <p className="text-muted-foreground text-sm mt-1">Browse vehicles or rooms to make your first booking.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                      <th className="px-4 py-3 text-left font-medium">Item</th>
                      <th className="px-4 py-3 text-left font-medium">Dates</th>
                      <th className="px-4 py-3 text-left font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr></thead>
                    <tbody className="divide-y">
                      {bookings.map((b: any) => (
                        <tr key={b._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{b.serviceType === 'vehicle' ? '🚗' : '🏠'} {b.serviceId?.name || b.serviceId?.title || 'N/A'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">₹{b.totalAmount}</td>
                          <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {section === 'laundry' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight">Laundry Orders</h2>
            {loadingLaundry ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6 animate-pulse"><div className="h-4 bg-muted rounded w-48" /></Card>)}</div>
            ) : laundryOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <Shirt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No laundry orders</h3>
                <p className="text-muted-foreground text-sm mt-1">Place an order from the Laundry section.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                      <th className="px-4 py-3 text-left font-medium">Service</th>
                      <th className="px-4 py-3 text-left font-medium">Items</th>
                      <th className="px-4 py-3 text-left font-medium">Total</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                    </tr></thead>
                    <tbody className="divide-y">
                      {laundryOrders.map((o: any) => (
                        <tr key={o._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{o.laundryServiceId?.name || 'Service'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{o.items?.length || 0} items</td>
                          <td className="px-4 py-3">₹{o.totalAmount}</td>
                          <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {section === 'marketplace' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight">My Marketplace Listings</h2>
            {loadingMarketplace ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6 animate-pulse"><div className="h-4 bg-muted rounded w-48" /></Card>)}</div>
            ) : marketplaceItems.length === 0 ? (
              <Card className="p-12 text-center">
                <Store className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No listings yet</h3>
                <p className="text-muted-foreground text-sm mt-1">Sell your used items in the marketplace.</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {marketplaceItems.map((item: any) => (
                  <Card key={item._id} className="overflow-hidden">
                    {item.images?.[0] && (
                      <img src={item.images[0]} alt={item.title} className="w-full h-40 object-cover" />
                    )}
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <span className="text-lg font-bold">₹{item.price}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={item.isSold ? 'sold' : 'active'} />
                        <span className="text-xs text-muted-foreground">{item.condition}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {section === 'offers' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight">My Offers</h2>
            {loadingOffers ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6 animate-pulse"><div className="h-4 bg-muted rounded w-48" /></Card>)}</div>
            ) : myOffers.length === 0 ? (
              <Card className="p-12 text-center">
                <Handshake className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No offers made</h3>
                <p className="text-muted-foreground text-sm mt-1">Make an offer on marketplace items to see them here.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                      <th className="px-4 py-3 text-left font-medium">Item</th>
                      <th className="px-4 py-3 text-left font-medium">Offered Price</th>
                      <th className="px-4 py-3 text-left font-medium">Message</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                    </tr></thead>
                    <tbody className="divide-y">
                      {myOffers.map((o: any) => (
                        <tr key={o._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{o.itemId?.title || 'Unknown Item'}</td>
                          <td className="px-4 py-3">₹{o.offeredPrice}</td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{o.message || '-'}</td>
                          <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {section === 'wallet' && <WalletSection />}
      </div>
    </div>
  );
}

// ─── VENDOR DASHBOARD ───────────────────────────────────────────────
function VendorDashboard() {
  const [section, setSection] = useState('overview');
  const { data: vehiclesData, isLoading: loadingVehicles } = useVendorVehicles();
  const { data: housesData, isLoading: loadingHouses } = useVendorHouses();
  const { data: bookingsData, isLoading: loadingBookings } = useVendorBookings();
  const { data: wallet, isLoading: loadingWallet } = useWallet();
  const { data: vendorProfile } = useVendorProfile();
  const { data: statsData, isLoading: loadingStats } = useVendorDashboardStats();
  const { data: vendorOffersData, isLoading: loadingVendorOffers } = useMyOffers('seller');
  const updateBookingStatus = useUpdateBookingStatus();
  const updateOfferStatus = useUpdateOfferStatus();
  const deleteVehicle = useDeleteVehicle();

  const vehicles = vehiclesData?.vehicles || [];
  const houses = housesData?.houses || [];
  const bookings = bookingsData?.bookings || [];
  const vendorOffers = vendorOffersData?.data?.data || vendorOffersData?.data || [];

  const totalVehicles = statsData?.totalVehicles ?? vehicles.length;
  const totalHouses = statsData?.totalHouses ?? houses.length;
  const pendingBookings = statsData?.pendingBookings ?? bookings.filter((b: any) => b.status === 'pending').length;

  const isProfileComplete = Boolean(vendorProfile?.businessAddress && vendorProfile?.businessPhone);

  const { data: overview, isLoading: loadingOverview } = useVendorAnalyticsOverview();

  const [isPending, startTransition] = useTransition();

  const handleTabChange = (id: string) => {
    startTransition(() => {
      setSection(id);
    });
  };

  const filteredSections = vendorSections.filter(s => {
    if (!s.serviceType) return true;
    const userType = vendorProfile?.serviceType?.toLowerCase();
    const sectionType = s.serviceType?.toLowerCase();
    if (userType === sectionType) return true;
    // Map room/pg to house features
    if ((userType === 'room' || userType === 'pg') && sectionType === 'house') return true;
    return false;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 p-4 rounded-xl min-h-screen">
      {/* Sidebar */}
      <aside className="lg:w-64 shrink-0">
        <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 p-2 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50">
          {filteredSections.map((s) => (
            <button
              key={s.id}
              onClick={() => handleTabChange(s.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 group ${
                section === s.id
                  ? 'bg-[#8B004A] text-white shadow-xl shadow-[#8B004A]/20 scale-[1.02]'
                  : 'text-slate-500 hover:bg-white hover:text-[#8B004A] hover:shadow-md'
              }`}
            >
              <s.icon className={`w-4 h-4 transition-transform duration-500 ${section === s.id ? 'scale-110' : 'group-hover:rotate-12'}`} />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Vendor Status */}
        {vendorProfile && (
          <Card className="mt-4 p-4">
            <p className="text-xs text-muted-foreground mb-1">Vendor Status</p>
            <StatusBadge status={vendorProfile.approvalStatus || 'pending'} />
            {vendorProfile.businessName && (
              <p className="text-sm font-medium mt-2">{vendorProfile.businessName}</p>
            )}
          </Card>
        )}
      </aside>

      {/* Content */}
      <div className="flex-1 space-y-6">
        {/* Quick Actions Header */}
        <div className="bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-[#8B004A]">
              Welcome back, {user?.name?.split(' ')[0] || 'Vendor'} 👋
            </h1>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Your command center is online and synchronized.
            </p>
          </div>
          <div className="flex items-center gap-3">
             {vendorProfile?.serviceType?.toLowerCase() === 'vehicle' && (
               <div className="p-1 rounded-2xl bg-[#8B004A]/5 border border-[#8B004A]/10">
                 <AddVehicleDialog />
               </div>
             )}
             {(vendorProfile?.serviceType?.toLowerCase() === 'house' || vendorProfile?.serviceType?.toLowerCase() === 'room' || vendorProfile?.serviceType?.toLowerCase() === 'pg') && (
               <div className="p-1 rounded-2xl bg-[#8B004A]/5 border border-[#8B004A]/10">
                 <AddHouseDialog />
               </div>
             )}
             <Button asChild variant="outline" className="rounded-xl h-11 border-[#8B004A]/20 text-[#8B004A] hover:bg-[#8B004A] hover:text-white transition-all font-bold">
                <Link href="/profile">Profile Settings</Link>
             </Button>
          </div>
        </div>

        {section === 'overview' && overview && <OverviewSection overview={overview} />}
        {section === 'revenue' && <RevenueSection />}
        {section === 'ledger' && <LedgerSection />}
        {section === 'fleet' && <FleetSection />}
        {section === 'rooms' && <RoomsSection />}
        {section === 'laundry-pipeline' && <LaundrySection />}

        {section === 'vehicles' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight">My Vehicles</h2>
              {vendorProfile?.approvalStatus === 'approved' && isProfileComplete ? (
                <AddVehicleDialog />
              ) : (
                <Button disabled variant="outline" className="opacity-50 cursor-not-allowed">
                  {vendorProfile?.approvalStatus !== 'approved' ? 'Add Vehicle (Pending Approval)' : 'Complete Profile First'}
                </Button>
              )}
            </div>
            {loadingVehicles ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6 animate-pulse"><div className="h-4 bg-muted rounded w-48" /></Card>)}</div>
            ) : vehicles.length === 0 ? (
              <Card className="p-12 text-center">
                <Car className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No vehicles listed</h3>
                <p className="text-muted-foreground text-sm mt-1">Add your first vehicle to start renting.</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((v: any) => (
                  <Card key={v._id} className="overflow-hidden">
                    <img
                      src={v.images?.[0] || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80'}
                      alt={v.name}
                      className="w-full h-40 object-cover"
                    />
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{v.name}</h3>
                          <p className="text-xs text-muted-foreground">{v.brand} {v.modelName} · {v.year}</p>
                        </div>
                        <span className="text-lg font-bold">₹{v.pricePerDay}<span className="text-xs font-normal text-muted-foreground">/day</span></span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={v.approvalStatus} />
                          <Badge variant={v.isAvailable ? 'outline' : 'secondary'} className="text-xs">
                            {v.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this vehicle?')) {
                              deleteVehicle.mutate(v._id);
                            }
                          }}
                          disabled={deleteVehicle.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {section === 'houses' && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight">My Houses</h2>
              {vendorProfile?.approvalStatus === 'approved' && isProfileComplete ? (
                <AddHouseDialog />
              ) : (
                <Button disabled variant="outline" className="opacity-50 cursor-not-allowed">
                  {vendorProfile?.approvalStatus !== 'approved' ? 'Add House (Pending Approval)' : 'Complete Profile First'}
                </Button>
              )}
            </div>
            {loadingHouses ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6 animate-pulse"><div className="h-4 bg-muted rounded w-48" /></Card>)}</div>
            ) : houses.length === 0 ? (
              <Card className="p-12 text-center">
                <Home className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No properties listed</h3>
                <p className="text-muted-foreground text-sm mt-1">Add your first property to start earning.</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {houses.map((h: any) => (
                  <Card key={h._id} className="overflow-hidden">
                    <img
                      src={h.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80'}
                      alt={h.title}
                      className="w-full h-40 object-cover"
                    />
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{h.title}</h3>
                          <p className="text-xs text-muted-foreground">{h.city}, {h.state} · {h.bedrooms}BHK</p>
                        </div>
                        <span className="text-lg font-bold">₹{h.pricePerMonth}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={h.approvalStatus} />
                        <Badge variant={h.isAvailable ? 'outline' : 'secondary'} className="text-xs">
                          {h.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {section === 'bookings' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight">Booking Requests</h2>
            {loadingBookings ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6 animate-pulse"><div className="h-4 bg-muted rounded w-48" /></Card>)}</div>
            ) : bookings.length === 0 ? (
              <Card className="p-12 text-center">
                <CalendarCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No booking requests</h3>
                <p className="text-muted-foreground text-sm mt-1">Customers will book your listings — requests appear here.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                      <th className="px-4 py-3 text-left font-medium">Customer</th>
                      <th className="px-4 py-3 text-left font-medium">Item</th>
                      <th className="px-4 py-3 text-left font-medium">Dates</th>
                      <th className="px-4 py-3 text-left font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Action</th>
                    </tr></thead>
                    <tbody className="divide-y">
                      {bookings.map((b: any) => (
                        <tr key={b._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{b.userId?.name || 'Customer'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{b.serviceType === 'vehicle' ? '🚗' : '🏠'} {b.serviceId?.name || b.serviceId?.title || 'N/A'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">₹{b.totalAmount}</td>
                          <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                          <td className="px-4 py-3">
                            {b.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                  onClick={(e) => { e.stopPropagation(); updateBookingStatus.mutate({ bookingId: b._id, status: 'confirmed' }); }}
                                  disabled={updateBookingStatus.isPending}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                  onClick={(e) => { e.stopPropagation(); updateBookingStatus.mutate({ bookingId: b._id, status: 'cancelled' }); }}
                                  disabled={updateBookingStatus.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {section === 'offers' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight">Offers Received</h2>
            {loadingVendorOffers ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6 animate-pulse"><div className="h-4 bg-muted rounded w-48" /></Card>)}</div>
            ) : vendorOffers.length === 0 ? (
              <Card className="p-12 text-center">
                <Handshake className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No offers received</h3>
                <p className="text-muted-foreground text-sm mt-1">Users can make offers on your marketplace items.</p>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                      <th className="px-4 py-3 text-left font-medium">Buyer</th>
                      <th className="px-4 py-3 text-left font-medium">Item</th>
                      <th className="px-4 py-3 text-left font-medium">Offered Price</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Action</th>
                    </tr></thead>
                    <tbody className="divide-y">
                      {vendorOffers.map((o: any) => (
                        <tr key={o._id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{o.buyerId?.name || 'Buyer'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{o.itemId?.title || 'Unknown Item'}</td>
                          <td className="px-4 py-3">₹{o.offeredPrice}</td>
                          <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                          <td className="px-4 py-3">
                            {o.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                  onClick={(e) => { e.stopPropagation(); updateOfferStatus.mutate({ id: o._id, status: 'accepted' }); }}
                                  disabled={updateOfferStatus.isPending}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                  onClick={(e) => { e.stopPropagation(); updateOfferStatus.mutate({ id: o._id, status: 'rejected' }); }}
                                  disabled={updateOfferStatus.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
        {section === 'laundry-settings' && (
          <LaundryServiceSettings />
        )}
        {section === 'my-orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">My Purchases & Bookings</h2>
            <UserDashboardOrders />
          </div>
        )}
      </div>
    </div>
  );
}

function UserDashboardOrders() {
  const { data: bookingsData, isLoading: loadingBookings } = useUserBookings();
  const bookings = bookingsData?.bookings || [];

  return (
    <>
      {loadingBookings ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="p-6 animate-pulse"><div className="h-4 bg-muted rounded w-48" /></Card>)}</div>
      ) : bookings.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No bookings yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Browse vehicles or rooms to make your first booking.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr>
                <th className="px-4 py-3 text-left font-medium">Item</th>
                <th className="px-4 py-3 text-left font-medium">Dates</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {bookings.map((b: any) => (
                  <tr key={b._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{b.serviceType === 'vehicle' ? '🚗' : '🏠'} {b.serviceId?.name || b.serviceId?.title || 'N/A'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">₹{b.totalAmount}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

// ─── SHARED WALLET SECTION ──────────────────────────────────────────
function WalletSection() {
  const { data: wallet, isLoading: loadingWallet } = useWallet();

  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight">Wallet</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="col-span-1 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
          <CardContent className="pt-6">
            <p className="text-sm opacity-90 mb-1">Available Balance</p>
            <p className="text-3xl font-bold">{loadingWallet ? '...' : `₹${(wallet?.balance || 0).toLocaleString()}`}</p>
          </CardContent>
        </Card>
      </div>
      <Card className="p-6 text-center text-muted-foreground">
        <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Transaction history will appear here as you make bookings and receive payments.</p>
      </Card>
    </>
  );
}

// ─── LAUNDRY SERVICE SETTINGS (VENDOR) ──────────────────────────────
function LaundryServiceSettings() {
  const { data: service, isLoading } = useVendorLaundryService();
  const updateService = useUpdateVendorLaundryService();
  const [onsiteCharge, setOnsiteCharge] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-48" />
          </Card>
        ))}
      </div>
    );
  }

  if (!service) {
    return (
      <Card className="p-12 text-center">
        <WashingMachine className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No Laundry Service Found</h3>
        <p className="text-muted-foreground text-sm mt-1">Your laundry service will appear here once approved by admin.</p>
      </Card>
    );
  }

  const handleToggle = async (field: 'onsitePickup' | 'onStoreService', value: boolean) => {
    // Prevent disabling both
    if (field === 'onsitePickup' && !value && !service.onStoreService) return;
    if (field === 'onStoreService' && !value && !service.onsitePickup) return;

    try {
      await updateService.mutateAsync({ [field]: value });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSaveCharge = async () => {
    try {
      await updateService.mutateAsync({ onsitePickupCharge: Number(onsiteCharge) || 0 });
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight">My Laundry Service</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Mode Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Control how customers can use your laundry service. Changes take effect immediately.
          </p>

          {/* On Store Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div>
              <p className="font-medium">🏪 On Store Service</p>
              <p className="text-xs text-muted-foreground">Customers drop clothes at your store</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('onStoreService', !service.onStoreService)}
              disabled={updateService.isPending}
              className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                service.onStoreService ? 'bg-primary justify-end' : 'bg-muted justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow mx-1 transition-all" />
            </button>
          </div>

          {/* Onsite Pickup Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div>
              <p className="font-medium">🚚 Onsite Pickup</p>
              <p className="text-xs text-muted-foreground">You pick up clothes from customer location</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('onsitePickup', !service.onsitePickup)}
              disabled={updateService.isPending}
              className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                service.onsitePickup ? 'bg-primary justify-end' : 'bg-muted justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow mx-1 transition-all" />
            </button>
          </div>

          {/* Pickup Charge */}
          {service.onsitePickup && (
            <div className="p-4 rounded-xl border space-y-3">
              <p className="font-medium text-sm">Onsite Pickup Charge</p>
              <p className="text-xs text-muted-foreground">Current: ₹{service.onsitePickupCharge || 0}</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder="Enter new charge"
                  value={onsiteCharge}
                  onChange={(e) => setOnsiteCharge(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={handleSaveCharge}
                  disabled={updateService.isPending || !onsiteCharge}
                >
                  Update
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30">
        <CardContent className="pt-6 text-sm text-blue-700 dark:text-blue-400">
          <p className="font-medium mb-1">💡 Tip</p>
          <p>Toggling these settings instantly changes what customers see. If you enable onsite pickup, customers will see a pickup option with your charge added to their total.</p>
        </CardContent>
      </Card>
    </>
  );
}

// ─── MAIN DASHBOARD COMPONENT ───────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Redirect admin to admin panel
  if (user?.role === 'admin') {
    if (typeof window !== 'undefined') {
      router.replace('/admin');
    }
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'vendor' ? 'Manage your listings and track earnings.' : 'Here\'s what\'s happening with your account.'}
          </p>
        </div>
        
        {/* Banner for unapproved vendors */}
        {user?.role === 'vendor' && <VendorApprovalBanner />}

        {user?.role === 'vendor' ? <VendorDashboard /> : <UserDashboard />}
      </div>
    </ProtectedRoute>
  );
}

function VendorApprovalBanner() {
  const { data: vendorProfile } = useVendorProfile();
  
  if (!vendorProfile || vendorProfile.approvalStatus === 'approved') return null;

  return (
    <div className="mb-8 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-500">
      <h3 className="font-semibold flex items-center gap-2">
        <ShieldAlert className="w-5 h-5" />
        Account Pending Approval
      </h3>
      <p className="text-sm mt-1">
        Your vendor account is currently {vendorProfile.approvalStatus}. You can complete your profile in the <a href="/profile" className="underline font-medium">Profile</a> tab. Once approved by an administrator, you'll be able to start listing vehicles and properties.
      </p>
    </div>
  );
}
