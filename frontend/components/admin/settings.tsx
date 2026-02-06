import React, { useEffect, useState } from 'react';
import { Button, Card } from '../Layout';
import { Loader2 } from 'lucide-react';

interface SettingsState {
  platformFee: number;
  supportEmail: string;
  maintenanceMode: boolean;
  termsUrl: string;
}

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [draft, setDraft] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/admin/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          const normalized: SettingsState = {
            platformFee: Number(data.platformFee ?? 0),
            supportEmail: data.supportEmail || '',
            maintenanceMode: Boolean(data.maintenanceMode),
            termsUrl: data.termsUrl || '',
          };
          setSettings(normalized);
          setDraft(prev => prev ?? normalized);
        } else {
          setError(data.message || 'Unable to load settings.');
        }
      } catch (loadError) {
        console.error('Failed to load settings', loadError);
        setError('Unable to load settings.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    const intervalId = setInterval(loadSettings, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const onSave = async () => {
    if (!draft) return;
    const token = localStorage.getItem('token');
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save settings.');
      }
      const normalized: SettingsState = {
        platformFee: Number(data.platformFee ?? 0),
        supportEmail: data.supportEmail || '',
        maintenanceMode: Boolean(data.maintenanceMode),
        termsUrl: data.termsUrl || '',
      };
      setSettings(normalized);
      setDraft(normalized);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (saveError) {
      console.error('Failed to save settings', saveError);
      setError('Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const dirty = settings && draft && JSON.stringify(settings) !== JSON.stringify(draft);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Settings</h2>
          <p className="text-slate-400 text-sm">Manage platform-wide configuration.</p>
        </div>
        <Button onClick={onSave} disabled={!dirty || saving || loading}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={18} /> Loading settings...
        </div>
      ) : error ? (
        <Card className="text-red-400">{error}</Card>
      ) : (
        <Card>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Platform Fee (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={draft?.platformFee ?? 0}
                onChange={(e) => setDraft(prev => prev ? { ...prev, platformFee: Number(e.target.value) } : prev)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Support Email</label>
              <input
                type="email"
                value={draft?.supportEmail ?? ''}
                onChange={(e) => setDraft(prev => prev ? { ...prev, supportEmail: e.target.value } : prev)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Terms URL</label>
              <input
                type="url"
                value={draft?.termsUrl ?? ''}
                onChange={(e) => setDraft(prev => prev ? { ...prev, termsUrl: e.target.value } : prev)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 p-4">
              <div>
                <div className="text-sm font-medium text-white">Maintenance Mode</div>
                <div className="text-xs text-slate-500">Temporarily disable user access to the platform.</div>
              </div>
              <button
                onClick={() => setDraft(prev => prev ? { ...prev, maintenanceMode: !prev.maintenanceMode } : prev)}
                className={`w-12 h-6 rounded-full transition-colors ${draft?.maintenanceMode ? 'bg-emerald-500' : 'bg-slate-700'}`}
                aria-label="Toggle maintenance mode"
              >
                <span className={`block w-5 h-5 bg-white rounded-full transform transition-transform ${draft?.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {savedAt && (
              <div className="text-xs text-slate-500">Saved at {savedAt}</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
