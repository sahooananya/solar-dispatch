import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Plus } from 'lucide-react';
import { getCustomer, createFollowUp } from '../api/customers';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { apiErrorMessage } from '../api/client';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { push } = useToast();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [followUpType, setFollowUpType] = useState('CALL');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  const { data: c, isLoading } = useQuery({ queryKey: ['customer', id], queryFn: () => getCustomer(id!), enabled: !!id });

  const mut = useMutation({
    mutationFn: () => createFollowUp(id!, { note, followUpType, nextFollowUpDate: nextFollowUpDate || null }),
    onSuccess: () => { push('Follow-up recorded successfully.', 'success'); setNote(''); setNextFollowUpDate(''); qc.invalidateQueries({ queryKey: ['customer', id] }); },
    onError: (e) => push(apiErrorMessage(e), 'error'),
  });

  const canFollowUp = user?.role === 'ADMIN' || user?.role === 'SALES';

  if (isLoading || !c) return <div className="skeleton" style={{ height: 300 }} />;

  const statusBadge = c.status === 'ACTIVE' ? 'badge-success' : c.status === 'LEAD' ? 'badge-info' : 'badge-neutral';

  return (
    <>
      <Link to="/customers" className="btn btn-subtle btn-sm mb-md"><ArrowLeft size={14} /> Back to customers</Link>
      <div className="page-header">
        <div>
          <h1>{c.businessName || c.customerName}</h1>
          <p>{c.customerName} · <span className={`badge ${statusBadge}`}>{c.status}</span> · <span className="badge badge-neutral">{c.customerType}</span></p>
        </div>
        {canFollowUp && (
          <Link to={`/challans/new?customerId=${c.id}`} className="btn btn-sun" data-testid="new-challan-btn"><Plus size={16} /> New challan</Link>
        )}
      </div>

      <div className="grid-2">
        <div>
          <div className="card mb-md" data-testid="customer-contact">
            <div className="card-body">
              <h2 className="card-title">Contact</h2>
              <div className="row gap-md wrap">
                <div><div className="tiny muted">Mobile</div><div className="mono">{c.mobileNumber}</div></div>
                <div><div className="tiny muted">Email</div><div>{c.email || '—'}</div></div>
                <div><div className="tiny muted">GST</div><div className="mono">{c.gstNumber || '—'}</div></div>
              </div>
              <div className="mt-md">
                <div className="tiny muted">Billing address</div>
                <div>{c.address}</div>
              </div>
              {c.installationAddress && (
                <div className="mt-sm"><div className="tiny muted">Installation address</div><div>{c.installationAddress}</div></div>
              )}
            </div>
          </div>

          <div className="card mb-md" data-testid="customer-solar">
            <div className="card-body">
              <h2 className="card-title">Solar Project</h2>
              <div className="row gap-md wrap">
                <div><div className="tiny muted">Property type</div><div>{c.propertyType || '—'}</div></div>
                <div><div className="tiny muted">Roof type</div><div>{c.roofType || '—'}</div></div>
                <div><div className="tiny muted">Monthly bill</div><div>{c.averageMonthlyElectricityBill ? `₹${Number(c.averageMonthlyElectricityBill).toLocaleString()}` : '—'}</div></div>
                <div><div className="tiny muted">Estimated capacity</div><div>{c.estimatedSystemCapacityKw ? `${Number(c.estimatedSystemCapacityKw).toFixed(1)} kW` : '—'}</div></div>
                <div><div className="tiny muted">Lead source</div><div>{c.leadSource || '—'}</div></div>
                <div><div className="tiny muted">Site survey</div><div>{c.siteSurveyDate ? format(new Date(c.siteSurveyDate), 'dd MMM yyyy') : '—'}</div></div>
              </div>
            </div>
          </div>

          {c.challans && c.challans.length > 0 && (
            <div className="card" data-testid="customer-challans">
              <div className="card-body">
                <h2 className="card-title">Related Challans</h2>
                <table className="data-table">
                  <thead><tr><th>Challan #</th><th>Status</th><th className="num">Qty</th><th>Date</th></tr></thead>
                  <tbody>
                    {c.challans.map((ch) => (
                      <tr key={ch.id}>
                        <td className="mono"><Link to={`/challans/${ch.id}`}>{ch.challanNumber}</Link></td>
                        <td><span className={`badge ${ch.status === 'CONFIRMED' ? 'badge-success' : ch.status === 'CANCELLED' ? 'badge-danger' : 'badge-neutral'}`}>{ch.status}</span></td>
                        <td className="num">{ch.totalQuantity}</td>
                        <td className="tiny muted">{format(new Date(ch.createdAt), 'dd MMM yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div>
          {canFollowUp && (
            <div className="card mb-md" data-testid="followup-form">
              <div className="card-body">
                <h2 className="card-title">Add follow-up</h2>
                <div className="field">
                  <label>Note</label>
                  <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Called client, sent proposal..." data-testid="followup-note" />
                </div>
                <div className="field">
                  <label>Type</label>
                  <select value={followUpType} onChange={(e) => setFollowUpType(e.target.value)}>
                    <option value="CALL">Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting</option>
                    <option value="SITE_SURVEY">Site Survey</option>
                    <option value="PROPOSAL_SENT">Proposal Sent</option>
                  </select>
                </div>
                <div className="field">
                  <label>Next follow-up date</label>
                  <input type="date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} />
                </div>
                <button className="btn btn-primary" disabled={!note.trim() || mut.isPending} onClick={() => mut.mutate()} data-testid="followup-submit">
                  {mut.isPending ? 'Saving…' : 'Add follow-up'}
                </button>
              </div>
            </div>
          )}

          <div className="card" data-testid="followup-timeline">
            <div className="card-body">
              <h2 className="card-title">Follow-up history</h2>
              {(!c.followUps || c.followUps.length === 0) ? (
                <div className="muted">No follow-ups yet.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {c.followUps.map((f) => (
                    <li key={f.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--slate-100)' }}>
                      <div className="row between">
                        <strong>{f.followUpType || 'Note'}</strong>
                        <span className="tiny muted">{format(new Date(f.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                      </div>
                      <div className="mt-sm">{f.note}</div>
                      {f.nextFollowUpDate && <div className="tiny muted mt-sm">Next: {format(new Date(f.nextFollowUpDate), 'dd MMM yyyy')}</div>}
                      {f.createdBy && <div className="tiny muted">by {f.createdBy.name}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
