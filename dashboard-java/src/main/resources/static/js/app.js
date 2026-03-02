const API = '/api';

let chartStatus = null;
let chartPriority = null;
let chartClear = null;
let chartRelease = null;

const views = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview and KPIs' },
    capture: { title: 'Capture requirement', subtitle: 'Add a new requirement to the backlog' },
    backlog: { title: 'Product backlog', subtitle: 'View and filter all requirements' },
    q1: { title: 'Q1 2026', subtitle: 'Requirements scheduled for Q1 2026' },
    roadmap: { title: 'Roadmap', subtitle: 'Q1, Q2, Q3 · O1, O2, O3' },
    'upcoming-releases': { title: 'Upcoming Releases', subtitle: 'Releases and readiness' },
    priorities: { title: 'Priorities', subtitle: 'Week / month / quarter priorities' },
    releases: { title: 'Releases', subtitle: 'Release notes and comments' },
    meetings: { title: 'Meetings', subtitle: 'Weekly and fortnightly' },
    users: { title: 'Manage users', subtitle: 'Add and view users (Admin only)' }
};

let allRequirements = [];
let currentUser = null;
let priorityRequirementIds = [];

function setView(name) {
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const viewEl = document.getElementById('view-' + name);
    const navEl = document.querySelector('[data-view="' + name + '"]');
    if (viewEl) viewEl.classList.remove('hidden');
    if (navEl) navEl.classList.add('active');
    const t = views[name];
    if (t) {
        document.querySelector('[data-title]').textContent = t.title;
        document.querySelector('[data-subtitle]').textContent = t.subtitle;
    }
    if (name === 'dashboard') {
        refreshKpis();
        refreshCharts();
        refreshDashboardSummary();
    }
    if (name === 'backlog') {
        renderBacklog();
        fetch(API + '/priority-sets/requirement-ids', { credentials: 'include' }).then(res => res.ok ? res.json() : []).then(ids => { priorityRequirementIds = ids || []; renderBacklog(); }).catch(() => {});
        refreshViewCharts('backlog');
    }
    if (name === 'q1') { renderQ1(); refreshViewCharts('q1'); }
    if (name === 'roadmap') { renderRoadmap(); refreshViewCharts('roadmap'); }
    if (name === 'upcoming-releases') { renderUpcomingReleases(); refreshViewCharts('upcoming-releases'); }
    if (name === 'priorities') { renderPriorities(); refreshViewCharts('priorities'); }
    if (name === 'releases') { currentReleasesStatusFilter = ''; renderReleasesList(); refreshViewCharts('releases'); }
    if (name === 'meetings') { renderMeetingsList(); refreshViewCharts('meetings'); }
    if (name === 'users') renderUsers();
}

// Chart instances per view (destroy before redraw)
let viewCharts = {};

function destroyViewCharts(viewName) {
    (viewCharts[viewName] || []).forEach(c => { if (c && c.destroy) c.destroy(); });
    viewCharts[viewName] = [];
}

function refreshViewCharts(viewName) {
    if (typeof Chart === 'undefined') return;
    destroyViewCharts(viewName);
    if (viewName === 'backlog') refreshBacklogCharts();
    else if (viewName === 'q1') refreshQ1Charts();
    else if (viewName === 'roadmap') refreshRoadmapCharts();
    else if (viewName === 'upcoming-releases') refreshUpcomingCharts();
    else if (viewName === 'priorities') refreshPrioritiesCharts();
    else if (viewName === 'releases') refreshReleasesCharts();
    else if (viewName === 'meetings') refreshMeetingsCharts();
}

function refreshBacklogCharts() {
    const reqs = allRequirements || [];
    const total = reqs.length;
    const notStarted = reqs.filter(r => (r.status || '') === 'Not Started').length;
    const inProgress = reqs.filter(r => ['In Dev', 'In QA', 'In UAT'].includes(r.status || '')).length;
    const released = reqs.filter(r => (r.status || '') === 'Released').length;
    setEl('backlog-kpi-total', total);
    setEl('backlog-kpi-not-started', notStarted);
    setEl('backlog-kpi-in-progress', inProgress);
    setEl('backlog-kpi-released', released);
    const typeCounts = {};
    reqs.forEach(r => { const t = r.type || 'Other'; typeCounts[t] = (typeCounts[t] || 0) + 1; });
    const typeLabels = Object.keys(typeCounts).sort();
    const typeData = typeLabels.map(l => typeCounts[l]);
    const priorityLabels = ['Critical', 'High', 'Medium', 'Low'];
    const priorityData = priorityLabels.map(p => reqs.filter(r => (r.priority || '') === p).length);
    viewCharts.backlog = [];
    const c1 = document.getElementById('chart-backlog-type');
    const c2 = document.getElementById('chart-backlog-priority');
    if (c1) viewCharts.backlog.push(new Chart(c1, chartOpts.pie(typeLabels, typeData, CHART_COLORS.status)));
    if (c2) viewCharts.backlog.push(new Chart(c2, chartOpts.bar(priorityLabels, priorityData, CHART_COLORS.priority)));
}

function refreshQ1Charts() {
    const reqs = (allRequirements || []).filter(r => (r.release || '').toLowerCase().includes('q1'));
    const total = reqs.length;
    const notStarted = reqs.filter(r => (r.status || '') === 'Not Started').length;
    const released = reqs.filter(r => (r.status || '') === 'Released').length;
    setEl('q1-kpi-total', total);
    setEl('q1-kpi-not-started', notStarted);
    setEl('q1-kpi-released', released);
    const statusLabels = STATUS_LIST;
    const statusData = statusLabels.map(s => reqs.filter(r => (r.status || '') === s).length);
    const priorityLabels = ['Critical', 'High', 'Medium', 'Low'];
    const priorityData = priorityLabels.map(p => reqs.filter(r => (r.priority || '') === p).length);
    viewCharts.q1 = [];
    const q1a = document.getElementById('chart-q1-status');
    const q1b = document.getElementById('chart-q1-priority');
    if (q1a) viewCharts.q1.push(new Chart(q1a, chartOpts.pie(statusLabels, statusData, CHART_COLORS.status)));
    if (q1b) viewCharts.q1.push(new Chart(q1b, chartOpts.bar(priorityLabels, priorityData, CHART_COLORS.priority)));
}

function refreshRoadmapCharts() {
    const quarterEl = document.getElementById('roadmap-quarter');
    const yearEl = document.getElementById('roadmap-year');
    const quarter = (quarterEl && quarterEl.value) || 'Q1';
    const year = parseInt((yearEl && yearEl.value) || new Date().getFullYear(), 10);
    fetch(API + '/roadmap?quarter=' + encodeURIComponent(quarter) + '&year=' + year, { credentials: 'include' })
        .then(res => res.ok ? res.json() : { byMonth: {} })
        .then(data => {
            const byMonth = data.byMonth || {};
            const months = Object.keys(byMonth).sort();
            const totals = months.map(m => (byMonth[m] || []).length);
            const total = totals.reduce((a, b) => a + b, 0);
            setEl('roadmap-kpi-total', total);
            setEl('roadmap-kpi-o1', totals[0] || 0);
            setEl('roadmap-kpi-o2', totals[1] || 0);
            setEl('roadmap-kpi-o3', totals[2] || 0);
            const labels = ['O1', 'O2', 'O3'].slice(0, months.length);
            viewCharts.roadmap = [];
            const rc = document.getElementById('chart-roadmap-bar');
            if (rc) viewCharts.roadmap.push(new Chart(rc, chartOpts.bar(labels, totals.slice(0, 3), ['#2563eb', '#8b5cf6', '#ec4899'])));
        });
}

