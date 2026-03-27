/* ═══════════════════════════════════════════════════════════
   DevShell — Frontend Logic (CLI + Analysis + Locks + GitHub)
   ═══════════════════════════════════════════════════════════ */

const API = {
    scripts: '/api/scripts',
    content: '/api/scripts/content',
    run: '/api/scripts/run',
    save: '/api/scripts/save',
    delete: '/api/scripts/delete',
    favorite: '/api/scripts/favorite',
    exec: '/api/exec',
    lock: '/api/scripts/lock',
    import_github: '/api/scripts/import_github',
};

// ─── State ─────────────────────────────────────────────────
let state = {
    scripts: {},
    activeScript: null,
    expandedCategories: new Set(),
    searchQuery: '',
    cmdHistory: [],
    cmdHistoryIndex: -1,
    unlockedScripts: {}, // stores valid passwords for locked scripts: { "path": "pass" }
    terminals: [1],      // list of terminal IDs
    activeTerminalId: 1,
    nextTerminalId: 2,
};

// ─── SVG Icons ─────────────────────────────────────────────
const ICONS = {
    docker: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`,
    git: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/></svg>`,
    linux: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
    network: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    database: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`,
    deploy: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2-2 4h4z"/><path d="M5 22h14l-2.7-8.1C15.8 12.4 14.1 11 12 11s-3.8 1.4-4.3 3.9z"/><path d="m9 11-2-6h10l-2 6"/></svg>`,
    monitor: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/><path d="M6 10h12"/></svg>`,
    backup: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    security: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    cloud: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    default: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
    script: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>`,
    favorite: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    lock: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
};

