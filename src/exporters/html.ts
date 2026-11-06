// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Manoj Rollo (MRJonam91)

import type { JobRadarLedger } from '../core/types.ts';
import { computePipelineStats } from '../core/stats.ts';
import { detectApplicationReminders } from '../core/reminders.ts';

function escapeHtml(str: unknown): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function exportLedgerToHtml(ledger: JobRadarLedger): string {
  const alerts = detectApplicationReminders(ledger.applications);
  const stats = computePipelineStats(
    ledger.applications,
    alerts.filter(a => a.type === 'stale_application').length
  );

  const columns = [
    { status: 'discovered', title: 'Discovered', color: '#8b949e' },
    { status: 'applied', title: 'Applied', color: '#58a6ff' },
    { status: 'screening', title: 'Screening', color: '#bc8cff' },
    { status: 'interviewing', title: 'Interviewing', color: '#d29922' },
    { status: 'offer_received', title: 'Offer Received', color: '#3fb950' }
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>JobRadar — Application Pipeline &amp; Ledger</title>
  <style>
    :root {
      --bg: #0d1117;
      --card-bg: #161b22;
      --border: #30363d;
      --text: #e6edf3;
      --text-muted: #8b949e;
      --accent: #58a6ff;
      --success: #3fb950;
      --warning: #d29922;
      --danger: #f85149;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f6f8fa;
        --card-bg: #ffffff;
        --border: #d0d7de;
        --text: #1f2328;
        --text-muted: #656d76;
        --accent: #0969da;
        --success: #1a7f37;
        --warning: #9a6700;
        --danger: #cf222e;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 { margin: 0; font-size: 24px; }
    .header .meta { color: var(--text-muted); font-size: 14px; }
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    .kpi .num { font-size: 28px; font-weight: bold; color: var(--accent); }
    .kpi .label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
    .board {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .col {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      min-height: 200px;
    }
    .col-header {
      font-weight: 600;
      font-size: 14px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border);
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
    }
    .card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 10px;
      font-size: 13px;
    }
    .card .title { font-weight: bold; margin-bottom: 2px; }
    .card .sub { color: var(--text-muted); font-size: 12px; margin-bottom: 6px; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      background: var(--border);
      color: var(--text);
    }
    .badge-alert { background: rgba(248, 81, 73, 0.2); color: var(--danger); border: 1px solid var(--danger); }
    .badge-stage { background: rgba(88, 166, 255, 0.2); color: var(--accent); }
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 24px;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    th, td { padding: 12px; border-bottom: 1px solid var(--border); }
    th { background: rgba(0,0,0,0.05); color: var(--text-muted); }
    footer { text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>JobRadar — Application Tracker</h1>
      <div class="meta">Deterministic, local-first career pipeline ledger</div>
    </div>
    <div class="meta">
      Updated: ${escapeHtml(ledger.updatedAt.slice(0, 10))} | Total: ${stats.total}
    </div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="num">${stats.activeCount}</div>
      <div class="label">Active Pipelines</div>
    </div>
    <div class="kpi">
      <div class="num">${stats.responseRatePercent}%</div>
      <div class="label">Response Rate (Screening)</div>
    </div>
    <div class="kpi">
      <div class="num">${stats.interviewRatePercent}%</div>
      <div class="label">Interview Rate</div>
    </div>
    <div class="kpi">
      <div class="num">${stats.offerRatePercent}%</div>
      <div class="label">Offer Rate</div>
    </div>
    <div class="kpi">
      <div class="num">${stats.staleCount}</div>
      <div class="label">Need Action / Stale</div>
    </div>
  </div>

  <h2>📊 Kanban Pipeline</h2>
  <div class="board">
    ${columns
      .map(col => {
        const apps = ledger.applications.filter(a => a.status === col.status);
        return `
      <div class="col">
        <div class="col-header" style="border-bottom-color: ${col.color}">
          <span>${escapeHtml(col.title)}</span>
          <span class="badge">${apps.length}</span>
        </div>
        ${
          apps.length === 0
            ? '<div style="color:var(--text-muted); font-size:12px; text-align:center; padding:16px;">(empty)</div>'
            : apps
                .map(app => {
                  const sal = app.salary?.min
                    ? `<div style="color:var(--success); font-weight:500; font-size:11px;">${escapeHtml(app.salary.currency)} ${app.salary.min}${app.salary.max ? `-${app.salary.max}` : ''}</div>`
                    : '';
                  const stages = app.stages?.length
                    ? `<span class="badge badge-stage">${app.stages.length} rounds</span>`
                    : '';
                  return `
            <div class="card">
              <div class="title">${escapeHtml(app.company)}</div>
              <div class="sub">${escapeHtml(app.role)} &bull; ${escapeHtml(app.workplace)}</div>
              ${sal}
              <div style="margin-top:6px; display:flex; gap:4px; align-items:center;">
                <span class="badge">${escapeHtml(app.id)}</span>
                ${stages}
              </div>
            </div>`;
                })
                .join('')
        }
      </div>`;
      })
      .join('')}
  </div>

  <h2>📋 Applications Ledger</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Company</th>
          <th>Role</th>
          <th>Workplace</th>
          <th>Status</th>
          <th>Discovered</th>
          <th>Applied</th>
          <th>CV</th>
          <th>Verified Compensation</th>
        </tr>
      </thead>
      <tbody>
        ${ledger.applications
          .map(
            app => `
        <tr>
          <td><code>${escapeHtml(app.id)}</code></td>
          <td><strong>${escapeHtml(app.company)}</strong></td>
          <td>${escapeHtml(app.role)}</td>
          <td>${escapeHtml(app.workplace)}</td>
          <td><span class="badge">${escapeHtml(app.status)}</span></td>
          <td>${escapeHtml(app.dates.discoveredAt)}</td>
          <td>${escapeHtml(app.dates.appliedAt || '—')}</td>
          <td>${escapeHtml(app.cv?.versionId || '—')}</td>
          <td>${
            app.salary
              ? `${escapeHtml(app.salary.currency)} ${app.salary.min ?? '?'}-${app.salary.max ?? '?'} <em>(${escapeHtml(app.salary.source)})</em>`
              : '—'
          }</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <footer>
    JobRadar v${ledger.version} &bull; Privacy-first deterministic job application tracker &bull; <a href="https://github.com/MRJonam91/JobRadar" style="color:var(--accent);">GitHub Repository</a>
  </footer>
</body>
</html>
`;
}