function refreshUpcomingCharts() {
    fetch(API + '/releases/upcoming', { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(list => {
            const count = list.length;
            const totalReqs = list.reduce((sum, r) => sum + (r.requirementIds || []).length, 0);
            setEl('upcoming-kpi-count', count);
            setEl('upcoming-kpi-reqs', totalReqs);
            const labels = (list.slice(0, 10)).map(r => r.name || r.version || 'Release');
            const data = (list.slice(0, 10)).map(r => (r.requirementIds || []).length);
            viewCharts['upcoming-releases'] = [];
            const uc = document.getElementById('chart-upcoming-bar');
            if (uc) viewCharts['upcoming-releases'].push(new Chart(uc, chartOpts.bar(labels, data, '#6366f1')));
        });
}

function refreshPrioritiesCharts() {
    const tf = getPrioritiesTimeframe();
    fetch(API + '/priority-sets?timeframe=' + encodeURIComponent(tf), { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(list => {
            const sets = list.length;
            const items = list.reduce((sum, ps) => sum + (ps.items || []).length, 0);
            setEl('priorities-kpi-sets', sets);
            setEl('priorities-kpi-items', items);
            const labels = list.map(ps => (ps.name || '').slice(0, 15));
            const data = list.map(ps => (ps.items || []).length);
            viewCharts.priorities = [];
            const pc = document.getElementById('chart-priorities-bar');
            if (pc) viewCharts.priorities.push(new Chart(pc, chartOpts.bar(labels, data, '#10b981')));
        });
}

function refreshReleasesCharts() {
    fetch(API + '/releases', { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(list => {
            const total = list.length;
            const planned = list.filter(r => (r.status || '') === 'planned').length;
            const released = list.filter(r => (r.status || '') === 'released').length;
            setEl('releases-kpi-total', total);
            setEl('releases-kpi-planned', planned);
            setEl('releases-kpi-released', released);
            const statusLabels = ['planned', 'in_progress', 'released', 'cancelled'];
            const statusData = statusLabels.map(s => list.filter(r => (r.status || '') === s).length);
            viewCharts.releases = [];
            const rlc = document.getElementById('chart-releases-pie');
            if (rlc) viewCharts.releases.push(new Chart(rlc, chartOpts.pie(statusLabels, statusData, ['#94a3b8', '#2563eb', '#10b981', '#ef4444'])));
        });
}

function refreshMeetingsCharts() {
    fetch(API + '/meetings', { credentials: 'include' })
        .then(res => res.ok ? res.json() : [])
        .then(list => {
            const total = list.length;
            const typeCounts = {};
            list.forEach(m => { const t = m.meetingType || 'other'; typeCounts[t] = (typeCounts[t] || 0) + 1; });
            const typeLabels = Object.keys(typeCounts).sort();
            const typeData = typeLabels.map(l => typeCounts[l]);
            setEl('meetings-kpi-total', total);
            setEl('meetings-kpi-weekly', typeCounts['weekly'] || 0);
            setEl('meetings-kpi-fortnightly', typeCounts['fortnightly'] || 0);
            viewCharts.meetings = [];
            const mp = document.getElementById('chart-meetings-pie');
            const ml = document.getElementById('chart-meetings-line');
            const pieLabels = typeLabels.map(l => l.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
            if (mp) viewCharts.meetings.push(new Chart(mp, chartOpts.pie(pieLabels, typeData, ['#2563eb', '#8b5cf6', '#059669', '#d97706', '#6b7280'].concat(CHART_COLORS.status))));
            const byMonth = {};
            list.forEach(m => {
                const month = (m.meetingDate || '').slice(0, 7);
                if (month) byMonth[month] = (byMonth[month] || 0) + 1;
            });
            const months = Object.keys(byMonth).sort().slice(-6);
            if (ml) viewCharts.meetings.push(new Chart(ml, chartOpts.line(months, months.map(m => byMonth[m] || 0))));
        });
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

const chartOpts = {
    pie: (labels, data, colors) => ({
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: colors || CHART_COLORS.status }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    }),
    bar: (labels, data, color) => ({
        type: 'bar',
        data: { labels, datasets: [{ label: 'Count', data, backgroundColor: Array.isArray(color) ? color : color }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    }),
    line: (labels, data) => ({
        type: 'line',
        data: { labels, datasets: [{ label: 'Meetings', data, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    })
};

function showMessage(elId, text, type) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = text;
    el.className = 'message ' + (type || 'success');
    el.classList.remove('hidden');
}

function hideMessage(elId) {
    const el = document.getElementById(elId);
    if (el) el.classList.add('hidden');
}

async function fetchKpis() {
    const res = await fetch(API + '/kpis');
    if (!res.ok) throw new Error('Failed to load KPIs');
    return res.json();
}

const STATUS_LIST = ['Not Started', 'In Dev', 'Dev Completed', 'In QA', 'QA Completed', 'In UAT', 'Production Ready', 'Released'];

async function refreshDashboardSummary() {
    const shipmentsEl = document.getElementById('summary-shipments');
    const countdownEl = document.getElementById('summary-countdown');
    const prioritiesEl = document.getElementById('summary-priorities');
    const actionsEl = document.getElementById('summary-actions');
    if (!countdownEl) return;
    try {
        const res = await fetch(API + '/dashboard/summary', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (shipmentsEl) {
            const list = data.thisMonthShipments || [];
            shipmentsEl.innerHTML = list.length ? list.slice(0, 5).map(r => `<div>${escapeHtml((r.requirement || r.id || '').slice(0, 50))}…</div>`).join('') : 'None this month';
        }
        if (countdownEl) {
            const c = data.nextReleaseCountdown || {};
            if (c.release) {
                const days = c.daysUntil != null ? c.daysUntil + ' days' : '';
                countdownEl.textContent = (c.release.name || c.release.version || 'Next') + (days ? ' — ' + days : '');
            } else countdownEl.textContent = 'No upcoming release';
        }
        if (prioritiesEl) {
            const list = data.top5Priorities || [];
            prioritiesEl.innerHTML = list.length ? list.map(r => `<li>${escapeHtml(r.id || '')}: ${escapeHtml((r.requirement || '').slice(0, 40))}…</li>`).join('') : '<li>—</li>';
        }
        if (actionsEl) {
            const list = data.openActionItems || [];
            actionsEl.innerHTML = list.length ? list.slice(0, 5).map(a => `<li>${escapeHtml((a.actionText || '').slice(0, 50))}…</li>`).join('') : '<li>None</li>';
        }
    } catch (e) {
        if (countdownEl) countdownEl.textContent = '—';
    }
}

async function refreshKpis() {
    try {
        const kpi = await fetchKpis();
        const totalEl = document.getElementById('kpi-total');
        if (totalEl) totalEl.textContent = kpi.total;
        document.querySelectorAll('.kpi-card[data-status]').forEach(card => {
            const status = card.getAttribute('data-status');
            const valEl = card.querySelector('.kpi-value');
            if (valEl && status) valEl.textContent = (kpi.byStatus && kpi.byStatus[status]) != null ? kpi.byStatus[status] : '—';
        });
    } catch (e) {
        const totalEl = document.getElementById('kpi-total');
        if (totalEl) totalEl.textContent = '—';
        document.querySelectorAll('.kpi-card[data-status] .kpi-value').forEach(el => { el.textContent = '—'; });
    }
}

const CHART_COLORS = {
    status: ['#94a3b8', '#2563eb', '#f59e0b', '#10b981', '#059669', '#8b5cf6', '#ec4899', '#14b8a6'],
    priority: ['#dc2626', '#2563eb', '#f59e0b', '#6b7280']
};

function goToBacklogWithFilter(opts) {
    const filterStatus = document.getElementById('filter-status');
    const filterPriority = document.getElementById('filter-priority');
    const filterType = document.getElementById('filter-type');
    const filterClear = document.getElementById('filter-clear');
    const filterRelease = document.getElementById('filter-release');
    if (filterStatus && opts.status !== undefined) filterStatus.value = opts.status;
    if (filterPriority && opts.priority !== undefined) filterPriority.value = opts.priority;
    if (filterType && opts.type !== undefined) filterType.value = opts.type;
    if (filterClear && opts.clear !== undefined) filterClear.value = opts.clear;
    if (filterRelease && opts.release !== undefined) filterRelease.value = opts.release;
    setView('backlog');
}

function refreshCharts() {
    if (typeof Chart === 'undefined') return;
    Promise.all([fetchKpis(), fetchRequirements()]).then(([kpi, reqs]) => {
        if (chartStatus) chartStatus.destroy();
        if (chartPriority) chartPriority.destroy();
        if (chartClear) chartClear.destroy();
        if (chartRelease) chartRelease.destroy();
        const statusCtx = document.getElementById('chart-status');
        const priorityCtx = document.getElementById('chart-priority');
        const clearCtx = document.getElementById('chart-clear');
        const releaseCtx = document.getElementById('chart-release');
        if (!statusCtx || !priorityCtx) return;
        const statusLabels = STATUS_LIST;
        const statusData = STATUS_LIST.map(s => (kpi.byStatus && kpi.byStatus[s]) || 0);
        chartStatus = new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: statusLabels,
                datasets: [{ data: statusData, backgroundColor: CHART_COLORS.status }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: { callbacks: { afterLabel: () => ' Click to view requirements' } }
                },
                onClick(_event, elements) {
                    if (elements.length && elements[0].index >= 0) {
                        const status = statusLabels[elements[0].index];
                        goToBacklogWithFilter({ status });
                    }
                }
            }
        });
        const priorityLabels = ['Critical', 'High', 'Medium', 'Low'];
        const priorityCounts = {};
        (reqs || []).forEach(r => {
            const p = r.priority || 'Low';
            priorityCounts[p] = (priorityCounts[p] || 0) + 1;
        });
        const priorityData = priorityLabels.map(p => priorityCounts[p] || 0);
        chartPriority = new Chart(priorityCtx, {
            type: 'bar',
            data: {
                labels: priorityLabels,
                datasets: [{ label: 'Requirements', data: priorityData, backgroundColor: CHART_COLORS.priority }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { afterLabel: () => ' Click to view requirements' } }
                },
                onClick(_event, elements) {
                    if (elements.length && elements[0].index >= 0) {
                        const priority = priorityLabels[elements[0].index];
                        goToBacklogWithFilter({ priority });
                    }
                }
            }
        });
        if (clearCtx) {
            const clearYes = (reqs || []).filter(r => (r.clear || '').trim() === 'Yes').length;
            const clearNo = (reqs || []).length - clearYes;
            const clearLabels = ['Yes', 'No'];
            const clearData = [clearYes, clearNo];
            chartClear = new Chart(clearCtx, {
                type: 'pie',
                data: {
                    labels: clearLabels,
                    datasets: [{ data: clearData, backgroundColor: ['#10b981', '#ef4444'] }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: { callbacks: { afterLabel: () => ' Click to view requirements' } }
                    },
                    onClick(_event, elements) {
                        if (elements.length && elements[0].index >= 0) {
                            const clear = clearLabels[elements[0].index];
                            goToBacklogWithFilter({ clear });
                        }
                    }
                }
            });
        }
        if (releaseCtx) {
            const releaseCounts = {};
            (reqs || []).forEach(r => {
                const rel = (r.release || '').trim() || '(No release)';
                releaseCounts[rel] = (releaseCounts[rel] || 0) + 1;
            });
            const releaseLabels = Object.keys(releaseCounts).sort();
            const releaseData = releaseLabels.map(rel => releaseCounts[rel]);
            const releaseColors = releaseLabels.map((_, i) => ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'][i % 5]);
            chartRelease = new Chart(releaseCtx, {
                type: 'bar',
                data: {
                    labels: releaseLabels,
                    datasets: [{ label: 'Requirements', data: releaseData, backgroundColor: releaseColors }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } },
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { afterLabel: () => ' Click to view requirements' } }
                    },
                    onClick(_event, elements) {
                        if (elements.length && elements[0].index >= 0) {
                            const release = releaseLabels[elements[0].index];
                            goToBacklogWithFilter({ release });
                        }
                    }
                }
            });
        }
    }).catch(() => {});
}

async function fetchRequirements() {
    const res = await fetch(API + '/requirements');
    if (!res.ok) throw new Error('Failed to load requirements');
    return res.json();
}

function statusClass(s) {
    if (!s) return '';
    return 'status-' + (s.replace(/\s+/g, '.'));
}

function filterBacklog() {
    const status = document.getElementById('filter-status');
    const priority = document.getElementById('filter-priority');
    const type = document.getElementById('filter-type');
    const clearVal = document.getElementById('filter-clear')?.value;
    const releaseVal = document.getElementById('filter-release')?.value;
    const searchEl = document.getElementById('backlog-search');
    const savedViewEl = document.getElementById('saved-view');
    const search = (searchEl && searchEl.value) ? searchEl.value.trim().toLowerCase() : '';
    const savedView = (savedViewEl && savedViewEl.value) || '';
    let list = [...allRequirements];
    if (status && status.value) list = list.filter(r => (r.status || '') === status.value);
    if (priority && priority.value) list = list.filter(r => (r.priority || '') === priority.value);
    if (type && type.value) list = list.filter(r => (r.type || '') === type.value);
    if (clearVal) list = list.filter(r => (r.clear || '').trim() === clearVal);
    if (releaseVal) list = list.filter(r => (releaseVal === '(No release)' ? !(r.release || '').trim() : (r.release || '').trim() === releaseVal));
    if (savedView === 'critical') list = list.filter(r => (r.priority || '') === 'Critical');
    if (savedView === 'not-started') list = list.filter(r => (r.status || '') === 'Not Started');
    if (savedView === 'in-progress') list = list.filter(r => ['In Dev', 'In QA', 'In UAT'].includes(r.status || ''));
    if (search) list = list.filter(r => [r.id, r.requirement, r.description, r.assignee].some(f => (f || '').toLowerCase().includes(search)));
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    list.sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 4;
        const pb = priorityOrder[b.priority] ?? 4;
        if (pa !== pb) return pa - pb;
        const sa = parseInt(a.stackRank, 10) || 999;
        const sb = parseInt(b.stackRank, 10) || 999;
        return sa - sb;
    });
    return list;
}

function renderBacklog() {
    const list = filterBacklog();
    const tbody = document.getElementById('backlog-tbody');
    const depFlag = r => (r.dependency && r.dependency.trim() && r.dependency.trim() !== '—') ? 'Yes' : '—';
    const isPriority = r => priorityRequirementIds.indexOf(r.id) !== -1;
    const pencilSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
    tbody.innerHTML = list.map(r => `
        <tr data-id="${(r.id || '').replace(/"/g, '&quot;')}">
            <td class="id">${escapeHtml(r.id || '')}</td>
            <td class="col-priority">${isPriority(r) ? '<span class="badge-priority" title="In a priority set">★ Priority</span>' : '—'}</td>
            <td>${escapeHtml((r.requirement || '').slice(0, 60))}${(r.requirement || '').length > 60 ? '…' : ''}</td>
            <td>${escapeHtml(r.type || '')}</td>
            <td>${escapeHtml(r.priority || '')}</td>
            <td><span class="status ${statusClass(r.status)}">${escapeHtml(r.status || 'Not Started')}</span></td>
            <td>${escapeHtml(r.releaseMonth || r.release || '—')}</td>
            <td>${escapeHtml(r.assignee || '—')}</td>
            <td>${escapeHtml(r.targetSprint || '—')}</td>
            <td>${escapeHtml(depFlag(r))}</td>
            <td>—</td>
            <td class="comments-cell">${(r.comments || '').trim() ? (escapeHtml((r.comments || '').trim().slice(0, 50)) + ((r.comments || '').trim().length > 50 ? '…' : '')) : '—'}</td>
            <td class="col-edit"><button type="button" class="btn-edit" data-id="${(r.id || '').replace(/"/g, '&quot;')}" title="Edit requirement" aria-label="Edit">${pencilSvg}</button></td>
        </tr>
    `).join('');
}

function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function isQ1Release(release) {
    return (release || '').toLowerCase().includes('q1');
}

function filterQ1() {
    let list = allRequirements.filter(r => isQ1Release(r.release));
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    list.sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 4;
        const pb = priorityOrder[b.priority] ?? 4;
        if (pa !== pb) return pa - pb;
        const sa = parseInt(a.stackRank, 10) || 999;
        const sb = parseInt(b.stackRank, 10) || 999;
        return sa - sb;
    });
    return list;
}

function renderQ1() {
    const list = filterQ1();
    const tbody = document.getElementById('q1-tbody');
    if (!tbody) return;
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9">No Q1 requirements. Set Release to e.g. Q1-2025 to see them here.</td></tr>';
        return;
    }
    const pencilSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
    tbody.innerHTML = list.map(r => `
        <tr data-id="${(r.id || '').replace(/"/g, '&quot;')}">
            <td class="id">${escapeHtml(r.id || '')}</td>
            <td>${escapeHtml((r.requirement || '').slice(0, 80))}${(r.requirement || '').length > 80 ? '…' : ''}</td>
            <td>${escapeHtml(r.type || '')}</td>
            <td>${escapeHtml(r.priority || '')}</td>
            <td><span class="status ${statusClass(r.status)}">${escapeHtml(r.status || 'Not Started')}</span></td>
            <td>${escapeHtml(r.estimate || '')}</td>
            <td>${escapeHtml(r.release || '')}</td>
            <td>${escapeHtml(r.requestedBy || '')}</td>
            <td class="col-edit"><button type="button" class="btn-edit" data-id="${(r.id || '').replace(/"/g, '&quot;')}" title="Edit requirement" aria-label="Edit">${pencilSvg}</button></td>
        </tr>
    `).join('');
}

function showDetail(req) {
    const form = document.getElementById('form-detail');
    if (!form) return;
    document.getElementById('detail-id').value = req.id || '';
    form.requirement.value = req.requirement || '';
    form.description.value = req.description || '';
    form.acceptanceCriteria.value = req.acceptanceCriteria || '';
    form.category.value = req.category || 'VarMiner';
    form.type.value = req.type || 'Functionality';
    form.priority.value = req.priority || 'High';
    form.status.value = req.status || 'Not Started';
    form.estimate.value = req.estimate || '';
    form.stackRank.value = req.stackRank || '';
    form.requesteeDept.value = req.requesteeDept || '';
    form.requestedBy.value = req.requestedBy || '';
    form.assignee.value = req.assignee || '';
    form.release.value = req.release || '';
    form.startSprint.value = req.startSprint || '';
    form.targetSprint.value = req.targetSprint || '';
    form.clear.value = req.clear || 'Yes';
    form.dependency.value = req.dependency || '—';
    form.comments.value = req.comments || '';
    document.getElementById('detail-title').textContent = (req.id || '') + ' — Edit';
    hideMessage('detail-message');
    document.getElementById('detail-panel').classList.remove('hidden');
    const overlay = document.getElementById('detail-panel-overlay');
    if (overlay) { overlay.classList.remove('hidden'); overlay.setAttribute('aria-hidden', 'false'); }
}

function closeDetail() {
    document.getElementById('detail-panel').classList.add('hidden');
    const overlay = document.getElementById('detail-panel-overlay');
    if (overlay) { overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden', 'true'); }
}

function populateReleaseFilter() {
    const sel = document.getElementById('filter-release');
    if (!sel) return;
    const releases = [...new Set(allRequirements.map(r => ((r.release || '').trim() || '(No release)')).filter(Boolean))].sort();
    const current = sel.value;
    sel.innerHTML = '<option value="">All</option>';
    releases.forEach(rel => {
        const opt = document.createElement('option');
        opt.value = rel === '(No release)' ? '(No release)' : rel;
        opt.textContent = rel;
        sel.appendChild(opt);
    });
    if (releases.includes(current)) sel.value = current;
}

async function loadBacklog() {
    try {
        allRequirements = await fetchRequirements();
        try {
            const res = await fetch(API + '/priority-sets/requirement-ids', { credentials: 'include' });
            priorityRequirementIds = res.ok ? await res.json() : [];
        } catch (_) { priorityRequirementIds = []; }
        populateReleaseFilter();
        renderBacklog();
    } catch (e) {
        allRequirements = [];
        document.getElementById('backlog-tbody').innerHTML = '<tr><td colspan="13">Failed to load backlog.</td></tr>';
    }
}

document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
        e.preventDefault();
        setView(el.getAttribute('data-view'));
    });
});