function getCategoryIcon(name) {
    return ICONS[name.toLowerCase()] || ICONS.default;
}

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadScripts();
    bindEvents();
    initResizers();

    // Replace the execute icon inside the CLI input bar to a more standard 'Enter' icon
    const runCmdBtn = document.getElementById('btn-run-cmd');
    if (runCmdBtn) {
        runCmdBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>`;
    }
});

// ─── API Calls ─────────────────────────────────────────────

function initResizers() {
    const resizerLeft = document.getElementById('resizer-left');
    const sidebar = document.getElementById('sidebar');
    let isResizingLeft = false;

    if (resizerLeft) {
        resizerLeft.addEventListener('mousedown', (e) => {
            isResizingLeft = true;
            document.body.style.cursor = 'col-resize';
            resizerLeft.classList.add('resizing');
        });
    }

    const resizerRight = document.getElementById('resizer-right');
    const rightPanel = document.getElementById('analysis-panel');
    let isResizingRight = false;

    if (resizerRight) {
        resizerRight.addEventListener('mousedown', (e) => {
            isResizingRight = true;
            document.body.style.cursor = 'col-resize';
            resizerRight.classList.add('resizing');
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (!isResizingLeft && !isResizingRight) return;

        if (isResizingLeft) {
            let newWidth = e.clientX;
            if (newWidth < 150) newWidth = 150;
            if (newWidth > 600) newWidth = 600;
            sidebar.style.width = newWidth + 'px';
            sidebar.style.minWidth = newWidth + 'px';
            document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
        }
        else if (isResizingRight) {
            let newWidth = document.body.clientWidth - e.clientX;
            if (newWidth < 250) newWidth = 250;
            if (newWidth > 800) newWidth = 800;
            rightPanel.style.width = newWidth + 'px';
            rightPanel.style.minWidth = newWidth + 'px';
            document.documentElement.style.setProperty('--analysis-width', newWidth + 'px');
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizingLeft) {
            isResizingLeft = false;
            if (resizerLeft) resizerLeft.classList.remove('resizing');
        }
        if (isResizingRight) {
            isResizingRight = false;
            if (resizerRight) resizerRight.classList.remove('resizing');
        }
        document.body.style.cursor = 'default';
    });
}

async function loadScripts() {
    try {
        const res = await fetch(API.scripts);
        state.scripts = await res.json();
        renderSidebar();
        renderWelcomeStats();
    } catch (err) {
        console.error('Failed to load scripts:', err);
    }
}

async function fetchScriptContent(relPath, password = '') {
    try {
        const res = await fetch(API.content, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: relPath, password: password })
        });
        const data = await res.json();
        if (res.status === 401) {
            return { error: 'Locked', locked: true };
        }
        return data.content || '';
    } catch (err) {
        console.error('Failed to load script content:', err);
        return { error: err.message };
    }
}

async function runScript(relPath) {
    const termId = state.activeTerminalId;
    const btnRun = document.getElementById('btn-run');
    const runStatus = document.getElementById('run-status');
    const resourcePanel = document.getElementById('resource-panel');

    // Set running state
    if (btnRun) {
        btnRun.classList.add('running');
        btnRun.innerHTML = '<span class="spinner" style="margin-right: 6px;"></span> Running...';
    }
    if (termId === state.activeTerminalId) {
        runStatus.textContent = 'Executing...';
        runStatus.className = 'run-status running';
        resourcePanel.style.display = 'none';
    }

    appendToCli(`$ Running script: ${relPath}`, 'cmd-line', termId);

    try {
        const res = await fetch(API.run, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: relPath, password: state.unlockedScripts[relPath] || '' }),
        });

        if (res.status === 401) {
            appendToCli('Error: Script depends on a lock sequence. Unauthorized.', 'error', termId);
            if (termId === state.activeTerminalId) {
                runStatus.textContent = 'Locked';
                runStatus.className = 'run-status error';
            }
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let eolIndex;
            while ((eolIndex = buffer.indexOf('\\n\\n')) >= 0) {
                const chunk = buffer.slice(0, eolIndex).trim();
                buffer = buffer.slice(eolIndex + 2);

                if (chunk.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(chunk.substring(6));

                        if (data.type === 'stdout' || data.type === 'error' || data.type === 'system') {
                            let cssClass = data.type === 'stdout' ? 'stdout' : (data.type === 'system' ? 'cmd-line' : 'error');
                            appendToCli(data.content, cssClass, termId);
                        } else if (data.type === 'metrics') {
                            if (data.success) {
                                appendToCli(`Script completed (Exit code: ${data.exit_code})`, 'success', termId);
                                if (termId === state.activeTerminalId) {
                                    runStatus.textContent = 'Success';
                                    runStatus.className = 'run-status success';
                                }
                            } else {
                                appendToCli(`Script failed (Exit code: ${data.exit_code})`, 'error', termId);
                                if (termId === state.activeTerminalId) {
                                    runStatus.textContent = 'Failed';
                                    runStatus.className = 'run-status error';
                                }
                            }

                            if (data.resources && Object.keys(data.resources).length > 0) {
                                if (termId === state.activeTerminalId) {
                                    renderResources(data.resources);
                                    resourcePanel.style.display = '';
                                }
                            }
                        }
                    } catch (e) { }
                }
            }
        }
    } catch (err) {
        appendToCli(`Error executing script: ${err.message}`, 'error', termId);
        if (termId === state.activeTerminalId) {
            runStatus.textContent = 'Error';
            runStatus.className = 'run-status error';
        }
    } finally {
        if (btnRun) {
            btnRun.classList.remove('running');
            btnRun.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Run</span>`;
        }
    }
}

async function execCommand(cmd) {
    if (!cmd.trim()) return;
    const termId = state.activeTerminalId;

    state.cmdHistory.push(cmd);
    state.cmdHistoryIndex = state.cmdHistory.length;
    appendToCli(`$ ${cmd}`, 'cmd-line', termId);

    try {
        const res = await fetch(API.exec, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: cmd }),
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let eolIndex;
            while ((eolIndex = buffer.indexOf('\\n\\n')) >= 0) {
                const chunk = buffer.slice(0, eolIndex).trim();
                buffer = buffer.slice(eolIndex + 2);

                if (chunk.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(chunk.substring(6));
                        if (data.type === 'stdout' || data.type === 'error') {
                            appendToCli(data.content, data.type === 'stdout' ? 'stdout' : 'error', termId);
                        } else if (data.type === 'metrics') {
                            if (!data.success) {
                                appendToCli(`Command failed (Exit code: ${data.exit_code})`, 'error', termId);
                            }
                        }
                    } catch (e) { }
                }
            }
        }
    } catch (err) {
        appendToCli(`Error executing command: ${err.message}`, 'error', termId);
    }
}

