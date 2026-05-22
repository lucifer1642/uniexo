'use client';

import { useState } from 'react';
import { useAdminSettings, useUpdateSetting, useSetCommission } from '@/hooks/use-admin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Percent, Save, Plus, Pencil, X } from 'lucide-react';
import type { AdminSetting } from '@/types';

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSetting = useUpdateSetting();
  const setCommission = useSetCommission();

  const [commissionValue, setCommissionValue] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // New setting form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const commissionSetting = Array.isArray(settings)
    ? settings.find((s: AdminSetting) => s.key === 'commission_percent')
    : null;

  const handleSetCommission = () => {
    const val = Number(commissionValue);
    if (isNaN(val) || val < 0 || val > 100) {
      alert('Commission must be between 0 and 100');
      return;
    }
    setCommission.mutate(val, {
      onSuccess: () => setCommissionValue(''),
    });
  };

  const handleUpdateSetting = (key: string) => {
    let parsedValue: unknown = editValue;
    try {
      parsedValue = JSON.parse(editValue);
    } catch {
      // use as string
    }
    updateSetting.mutate(
      { key, value: parsedValue },
      { onSuccess: () => setEditingKey(null) }
    );
  };

  const handleAddSetting = () => {
    if (!newKey.trim() || !newValue.trim()) {
      alert('Key and value are required');
      return;
    }
    let parsedValue: unknown = newValue;
    try {
      parsedValue = JSON.parse(newValue);
    } catch {
      // use as string
    }
    updateSetting.mutate(
      { key: newKey, value: parsedValue, description: newDesc || undefined },
      {
        onSuccess: () => {
          setNewKey('');
          setNewValue('');
          setNewDesc('');
          setShowNewForm(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-40 mb-3" />
              <div className="h-8 bg-muted rounded w-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const settingsList = Array.isArray(settings) ? settings : [];
  // const otherSettings = settingsList.filter((s: AdminSetting) => s.key !== 'commission_percent');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>

      {/* Commission Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Percent className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold">Platform Commission</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Set the percentage commission the platform takes from each vendor transaction.
        </p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-muted-foreground">Current:</span>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {commissionSetting ? `${commissionSetting.value}%` : 'Not set'}
          </Badge>
        </div>
        <div className="flex items-end gap-3 max-w-sm">
          <div className="flex-1">
            <Label htmlFor="commission" className="text-sm">New Commission %</Label>
            <Input
              id="commission"
              type="number"
              min={0}
              max={100}
              step={0.5}
              placeholder="e.g. 10"
              value={commissionValue}
              onChange={(e) => setCommissionValue(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSetCommission}
            disabled={setCommission.isPending || !commissionValue}
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </Card>

      {/* All Settings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            All Settings
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewForm(!showNewForm)}
          >
            {showNewForm ? (
              <>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Add Setting
              </>
            )}
          </Button>
        </div>

        {/* New Setting Form */}
        {showNewForm && (
          <Card className="p-6 mb-4 border-dashed">
            <h3 className="font-medium mb-3">Add New Setting</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <Label className="text-xs">Key</Label>
                <Input
                  placeholder="setting_key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Value</Label>
                <Input
                  placeholder="value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Description (optional)</Label>
                <Input
                  placeholder="Description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
            </div>
            <Button size="sm" onClick={handleAddSetting} disabled={updateSetting.isPending}>
              <Save className="w-4 h-4 mr-1" />
              Create
            </Button>
          </Card>
        )}

        {/* Settings Table */}
        {settingsList.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No settings configured yet.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Key</th>
                    <th className="px-4 py-3 text-left font-medium">Value</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Updated</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {settingsList.map((setting: AdminSetting) => (
                    <tr key={setting._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{setting.key}</td>
                      <td className="px-4 py-3">
                        {editingKey === setting.key ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 text-sm max-w-50"
                          />
                        ) : (
                          <span className="font-medium">
                            {typeof setting.value === 'object'
                              ? JSON.stringify(setting.value)
                              : String(setting.value)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {setting.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(setting.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {editingKey === setting.key ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleUpdateSetting(setting.key)}
                              disabled={updateSetting.isPending}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setEditingKey(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setEditingKey(setting.key);
                              setEditValue(
                                typeof setting.value === 'object'
                                  ? JSON.stringify(setting.value)
                                  : String(setting.value)
                              );
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