(function initSidebarCollapse() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const key = 'varminer-sidebar-collapsed';
    if (sidebar && toggle) {
        if (localStorage.getItem(key) === '1') sidebar.classList.add('sidebar-collapsed');
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-collapsed');
            localStorage.setItem(key, sidebar.classList.contains('sidebar-collapsed') ? '1' : '0');
            toggle.setAttribute('aria-label', sidebar.classList.contains('sidebar-collapsed') ? 'Expand sidebar' : 'Collapse sidebar');
            toggle.setAttribute('title', sidebar.classList.contains('sidebar-collapsed') ? 'Expand sidebar' : 'Collapse sidebar');
        });
    }
})();

const formCapture = document.getElementById('form-capture');
if (formCapture) formCapture.addEventListener('submit', async e => {
    e.preventDefault();
    hideMessage('capture-message');
    const form = e.target;
    const body = {
        category: form.category?.value?.trim() || 'VarMiner',
        type: form.type?.value?.trim() || 'Functionality',
        requirement: form.requirement?.value?.trim(),
        description: form.description?.value?.trim() || '',
        acceptanceCriteria: form.acceptanceCriteria?.value?.trim() || '',
        clear: form.clear?.value || 'Yes',
        estimate: form.estimate?.value?.trim() || '',
        dependency: form.dependency?.value?.trim() || '—',
        priority: form.priority?.value || 'High',
        stackRank: form.stackRank?.value?.trim() || '',
        status: form.status?.value || 'Not Started',
        startSprint: form.startSprint?.value?.trim() || '',
        targetSprint: form.targetSprint?.value?.trim() || '',
        release: form.release?.value?.trim() || '',
        requesteeDept: form.requesteeDept?.value?.trim() || '',
        requestedBy: form.requestedBy?.value?.trim() || '',
        assignee: form.assignee?.value?.trim() || '',
        comments: form.comments?.value?.trim() || ''
    };
    if (!body.requirement) {
        showMessage('capture-message', 'Requirement text is required.', 'error');
        return;
    }
    try {
        const res = await fetch(API + '/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Save failed');
        }
        showMessage('capture-message', 'Requirement saved. ID: ' + (await res.json()).id, 'success');
        form.reset();
        form.category.value = 'VarMiner';
        form.type.value = 'Functionality';
        form.status.value = 'Not Started';
        refreshKpis();
    } catch (err) {
        showMessage('capture-message', err.message || 'Failed to save.', 'error');
    }
});

