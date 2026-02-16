import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card } from '../Layout';
import { Loader2 } from 'lucide-react';

interface EscrowOpsSummary {
  held: number;
  releaseApproved: number;
  releasing: number;
  released: number;
  disputed: number;
  payoutFailed: number;
  openDisputes: number;
}

interface ApiDispute {
  _id: string;
  reason: string;
  status: 'OPEN' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  raisedBy?: { name?: string; role?: string };
  escrow?: { _id?: string; state?: string };
}

interface ReconciliationData {
  escrow?: {
    id?: string;
    state?: string;
    grossAmount?: number;
    commissionAmount?: number;
    netAmount?: number;
  };
  payouts?: Array<{ id: string }>;
  ledger?: {
    totals?: {
      credits?: number;
      debits?: number;
      balance?: number;
    };
  };
}

export const AdminEscrowOps: React.FC = () => {
  const [summary, setSummary] = useState<EscrowOpsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [disputes, setDisputes] = useState<ApiDispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(true);
  const [disputesError, setDisputesError] = useState<string | null>(null);
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessingAutoRelease, setIsProcessingAutoRelease] = useState(false);
  const [isProcessingReleaseQueue, setIsProcessingReleaseQueue] = useState(false);

  const [reconciliationEscrowId, setReconciliationEscrowId] = useState('');
  const [reconciliationLoading, setReconciliationLoading] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData | null>(null);

  const loadSummary = async () => {
    const token = localStorage.getItem('token');
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const res = await fetch('/api/payments/escrow/ops-summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
      } else {
        setSummary(null);
        setSummaryError(data.message || 'Unable to load escrow operations summary.');
      }
    } catch (error) {
      console.error('Failed to load escrow operations summary', error);
      setSummary(null);
      setSummaryError('Unable to load escrow operations summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadOpenDisputes = async () => {
    const token = localStorage.getItem('token');
    try {
      setDisputesLoading(true);
      setDisputesError(null);
      const res = await fetch('/api/payments/disputes?status=OPEN', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDisputes(data);
      } else {
        setDisputes([]);
        setDisputesError(data.message || 'Unable to load open disputes.');
      }
    } catch (error) {
      console.error('Failed to load open disputes', error);
      setDisputes([]);
      setDisputesError('Unable to load open disputes.');
    } finally {
      setDisputesLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadOpenDisputes();
    const summaryIntervalId = setInterval(loadSummary, 30000);
    const disputesIntervalId = setInterval(loadOpenDisputes, 30000);
    return () => {
      clearInterval(summaryIntervalId);
      clearInterval(disputesIntervalId);
    };
  }, []);

  const orderedDisputes = useMemo(() => {
    return [...disputes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [disputes]);

  const runAutoRelease = async () => {
    const token = localStorage.getItem('token');
    try {
      setIsProcessingAutoRelease(true);
      setActionError(null);
      setActionMessage(null);
      const res = await fetch('/api/payments/escrow/process-auto-release', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to process auto release.');
      setActionMessage(`Auto-release processed: ${data.approved || 0} approved out of ${data.processed || 0}.`);
      await loadSummary();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process auto release.';
      setActionError(message);
    } finally {
      setIsProcessingAutoRelease(false);
    }
  };

  const runReleaseQueue = async () => {
    const token = localStorage.getItem('token');
    try {
      setIsProcessingReleaseQueue(true);
      setActionError(null);
      setActionMessage(null);
      const res = await fetch('/api/payments/escrow/process-release-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ limit: 20 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to process release queue.');
      setActionMessage(
        `Release queue scanned ${data.scanned || 0}. Initiated ${data.initiated || 0}, in-flight ${data.inFlight || 0}, failed ${data.failed?.length || 0}.`
      );
      await loadSummary();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process release queue.';
      setActionError(message);
    } finally {
      setIsProcessingReleaseQueue(false);
    }
  };

  const resolveDispute = async (disputeId: string, action: 'RELEASE' | 'CANCEL' | 'KEEP_HOLD') => {
    const token = localStorage.getItem('token');
    try {
      setResolvingDisputeId(disputeId);
      setDisputesError(null);
      const note = window.prompt('Optional resolution note:');
      const res = await fetch(`/api/payments/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, note: note || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resolve dispute.');
      await Promise.all([loadOpenDisputes(), loadSummary()]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to resolve dispute.';
      setDisputesError(message);
    } finally {
      setResolvingDisputeId(null);
    }
  };

  const fetchReconciliation = async () => {
    const token = localStorage.getItem('token');
    const escrowId = reconciliationEscrowId.trim();
    if (!escrowId) return;
    try {
      setReconciliationLoading(true);
      setActionError(null);
      const res = await fetch(`/api/payments/escrow/${escrowId}/reconciliation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load reconciliation.');
      setReconciliationData(data);
    } catch (error: unknown) {
      setReconciliationData(null);
      const message = error instanceof Error ? error.message : 'Failed to load reconciliation.';
      setActionError(message);
    } finally {
      setReconciliationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold">Escrow Operations</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="text-xs"
            disabled={isProcessingAutoRelease}
            onClick={runAutoRelease}
          >
            {isProcessingAutoRelease ? 'Processing...' : 'Process Auto Release'}
          </Button>
          <Button
            variant="secondary"
            className="text-xs"
            disabled={isProcessingReleaseQueue}
            onClick={runReleaseQueue}
          >
            {isProcessingReleaseQueue ? 'Processing...' : 'Process Release Queue'}
          </Button>
        </div>
      </div>

      {(actionMessage || actionError) && (
        <Card className={actionError ? 'text-red-400' : 'text-emerald-400'}>
          {actionError || actionMessage}
        </Card>
      )}

      <Card>
        <h3 className="font-semibold mb-4">Escrow State Summary</h3>
        {summaryLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={16} /> Loading summary...
          </div>
        ) : summaryError ? (
          <div className="text-red-400 text-sm">{summaryError}</div>
        ) : summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
            <div><div className="text-slate-500">Held</div><div className="font-semibold">{summary.held}</div></div>
            <div><div className="text-slate-500">Approved</div><div className="font-semibold">{summary.releaseApproved}</div></div>
            <div><div className="text-slate-500">Releasing</div><div className="font-semibold">{summary.releasing}</div></div>
            <div><div className="text-slate-500">Released</div><div className="font-semibold">{summary.released}</div></div>
            <div><div className="text-slate-500">Disputed</div><div className="font-semibold">{summary.disputed}</div></div>
            <div><div className="text-slate-500">Payout Failed</div><div className="font-semibold">{summary.payoutFailed}</div></div>
            <div><div className="text-slate-500">Open Disputes</div><div className="font-semibold">{summary.openDisputes}</div></div>
          </div>
        ) : null}
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Reconciliation Lookup</h3>
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            value={reconciliationEscrowId}
            onChange={(e) => setReconciliationEscrowId(e.target.value)}
            placeholder="Enter Escrow ID"
            className="w-full md:w-96 bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-white"
          />
          <Button
            variant="secondary"
            className="text-sm"
            disabled={reconciliationLoading || !reconciliationEscrowId.trim()}
            onClick={fetchReconciliation}
          >
            {reconciliationLoading ? 'Loading...' : 'Fetch Reconciliation'}
          </Button>
        </div>

        {reconciliationData && (
          <div className="mt-4 text-sm text-slate-300 space-y-2">
            <div>Escrow: <span className="font-mono text-white">#{reconciliationData.escrow?.id?.slice(-8)?.toUpperCase()}</span></div>
            <div>State: <span className="text-white">{reconciliationData.escrow?.state}</span></div>
            <div>
              Gross: <span className="text-white">Ksh {Number(reconciliationData.escrow?.grossAmount || 0).toFixed(2)}</span>
              {' '}| Commission: <span className="text-white">Ksh {Number(reconciliationData.escrow?.commissionAmount || 0).toFixed(2)}</span>
              {' '}| Net: <span className="text-white">Ksh {Number(reconciliationData.escrow?.netAmount || 0).toFixed(2)}</span>
            </div>
            <div>
              Ledger Credits: <span className="text-white">Ksh {Number(reconciliationData.ledger?.totals?.credits || 0).toFixed(2)}</span>
              {' '}| Debits: <span className="text-white">Ksh {Number(reconciliationData.ledger?.totals?.debits || 0).toFixed(2)}</span>
              {' '}| Balance: <span className="text-white">Ksh {Number(reconciliationData.ledger?.totals?.balance || 0).toFixed(2)}</span>
            </div>
            <div>Payout attempts: <span className="text-white">{(reconciliationData.payouts || []).length}</span></div>
          </div>
        )}
      </Card>

      <Card noPadding className="overflow-x-auto">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Open Disputes</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="p-4">Dispute</th>
              <th className="p-4">Raised By</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Escrow</th>
              <th className="p-4">Created</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {disputesLoading ? (
              <tr>
                <td className="p-4 text-slate-400" colSpan={6}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-500" size={18} /> Loading open disputes...
                  </div>
                </td>
              </tr>
            ) : disputesError ? (
              <tr>
                <td className="p-4 text-red-400" colSpan={6}>{disputesError}</td>
              </tr>
            ) : orderedDisputes.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={6}>No open disputes.</td>
              </tr>
            ) : (
              orderedDisputes.map(dispute => (
                <tr key={dispute._id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 text-xs text-slate-300 font-mono">#{dispute._id.slice(-8).toUpperCase()}</td>
                  <td className="p-4 text-sm text-white">
                    {dispute.raisedBy?.name || 'User'}
                    <span className="ml-2 text-xs text-slate-500">{dispute.raisedBy?.role || ''}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-300 max-w-xs truncate">{dispute.reason}</td>
                  <td className="p-4 text-xs text-slate-400">
                    #{dispute.escrow?._id?.slice(-8).toUpperCase() || 'N/A'}
                    <div className="mt-1">
                      <Badge variant="outline">{dispute.escrow?.state || 'UNKNOWN'}</Badge>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{new Date(dispute.createdAt).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20"
                        disabled={resolvingDisputeId === dispute._id}
                        onClick={() => resolveDispute(dispute._id, 'RELEASE')}
                      >
                        Release
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs border-red-900/50 text-red-400 hover:bg-red-900/20"
                        disabled={resolvingDisputeId === dispute._id}
                        onClick={() => resolveDispute(dispute._id, 'CANCEL')}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        disabled={resolvingDisputeId === dispute._id}
                        onClick={() => resolveDispute(dispute._id, 'KEEP_HOLD')}
                      >
                        Keep Hold
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