async function saveScript(category, filename, content) {
    try {
        const relPath = `${category}/${filename}`.replace(/\/+/g, '/'); // simple guess
        const res = await fetch(API.save, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, filename, content, password: state.unlockedScripts[relPath] || '' }),
        });
        const data = await res.json();

        if (res.status === 401) {
            alert('Cannot save: Script is locked.');
            return;
        }

        if (data.success) {
            await loadScripts();
            closeModal();
            selectScript(data.path);
        }
    } catch (err) {
        console.error('Failed to save script:', err);
        alert('Failed to save script: ' + err.message);
    }
}

async function deleteScript(relPath) {
    if (!confirm('Are you sure you want to delete this script permanently?')) return;
    try {
        const res = await fetch(API.delete, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: relPath, password: state.unlockedScripts[relPath] || '' })
        });
        const data = await res.json();
        if (res.status === 401) {
            alert("This script is locked. Unlock it first to delete.");
            return;
        }

        state.activeScript = null;
        showWelcome();
        await loadScripts();
    } catch (err) {
        console.error('Failed to delete script:', err);
    }
}

async function toggleFavorite(relPath) {
    try {
        const res = await fetch(API.favorite, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: relPath }),
        });
        const data = await res.json();
        await loadScripts();

        if (state.activeScript === relPath) {
            const btnFav = document.getElementById('btn-fav');
            if (btnFav) btnFav.classList.toggle('active', data.favorite);
        }
    } catch (err) {
        console.error('Failed to toggle favorite:', err);
    }
}

async function importGithubScript(url, category, filename) {
    try {
        const res = await fetch(API.import_github, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, category, filename }),
        });
        const data = await res.json();

        if (res.status === 401) {
            alert("File already exists and is locked.");
            return;
        }

        if (data.success) {
            await loadScripts();
            document.getElementById('github-modal-overlay').classList.remove('active');
            selectScript(data.path);
            appendToCli(`✓ Imported script from GitHub: ${data.path}`, 'success');
        } else {
            alert('Import failed: ' + data.error);
        }
    } catch (err) {
        console.error('Import error:', err);
        alert('Exception during import: ' + err.message);
    }
}

async function manageLock(relPath, oldPass, newPass) {
    try {
        const res = await fetch(API.lock, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: relPath, old_password: oldPass, new_password: newPass }),
        });
        const data = await res.json();

        if (!data.success) {
            alert('Failed: ' + data.error);
            return false;
        }

        if (data.locked) {
            state.unlockedScripts[relPath] = newPass; // update session cache
        } else {
            delete state.unlockedScripts[relPath]; // unlocked completely
        }

        await loadScripts();
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}


// ─── CLI Helpers ───

function appendToCli(text, className = '', termId = state.activeTerminalId) {
    const termBody = document.getElementById(`terminal-body-${termId}`) || document.getElementById('terminal-body');
    if (!termBody) return;

    const welcomeEl = termBody.querySelector('.cli-welcome');
    if (welcomeEl) welcomeEl.remove();

    const line = document.createElement('div');
    line.className = `cli-output-block ${className}`;
    line.textContent = text;
    termBody.appendChild(line);

    termBody.scrollTop = termBody.scrollHeight;
    highlightTerminalSearch();
}

function clearCli() {
    const termBody = document.getElementById(`terminal-body-${state.activeTerminalId}`) || document.getElementById('terminal-body');
    if (termBody) {
        termBody.innerHTML = '<div class="cli-welcome"><span class="cli-prompt">$</span> <span class="cli-welcome-text">Terminal cleared.</span></div>';
    }
    document.getElementById('run-status').textContent = '';
    document.getElementById('run-status').className = 'run-status';
    document.getElementById('resource-panel').style.display = 'none';
}

// ─── Terminal Tabs ───