const filterStatus = document.getElementById('filter-status');
const filterType = document.getElementById('filter-type');
const filterPriority = document.getElementById('filter-priority');
const filterClear = document.getElementById('filter-clear');
const filterRelease = document.getElementById('filter-release');
const backlogSearch = document.getElementById('backlog-search');
const savedView = document.getElementById('saved-view');
if (filterStatus) filterStatus.addEventListener('change', () => renderBacklog());
if (filterType) filterType.addEventListener('change', () => renderBacklog());
if (filterPriority) filterPriority.addEventListener('change', () => renderBacklog());
if (filterClear) filterClear.addEventListener('change', () => renderBacklog());
if (filterRelease) filterRelease.addEventListener('change', () => renderBacklog());
if (backlogSearch) backlogSearch.addEventListener('input', () => renderBacklog());
if (savedView) savedView.addEventListener('change', () => renderBacklog());
const detailClose = document.getElementById('detail-close');
const detailCancel = document.getElementById('detail-cancel');
if (detailClose) detailClose.addEventListener('click', closeDetail);
if (detailCancel) detailCancel.addEventListener('click', closeDetail);
const detailOverlay = document.getElementById('detail-panel-overlay');
if (detailOverlay) detailOverlay.addEventListener('click', closeDetail);
document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-edit');
    if (btn) {
        const id = btn.getAttribute('data-id');
        if (id) {
            const req = allRequirements.find(r => r.id === id);
            if (req) showDetail(req);
        }
        return;
    }
    const row = e.target.closest('#backlog-tbody tr, #q1-tbody tr');
    if (row) {
        const id = row.getAttribute('data-id');
        if (id) {
            const req = allRequirements.find(r => r.id === id);
            if (req) showDetail(req);
        }
    }
});

const detailDelete = document.getElementById('detail-delete');
if (detailDelete) detailDelete.addEventListener('click', async () => {
    const id = document.getElementById('detail-id').value;
    if (!id) return;
    if (!confirm('Delete this requirement? This cannot be undone.')) return;
    hideMessage('detail-message');
    try {
        const res = await fetch(API + '/requirements/' + encodeURIComponent(id), { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        closeDetail();
        allRequirements = await fetchRequirements();
        populateReleaseFilter();
        renderBacklog();
        if (document.querySelector('.nav-item[data-view="q1"].active')) renderQ1();
        refreshKpis();
    } catch (err) {
        showMessage('detail-message', err.message || 'Failed to delete.', 'error');
    }
});

const formDetail = document.getElementById('form-detail');
if (formDetail) formDetail.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const id = document.getElementById('detail-id').value;
    if (!id) return;
    hideMessage('detail-message');
    const body = {
        id,
        category: form.category?.value?.trim() || 'VarMiner',
        type: form.type?.value?.trim() || 'Functionality',
        requirement: form.requirement?.value?.trim() || '',
        description: form.description?.value?.trim() || '',
        acceptanceCriteria: form.acceptanceCriteria?.value?.trim() || '',
        clear: form.clear?.value || 'Yes',
        estimate: form.estimate?.value?.trim() || '',
        dependency: form.dependency?.value?.trim() || '—',
        priority: form.priority?.value || 'High',
        stackRank: form.stackRank?.value?.trim() || '',
        status: form.status?.value || 'Not Started',
        startSprint: form.startSprint?.value?.trim() || '',
        targetSprint: form.targetSprint?.value?.trim() || '',
        release: form.release?.value?.trim() || '',
        requesteeDept: form.requesteeDept?.value?.trim() || '',
        requestedBy: form.requestedBy?.value?.trim() || '',
        assignee: form.assignee?.value?.trim() || '',
        comments: form.comments?.value?.trim() || ''
    };
    if (!body.requirement) {
        showMessage('detail-message', 'Requirement text is required.', 'error');
        return;
    }
    try {
        const res = await fetch(API + '/requirements/' + encodeURIComponent(id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Save failed');
        }
        showMessage('detail-message', 'Saved.', 'success');
        allRequirements = await fetchRequirements();
        populateReleaseFilter();
        renderBacklog();
        if (document.querySelector('.nav-item[data-view="q1"].active')) renderQ1();
        refreshKpis();
        setTimeout(closeDetail, 600);
    } catch (err) {
        showMessage('detail-message', err.message || 'Failed to save.', 'error');
    }
});

const kpiGrid = document.getElementById('kpi-grid');
if (kpiGrid) {
    kpiGrid.addEventListener('click', function(e) {
        const card = e.target.closest('.kpi-card.kpi-clickable');
        if (!card) return;
        e.preventDefault();
        const status = card.getAttribute('data-status');
        const type = card.getAttribute('data-type');
        const filterStatusEl = document.getElementById('filter-status');
        const filterTypeEl = document.getElementById('filter-type');
        if (filterStatusEl) filterStatusEl.value = status !== null ? status : '';
        if (filterTypeEl) filterTypeEl.value = type !== null ? type : '';
        setView('backlog');
    });
}

document.addEventListener('click', function(e) {
    const card = e.target.closest('.view-kpi-row .kpi-card.kpi-clickable');
    if (!card) return;
    const view = card.getAttribute('data-view');
    if (!view) return;
    e.preventDefault();
    if (view === 'q1') {
        goToBacklogWithFilter({ release: card.getAttribute('data-release') || 'Q1', status: card.getAttribute('data-status') || '' });
        return;
    }
    if (view === 'roadmap') {
        document.getElementById('roadmap-months')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (view === 'upcoming-releases') {
        document.getElementById('upcoming-releases-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (view === 'priorities') {
        document.getElementById('priorities-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (view === 'releases') {
        currentReleasesStatusFilter = card.getAttribute('data-status') || '';
        renderReleasesList();
        document.getElementById('releases-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (view === 'meetings') {
        const type = card.getAttribute('data-type') || '';
        const sel = document.getElementById('meetings-type');
        if (sel) sel.value = type;
        renderMeetingsList();
        document.getElementById('meetings-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
});

function showUploadMessage(text, type) {
    const el = document.getElementById('upload-message');
    if (!el) return;
    el.textContent = text;
    el.className = 'message ' + (type || 'success');
    el.classList.remove('hidden');
}

function hideUploadMessage() {
    const el = document.getElementById('upload-message');
    if (el) el.classList.add('hidden');
}

async function uploadCsv(file) {
    hideUploadMessage();
    const fd = new FormData();
    fd.append('file', file);
    try {
        const res = await fetch(API + '/requirements/upload', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            showUploadMessage(data.error || 'Upload failed', 'error');
            return;
        }
        showUploadMessage('Imported ' + (data.imported || 0) + ' requirements.', 'success');
        allRequirements = await fetchRequirements();
        populateReleaseFilter();
        refreshKpis();
        refreshCharts();
        renderBacklog();
    } catch (e) {
        showUploadMessage(e.message || 'Upload failed', 'error');
    }
}

const csvFile = document.getElementById('csv-file');
if (csvFile) csvFile.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (file) uploadCsv(file);
    e.target.value = '';
});

const uploadZone = document.getElementById('upload-zone');
if (uploadZone) {
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const file = e.dataTransfer && e.dataTransfer.files[0];
        if (file && file.name.toLowerCase().endsWith('.csv')) uploadCsv(file);
        else showUploadMessage('Please drop a CSV file.', 'error');
    });
}

async function fetchMe() {
    try {
        const res = await fetch(API + '/me', { credentials: 'include' });
        if (res.ok) currentUser = await res.json();
        else currentUser = null;
    } catch (e) { currentUser = null; }
    return currentUser;
}

async function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    try {
        const res = await fetch(API + '/users', { credentials: 'include' });
        if (!res.ok) {
            tbody.innerHTML = '<tr><td colspan="2">Not authorized. Admin only.</td></tr>';
            return;
        }
        const list = await res.json();
        tbody.innerHTML = list.map(u => `<tr><td>${escapeHtml(u.username)}</td><td>${escapeHtml(u.role)}</td></tr>`).join('');
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="2">Failed to load.</td></tr>';
    }
}

async function renderRoadmap() {
    const container = document.getElementById('roadmap-months');
    const quarterEl = document.getElementById('roadmap-quarter');
    const yearEl = document.getElementById('roadmap-year');
    if (!container) return;
    const quarter = (quarterEl && quarterEl.value) || 'Q1';
    const year = parseInt((yearEl && yearEl.value) || new Date().getFullYear(), 10);
    try {
        const res = await fetch(API + '/roadmap?quarter=' + encodeURIComponent(quarter) + '&year=' + year, { credentials: 'include' });
        if (!res.ok) { container.innerHTML = '<p>Failed to load roadmap.</p>'; return; }
        const data = await res.json();
        const byMonth = data.byMonth || {};
        const months = Object.keys(byMonth).sort();
        const monthLabels = ['O1', 'O2', 'O3'];
        container.innerHTML = months.map((monthKey, index) => {
            const reqs = byMonth[monthKey] || [];
            const label = monthLabels[index] || ('O' + (index + 1));
            return `<div class="roadmap-month"><h3>${escapeHtml(label)}</h3>
                ${reqs.map(r => `<div class="req-card" data-id="${escapeHtml(r.id || '')}">${escapeHtml(r.id || '')} — ${escapeHtml((r.requirement || '').slice(0, 50))}…</div>`).join('')}
                ${reqs.length === 0 ? '<p class="hint">No requirements</p>' : ''}</div>`;
        }).join('');
        container.querySelectorAll('.req-card[data-id]').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id');
                const req = allRequirements.find(r => r.id === id);
                if (req) showDetail(req);
            });
        });
    } catch (e) {
        container.innerHTML = '<p>Failed to load roadmap.</p>';
    }
}

