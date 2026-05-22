'use client';

import { useState } from 'react';
import { useAdminReportedItems, useRemoveReportedItem } from '@/hooks/use-admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flag, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import type { MarketplaceItem, User } from '@/types';

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useAdminReportedItems(page, limit);
  const removeItem = useRemoveReportedItem();

  const handleRemove = (itemId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}"? This will soft-delete the listing.`)) return;
    removeItem.mutate(itemId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Reported Items</h1>
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

  const items = data?.data || [];
  const pagination = data?.pagination;

  const getSellerName = (seller: User | string) =>
    typeof seller === 'object' && seller !== null ? seller.name : 'N/A';
  const getSellerEmail = (seller: User | string) =>
    typeof seller === 'object' && seller !== null ? seller.email : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Flag className="w-7 h-7 text-red-500" />
          Reported Items
        </h1>
        <p className="text-sm text-muted-foreground">
          {pagination?.total || 0} reported item(s)
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground text-lg font-medium">No reported items</p>
          <p className="text-sm text-muted-foreground mt-1">All marketplace listings are clean!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item: MarketplaceItem) => (
            <Card key={item._id} className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Image */}
                {item.images && item.images.length > 0 && (
                  <div className="w-full lg:w-32 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <Badge variant="destructive" className="shrink-0">
                      <Flag className="w-3 h-3 mr-1" />
                      {item.reportCount} report{item.reportCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm mb-3">
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">Seller:</span>{' '}
                      {getSellerName(item.sellerId)} ({getSellerEmail(item.sellerId)})
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">Price:</span> ₹
                      {item.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">Category:</span> {item.category}
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">Condition:</span> {item.condition}
                    </span>
                  </div>

                  {/* Report Reasons */}
                  {item.reportReasons && item.reportReasons.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Report Reasons:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.reportReasons.map((reason, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemove(item._id, item.title)}
                      disabled={removeItem.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove Listing
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