function addTerminal() {
    const id = state.nextTerminalId++;
    state.terminals.push(id);

    const tabsContainer = document.getElementById('cli-tabs');
    const tabBtn = document.createElement('div');
    tabBtn.className = 'cli-tab';
    tabBtn.id = `tab-btn-${id}`;
    tabBtn.innerHTML = `
        <span class="cli-dots" style="margin-right: 6px;">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
        </span>
        <span>Terminal ${id}</span> 
        <button class="cli-tab-close" title="Close" onclick="event.stopPropagation(); closeTerminal(${id})"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>`;
    tabBtn.onclick = () => switchTerminal(id);
    tabsContainer.insertBefore(tabBtn, document.getElementById('btn-add-tab'));

    const bodyContainer = document.createElement('div');
    bodyContainer.className = 'cli-body';
    bodyContainer.id = `terminal-body-${id}`;
    bodyContainer.style.display = 'none';
    bodyContainer.innerHTML = '<div class="cli-welcome"><span class="cli-prompt">$</span> <span class="cli-welcome-text">Terminal ready.</span></div>';

    document.getElementById('cli-area').insertBefore(bodyContainer, document.querySelector('.cli-input-bar'));
    switchTerminal(id);
}

function switchTerminal(id) {
    state.activeTerminalId = id;

    document.querySelectorAll('.cli-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.getElementById(`tab-btn-${id}`) || document.querySelector(`.cli-tab[data-id="${id}"]`);
    if (activeTab) activeTab.classList.add('active');

    document.querySelectorAll('.cli-body').forEach(b => b.style.display = 'none');
    const activeBody = document.getElementById(`terminal-body-${id}`) || (id === 1 ? document.getElementById('terminal-body') : null);
    if (activeBody) activeBody.style.display = 'block';

    highlightTerminalSearch();
}

function closeTerminal(id) {
    if (state.terminals.length <= 1) return;

    state.terminals = state.terminals.filter(t => t !== id);
    const tabBtn = document.getElementById(`tab-btn-${id}`) || document.querySelector(`.cli-tab[data-id="${id}"]`);
    if (tabBtn) tabBtn.remove();

    const bodyContainer = document.getElementById(`terminal-body-${id}`) || (id === 1 ? document.getElementById('terminal-body') : null);
    if (bodyContainer) bodyContainer.remove();

    if (state.activeTerminalId === id) {
        switchTerminal(state.terminals[state.terminals.length - 1]);
    }
}

// ─── Terminal Search Highlight ───

function highlightTerminalSearch() {
    const searchInput = document.getElementById('cli-search-input');
    if (!searchInput) return;
    const query = searchInput.value;
    const termId = state.activeTerminalId;
    const body = document.getElementById(`terminal-body-${termId}`) || (termId === 1 ? document.getElementById('terminal-body') : null);
    if (!body) return;

    const resultsSpan = document.getElementById('cli-search-results');

    // Remove old highlights
    const marks = body.querySelectorAll('mark.highlight');
    marks.forEach(m => {
        const parent = m.parentNode;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
    });

    if (!query) {
        if (resultsSpan) resultsSpan.textContent = '';
        return;
    }

    let matchCount = 0;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');

    const treeWalker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];

    while (treeWalker.nextNode()) {
        const node = treeWalker.currentNode;
        if (node.parentNode.tagName === 'MARK') continue;
        if (regex.test(node.nodeValue)) {
            nodesToReplace.push(node);
        }
    }

    nodesToReplace.forEach(node => {
        const fragment = document.createDocumentFragment();
        const parts = node.nodeValue.split(regex);

        parts.forEach(part => {
            if (part !== '') {
                if (part.toLowerCase() === query.toLowerCase()) {
                    matchCount++;
                    const mark = document.createElement('mark');
                    mark.className = 'highlight';
                    mark.textContent = part;
                    fragment.appendChild(mark);
                } else {
                    fragment.appendChild(document.createTextNode(part));
                }
            }
        });
        node.parentNode.replaceChild(fragment, node);
    });

    if (resultsSpan) resultsSpan.textContent = matchCount > 0 ? `${matchCount} found` : 'No matches';
}


// ─── Rendering ─────────────────────────────────────────────