function populateRoadmapYear() {
    const sel = document.getElementById('roadmap-year');
    if (!sel) return;
    const y = new Date().getFullYear();
    sel.innerHTML = [y, y + 1].map(yr => `<option value="${yr}">${yr}</option>`).join('');
}

async function renderUpcomingReleases() {
    const container = document.getElementById('upcoming-releases-list');
    if (!container) return;
    try {
        const res = await fetch(API + '/releases/upcoming', { credentials: 'include' });
        if (!res.ok) { container.innerHTML = '<p>No upcoming releases.</p>'; return; }
        const list = await res.json();
        container.innerHTML = list.map(rel => `
            <div class="release-card release-card-clickable" data-release-id="${rel.id}">
                <h3>${escapeHtml(rel.name || '')} ${rel.version ? escapeHtml(rel.version) : ''}</h3>
                <div class="meta">Planned: ${rel.plannedDate || '—'} | Status: ${escapeHtml(rel.status || '')}</div>
                <div class="readiness">Scope: ${(rel.requirementIds || []).length} requirements</div>
                <span class="hint">Click to edit</span>
            </div>
        `).join('') || '<p>No upcoming releases.</p>';
        container.querySelectorAll('.release-card-clickable').forEach(card => {
            card.addEventListener('click', () => {
                openReleasePanel(Number(card.getAttribute('data-release-id')));
            });
        });
    } catch (e) {
        container.innerHTML = '<p>Failed to load.</p>';
    }
}

(function setupUpcomingReleases() {
    const btnAdd = document.getElementById('upcoming-add-release');
    const btnRefresh = document.getElementById('upcoming-refresh');
    if (btnAdd) btnAdd.addEventListener('click', () => openReleasePanel(null));
    if (btnRefresh) btnRefresh.addEventListener('click', () => renderUpcomingReleases());
})();

let currentPrioritiesTimeframe = 'week';

function getPrioritiesTimeframe() {
    const active = document.querySelector('.priorities-tab.active');
    return (active && active.getAttribute('data-timeframe')) || 'week';
}

function formatPriorityDate(dateStr) {
    if (!dateStr || !String(dateStr).trim()) return '—';
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function getReleaseDateContext(dateStr) {
    if (!dateStr || !String(dateStr).trim()) return '';
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() < today.getTime()) return 'overdue';
    if (d.getTime() > today.getTime()) return 'upcoming';
    return 'completed';
}

function assigneeInitial(name) {
    if (!name || !String(name).trim()) return '?';
    return String(name).trim().charAt(0).toUpperCase();
}

async function renderPriorities() {
    currentPrioritiesTimeframe = getPrioritiesTimeframe();
    const container = document.getElementById('priorities-list');
    if (!container) return;
    try {
        const url = API + '/priority-sets?timeframe=' + encodeURIComponent(currentPrioritiesTimeframe);
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) { container.innerHTML = '<p>Failed to load.</p>'; return; }
        const list = await res.json();
        const pencilSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
        container.innerHTML = list.map(ps => {
            const timeframeLabel = (ps.timeframe || '').replace(/\b\w/g, c => c.toUpperCase());
            const dateRange = [formatPriorityDate(ps.startDate), formatPriorityDate(ps.endDate)].filter(Boolean).join(' – ') || '—';
            const items = ps.items || [];
            const rows = items.length ? items.map(i => {
                const req = (i.requirementText || (i.requirement && i.requirement.requirement) || '—').toString().slice(0, 80);
                const id = escapeHtml(i.requirementId || '—');
                const start = escapeHtml(i.startSprint || '—');
                const end = escapeHtml(i.endSprint || '—');
                const rel = formatPriorityDate(i.releaseDate);
                const assignee = escapeHtml(i.assignee || '—');
                return `<tr><td>${escapeHtml(req)}${req.length >= 80 ? '…' : ''}</td><td>${id}</td><td>${start}</td><td>${end}</td><td>${rel}</td><td>${assignee}</td></tr>`;
            }).join('') : '<tr><td colspan="6" class="text-muted">No items</td></tr>';
            return `
            <div class="priority-set-block card" data-priority-set-id="${ps.id}">
                <div class="priority-set-block-header">
                    <div class="priority-set-block-title-row">
                        <h3 class="priority-set-block-name">${escapeHtml(ps.name || 'Unnamed')}</h3>
                        <button type="button" class="btn-edit-priority btn-edit" data-priority-set-id="${ps.id}" title="Edit priority set" aria-label="Edit">${pencilSvg}</button>
                    </div>
                    <div class="priority-set-block-meta">
                        <span class="priority-set-meta-badge">${escapeHtml(timeframeLabel)}</span>
                        <span class="priority-set-meta-dates">${dateRange}</span>
                        <span class="priority-set-meta-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="priority-set-block-table-wrap">
                    <table class="priority-set-view-table">
                        <thead><tr><th>Requirement</th><th>Requirement ID</th><th>Start sprint</th><th>End sprint</th><th>Release date</th><th>Assignee</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>`;
        }).join('') || '<p class="priorities-empty">No priority sets for this tab. Click &quot;New priority set&quot; to create one.</p>';
        container.querySelectorAll('.btn-edit-priority').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); openPrioritySetPanel(Number(btn.getAttribute('data-priority-set-id'))); });
        });
    } catch (e) {
        container.innerHTML = '<p>Failed to load.</p>';
    }
}

