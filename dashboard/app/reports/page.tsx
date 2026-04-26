'use client';
import { useState, useEffect } from 'react';

// ─── Icons (inline SVGs to avoid deps) ────────────────────────────
const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={spinning ? 'animate-spin' : ''}
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const AlertTriangle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────
export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');
    try {
      const res = await fetch('/api/reports', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.html) {
        setReportHtml(data.html);
        setStatus('success');
        setMessage('Report generated successfully');
        setGeneratedAt(new Date().toLocaleString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }));
      } else {
        setStatus('error');
        setMessage(data.error || 'Report generated but could not load preview.');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to connect to report generator');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!reportHtml) return;
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `borgwarner_threat_report_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0B0E14' }}>
      {/* ── Header Section ──────────────────────────────────── */}
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #e9456022, #e9456008)',
                border: '1px solid #e9456030',
              }}
            >
              <span style={{ color: '#e94560' }}><ShieldIcon /></span>
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: '#F0F0F0', fontFamily: "'Segoe UI', system-ui, sans-serif" }}
              >
                Threat Reports
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#5a6785' }}>
                Generate weekly vulnerability reports from NVD &amp; CISA KEV data
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {reportHtml && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: '#1a1a2e',
                  border: '1px solid #2a2a4e',
                  color: '#8892b0',
                }}
              >
                <DownloadIcon />
                Download HTML
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: loading
                  ? 'linear-gradient(135deg, #e94560aa, #c23152aa)'
                  : 'linear-gradient(135deg, #e94560, #c23152)',
                color: '#ffffff',
                boxShadow: loading ? 'none' : '0 4px 20px #e9456040',
              }}
            >
              <RefreshIcon spinning={loading} />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {status !== 'idle' && (
          <div
            className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm"
            style={{
              background: status === 'success' ? '#4ecdc410' : '#ff444410',
              border: `1px solid ${status === 'success' ? '#4ecdc425' : '#ff444425'}`,
              color: status === 'success' ? '#4ecdc4' : '#ff6b6b',
            }}
          >
            {status === 'success' ? <CheckCircle /> : <AlertTriangle />}
            <span>{message}</span>
            {generatedAt && status === 'success' && (
              <span className="ml-auto flex items-center gap-1.5" style={{ color: '#5a6785' }}>
                <ClockIcon />
                {generatedAt}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Report Preview ─────────────────────────────────── */}
      <div className="px-8 pb-8">
        {reportHtml ? (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: '1px solid #1e2338',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* Preview Bar */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                borderBottom: '1px solid #2a2a4e',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
                </div>
                <span className="text-xs ml-2" style={{ color: '#5a6785' }}>
                  Report Preview
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#5a6785' }}>
                <FileIcon />
                <span>threat_report_{new Date().toISOString().slice(0, 10)}.html</span>
              </div>
            </div>

            {/* iFrame */}
            <iframe
              srcDoc={reportHtml}
              className="w-full"
              style={{
                height: '75vh',
                border: 'none',
                background: '#0a0a0a',
              }}
              title="Threat Report Preview"
            />
          </div>
        ) : (
          /* Empty State */
          <div
            className="flex flex-col items-center justify-center rounded-xl py-24"
            style={{
              background: '#0d1017',
              border: '1px dashed #1e2338',
            }}
          >
            <div
              className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                border: '1px solid #2a2a4e',
              }}
            >
              <span style={{ color: '#3a4565' }}><FileIcon /></span>
            </div>
            <p className="text-base font-medium" style={{ color: '#4a5580' }}>
              No report generated yet
            </p>
            <p className="text-sm mt-2 max-w-sm text-center" style={{ color: '#2e3650' }}>
              Click <strong style={{ color: '#e94560' }}>Generate Report</strong> to create a weekly
              threat intelligence report from the latest scan data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}