function renderSidebar() {
    const tree = document.getElementById('category-tree');
    const countEl = document.getElementById('script-count');
    const favsSection = document.getElementById('favorites-section');
    const favsList = document.getElementById('favorites-list');

    let totalScripts = 0;
    let favScripts = [];
    let html = '';

    const query = state.searchQuery.toLowerCase();

    for (const [cat, scripts] of Object.entries(state.scripts)) {
        const filteredScripts = query
            ? scripts.filter(s =>
                s.name.toLowerCase().includes(query) ||
                (s.desc && s.desc.toLowerCase().includes(query)) ||
                (s.tag && s.tag.toLowerCase().includes(query)) ||
                s.file.toLowerCase().includes(query))
            : scripts;

        if (filteredScripts.length === 0) continue;

        totalScripts += filteredScripts.length;
        const isExpanded = state.expandedCategories.has(cat) || !!query;

        html += `
            <div class="category" data-category="${cat}">
                <div class="category-header" onclick="toggleCategory('${cat}')">
                    <span class="category-arrow ${isExpanded ? 'expanded' : ''}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </span>
                    <span class="category-icon">${getCategoryIcon(cat)}</span>
                    <span class="category-name">${cat}</span>
                    <span class="category-count">${filteredScripts.length}</span>
                </div>
                <ul class="script-list ${isExpanded ? '' : 'collapsed'}" style="max-height: ${filteredScripts.length * 44}px;">
                    ${filteredScripts.map(s => {
            let lockIcon = s.locked ? `<span class="script-item-icon" style="color: var(--accent-orange); margin-right: 4px;">${ICONS.lock}</span>` : '';

            return `
                        <li class="script-item ${state.activeScript === s.relative_path ? 'active' : ''}"
                            onclick="selectScript('${s.relative_path}')"
                            title="${escapeAttr(s.desc)}">
                            ${lockIcon}
                            <span class="script-item-icon" style="${s.locked ? 'display:none;' : ''}">${ICONS.script}</span>
                            <span class="script-item-name">${escapeHtml(s.name)}</span>
                            <span class="script-item-fav ${s.favorite ? 'visible' : ''}"
                                  onclick="event.stopPropagation(); toggleFavorite('${s.relative_path}')">
                                ${ICONS.favorite}
                            </span>
                        </li>
                    `}).join('')}
                </ul>
            </div>
        `;

        // Populate favs
        scripts.forEach(s => { if (s.favorite) favScripts.push(s); });
    }

    tree.innerHTML = html || '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">No scripts found. Create one to get started.</div>';
    countEl.textContent = totalScripts;

    if (favScripts.length > 0) {
        favsSection.style.display = '';
        favsList.innerHTML = favScripts.map(s => `
            <li class="script-item ${state.activeScript === s.relative_path ? 'active' : ''}"
                onclick="selectScript('${s.relative_path}')">
                <span class="script-item-icon" style="color: var(--accent-yellow); stroke: var(--accent-yellow);">${ICONS.favorite}</span>
                <span class="script-item-name">${escapeHtml(s.name)}</span>
            </li>
        `).join('');
    } else {
        favsSection.style.display = 'none';
    }
}

