'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useVendorsByCategory, useUpdateVendorRank } from '@/hooks/use-admin';
import { toast } from 'sonner';
import { Trophy, Building, Car, Shirt, ArrowUpDown, Save, Sparkles, Hash } from 'lucide-react';

const CATEGORIES = [
  { key: 'ROOM', label: 'PG / Rooms', icon: Building, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'CAR', label: 'Vehicles', icon: Car, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'LAUNDRY', label: 'Laundry', icon: Shirt, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

export default function RankOptimizationPage() {
  const [activeTab, setActiveTab] = useState('ROOM');
  const [editingRanks, setEditingRanks] = useState<Record<string, number>>({});
  const { data: vendors, isLoading } = useVendorsByCategory(activeTab);
  const updateRank = useUpdateVendorRank();

  const handleRankChange = (vendorProfileId: string, rank: number) => {
    setEditingRanks(prev => ({ ...prev, [vendorProfileId]: rank }));
  };

  const handleSaveRank = async (vendorProfileId: string) => {
    const rank = editingRanks[vendorProfileId];
    if (rank === undefined) return;

    try {
      await updateRank.mutateAsync({ vendorProfileId, rank });
      toast.success('Rank updated! Visibility synced across all pages.', { icon: '🏆' });
      setEditingRanks(prev => {
        const next = { ...prev };
        delete next[vendorProfileId];
        return next;
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update rank');
    }
  };

  const handleSaveAll = async () => {
    const entries = Object.entries(editingRanks);
    if (entries.length === 0) {
      toast.info('No changes to save.');
      return;
    }
    for (const [id, rank] of entries) {
      try {
        await updateRank.mutateAsync({ vendorProfileId: id, rank });
      } catch (err: any) {
        toast.error(`Failed to update rank for vendor: ${err.response?.data?.message || 'Unknown error'}`);
      }
    }
    setEditingRanks({});
    toast.success(`All ${entries.length} rank(s) updated and synced!`, { icon: '🏆' });
  };

  const activeCategory = CATEGORIES.find(c => c.key === activeTab)!;
  const sortedVendors = [...(vendors || [])].sort((a, b) => {
    // Ranked first (higher rank = higher priority), then alphabetical
    if (a.rank > 0 && b.rank > 0) return a.rank - b.rank;
    if (a.rank > 0) return -1;
    if (b.rank > 0) return 1;
    return a.businessName.localeCompare(b.businessName);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Rank Optimization
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assign ranks to vendors for SEO-style visibility control. Ranked vendors appear first; unranked appear alphabetically. Rank 1 = highest priority.
          </p>
        </div>
        {Object.keys(editingRanks).length > 0 && (
          <Button
            onClick={handleSaveAll}
            disabled={updateRank.isPending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save All ({Object.keys(editingRanks).length})
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => { setActiveTab(cat.key); setEditingRanks({}); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === cat.key
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                : 'bg-card border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Vendor List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <activeCategory.icon className={`w-5 h-5 ${activeCategory.color}`} />
              {activeCategory.label} Vendors
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {sortedVendors.length} vendors
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sortedVendors.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <activeCategory.icon className={`w-12 h-12 mx-auto mb-3 opacity-30 ${activeCategory.color}`} />
              <h3 className="text-lg font-medium">No {activeCategory.label} Vendors</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No vendors registered under this category yet.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium w-16">
                      <div className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        Rank
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Vendor</th>
                    <th className="px-4 py-3 text-left font-medium">Contact</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium w-32">
                      <div className="flex items-center gap-1">
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        Set Rank
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedVendors.map((vendor, index) => {
                    const currentEditRank = editingRanks[vendor._id];
                    const displayRank = vendor.rank || 0;
                    const hasEdit = currentEditRank !== undefined && currentEditRank !== displayRank;
                    const userInfo = typeof vendor.userId === 'object' ? vendor.userId as any : null;

                    return (
                      <tr
                        key={vendor._id}
                        className={`transition-colors hover:bg-muted/30 ${
                          displayRank > 0 ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          {displayRank > 0 ? (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                {displayRank}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{vendor.businessName}</p>
                            <p className="text-xs text-muted-foreground">{userInfo?.name || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <p className="text-xs">{userInfo?.email || 'N/A'}</p>
                          <p className="text-xs">{userInfo?.phone || vendor.businessPhone || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            vendor.approvalStatus === 'approved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : vendor.approvalStatus === 'rejected'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {vendor.approvalStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            className="h-8 w-20 text-center text-sm"
                            placeholder="0"
                            value={currentEditRank !== undefined ? currentEditRank : displayRank}
                            onChange={(e) => handleRankChange(vendor._id, Number(e.target.value))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {hasEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                              onClick={() => handleSaveRank(vendor._id)}
                              disabled={updateRank.isPending}
                            >
                              <Sparkles className="w-3 h-3" />
                              Save
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-amber-800 dark:text-amber-300">How Rank Optimization Works</p>
              <ul className="text-amber-700/80 dark:text-amber-400/70 space-y-0.5 list-disc list-inside">
                <li><strong>Rank 1</strong> = Highest visibility — shown first to customers.</li>
                <li><strong>Rank 0 or unset</strong> = Default — listed alphabetically after ranked vendors.</li>
                <li>Changes sync <strong>instantly</strong> to all customer-facing pages.</li>
                <li>Rank is internal — customers never see the rank number.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