function prioritySetItemsTableAddRow(row) {
    const tbody = document.getElementById('priority-set-items-tbody');
    if (!tbody) return;
    const reqText = (row && row.requirement && typeof row.requirement === 'object' && row.requirement.requirement) ? row.requirement.requirement : ((row && row.requirementText) || '');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="td-requirement"><textarea class="priority-item-requirement-text" placeholder="Write requirement" rows="3">${escapeHtml(reqText)}</textarea></td>
        <td><input type="text" class="priority-item-id" placeholder="Optional, e.g. VR-001" value="${escapeHtml((row && row.requirementId) || '')}"></td>
        <td><input type="text" class="priority-item-start-sprint" placeholder="Sprint 1" value="${escapeHtml((row && row.startSprint) || '')}"></td>
        <td><input type="text" class="priority-item-end-sprint" placeholder="Sprint 2" value="${escapeHtml((row && row.endSprint) || '')}"></td>
        <td><input type="date" class="priority-item-release-date" value="${(row && row.releaseDate) || ''}"></td>
        <td><input type="text" class="priority-item-assignee" placeholder="Assignee" value="${escapeHtml((row && row.assignee) || '')}"></td>
        <td><button type="button" class="btn-remove-row" aria-label="Remove">×</button></td>
    `;
    tr.querySelector('.btn-remove-row')?.addEventListener('click', () => tr.remove());
    tbody.appendChild(tr);
}

let currentPrioritySetData = null;

function showPrioritySetViewMode(ps) {
    currentPrioritySetData = ps;
    const viewMode = document.getElementById('priority-set-view-mode');
    const form = document.getElementById('form-priority-set');
    if (!viewMode || !form) return;
    viewMode.classList.remove('hidden');
    form.classList.add('hidden');
    document.getElementById('priority-set-panel-title').textContent = ps.name || 'Priority set';
    document.getElementById('ps-view-name').textContent = ps.name || '—';
    const timeframeLabel = (ps.timeframe || '').replace(/\b\w/g, c => c.toUpperCase());
    document.getElementById('ps-view-timeframe').textContent = timeframeLabel || '—';
    const items = ps.items || [];
    document.getElementById('ps-view-total').textContent = String(items.length);
    document.getElementById('ps-view-owner').textContent = '—';
    document.getElementById('ps-view-updated').textContent = ps.updatedAt ? formatPriorityDate(ps.updatedAt.split('T')[0]) : '—';
    const viewTbody = document.getElementById('priority-set-view-tbody');
    if (viewTbody) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        viewTbody.innerHTML = items.length ? items.map((i, idx) => {
            const req = (i.requirementText || (i.requirement && i.requirement.requirement) || '—').toString();
            const reqShort = req.length > 80 ? req.slice(0, 80) + '…' : req;
            const reqId = escapeHtml(i.requirementId || '—');
            const startSprint = (i.startSprint || '').trim();
            const endSprint = (i.endSprint || '').trim();
            const relDate = i.releaseDate ? formatPriorityDate(i.releaseDate) : '—';
            const relContext = getReleaseDateContext(i.releaseDate);
            const assignee = (i.assignee || '').trim();
            const priorityRowClass = idx === 0 ? 'priority-row-1' : idx === 1 ? 'priority-row-2' : idx === 2 ? 'priority-row-3' : 'priority-row-other';
            const startPill = startSprint ? `<span class="pill pill-sprint">${escapeHtml(startSprint)}</span>` : '—';
            const endPill = endSprint ? `<span class="pill pill-sprint">${escapeHtml(endSprint)}</span>` : '—';
            const releaseCell = relContext ? `<span class="release-date-badge release-date-${relContext}">${escapeHtml(relDate)}</span>` : escapeHtml(relDate);
            const assigneeCell = assignee
                ? `<span class="assignee-cell"><span class="assignee-avatar" aria-hidden="true">${escapeHtml(assigneeInitial(assignee))}</span><span class="assignee-name">${escapeHtml(assignee)}</span></span>`
                : '—';
            return `<tr class="priority-modal-row ${priorityRowClass}"><td>${escapeHtml(reqShort)}</td><td>${reqId}</td><td>${startPill}</td><td>${endPill}</td><td>${releaseCell}</td><td>${assigneeCell}</td></tr>`;
        }).join('') : '<tr><td colspan="6" class="priority-set-empty-cell">No items</td></tr>';
    }
    const btnDeleteView = document.getElementById('priority-set-delete');
    if (btnDeleteView) {
        btnDeleteView.dataset.prioritySetId = String(ps.id || '');
        btnDeleteView.classList.toggle('hidden', !ps.id);
    }
}

function showPrioritySetEditMode(ps) {
    currentPrioritySetData = ps;
    const viewMode = document.getElementById('priority-set-view-mode');
    const form = document.getElementById('form-priority-set');
    if (!viewMode || !form) return;
    viewMode.classList.add('hidden');
    form.classList.remove('hidden');
    document.getElementById('priority-set-panel-title').textContent = ps && ps.id ? 'Edit priority set' : 'New priority set';
    document.getElementById('priority-set-id').value = ps ? (ps.id || '') : '';
    document.getElementById('priority-set-name').value = (ps && ps.name) || '';
    document.getElementById('priority-set-timeframe').value = (ps && ps.timeframe) || currentPrioritiesTimeframe;
    document.getElementById('priority-set-start-date').value = (ps && ps.startDate) || '';
    document.getElementById('priority-set-end-date').value = (ps && ps.endDate) || '';
    const tbody = document.getElementById('priority-set-items-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        (ps && ps.items && ps.items.length ? ps.items : [null]).forEach(i => {
            prioritySetItemsTableAddRow(i ? {
                requirementId: i.requirementId,
                requirement: i.requirement,
                requirementText: (i.requirement && i.requirement.requirement) || i.requirementText,
                startSprint: i.startSprint,
                endSprint: i.endSprint,
                assignee: i.assignee,
                releaseDate: i.releaseDate
            } : null);
        });
    }
    const btnDeleteEdit = document.getElementById('priority-set-delete-edit');
    if (btnDeleteEdit) {
        btnDeleteEdit.dataset.prioritySetId = String(ps && ps.id || '');
        btnDeleteEdit.classList.toggle('hidden', !(ps && ps.id));
    }
}

function openPrioritySetPanel(id) {
    const panel = document.getElementById('priority-set-panel');
    const titleEl = document.getElementById('priority-set-panel-title');
    const viewMode = document.getElementById('priority-set-view-mode');
    const form = document.getElementById('form-priority-set');
    const tbody = document.getElementById('priority-set-items-tbody');
    if (!panel) return;
    if (tbody) tbody.innerHTML = '';
    hideMessage('priority-set-message');
    if (id) {
        viewMode.classList.remove('hidden');
        form.classList.add('hidden');
        titleEl.textContent = 'Loading…';
        document.getElementById('ps-view-name').textContent = '—';
        document.getElementById('ps-view-timeframe').textContent = '—';
        document.getElementById('ps-view-total').textContent = '—';
        document.getElementById('ps-view-owner').textContent = '—';
        document.getElementById('ps-view-updated').textContent = '—';
        const viewTbody = document.getElementById('priority-set-view-tbody');
        if (viewTbody) viewTbody.innerHTML = '<tr><td colspan="6" class="priority-set-empty-cell">Loading…</td></tr>';
        document.getElementById('priority-set-delete').classList.add('hidden');
        fetch(API + '/priority-sets/' + id, { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(ps => {
                if (ps) showPrioritySetViewMode(ps);
                else {
                    viewMode.classList.add('hidden');
                    form.classList.remove('hidden');
                    showPrioritySetEditMode({ id });
                }
            })
            .catch(() => {
                viewMode.classList.add('hidden');
                form.classList.remove('hidden');
                showPrioritySetEditMode({ id });
            });
    } else {
        viewMode.classList.add('hidden');
        form.classList.remove('hidden');
        currentPrioritySetData = null;
        titleEl.textContent = 'New priority set';
        document.getElementById('form-priority-set').reset();
        document.getElementById('priority-set-id').value = '';
        document.getElementById('priority-set-timeframe').value = currentPrioritiesTimeframe;
        document.getElementById('priority-set-delete-edit').classList.add('hidden');
        prioritySetItemsTableAddRow(null);
    }
    panel.classList.remove('hidden');
}

function closePrioritySetPanel() {
    document.getElementById('priority-set-panel').classList.add('hidden');
    renderPriorities();
}

(function setupPriorities() {
    document.querySelectorAll('.priorities-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.priorities-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderPriorities();
        });
    });
    const btnNew = document.getElementById('priorities-new-set');
    const btnClose = document.getElementById('priority-set-panel-close');
    const btnCancel = document.getElementById('priority-set-panel-cancel');
    const form = document.getElementById('form-priority-set');
    if (btnNew) btnNew.addEventListener('click', () => openPrioritySetPanel(null));
    if (btnClose) btnClose.addEventListener('click', closePrioritySetPanel);
    document.getElementById('priority-set-view-close')?.addEventListener('click', closePrioritySetPanel);
    document.getElementById('priority-set-view-edit')?.addEventListener('click', () => {
        if (currentPrioritySetData) showPrioritySetEditMode(currentPrioritySetData);
    });
    if (btnCancel) btnCancel.addEventListener('click', () => {
        if (currentPrioritySetData && currentPrioritySetData.id) {
            showPrioritySetViewMode(currentPrioritySetData);
        } else {
            closePrioritySetPanel();
        }
    });
    const btnAddItem = document.getElementById('priority-set-add-item');
    function getPrioritySetDeleteId() {
        const viewBtn = document.getElementById('priority-set-delete');
        const editBtn = document.getElementById('priority-set-delete-edit');
        if (viewBtn && !viewBtn.classList.contains('hidden')) return viewBtn.dataset.prioritySetId;
        if (editBtn && !editBtn.classList.contains('hidden')) return editBtn.dataset.prioritySetId;
        return document.getElementById('priority-set-id')?.value || '';
    }
    function handlePrioritySetDelete() {
        const setId = getPrioritySetDeleteId();
        if (!setId || !confirm('Delete this priority set?')) return;
        (async () => {
            try {
                const res = await fetch(API + '/priority-sets/' + setId, { method: 'DELETE', credentials: 'include' });
                if (res.ok || res.status === 204) { closePrioritySetPanel(); renderPriorities(); }
                else showMessage('priority-set-message', 'Delete failed.', 'error');
            } catch (err) {
                showMessage('priority-set-message', err.message || 'Delete failed.', 'error');
            }
        })();
    }
    document.getElementById('priority-set-delete')?.addEventListener('click', handlePrioritySetDelete);
    document.getElementById('priority-set-delete-edit')?.addEventListener('click', handlePrioritySetDelete);
    if (btnAddItem) btnAddItem.addEventListener('click', () => prioritySetItemsTableAddRow(null));
    if (form) form.addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('priority-set-id').value;
        const name = document.getElementById('priority-set-name').value.trim();
        const timeframe = document.getElementById('priority-set-timeframe').value;
        const startDate = document.getElementById('priority-set-start-date').value || null;
        const endDate = document.getElementById('priority-set-end-date').value || null;
        const rows = document.querySelectorAll('#priority-set-items-tbody tr');
        const items = [];
        rows.forEach((tr, i) => {
            const reqText = (tr.querySelector('.priority-item-requirement-text')?.value ?? '').trim();
            const rid = (tr.querySelector('.priority-item-id')?.value || '').trim();
            if (!rid && !reqText) return;
            items.push({
                requirementText: reqText || null,
                requirementId: rid || null,
                sortOrder: i,
                startSprint: (tr.querySelector('.priority-item-start-sprint')?.value || '').trim() || null,
                endSprint: (tr.querySelector('.priority-item-end-sprint')?.value || '').trim() || null,
                releaseDate: (tr.querySelector('.priority-item-release-date')?.value || '') || null,
                assignee: (tr.querySelector('.priority-item-assignee')?.value || '').trim() || null
            });
        });
        if (!name) { showMessage('priority-set-message', 'Name is required.', 'error'); return; }
        hideMessage('priority-set-message');
        const saveBtn = document.getElementById('priority-set-save-btn');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }
        const body = { name, timeframe, startDate, endDate, items };
        try {
            const url = id ? API + '/priority-sets/' + id : API + '/priority-sets';
            const method = id ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
            if (!res.ok) throw new Error(await res.text() || 'Save failed');
            showMessage('priority-set-message', 'Saved.', 'success');
            if (!id) {
                closePrioritySetPanel();
            } else {
                const updated = await fetch(API + '/priority-sets/' + id, { credentials: 'include' }).then(r => r.ok ? r.json() : null);
                if (updated) showPrioritySetViewMode(updated);
                else renderPriorities();
            }
        } catch (err) {
            showMessage('priority-set-message', err.message || 'Failed to save.', 'error');
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save changes'; }
        }
    });
})();

async function renderReleasesList() {
    const container = document.getElementById('releases-list');
    if (!container) return;
    try {
        const res = await fetch(API + '/releases', { credentials: 'include' });
        if (!res.ok) { container.innerHTML = '<p>Failed to load.</p>'; return; }
        let list = await res.json();
        if (currentReleasesStatusFilter) list = list.filter(r => (r.status || '') === currentReleasesStatusFilter);
        container.innerHTML = list.map(rel => `
            <div class="release-card release-card-clickable" data-release-id="${rel.id}">
                <h3>${escapeHtml(rel.name || '')} ${rel.version ? escapeHtml(rel.version) : ''}</h3>
                <div class="meta">Planned: ${rel.plannedDate || '—'} | Released: ${rel.releaseDate || '—'} | ${escapeHtml(rel.status || '')}</div>
                <p>${escapeHtml((rel.releaseNotes || '').slice(0, 200))}${(rel.releaseNotes || '').length > 200 ? '…' : ''}</p>
                <span class="hint">Click to edit · ${(rel.requirementIds || []).length} requirements</span>
            </div>
        `).join('') || '<p>No releases yet.</p>';
        container.querySelectorAll('.release-card-clickable').forEach(card => {
            card.addEventListener('click', () => openReleasePanel(Number(card.getAttribute('data-release-id'))));
        });
    } catch (e) {
        container.innerHTML = '<p>Failed to load.</p>';
    }
}

let currentReleaseId = null;
let currentReleasesStatusFilter = '';

function openReleasePanel(releaseId) {
    currentReleaseId = releaseId;
    const panel = document.getElementById('release-panel');
    const titleEl = document.getElementById('release-panel-title');
    const commentsSection = document.getElementById('release-comments-section');
    if (!panel) return;
    if (releaseId) {
        titleEl.textContent = 'Edit release';
        commentsSection.classList.remove('hidden');
        fetch(API + '/releases/' + releaseId, { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(rel => {
                if (rel) {
                    document.getElementById('release-id').value = rel.id;
                    document.getElementById('release-name').value = rel.name || '';
                    document.getElementById('release-version').value = rel.version || '';
                    document.getElementById('release-planned-date').value = rel.plannedDate || '';
                    document.getElementById('release-release-date').value = rel.releaseDate || '';
                    document.getElementById('release-status').value = rel.status || 'planned';
                    document.getElementById('release-notes').value = rel.releaseNotes || '';
                    document.getElementById('release-internal-comments').value = rel.internalComments || '';
                    document.getElementById('release-requirement-ids').value = (rel.requirementIds || []).join(', ');
                    renderReleaseComments(rel.comments || []);
                }
            });
    } else {
        titleEl.textContent = 'New release';
        commentsSection.classList.add('hidden');
        document.getElementById('form-release').reset();
        document.getElementById('release-id').value = '';
        document.getElementById('release-status').value = 'planned';
    }
    hideMessage('release-message');
    panel.classList.remove('hidden');
}

function closeReleasePanel() {
    document.getElementById('release-panel').classList.add('hidden');
    currentReleaseId = null;
    renderReleasesList();
    renderUpcomingReleases();
}

function renderReleaseComments(comments) {
    const list = document.getElementById('release-comments-list');
    if (!list) return;
    list.innerHTML = (comments || []).map(c => `
        <li style="margin-bottom: 0.5rem;">
            <strong>${escapeHtml(c.authorUsername || '')}</strong> ${c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}<br>
            ${escapeHtml(c.body || '')}
        </li>
    `).join('') || '<li class="hint">No comments yet.</li>';
}

(function setupReleasePanel() {
    const btnNew = document.getElementById('releases-new');
    const btnClose = document.getElementById('release-panel-close');
    const btnCancel = document.getElementById('release-panel-cancel');
    const form = document.getElementById('form-release');
    const addCommentBtn = document.getElementById('release-add-comment');
    const newCommentInput = document.getElementById('release-new-comment');
    if (btnNew) btnNew.addEventListener('click', () => openReleasePanel(null));
    if (btnClose) btnClose.addEventListener('click', closeReleasePanel);
    if (btnCancel) btnCancel.addEventListener('click', closeReleasePanel);
    if (form) form.addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('release-id').value;
        const body = {
            name: document.getElementById('release-name').value.trim(),
            version: document.getElementById('release-version').value.trim() || null,
            plannedDate: document.getElementById('release-planned-date').value || null,
            releaseDate: document.getElementById('release-release-date').value || null,
            status: document.getElementById('release-status').value,
            releaseNotes: document.getElementById('release-notes').value.trim() || null,
            internalComments: document.getElementById('release-internal-comments').value.trim() || null,
            requirementIds: document.getElementById('release-requirement-ids').value.split(',').map(s => s.trim()).filter(Boolean)
        };
        if (!body.name) { showMessage('release-message', 'Name is required.', 'error'); return; }
        hideMessage('release-message');
        try {
            const url = id ? API + '/releases/' + id : API + '/releases';
            const method = id ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
            if (!res.ok) throw new Error(await res.text() || 'Save failed');
            showMessage('release-message', 'Saved.', 'success');
            if (!id) closeReleasePanel();
            else { renderReleasesList(); renderUpcomingReleases(); }
        } catch (err) {
            showMessage('release-message', err.message || 'Failed to save.', 'error');
        }
    });
    if (addCommentBtn && newCommentInput) addCommentBtn.addEventListener('click', async () => {
        if (!currentReleaseId) return;
        const body = newCommentInput.value.trim();
        if (!body) return;
        try {
            const res = await fetch(API + '/releases/' + currentReleaseId + '/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ body })
            });
            if (!res.ok) throw new Error('Failed to add comment');
            newCommentInput.value = '';
            const rel = await fetch(API + '/releases/' + currentReleaseId, { credentials: 'include' }).then(r => r.json());
            renderReleaseComments(rel.comments || []);
        } catch (e) {
            showMessage('release-message', e.message || 'Failed to add comment.', 'error');
        }
    });
})();

let currentMeetingData = null;

function populateMeetingForm(m) {
    if (!m) return;
    document.getElementById('meeting-id').value = m.id || '';
    document.getElementById('meeting-type').value = m.meetingType || 'weekly';
    document.getElementById('meeting-date').value = m.meetingDate || '';
    document.getElementById('meeting-attendees').value = m.attendees || '';
    document.getElementById('meeting-agenda').value = m.agenda || '';
    document.getElementById('meeting-summary').value = m.summary || '';
    document.getElementById('meeting-decisions').value = (m.decisions || []).join('\n');
    document.getElementById('meeting-action-items').value = (m.actionItems || []).map(a =>
        [a.actionText, a.owner || '', a.dueDate || '', a.status || 'open'].join(' | ')
    ).join('\n');
    document.getElementById('meeting-requirement-ids').value = (m.requirementIds || []).join(', ');
}

function formatMeetingDate(dateStr) {
    if (!dateStr || !dateStr.trim()) return '';
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function showMeetingViewMode(m) {
    const viewMode = document.getElementById('meeting-view-mode');
    const formEl = document.getElementById('form-meeting');
    if (!viewMode || !formEl) return;
    const typeLabel = (m.meetingType || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—';
    document.getElementById('meeting-view-type').textContent = typeLabel;
    document.getElementById('meeting-view-date').textContent = formatMeetingDate(m.meetingDate);
    document.getElementById('meeting-view-attendees').textContent = (m.attendees || '').trim() || '—';
    document.getElementById('meeting-view-agenda').textContent = (m.agenda || '').trim() || '—';
    document.getElementById('meeting-view-summary').textContent = (m.summary || '').trim() || '—';
    document.getElementById('meeting-view-decisions').textContent = (m.decisions || []).join('\n').trim() || '—';
    const actionStr = (m.actionItems || []).map(a =>
        [a.actionText, a.owner || '', a.dueDate || '', a.status || 'open'].join(' | ')
    ).join('\n');
    document.getElementById('meeting-view-action-items').textContent = actionStr.trim() || '—';
    document.getElementById('meeting-view-requirement-ids').textContent = (m.requirementIds || []).join(', ').trim() || '—';
    document.getElementById('meeting-view-field-type').classList.remove('hidden');
    document.getElementById('meeting-view-field-date').classList.remove('hidden');
    const attendeesVal = (m.attendees || '').trim();
    document.getElementById('meeting-view-field-attendees').classList.toggle('hidden', !attendeesVal);
    ['meeting-view-section-agenda', 'meeting-view-section-summary', 'meeting-view-section-decisions', 'meeting-view-section-actions', 'meeting-view-section-linked'].forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const p = section.querySelector('.meeting-view-paragraph');
        const val = (p && p.textContent || '').trim();
        section.classList.toggle('hidden', !val || val === '—');
    });
    const btnDelete = document.getElementById('meeting-delete-btn');
    if (btnDelete) {
        btnDelete.dataset.meetingId = m.id || '';
        btnDelete.classList.toggle('hidden', !(currentUser && currentUser.role === 'ADMIN'));
    }
    viewMode.classList.remove('hidden');
    formEl.classList.add('hidden');
}

function showMeetingEditMode() {
    const viewMode = document.getElementById('meeting-view-mode');
    const formEl = document.getElementById('form-meeting');
    if (viewMode) viewMode.classList.add('hidden');
    if (formEl) formEl.classList.remove('hidden');
    document.getElementById('meeting-panel-title').textContent = 'Edit meeting';
}

function openMeetingPanel(id) {
    const panel = document.getElementById('meeting-panel');
    const titleEl = document.getElementById('meeting-panel-title');
    const viewMode = document.getElementById('meeting-view-mode');
    const formEl = document.getElementById('form-meeting');
    if (!panel) return;
    currentMeetingData = null;
    if (id) {
        titleEl.textContent = 'Meeting details';
        formEl.classList.add('hidden');
        viewMode.classList.remove('hidden');
        document.getElementById('meeting-view-type').textContent = 'Loading…';
        document.getElementById('meeting-view-date').textContent = '';
        document.getElementById('meeting-view-attendees').textContent = '';
        document.getElementById('meeting-view-agenda').textContent = '';
        document.getElementById('meeting-view-summary').textContent = '';
        document.getElementById('meeting-view-decisions').textContent = '';
        document.getElementById('meeting-view-action-items').textContent = '';
        document.getElementById('meeting-view-requirement-ids').textContent = '';
        document.getElementById('meeting-delete-btn')?.classList.add('hidden');
        fetch(API + '/meetings/' + id, { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(m => {
                if (m) {
                    currentMeetingData = m;
                    populateMeetingForm(m);
                    showMeetingViewMode(m);
                } else {
                    document.getElementById('meeting-view-type').textContent = 'Failed to load';
                }
            });
    } else {
        titleEl.textContent = 'New meeting';
        document.getElementById('form-meeting').reset();
        document.getElementById('meeting-id').value = '';
        document.getElementById('meeting-type').value = document.getElementById('meetings-type')?.value || 'weekly';
        if (viewMode) viewMode.classList.add('hidden');
        if (formEl) formEl.classList.remove('hidden');
        document.getElementById('meeting-form-delete')?.classList.add('hidden');
    }
    hideMessage('meeting-message');
    panel.classList.remove('hidden');
}

function closeMeetingPanel() {
    document.getElementById('meeting-panel').classList.add('hidden');
    renderMeetingsList();
}

function parseActionItems(text) {
    if (!text || !text.trim()) return [];
    return text.split('\n').map(line => {
        const parts = line.split('|').map(s => s.trim());
        return {
            actionText: parts[0] || '',
            owner: parts[1] || null,
            dueDate: parts[2] || null,
            status: (parts[3] || 'open').toLowerCase()
        };
    }).filter(a => a.actionText);
}

async function deleteMeeting(id) {
    if (!(currentUser && currentUser.role === 'ADMIN') || !confirm('Delete this meeting?')) return;
    try {
        const res = await fetch(API + '/meetings/' + id, { method: 'DELETE', credentials: 'include' });
        if (res.ok || res.status === 204) { closeMeetingPanel(); renderMeetingsList(); }
    } catch (e) { /* ignore */ }
}

async function renderMeetingsList() {
    const container = document.getElementById('meetings-list');
    const typeEl = document.getElementById('meetings-type');
    if (!container) return;
    const type = (typeEl && typeEl.value) || '';
    const isAdmin = currentUser && currentUser.role === 'ADMIN';
    try {
        const url = type ? API + '/meetings?type=' + encodeURIComponent(type) : API + '/meetings';
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) { container.innerHTML = '<p>Failed to load.</p>'; return; }
        const list = await res.json();
        container.innerHTML = list.map(m => {
            const name = (m.meetingType || 'Meeting') + ' — ' + (m.meetingDate || '');
            const preview = (m.summary || m.agenda || '').slice(0, 100);
            const deleteBtn = isAdmin ? `<button type="button" class="meeting-card-delete btn-close" data-meeting-id="${m.id}" aria-label="Delete meeting" title="Delete (Admin only)">×</button>` : '';
            return `<div class="meeting-card meeting-card-clickable" data-meeting-id="${m.id}">
                ${deleteBtn}
                <h3>${escapeHtml(name)}</h3>
                <p class="hint">${escapeHtml(preview)}${preview.length >= 100 ? '…' : ''}</p>
                <span class="hint">Click to view or update MOM</span>
            </div>`;
        }).join('') || '<p>No meetings yet. Click &quot;New meeting&quot; to add one.</p>';
        container.querySelectorAll('.meeting-card-clickable').forEach(card => {
            card.addEventListener('click', (e) => { if (!e.target.closest('.meeting-card-delete')) openMeetingPanel(Number(card.getAttribute('data-meeting-id'))); });
        });
        container.querySelectorAll('.meeting-card-delete').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); deleteMeeting(Number(btn.getAttribute('data-meeting-id'))); });
        });
    } catch (e) {
        container.innerHTML = '<p>Failed to load.</p>';
    }
}

(function setupMeetingPanel() {
    const btnNew = document.getElementById('meetings-new');
    const btnClose = document.getElementById('meeting-panel-close');
    const btnCancel = document.getElementById('meeting-panel-cancel');
    const form = document.getElementById('form-meeting');
    const btnViewEdit = document.getElementById('meeting-view-edit');
    const btnViewClose = document.getElementById('meeting-view-close');
    const btnDelete = document.getElementById('meeting-delete-btn');
    const btnSave = document.getElementById('meeting-save-btn');
    if (btnNew) btnNew.addEventListener('click', () => openMeetingPanel(null));
    if (btnClose) btnClose.addEventListener('click', closeMeetingPanel);
    if (btnCancel) btnCancel.addEventListener('click', () => {
        if (currentMeetingData && currentMeetingData.id) {
            showMeetingViewMode(currentMeetingData);
            document.getElementById('meeting-panel-title').textContent = 'Meeting details';
        } else {
            closeMeetingPanel();
        }
    });
    if (btnViewEdit) btnViewEdit.addEventListener('click', () => showMeetingEditMode());
    if (btnViewClose) btnViewClose.addEventListener('click', closeMeetingPanel);
    if (btnDelete) btnDelete.addEventListener('click', () => { const id = btnDelete.dataset.meetingId; if (id) deleteMeeting(Number(id)); });
    if (form) form.addEventListener('submit', async e => {
        e.preventDefault();
        const id = document.getElementById('meeting-id').value;
        const meetingType = document.getElementById('meeting-type').value;
        const meetingDate = document.getElementById('meeting-date').value;
        if (!meetingDate || !meetingType) { showMessage('meeting-message', 'Meeting type and date are required.', 'error'); return; }
        const decisions = document.getElementById('meeting-decisions').value.split('\n').map(s => s.trim()).filter(Boolean);
        const actionItems = parseActionItems(document.getElementById('meeting-action-items').value);
        const requirementIds = document.getElementById('meeting-requirement-ids').value.split(',').map(s => s.trim()).filter(Boolean);
        const body = {
            meetingType,
            meetingDate,
            attendees: document.getElementById('meeting-attendees').value.trim() || null,
            agenda: document.getElementById('meeting-agenda').value.trim() || null,
            summary: document.getElementById('meeting-summary').value.trim() || null,
            decisions,
            actionItems,
            requirementIds,
            releaseIds: []
        };
        hideMessage('meeting-message');
        const saveBtn = btnSave || form.querySelector('button[type="submit"]');
        const origLabel = saveBtn ? saveBtn.textContent : 'Save';
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }
        try {
            const url = id ? API + '/meetings/' + id : API + '/meetings';
            const method = id ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
            if (!res.ok) throw new Error(await res.text() || 'Save failed');
            const updated = await res.json().catch(() => ({}));
            showMessage('meeting-message', 'Saved.', 'success');
            if (!id) {
                closeMeetingPanel();
                renderMeetingsList();
            } else {
                currentMeetingData = updated;
                populateMeetingForm(updated);
                showMeetingViewMode(updated);
                document.getElementById('meeting-panel-title').textContent = 'Meeting details';
                renderMeetingsList();
            }
        } catch (err) {
            showMessage('meeting-message', err.message || 'Failed to save.', 'error');
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = origLabel; }
        }
    });
})();

const formAddUser = document.getElementById('form-add-user');
if (formAddUser) formAddUser.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const username = form.username?.value?.trim();
    const password = form.password?.value;
    const msgEl = document.getElementById('users-message');
    if (!msgEl) return;
    msgEl.classList.add('hidden');
    if (!username || !password) {
        msgEl.textContent = 'Username and password required.';
        msgEl.className = 'message error';
        msgEl.classList.remove('hidden');
        return;
    }
    try {
        const res = await fetch(API + '/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            msgEl.textContent = data.error || 'Failed to add user.';
            msgEl.className = 'message error';
            msgEl.classList.remove('hidden');
            return;
        }
        msgEl.textContent = 'User added.';
        msgEl.className = 'message success';
        msgEl.classList.remove('hidden');
        form.reset();
        renderUsers();
    } catch (err) {
        msgEl.textContent = err.message || 'Failed to add user.';
        msgEl.className = 'message error';
        msgEl.classList.remove('hidden');
    }
});

(function setupRoadmapAndFilters() {
    const q = document.getElementById('roadmap-quarter');
    const y = document.getElementById('roadmap-year');
    if (q) q.addEventListener('change', () => renderRoadmap());
    if (y) y.addEventListener('change', () => renderRoadmap());
    const mt = document.getElementById('meetings-type');
    if (mt) mt.addEventListener('change', () => renderMeetingsList());
})();

// Initial load - run after DOM is ready so production (and CDN/cache) always has elements
async function init() {
    const me = await fetchMe();
    const footerUser = document.getElementById('footer-user');
    if (footerUser) footerUser.textContent = me ? 'Logged in as ' + me.username : '—';
    if (me && me.role === 'ADMIN') document.querySelector('.nav-item-users')?.classList.remove('hidden');
    populateRoadmapYear();
    refreshKpis();
    loadBacklog();
    setView('dashboard');
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
} else {
    init();
}