function renderWelcomeStats() {
    const statsEl = document.getElementById('welcome-stats');
    if (!statsEl) return;

    let totalScripts = 0;
    let totalCategories = Object.keys(state.scripts).length;
    let totalFavs = 0;

    for (const scripts of Object.values(state.scripts)) {
        totalScripts += scripts.length;
        totalFavs += scripts.filter(s => s.favorite).length;
    }

    statsEl.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalScripts}</div>
            <div class="stat-label">Total Scripts</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${totalCategories}</div>
            <div class="stat-label">Categories</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${totalFavs}</div>
            <div class="stat-label">Favorites</div>
        </div>
    `;
}

async function selectScript(relPath) {
    state.activeScript = relPath;

    let script = null;
    for (const scripts of Object.values(state.scripts)) {
        script = scripts.find(s => s.relative_path === relPath);
        if (script) break;
    }
    if (!script) return;

    state.expandedCategories.add(script.category);
    renderSidebar();

    const welcomePanel = document.getElementById('welcome-state');
    const detailPanel = document.getElementById('script-detail');
    const lockedPanel = document.getElementById('locked-state');

    welcomePanel.style.display = 'none';

    // Handle locked state
    if (script.locked && !state.unlockedScripts[relPath]) {
        detailPanel.style.display = 'none';
        lockedPanel.style.display = '';

        const unlockBtn = document.getElementById('btn-unlock');
        const passInput = document.getElementById('unlock-password');
        passInput.value = '';
        passInput.focus();

        // Remove old event listeners
        const newUnlockBtn = unlockBtn.cloneNode(true);
        unlockBtn.parentNode.replaceChild(newUnlockBtn, unlockBtn);

        const unlockAction = async () => {
            const content = await fetchScriptContent(relPath, passInput.value);
            if (content.locked) {
                alert('Incorrect password!');
            } else {
                state.unlockedScripts[relPath] = passInput.value;
                selectScript(relPath);
            }
        };

        newUnlockBtn.addEventListener('click', unlockAction);
        passInput.onkeydown = (e) => { if (e.key === 'Enter') unlockAction(); };

        return;
    }

    // Unlocked flow
    lockedPanel.style.display = 'none';
    detailPanel.style.display = '';

    // Fill details
    document.getElementById('detail-category').textContent = script.category;
    document.getElementById('detail-name').textContent = script.name;
    document.getElementById('detail-desc').textContent = script.desc || 'No description provided';
    document.getElementById('detail-path').textContent = script.relative_path;

    // Tags
    const tagsEl = document.getElementById('detail-tags');
    if (script.tag && script.tag.trim() !== '') {
        tagsEl.innerHTML = script.tag.split(',').map(t =>
            `<span class="tag">${escapeHtml(t.trim())}</span>`
        ).join('');
    } else {
        tagsEl.innerHTML = '';
    }

    // Toolbar states
    const btnFav = document.getElementById('btn-fav');
    if (btnFav) btnFav.classList.toggle('active', script.favorite);

    const btnLock = document.getElementById('btn-lock');
    if (btnLock) {
        if (script.locked) {
            btnLock.style.color = "var(--accent-orange)";
            btnLock.style.borderColor = "var(--accent-orange)";
        } else {
            btnLock.style.color = "";
            btnLock.style.borderColor = "";
        }
    }

    // Source code
    const content = await fetchScriptContent(relPath, state.unlockedScripts[relPath] || '');
    if (!content.locked && content !== undefined) {
        document.getElementById('detail-code').textContent = content;
    }

    // Reset resource panel
    document.getElementById('resource-panel').style.display = 'none';

    // Animate in
    detailPanel.classList.add('animate-in');
    setTimeout(() => detailPanel.classList.remove('animate-in'), 300);
}

function showWelcome() {
    document.getElementById('welcome-state').style.display = '';
    if (document.getElementById('script-detail')) document.getElementById('script-detail').style.display = 'none';
    if (document.getElementById('locked-state')) document.getElementById('locked-state').style.display = 'none';
    state.activeScript = null;
    renderSidebar();
}

function renderResources(resources) {
    document.getElementById('res-time').textContent = resources.execution_time_formatted || `${resources.execution_time}s`;

    const exitEl = document.getElementById('res-exit');
    exitEl.textContent = resources.exit_code !== undefined ? resources.exit_code : '—';
    exitEl.style.color = resources.exit_code === 0 ? 'var(--accent)' : 'var(--accent-red)';

    if (resources.cpu_percent !== undefined) {
        document.getElementById('res-cpu').textContent = `${resources.cpu_percent}%`;
        document.getElementById('res-cpu-bar').style.width = `${Math.min(resources.cpu_percent, 100)}%`;

        const cpuBar = document.getElementById('res-cpu-bar');
        if (resources.cpu_percent > 80) cpuBar.style.background = 'var(--accent-red)';
        else if (resources.cpu_percent > 50) cpuBar.style.background = 'var(--accent-orange)';
        else cpuBar.style.background = 'var(--accent)';
    }

    if (resources.memory_used_mb !== undefined) {
        const memUsed = resources.memory_used_mb.toFixed(1);
        const memPercent = resources.memory_percent.toFixed(2);

        // Show actual memory used by process 
        document.getElementById('res-mem').textContent = `${memUsed} MB (${memPercent}%)`;
        document.getElementById('res-mem-bar').style.width = `${Math.min(resources.memory_percent, 100)}%`;

        const memBar = document.getElementById('res-mem-bar');
        if (resources.memory_percent > 85) memBar.style.background = 'var(--accent-red)';
        else if (resources.memory_percent > 60) memBar.style.background = 'var(--accent-orange)';
        else memBar.style.background = 'var(--accent)';
    }
}

function toggleCategory(cat) {
    if (state.expandedCategories.has(cat)) state.expandedCategories.delete(cat);
    else state.expandedCategories.add(cat);
    renderSidebar();
}

// ─── Modals ─────────────────────────────────────────────

function openModal(mode = 'new') {
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');

    if (mode === 'edit' && state.activeScript) {
        title.textContent = 'Edit Script';
        const parts = state.activeScript.split('/');
        document.getElementById('modal-category').value = parts[0] || '';
        document.getElementById('modal-filename').value = parts[1] || '';
        fetchScriptContent(state.activeScript, state.unlockedScripts[state.activeScript] || '').then(content => {
            if (!content.locked) document.getElementById('modal-editor').value = content;
        });
    } else {
        title.textContent = 'New Script';
        document.getElementById('modal-category').value = '';
        document.getElementById('modal-filename').value = '';
        document.getElementById('modal-editor').value = `#!/bin/bash\n# name: \n# desc: \n# tag: \n\n`;
    }

    overlay.classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

