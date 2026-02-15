const API = '/api';

let chartStatus = null;
let chartPriority = null;
let chartClear = null;
let chartRelease = null;

const views = {
    dashboard: {
        title: 'Dashboard',
        subtitle: 'Overview and KPIs'
    },
    capture: {
        title: 'Capture requirement',
        subtitle: 'Add a new requirement to the backlog'
    },
    backlog: {
        title: 'Product backlog',
        subtitle: 'View and filter all requirements'
    },
    q1: {
        title: 'Q1 2026',
        subtitle: 'Requirements scheduled for Q1 2026'
    },
    users: {
        title: 'Manage users',
        subtitle: 'Add and view users (Admin only)'
    }
};

let allRequirements = [];
let currentUser = null;

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
    }
    if (name === 'backlog') renderBacklog();
    if (name === 'q1') renderQ1();
    if (name === 'users') renderUsers();
}

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
    const status = document.getElementById('filter-status').value;
    const priority = document.getElementById('filter-priority').value;
    const type = document.getElementById('filter-type')?.value;
    const clearVal = document.getElementById('filter-clear')?.value;
    const releaseVal = document.getElementById('filter-release')?.value;
    let list = [...allRequirements];
    if (status) list = list.filter(r => (r.status || '') === status);
    if (priority) list = list.filter(r => (r.priority || '') === priority);
    if (type) list = list.filter(r => (r.type || '') === type);
    if (clearVal) list = list.filter(r => (r.clear || '').trim() === clearVal);
    if (releaseVal) list = list.filter(r => (releaseVal === '(No release)' ? !(r.release || '').trim() : (r.release || '').trim() === releaseVal));
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
        </tr>
    `).join('');
    tbody.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', () => {
            const id = tr.getAttribute('data-id');
            const req = allRequirements.find(r => r.id === id);
            if (req) showDetail(req);
        });
    });
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
        tbody.innerHTML = '<tr><td colspan="8">No Q1 requirements. Set Release to e.g. Q1-2025 to see them here.</td></tr>';
        return;
    }
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
        </tr>
    `).join('');
    tbody.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', () => {
            const id = tr.getAttribute('data-id');
            const req = allRequirements.find(r => r.id === id);
            if (req) showDetail(req);
        });
    });
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
}

function closeDetail() {
    document.getElementById('detail-panel').classList.add('hidden');
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
        populateReleaseFilter();
        renderBacklog();
    } catch (e) {
        allRequirements = [];
        document.getElementById('backlog-tbody').innerHTML = '<tr><td colspan="8">Failed to load backlog.</td></tr>';
    }
}

document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
        e.preventDefault();
        setView(el.getAttribute('data-view'));
    });
});

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
if (filterStatus) filterStatus.addEventListener('change', () => renderBacklog());
if (filterType) filterType.addEventListener('change', () => renderBacklog());
if (filterPriority) filterPriority.addEventListener('change', () => renderBacklog());
if (filterClear) filterClear.addEventListener('change', () => renderBacklog());
if (filterRelease) filterRelease.addEventListener('change', () => renderBacklog());
const detailClose = document.getElementById('detail-close');
const detailCancel = document.getElementById('detail-cancel');
if (detailClose) detailClose.addEventListener('click', closeDetail);
if (detailCancel) detailCancel.addEventListener('click', closeDetail);

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

// Initial load - run after DOM is ready so production (and CDN/cache) always has elements
async function init() {
    const me = await fetchMe();
    const footerUser = document.getElementById('footer-user');
    if (footerUser) footerUser.textContent = me ? 'Logged in as ' + me.username : '—';
    if (me && me.role === 'ADMIN') document.querySelector('.nav-item-users')?.classList.remove('hidden');
    refreshKpis();
    loadBacklog();
    setView('dashboard');
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
} else {
    init();
}
