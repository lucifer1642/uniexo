'use client';

import { useState } from 'react';
import { useVendorsList, useApproveVendor } from '@/hooks/use-admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react';

export default function AdminVendorsPage() {
  const { data: vendors, isLoading } = useVendorsList();
  const approveVendor = useApproveVendor();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const handleApprove = (vendorId: string) => {
    approveVendor.mutate({ vendorId, status: 'approved' });
  };

  const handleReject = (vendorId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    approveVendor.mutate({ vendorId, status: 'rejected', reason: reason || undefined });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-48 mb-2" />
              <div className="h-3 bg-muted rounded w-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const vendorList: any[] = Array.isArray(vendors) ? vendors : (vendors?.data || []);

  const filteredVendors = vendorList.filter((v: any) => {
    const matchesSearch = v.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      v.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.userId?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || v.approvalStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {statusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
        <p className="text-sm text-muted-foreground">{filteredVendors.length} vendor(s)</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Vendor List */}
      {filteredVendors.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No vendors found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVendors.map((vendor: any) => (
            <Card key={vendor._id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{vendor.businessName || 'Unnamed Business'}</h3>
                    {statusBadge(vendor.approvalStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Owner: {vendor.userId?.name || 'N/A'} ({vendor.userId?.email || 'N/A'})
                  </p>
                  {vendor.businessType && (
                    <p className="text-sm text-muted-foreground">
                      Type: {vendor.businessType} • Phone: {vendor.businessPhone || 'N/A'}
                    </p>
                  )}
                  {vendor.businessAddress && (
                    <p className="text-sm text-muted-foreground">
                      Address: {vendor.businessAddress}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Registered: {new Date(vendor.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {vendor.approvalStatus === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(vendor._id)}
                      disabled={approveVendor.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(vendor._id)}
                      disabled={approveVendor.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                {vendor.approvalStatus === 'rejected' && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(vendor._id)}
                    disabled={approveVendor.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Re-Approve
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