// ─── Event Bindings ────────────────────────────────────────

function bindEvents() {
    // Terminal Search
    const cliSearchInput = document.getElementById('cli-search-input');
    if (cliSearchInput) {
        cliSearchInput.addEventListener('input', () => highlightTerminalSearch());
    }

    // Terminal Tabs
    const btnAddTab = document.getElementById('btn-add-tab');
    if (btnAddTab) {
        btnAddTab.addEventListener('click', addTerminal);
    }
    const firstTab = document.querySelector('.cli-tab[data-id="1"]');
    if (firstTab) {
        firstTab.addEventListener('click', () => switchTerminal(1));
    }

    // Search
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderSidebar();
    });

    // CLI input
    const cliInput = document.getElementById('cli-input');
    cliInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = cliInput.value.trim();
            if (cmd) {
                execCommand(cmd);
                cliInput.value = '';
            }
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (state.cmdHistoryIndex > 0) {
                state.cmdHistoryIndex--;
                cliInput.value = state.cmdHistory[state.cmdHistoryIndex] || '';
            }
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (state.cmdHistoryIndex < state.cmdHistory.length - 1) {
                state.cmdHistoryIndex++;
                cliInput.value = state.cmdHistory[state.cmdHistoryIndex] || '';
            } else {
                state.cmdHistoryIndex = state.cmdHistory.length;
                cliInput.value = '';
            }
        }
    });

    // Run Command button
    document.getElementById('btn-run-cmd').addEventListener('click', () => {
        const cmd = cliInput.value.trim();
        if (cmd) {
            execCommand(cmd);
            cliInput.value = '';
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        if (e.key === 'Escape') {
            // close any active modal
            document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active'));
            if (document.activeElement === searchInput) {
                searchInput.value = '';
                state.searchQuery = '';
                searchInput.blur();
                renderSidebar();
            }
        }
    });

    // Create / Refresh
    document.getElementById('btn-add-script').addEventListener('click', () => openModal('new'));
    document.getElementById('btn-refresh').addEventListener('click', () => loadScripts());

    // Script Details Actions
    const btnRun = document.getElementById('btn-run');
    if (btnRun) btnRun.addEventListener('click', () => { if (state.activeScript) runScript(state.activeScript); });

    const btnEdit = document.getElementById('btn-edit');
    if (btnEdit) btnEdit.addEventListener('click', () => { if (state.activeScript) openModal('edit'); });

    const btnDel = document.getElementById('btn-delete');
    if (btnDel) btnDel.addEventListener('click', () => { if (state.activeScript) deleteScript(state.activeScript); });

    const btnFav = document.getElementById('btn-fav');
    if (btnFav) btnFav.addEventListener('click', () => { if (state.activeScript) toggleFavorite(state.activeScript); });

    // Clear terminal
    document.getElementById('btn-clear').addEventListener('click', clearCli);
    document.getElementById('btn-close-detail').addEventListener('click', showWelcome);

    // Main Modal controls
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => { if (e.target.id === 'modal-overlay') closeModal(); });

    document.getElementById('modal-save').addEventListener('click', () => {
        const category = document.getElementById('modal-category').value.trim();
        const filename = document.getElementById('modal-filename').value.trim();
        const content = document.getElementById('modal-editor').value;

        if (!category) return alert('Please enter a category name');
        if (!filename) return alert('Please enter a filename');
        if (!content.trim()) return alert('Please enter script content');

        saveScript(category, filename, content);
    });

    // GitHub Import Features
    const btnGithub = document.getElementById('btn-github-import');
    const githubOverlay = document.getElementById('github-modal-overlay');
    if (btnGithub && githubOverlay) {
        btnGithub.addEventListener('click', () => {
            document.getElementById('github-url').value = '';
            document.getElementById('github-category').value = '';
            document.getElementById('github-filename').value = '';
            githubOverlay.classList.add('active');
        });

        const closeGithub = () => githubOverlay.classList.remove('active');
        document.getElementById('github-modal-close').addEventListener('click', closeGithub);
        document.getElementById('github-modal-cancel').addEventListener('click', closeGithub);
        githubOverlay.addEventListener('click', (e) => { if (e.target.id === 'github-modal-overlay') closeGithub(); });

        document.getElementById('github-modal-import').addEventListener('click', () => {
            const url = document.getElementById('github-url').value;
            const category = document.getElementById('github-category').value;
            const filename = document.getElementById('github-filename').value;

            if (!url || !category || !filename) return alert("All fields are required!");
            importGithubScript(url, category, filename);
        });
    }

    // Lock Features
    const btnLock = document.getElementById('btn-lock');
    const lockOverlay = document.getElementById('lock-modal-overlay');
    if (btnLock && lockOverlay) {
        btnLock.addEventListener('click', () => {
            if (!state.activeScript) return;

            // Check if it's already locked from state
            let isLocked = false;
            for (let cat in state.scripts) {
                let sc = state.scripts[cat].find(s => s.relative_path === state.activeScript);
                if (sc && sc.locked) isLocked = true;
            }

            const modalHeader = document.querySelector('#lock-modal h2');
            const currentPassGroup = document.getElementById('lock-current-pass-group');
            const newPassGroup = document.getElementById('lock-new-pass').parentElement;

            if (isLocked) {
                modalHeader.textContent = 'Remove Script Lock';
                currentPassGroup.style.display = 'flex';
                currentPassGroup.querySelector('label').textContent = 'Enter Password to Remove Lock';
                newPassGroup.style.display = 'none';
            } else {
                modalHeader.textContent = 'Lock Script';
                currentPassGroup.style.display = 'none';
                newPassGroup.style.display = 'flex';
                newPassGroup.querySelector('label').textContent = 'Set Password';
            }

            document.getElementById('lock-current-pass').value = '';
            document.getElementById('lock-new-pass').value = '';

            lockOverlay.classList.add('active');
        });

        const closeLock = () => lockOverlay.classList.remove('active');
        document.getElementById('lock-modal-close').addEventListener('click', closeLock);
        document.getElementById('lock-modal-cancel').addEventListener('click', closeLock);
        lockOverlay.addEventListener('click', (e) => { if (e.target.id === 'lock-modal-overlay') closeLock(); });

        document.getElementById('lock-modal-save').addEventListener('click', async () => {
            let isLocked = false;
            for (let cat in state.scripts) {
                let sc = state.scripts[cat].find(s => s.relative_path === state.activeScript);
                if (sc && sc.locked) isLocked = true;
            }

            let oldPass = '', newPass = '';
            if (isLocked) {
                oldPass = document.getElementById('lock-current-pass').value;
                newPass = ''; // meaning remove lock
            } else {
                oldPass = '';
                newPass = document.getElementById('lock-new-pass').value;
                if (!newPass) return alert("Password cannot be empty when setting a lock!");
            }

            const success = await manageLock(state.activeScript, oldPass, newPass);
            if (success) {
                if (!isLocked && newPass) {
                    // Instantly lock screen up by clearing session
                    delete state.unlockedScripts[state.activeScript];
                    selectScript(state.activeScript);
                } else if (isLocked && !newPass) {
                    delete state.unlockedScripts[state.activeScript];
                    selectScript(state.activeScript);
                }
                closeLock();
            }
        });
    }
}

// ─── Helpers ───────────────────────────────────────────────

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
