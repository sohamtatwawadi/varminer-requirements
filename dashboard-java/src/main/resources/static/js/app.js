const API = '/api';

let chartStatus = null;
let chartPriority = null;

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
    }
};

let allRequirements = [];

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

async function refreshKpis() {
    try {
        const kpi = await fetchKpis();
        document.getElementById('kpi-total').textContent = kpi.total;
        document.getElementById('kpi-not-started').textContent = kpi.notStarted;
        document.getElementById('kpi-in-dev').textContent = kpi.inDev;
        document.getElementById('kpi-in-uat').textContent = kpi.inUat;
        document.getElementById('kpi-dev-completed').textContent = kpi.devCompleted;
        document.getElementById('kpi-closed').textContent = kpi.closed;
    } catch (e) {
        document.getElementById('kpi-total').textContent = '—';
        document.getElementById('kpi-not-started').textContent = '—';
        document.getElementById('kpi-in-dev').textContent = '—';
        document.getElementById('kpi-in-uat').textContent = '—';
        document.getElementById('kpi-dev-completed').textContent = '—';
        document.getElementById('kpi-closed').textContent = '—';
    }
}

const CHART_COLORS = {
    status: ['#94a3b8', '#2563eb', '#f59e0b', '#10b981', '#059669'],
    priority: ['#dc2626', '#2563eb', '#f59e0b', '#6b7280']
};

function refreshCharts() {
    if (typeof Chart === 'undefined') return;
    Promise.all([fetchKpis(), fetchRequirements()]).then(([kpi, reqs]) => {
        if (chartStatus) chartStatus.destroy();
        if (chartPriority) chartPriority.destroy();
        const statusCtx = document.getElementById('chart-status');
        const priorityCtx = document.getElementById('chart-priority');
        if (!statusCtx || !priorityCtx) return;
        const statusLabels = ['Not started', 'In DEV', 'In UAT', 'Dev completed', 'Closed'];
        const statusData = [kpi.notStarted, kpi.inDev, kpi.inUat, kpi.devCompleted, kpi.closed];
        chartStatus = new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: statusLabels,
                datasets: [{ data: statusData, backgroundColor: CHART_COLORS.status }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
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
                plugins: { legend: { display: false } }
            }
        });
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
    let list = [...allRequirements];
    if (status) list = list.filter(r => (r.status || '') === status);
    if (priority) list = list.filter(r => (r.priority || '') === priority);
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
            <td><span class="status ${statusClass(r.status)}">${escapeHtml(r.status || 'Not started')}</span></td>
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

function showDetail(req) {
    const form = document.getElementById('form-detail');
    if (!form) return;
    document.getElementById('detail-id').value = req.id || '';
    form.requirement.value = req.requirement || '';
    form.description.value = req.description || '';
    form.acceptanceCriteria.value = req.acceptanceCriteria || '';
    form.category.value = req.category || 'VarMiner';
    form.type.value = req.type || 'Report Requirements';
    form.priority.value = req.priority || 'High';
    form.status.value = req.status || 'Not started';
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

async function loadBacklog() {
    try {
        allRequirements = await fetchRequirements();
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

document.getElementById('form-capture').addEventListener('submit', async e => {
    e.preventDefault();
    hideMessage('capture-message');
    const form = e.target;
    const body = {
        category: form.category?.value?.trim() || 'VarMiner',
        type: form.type?.value?.trim() || 'Report Requirements',
        requirement: form.requirement?.value?.trim(),
        description: form.description?.value?.trim() || '',
        acceptanceCriteria: form.acceptanceCriteria?.value?.trim() || '',
        clear: form.clear?.value || 'Yes',
        estimate: form.estimate?.value?.trim() || '',
        dependency: form.dependency?.value?.trim() || '—',
        priority: form.priority?.value || 'High',
        stackRank: form.stackRank?.value?.trim() || '',
        status: form.status?.value || 'Not started',
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
        refreshKpis();
    } catch (err) {
        showMessage('capture-message', err.message || 'Failed to save.', 'error');
    }
});

document.getElementById('filter-status').addEventListener('change', () => renderBacklog());
document.getElementById('filter-priority').addEventListener('change', () => renderBacklog());
document.getElementById('detail-close').addEventListener('click', closeDetail);
document.getElementById('detail-cancel').addEventListener('click', closeDetail);

document.getElementById('form-detail').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const id = document.getElementById('detail-id').value;
    if (!id) return;
    hideMessage('detail-message');
    const body = {
        id,
        category: form.category?.value?.trim() || 'VarMiner',
        type: form.type?.value?.trim() || 'Report Requirements',
        requirement: form.requirement?.value?.trim() || '',
        description: form.description?.value?.trim() || '',
        acceptanceCriteria: form.acceptanceCriteria?.value?.trim() || '',
        clear: form.clear?.value || 'Yes',
        estimate: form.estimate?.value?.trim() || '',
        dependency: form.dependency?.value?.trim() || '—',
        priority: form.priority?.value || 'High',
        stackRank: form.stackRank?.value?.trim() || '',
        status: form.status?.value || 'Not started',
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
        renderBacklog();
        refreshKpis();
        setTimeout(closeDetail, 600);
    } catch (err) {
        showMessage('detail-message', err.message || 'Failed to save.', 'error');
    }
});

document.querySelectorAll('.kpi-card.kpi-clickable').forEach(card => {
    card.addEventListener('click', () => {
        const status = card.getAttribute('data-status');
        if (!status) return;
        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) filterStatus.value = status;
        setView('backlog');
    });
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
        refreshKpis();
        refreshCharts();
        renderBacklog();
    } catch (e) {
        showUploadMessage(e.message || 'Upload failed', 'error');
    }
}

document.getElementById('csv-file').addEventListener('change', e => {
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

// Initial load
refreshKpis();
loadBacklog();
setView('dashboard');
