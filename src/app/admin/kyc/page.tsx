'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Search, Banknote, FileText, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface KycRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  documents: {
    type: string;
    url: string;
  }[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminKycPage() {
  const [requests, setRequests] = useState<KycRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/admin/kyc');
      setRequests(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch KYC requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/admin/kyc/${id}`, { action });
      toast.success(`KYC request ${action}d successfully`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} KYC request`);
    }
  };

  const filteredRequests = requests.filter(r => 
    r.userId.name.toLowerCase().includes(search.toLowerCase()) ||
    r.userId.email.toLowerCase().includes(search.toLowerCase()) ||
    r.bankDetails.bankName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">KYC Management</h1>
            <p className="text-muted-foreground mt-1">Review and approve bank details for vendors and users.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email or bank..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card className="p-20 text-center border-dashed">
              <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-muted-foreground">No pending KYC requests found</h3>
            </Card>
          ) : (
            filteredRequests.map((req) => (
              <Card key={req._id} className="overflow-hidden border-border/50 hover:border-primary/30 transition-all">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r bg-muted/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {req.userId.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold">{req.userId.name}</h4>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{req.userId.email}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Submitted On</p>
                        <p className="text-sm">{new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="mt-4">
                        {req.status === 'pending' ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 gap-1.5 py-1 px-3">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </Badge>
                        ) : req.status === 'approved' ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 gap-1.5 py-1 px-3">
                            <CheckCircle className="w-3.5 h-3.5" /> Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 gap-1.5 py-1 px-3">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Account Holder</p>
                          <p className="font-medium">{req.bankDetails.accountHolder}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Bank Name</p>
                          <p className="font-medium">{req.bankDetails.bankName}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Account Number</p>
                          <p className="font-mono font-medium text-blue-600">{req.bankDetails.accountNumber}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">IFSC Code</p>
                          <p className="font-mono font-medium text-blue-600">{req.bankDetails.ifscCode}</p>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-4">Official Documents</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {req.documents?.map((doc, idx) => (
                            <a 
                              key={idx}
                              href={doc.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 rounded-lg border bg-white hover:border-primary/50 hover:shadow-sm transition-all group cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded bg-primary/5 text-primary">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold capitalize">{doc.type.replace('_', ' ')}</p>
                                  <p className="text-[10px] text-muted-foreground">Click to view document</p>
                                </div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </a>
                          ))}
                          {(!req.documents || req.documents.length === 0) && (
                            <p className="text-sm text-muted-foreground italic">No documents uploaded</p>
                          )}
                        </div>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex gap-3 mt-8 justify-end">
                          <Button 
                            variant="outline" 
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                            onClick={() => handleAction(req._id, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Reject
                          </Button>
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                            onClick={() => handleAction(req._id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
