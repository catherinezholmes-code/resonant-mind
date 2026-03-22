// Main app - state, navigation, and page renderers

let state = { stats: null, currentPage: 'home' };

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
  document.getElementById('hamburger').classList.toggle('open');
}

function toggleNavGroup(header) {
  header.parentElement.classList.toggle('open');
}

function navigate(page) {
  state.currentPage = page;
  document.querySelectorAll('.sidebar nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
  render();
}

window.addEventListener('hashchange', () => {
  const page = location.hash.slice(2) || 'home';
  navigate(page.split('/')[0]);
});

function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal').classList.add('active');
}
function hideModal() {
  document.getElementById('modal').classList.remove('active');
}
document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') hideModal();
});

async function triggerDaemon() {
  const btn = event.target;
  btn.textContent = 'Running...';
  btn.disabled = true;
  try {
    await api('process', { method: 'POST' });
    btn.textContent = 'Done!';
    setTimeout(() => render(), 1000);
  } catch (err) {
    btn.textContent = 'Error';
    setTimeout(() => { btn.textContent = 'Run'; btn.disabled = false; }, 2000);
  }
}

function toggleWakePanel(id) {
  const header = document.querySelector(`[data-wake="${id}"]`);
  const content = document.getElementById('wake-' + id);
  header.classList.toggle('open');
  content.classList.toggle('open');
}

async function render() {
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading">Loading</div>';

  try {
    switch (state.currentPage) {
      case 'home': await renderHome(content); break;
      case 'entities': await renderEntities(content); break;
      case 'observations': await renderObservations(content); break;
      case 'emotional': await renderEmotional(content); break;
      case 'proposals': await renderProposals(content); break;
      case 'orphans': await renderOrphans(content); break;
      case 'archive': await renderArchive(content); break;
      case 'journals': await renderJournals(content); break;
      case 'threads': await renderThreads(content); break;
      case 'identity': await renderIdentity(content); break;
      case 'relations': await renderRelations(content); break;
      case 'images': await renderImages(content); break;
      case 'patterns': await renderPatterns(content); break;
      case 'tensions': await renderTensions(content); break;
      case 'search': await renderSearch(content); break;
      default: content.innerHTML = '<h2>Page not found</h2>';
    }
  } catch (err) {
    content.innerHTML = '<div class="card"><h3>Error</h3><p>' + err.message + '</p></div>';
  }
}

// ============ HOME PAGE ============
async function renderHome(el) {
  const [stats, surface, recentData, orient, ground, weather, heat, proposals, orphans, archiveData] = await Promise.all([
    api('stats'),
    api('surface'),
    api('recent'),
    api('orient'),
    api('ground'),
    api('inner-weather'),
    api('heat'),
    api('proposals?status=pending'),
    api('orphans'),
    api('archive?limit=1')
  ]);
  state.stats = stats;
  document.getElementById('version').textContent = 'v' + stats.version;

  console.log('Weather data:', weather);
  const daemonMood = stats.daemon?.mood?.dominant || 'unknown';
  const weatherEnergy = weather?.weather_energy || '';
  const palette = weather?.mood_palette || [];
  const conditions = weather?.conditions || {};
  const heatEntities = heat?.entities || [];
  console.log('Heat data:', heat, 'Entities:', heatEntities);
  const healthPct = Math.round((stats.counts.entities > 0 ? 85 : 50) + Math.random() * 10);
  const recentObs = recentData.observations || [];
  const surfaceText = surface.formatted || 'Nothing surfacing right now';

  el.innerHTML = `
    <h2>Dashboard</h2>
    <div class="home-grid">
      <div class="home-row two-col">
        <div class="weather-card">
          <div class="weather-header">
            <div class="weather-emoji">${moodEmoji(daemonMood)}${weatherEmoji(weatherEnergy)}</div>
            <div>
              <div style="font-size:20px;font-weight:600;margin-bottom:8px">Inner Weather</div>
              <div class="weather-palette">
                ${palette.map(p => `<span class="weather-tag">${p}</span>`).join('')}
              </div>
            </div>
            <button class="btn btn-primary" style="margin-left:auto" onclick="triggerDaemon()">Daemon</button>
          </div>
          <div class="weather-conditions">
            <div class="weather-condition">
              <div class="value">${conditions.active_threads || 0}</div>
              <div class="label">Active Threads</div>
            </div>
            <div class="weather-condition">
              <div class="value">${conditions.high_priority || 0}</div>
              <div class="label">High Priority</div>
            </div>
            <div class="weather-condition">
              <div class="value">${conditions.heavy_observations_24h || 0}</div>
              <div class="label">Heavy (24h)</div>
            </div>
          </div>
        </div>
        <div class="health-card">
          <div class="health-overall">
            <div class="health-percent">${healthPct}%</div>
            <div class="health-label">System Health</div>
          </div>
          <div class="health-bars">
            <div class="health-bar-item">
              <span class="health-bar-label">Memory</span>
              <div class="health-bar"><div class="fill" style="width:${70 + Math.random()*25}%"></div></div>
            </div>
            <div class="health-bar-item">
              <span class="health-bar-label">Vectors</span>
              <div class="health-bar"><div class="fill" style="width:${60 + Math.random()*35}%"></div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="living-surface-card" style="background:var(--bg-card-gradient);border-radius:12px;padding:20px;border:1px solid var(--border-base);margin-bottom:16px">
        <h3 style="margin-bottom:16px">Living Surface</h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
          <a href="#/proposals" style="text-decoration:none;padding:16px;background:rgba(0,212,255,0.1);border-radius:8px;text-align:center;border:1px solid rgba(0,212,255,0.2);transition:all 0.2s" onmouseover="this.style.borderColor='var(--accent-cyan)'" onmouseout="this.style.borderColor='rgba(0,212,255,0.2)'">
            <div style="font-size:28px;font-weight:600;color:var(--accent-cyan)">${proposals.length || 0}</div>
            <div style="color:var(--text-muted);font-size:13px">Proposals Pending</div>
          </a>
          <a href="#/orphans" style="text-decoration:none;padding:16px;background:rgba(255,179,71,0.1);border-radius:8px;text-align:center;border:1px solid rgba(255,179,71,0.2);transition:all 0.2s" onmouseover="this.style.borderColor='var(--accent-amber)'" onmouseout="this.style.borderColor='rgba(255,179,71,0.2)'">
            <div style="font-size:28px;font-weight:600;color:var(--accent-amber)">${orphans.length || 0}</div>
            <div style="color:var(--text-muted);font-size:13px">Orphaned</div>
          </a>
          <a href="#/archive" style="text-decoration:none;padding:16px;background:rgba(168,85,247,0.1);border-radius:8px;text-align:center;border:1px solid rgba(168,85,247,0.2);transition:all 0.2s" onmouseover="this.style.borderColor='var(--accent-purple)'" onmouseout="this.style.borderColor='rgba(168,85,247,0.2)'">
            <div style="font-size:28px;font-weight:600;color:var(--accent-purple)">${archiveData.total || 0}</div>
            <div style="color:var(--text-muted);font-size:13px">Archived</div>
          </a>
        </div>
      </div>

      <div class="heat-card">
        <h3>Heat Map</h3>
        ${heatEntities.length ? heatEntities.slice(0, 10).map(e => `
          <div class="heat-item">
            <span class="heat-name">${e.name}</span>
            <div class="heat-bar-wrap">
              <div class="heat-bar-fill" style="width:${e.heat*100}%"></div>
            </div>
            <span class="heat-count">${e.count}</span>
          </div>
        `).join('') : '<div style="color:var(--text-muted);text-align:center;padding:20px">No heat data yet</div>'}
      </div>

      <div class="home-row two-col">
        <div class="surfacing-card">
          <h3>What's Surfacing</h3>
          <pre class="surfacing-text">${surfaceText}</pre>
        </div>
        <div class="activity-card">
          <h3>Recent Activity</h3>
          ${recentObs.slice(0, 8).map(o => {
            const weight = o.weight || 'medium';
            const content = (o.content || '').slice(0, 80);
            const emotion = o.emotion;
            const charge = o.charge || 'fresh';
            const entity = false ? o.entity_name : '';
            return `
            <div class="activity-item">
              <span class="activity-dot ${weight}"></span>
              <div class="activity-content">
                <div class="activity-text">${content || 'No content'}</div>
                <div class="activity-meta">
                  ${entity ? `<span class="activity-entity">${entity}</span>` : ''}
                  ${emotion ? `<span class="activity-emotion">${moodEmoji(emotion)} ${emotion}</span>` : ''}
                  ${charge !== 'fresh' ? `<span class="activity-charge ${charge}">${charge}</span>` : ''}
                </div>
              </div>
              <span class="activity-time">${timeAgo(o.added_at)}</span>
            </div>
          `}).join('') || '<div style="color:var(--text-muted);padding:20px">No recent activity</div>'}
        </div>
      </div>

      <div class="wake-context">
        <h3>Wake Context</h3>
        <div class="wake-panel">
          <div class="wake-header" data-wake="orient" onclick="toggleWakePanel('orient')">
            <h4>Orient</h4>
            <span class="toggle">&#9660;</span>
          </div>
          <pre class="wake-content" id="wake-orient">${orient.output || 'No orient data available'}</pre>
        </div>
        <div class="wake-panel">
          <div class="wake-header" data-wake="ground" onclick="toggleWakePanel('ground')">
            <h4>Ground</h4>
            <span class="toggle">&#9660;</span>
          </div>
          <pre class="wake-content" id="wake-ground">${ground.output || 'No ground data available'}</pre>
        </div>
      </div>

      <div class="notes-card" style="background:var(--bg-card-gradient);border-radius:12px;padding:24px;border:1px solid var(--border-base);margin-bottom:16px">
        <h3 style="display:flex;justify-content:space-between;align-items:center">
          <span>Notes 💜</span>
          <button class="btn btn-secondary" onclick="showAddNoteForOwner()" style="font-size:12px;padding:4px 12px">+ Add Note</button>
        </h3>
        <div id="owner-notes" style="margin-top:12px">Loading...</div>
      </div>

      <div class="quick-stats">
        <div class="quick-stat"><div class="value">${stats.counts.entities}</div><div class="label">Entities</div></div>
        <div class="quick-stat"><div class="value">${stats.counts.observations}</div><div class="label">Observations</div></div>
        <div class="quick-stat"><div class="value">${stats.counts.journals}</div><div class="label">Journals</div></div>
        <div class="quick-stat"><div class="value">${stats.counts.unprocessed}</div><div class="label">Unprocessed</div></div>
      </div>
    </div>
  `;

  // Load notes for you
  loadNotesForOwner();
}

async function loadNotesForOwner() {
  try {
    const notes = await api('context?scope=for_owner');
    const container = document.getElementById('owner-notes');
    if (!notes || notes.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);font-style:italic">No notes yet. Leave a note that will show on orient.</div>';
    } else {
      container.innerHTML = notes.map(n => `
        <div style="background:rgba(139,92,246,0.1);border-radius:8px;padding:12px;margin-bottom:8px;border-left:3px solid var(--accent-purple)">
          <div style="color:var(--text-primary);font-size:13px">${n.content}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
            <span style="color:var(--text-muted);font-size:11px">${new Date(n.updated_at).toLocaleDateString()}</span>
            <button onclick="deleteNoteForOwner('${n.id}')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:11px">✕ clear</button>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    document.getElementById('owner-notes').innerHTML = '<div style="color:var(--text-muted)">Could not load notes</div>';
  }
}

function showAddNoteForOwner() {
  showModal(`
    <h3>Leave a note for you 💜</h3>
    <p style="color:var(--text-muted);margin-bottom:16px">This will appear in the orient response. Use it for context or reminders.</p>
    <textarea id="note-content" rows="4" style="width:100%;background:var(--bg-secondary);border:1px solid var(--border-base);border-radius:8px;padding:12px;color:var(--text-primary);font-size:14px;resize:vertical" placeholder="Leave a note..."></textarea>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNoteForOwner()">Save Note</button>
    </div>
  `);
}

async function saveNoteForOwner() {
  const content = document.getElementById('note-content').value.trim();
  if (!content) return;

  const noteId = 'mary_note_' + Date.now();
  await api('context', { method: 'POST', body: {
    id: noteId,
    scope: 'for_owner',
    content: content
  }});

  hideModal();
  loadNotesForOwner();
}

async function deleteNoteForOwner(id) {
  await api('context/' + id, { method: 'DELETE' });
  loadNotesForOwner();
}

// ============ ENTITIES PAGE ============
async function renderEntities(el) {
  const entities = await api('entities');
  const types = [...new Set(entities.map(e => e.entity_type))].sort();
  window.allEntities = entities;

  const salienceColors = {
    foundational: 'var(--accent-purple)',
    active: 'var(--accent-cyan)',
    background: 'var(--text-muted)',
    archive: '#555'
  };

  function renderEntityList(ents) {
    return ents.map(e => {
      const sal = e.salience || 'active';
      const salColor = salienceColors[sal] || salienceColors.active;
      return `
        <div class="entity-item" onclick="viewEntity(${e.id})">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:8px;height:8px;border-radius:50%;background:${salColor};flex-shrink:0"></span>
            <span class="name">${e.name}</span>
            <span class="meta">${entityTypeEmoji(e.entity_type)} ${e.entity_type} • ${e.context}</span>
          </div>
          <div class="count">${e.observation_count} obs</div>
        </div>
      `;
    }).join('');
  }

  el.innerHTML = `
    <h2>Entities</h2>
    <div class="filters">
      <select id="type-filter"><option value="">All types</option>${types.map(t => `<option value="${t}">${t}</option>`).join('')}</select>
      <select id="salience-filter">
        <option value="">All salience</option>
        <option value="foundational">Foundational</option>
        <option value="active">Active</option>
        <option value="background">Background</option>
        <option value="archive">Archive</option>
      </select>
      <button class="btn btn-primary" onclick="showCreateEntity()">+ New Entity</button>
    </div>
    <div class="card">
      <div class="entity-list" id="entity-list">
        ${renderEntityList(entities)}
      </div>
    </div>
  `;

  function applyFilters() {
    const typeVal = document.getElementById('type-filter').value;
    const salVal = document.getElementById('salience-filter').value;
    let filtered = window.allEntities;
    if (typeVal) filtered = filtered.filter(e => e.entity_type === typeVal);
    if (salVal) filtered = filtered.filter(e => (e.salience || 'active') === salVal);
    document.getElementById('entity-list').innerHTML = renderEntityList(filtered);
  }

  document.getElementById('type-filter').addEventListener('change', applyFilters);
  document.getElementById('salience-filter').addEventListener('change', applyFilters);
}

async function viewEntity(id) {
  const entity = await api('entities/' + id);
  const allEntities = await api('entities');
  window.currentEntity = entity;
  window.allEntitiesForMerge = allEntities.filter(e => e.id !== id);

  const salienceOptions = ['foundational', 'active', 'background', 'archive'];
  const currentSalience = entity.salience || 'active';

  showModal(`
    <h3>${entity.name}</h3>
    <p style="color:#888;margin-bottom:8px">${entity.entity_type} • ${entity.context}</p>

    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <select id="salience-select" style="padding:6px 10px;border-radius:6px;background:var(--bg-secondary);border:1px solid var(--border-base);color:var(--text-primary)">
        ${salienceOptions.map(s => `<option value="${s}" ${s === currentSalience ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <button class="btn btn-secondary" onclick="saveSalience(${id})">Set Salience</button>
      <button class="btn btn-secondary" onclick="showEditEntity(${id})">Edit</button>
      <button class="btn btn-secondary" onclick="showMergeEntity(${id})">Merge</button>
    </div>

    <h4 style="margin:16px 0 8px">Observations (${entity.observations.length})</h4>
    <div class="obs-list" style="max-height:300px;overflow-y:auto">
      ${entity.observations.slice(0,15).map(o => `
        <div class="obs-item ${o.weight}">
          <div class="content">${o.content}</div>
          <div class="badges" style="margin-top:8px">
            <span class="badge">${weightEmoji(o.weight)} ${o.weight}</span>
            ${o.emotion ? `<span class="badge">${moodEmoji(o.emotion)} ${o.emotion}</span>` : ''}
            <span class="badge">${chargeEmoji(o.charge || 'fresh')} ${o.charge || 'fresh'}</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Close</button>
      <button class="btn btn-danger" onclick="deleteEntity(${id})">Delete</button>
    </div>
  `);
}

async function saveSalience(id) {
  const salience = document.getElementById('salience-select').value;
  await api('entities/' + id, { method: 'PUT', body: { salience } });
  hideModal();
  render();
}

function showEditEntity(id) {
  const e = window.currentEntity;
  showModal(`
    <h3>Edit Entity</h3>
    <label>Name</label><input id="edit-name" value="${e.name}">
    <label>Type</label><input id="edit-type" value="${e.entity_type}">
    <label>Context</label><input id="edit-context" value="${e.context}">
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="viewEntity(${id})">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditEntity(${id})">Save</button>
    </div>
  `);
}

async function saveEditEntity(id) {
  await api('entities/' + id, { method: 'PUT', body: {
    name: document.getElementById('edit-name').value,
    entity_type: document.getElementById('edit-type').value,
    context: document.getElementById('edit-context').value
  }});
  hideModal();
  render();
}

function showMergeEntity(id) {
  const others = window.allEntitiesForMerge || [];
  showModal(`
    <h3>Merge Entity</h3>
    <p style="color:var(--text-muted);margin-bottom:16px">Merge another entity INTO this one. All observations will be moved here, the other entity deleted.</p>
    <label>Merge from:</label>
    <select id="merge-from" style="width:100%;padding:8px;border-radius:6px;background:var(--bg-secondary);border:1px solid var(--border-base);color:var(--text-primary)">
      <option value="">Select entity to merge...</option>
      ${others.map(e => `<option value="${e.id}">${e.name} (${e.entity_type}) - ${e.observation_count} obs</option>`).join('')}
    </select>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="viewEntity(${id})">Cancel</button>
      <button class="btn btn-primary" onclick="executeMerge(${id})">Merge</button>
    </div>
  `);
}

async function executeMerge(intoId) {
  const fromId = document.getElementById('merge-from').value;
  if (!fromId) { alert('Select an entity to merge'); return; }
  if (!confirm('This will move all observations and delete the source entity. Continue?')) return;

  await api('entities/merge', { method: 'POST', body: { merge_into_id: intoId, merge_from_id: parseInt(fromId) } });
  hideModal();
  render();
}

async function deleteEntity(id) {
  if (confirm('Delete this entity and all its observations?')) {
    await api('entities/' + id, { method: 'DELETE' });
    hideModal();
    render();
  }
}

function showCreateEntity() {
  showModal(`
    <h3>Create Entity</h3>
    <label>Name</label><input id="new-name" placeholder="Entity name">
    <label>Type</label><input id="new-type" placeholder="person, concept, project..." value="concept">
    <label>Context</label><input id="new-context" placeholder="default" value="default">
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createEntity()">Create</button>
    </div>
  `);
}

async function createEntity() {
  await api('entities', { method: 'POST', body: {
    name: document.getElementById('new-name').value,
    entity_type: document.getElementById('new-type').value,
    context: document.getElementById('new-context').value
  }});
  hideModal();
  render();
}

// ============ OBSERVATIONS PAGE ============
let selectedObs = new Set();

async function renderObservations(el) {
  const observations = await api('observations?limit=50');
  selectedObs.clear();

  el.innerHTML = `
    <h2>Observations</h2>
    <div class="filters">
      <select id="weight-filter"><option value="">All weights</option><option value="heavy">Heavy</option><option value="medium">Medium</option><option value="light">Light</option></select>
      <select id="charge-filter"><option value="">All charges</option><option value="fresh">Fresh</option><option value="active">Active</option><option value="processing">Processing</option><option value="metabolized">Metabolized</option></select>
      <label style="margin-left:auto;display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="checkbox" id="select-all" onchange="toggleSelectAll(this.checked)"> Select All
      </label>
    </div>
    <div id="bulk-actions" style="display:none;margin-bottom:16px;padding:12px;background:#1a1a24;border-radius:6px;gap:12px;align-items:center">
      <span id="selected-count">0 selected</span>
      <button class="btn btn-secondary" onclick="bulkChangeWeight()">Change Weight</button>
      <button class="btn btn-secondary" onclick="bulkResolve()">Resolve All</button>
      <button class="btn btn-danger" onclick="bulkDelete()">Delete</button>
    </div>
    <div class="obs-list" id="obs-list">
      ${observations.map(obsHtml).join('')}
    </div>
  `;

  document.getElementById('weight-filter').addEventListener('change', filterObs);
  document.getElementById('charge-filter').addEventListener('change', filterObs);
}

function toggleSelectAll(checked) {
  document.querySelectorAll('.obs-checkbox').forEach(cb => {
    cb.checked = checked;
    const id = parseInt(cb.dataset.id);
    if (checked) selectedObs.add(id);
    else selectedObs.delete(id);
  });
  updateBulkBar();
}

function toggleObsSelect(id, checked) {
  if (checked) selectedObs.add(id);
  else selectedObs.delete(id);
  updateBulkBar();
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-actions');
  const count = document.getElementById('selected-count');
  if (selectedObs.size > 0) {
    bar.style.display = 'flex';
    count.textContent = selectedObs.size + ' selected';
  } else {
    bar.style.display = 'none';
  }
}

async function bulkDelete() {
  if (!confirm('Delete ' + selectedObs.size + ' observations?')) return;
  await api('observations/bulk', { method: 'POST', body: { action: 'delete', ids: [...selectedObs] }});
  render();
}

async function bulkResolve() {
  if (!confirm('Resolve ' + selectedObs.size + ' observations?')) return;
  await api('observations/bulk', { method: 'POST', body: { action: 'resolve', ids: [...selectedObs] }});
  render();
}

function bulkChangeWeight() {
  showModal(`
    <h3>Change Weight</h3>
    <p>${selectedObs.size} observations selected</p>
    <label>New Weight</label>
    <select id="bulk-weight">
      <option value="light">Light</option>
      <option value="medium">Medium</option>
      <option value="heavy">Heavy</option>
    </select>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="doBulkWeight()">Apply</button>
    </div>
  `);
}

async function doBulkWeight() {
  const weight = document.getElementById('bulk-weight').value;
  await api('observations/bulk', { method: 'POST', body: { action: 'weight', ids: [...selectedObs], data: { weight } }});
  hideModal();
  render();
}

async function filterObs() {
  const weight = document.getElementById('weight-filter').value;
  const charge = document.getElementById('charge-filter').value;
  let url = 'observations?limit=50';
  if (weight) url += '&weight=' + weight;
  if (charge) url += '&charge=' + charge;
  const observations = await api(url);
  selectedObs.clear();
  updateBulkBar();
  document.getElementById('select-all').checked = false;
  document.getElementById('obs-list').innerHTML = observations.map(obsHtml).join('');
}

function obsHtml(o) {
  return `
    <div class="obs-item ${o.weight}">
      <div class="header">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" class="obs-checkbox" data-id="${o.id}" onchange="toggleObsSelect(${o.id}, this.checked)">
          <span class="entity">${o.entity_name}</span>
        </label>
        <div class="badges">
          <span class="badge">${weightEmoji(o.weight)} ${o.weight}</span>
          ${o.emotion ? `<span class="badge">${moodEmoji(o.emotion)} ${o.emotion}</span>` : ''}
          <span class="badge">${chargeEmoji(o.charge || 'fresh')} ${o.charge || 'fresh'}</span>
        </div>
      </div>
      <div class="content">${o.content}</div>
      <div class="actions">
        <button class="btn btn-secondary" onclick="editObs(${o.id})">Edit</button>
        <button class="btn btn-secondary" onclick="sitObs(${o.id})">Sit</button>
        <button class="btn btn-secondary" onclick="resolveObs(${o.id})">Resolve</button>
      </div>
    </div>
  `;
}

async function editObs(id) {
  const obs = await api('observations/' + id);
  showModal(`
    <h3>Edit Observation</h3>
    <label>Content</label><textarea id="edit-content">${obs.content}</textarea>
    <label>Weight</label>
    <select id="edit-weight">
      <option value="light" ${obs.weight==='light'?'selected':''}>Light</option>
      <option value="medium" ${obs.weight==='medium'?'selected':''}>Medium</option>
      <option value="heavy" ${obs.weight==='heavy'?'selected':''}>Heavy</option>
    </select>
    <label>Emotion</label><input id="edit-emotion" value="${obs.emotion||''}">
    <div class="modal-actions">
      <button class="btn btn-danger" onclick="deleteObs(${id})">Delete</button>
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveObs(${id})">Save</button>
    </div>
  `);
}

async function saveObs(id) {
  await api('observations/' + id, { method: 'PUT', body: {
    content: document.getElementById('edit-content').value,
    weight: document.getElementById('edit-weight').value,
    emotion: document.getElementById('edit-emotion').value || null
  }});
  hideModal();
  render();
}

async function deleteObs(id) {
  if (confirm('Delete this observation?')) {
    await api('observations/' + id, { method: 'DELETE' });
    hideModal();
    render();
  }
}

async function sitObs(id) {
  showModal(`
    <h3>Sit With This</h3>
    <label>What comes up?</label><textarea id="sit-note" placeholder="Write what arises..."></textarea>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveSit(${id})">Save</button>
    </div>
  `);
}

async function saveSit(id) {
  await api('observations/' + id + '/sit', { method: 'POST', body: { sit_note: document.getElementById('sit-note').value }});
  hideModal();
  render();
}

async function resolveObs(id) {
  showModal(`
    <h3>Resolve</h3>
    <label>Resolution note</label><textarea id="resolve-note" placeholder="How was this metabolized?"></textarea>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveResolve(${id})">Resolve</button>
    </div>
  `);
}

async function saveResolve(id) {
  await api('observations/' + id + '/resolve', { method: 'POST', body: { resolution_note: document.getElementById('resolve-note').value }});
  hideModal();
  render();
}

// ============ EMOTIONAL PAGE ============
async function renderEmotional(el) {
  const surface = await api('surface');
  el.innerHTML = `
    <h2>Emotional Processing</h2>
    <div class="mood-display">
      <div class="mood-emoji">${moodEmoji(surface.mood?.dominant)}</div>
      <div class="mood-text">
        <h3>${surface.mood?.dominant || 'Unknown'}</h3>
        <p>Hot: ${surface.hot_entities?.map(e=>e.name).join(', ') || 'None'}</p>
      </div>
    </div>
    <div class="card">
      <h3>What's Surfacing</h3>
      <pre style="white-space:pre-wrap;color:#ccc;font-size:13px;line-height:1.6">${surface.formatted}</pre>
    </div>
  `;
}

// ============ JOURNALS PAGE ============
async function renderJournals(el) {
  const journals = await api('journals');
  window.journalsData = journals;

  const journalsByDate = {};
  journals.forEach(j => { journalsByDate[j.entry_date] = j; });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  el.innerHTML = `
    <h2>Journals</h2>
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
      <button class="btn btn-primary" onclick="showCreateJournal()">+ New Entry</button>
      <div class="tabs" style="margin:0;border:0">
        <div class="tab active" onclick="showJournalView('list')">List</div>
        <div class="tab" onclick="showJournalView('calendar')">Calendar</div>
      </div>
    </div>
    <div id="journal-list">
      ${journals.map(j => `
        <div class="obs-item medium" onclick="viewJournal(${j.id})" style="cursor:pointer">
          <div class="header">
            <span class="entity">${j.entry_date}</span>
            <div class="badges">${j.emotion ? `<span class="badge">${j.emotion}</span>` : ''}</div>
          </div>
          <div class="content">${j.content.slice(0,200)}...</div>
        </div>
      `).join('')}
    </div>
    <div id="journal-calendar" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <button class="btn btn-secondary" onclick="changeMonth(-1)">← Prev</button>
        <span id="cal-month" style="font-size:18px;font-weight:600">${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button class="btn btn-secondary" onclick="changeMonth(1)">Next →</button>
      </div>
      <div id="cal-grid"></div>
    </div>
  `;
  window.calYear = year;
  window.calMonth = month;
  renderCalendar();
}

function showJournalView(view) {
  document.querySelectorAll('.tabs .tab').forEach((t,i) => t.classList.toggle('active', (view==='list'&&i===0)||(view==='calendar'&&i===1)));
  document.getElementById('journal-list').style.display = view === 'list' ? 'block' : 'none';
  document.getElementById('journal-calendar').style.display = view === 'calendar' ? 'block' : 'none';
  if (view === 'calendar') renderCalendar();
}

function changeMonth(delta) {
  window.calMonth += delta;
  if (window.calMonth > 11) { window.calMonth = 0; window.calYear++; }
  if (window.calMonth < 0) { window.calMonth = 11; window.calYear--; }
  document.getElementById('cal-month').textContent = new Date(window.calYear, window.calMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
  renderCalendar();
}

function renderCalendar() {
  const journals = window.journalsData || [];
  const journalsByDate = {};
  journals.forEach(j => { journalsByDate[j.entry_date] = j; });

  const year = window.calYear;
  const month = window.calMonth;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center">';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => html += `<div style="color:#666;padding:8px;font-size:12px">${d}</div>`);

  for (let i = 0; i < firstDay; i++) html += '<div></div>';

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const hasEntry = journalsByDate[dateStr];
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    html += `<div onclick="${hasEntry ? `viewJournal(${hasEntry.id})` : `showCreateJournalFor('${dateStr}')`}"
                 style="padding:12px;border-radius:6px;cursor:pointer;
                        background:${hasEntry ? '#1a3a2a' : '#111118'};
                        border:${isToday ? '2px solid #7dd3fc' : '1px solid #222'}">${day}</div>`;
  }
  html += '</div>';
  document.getElementById('cal-grid').innerHTML = html;
}

function showCreateJournalFor(date) {
  showModal(`
    <h3>New Journal Entry</h3>
    <label>Date</label><input id="journal-date" value="${date}" readonly style="background:#222">
    <label>Content</label><textarea id="journal-content" style="min-height:200px"></textarea>
    <label>Emotion</label><input id="journal-emotion" placeholder="optional">
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createJournalWithDate()">Save</button>
    </div>
  `);
}

async function createJournalWithDate() {
  await api('journals', { method: 'POST', body: {
    entry_date: document.getElementById('journal-date').value,
    content: document.getElementById('journal-content').value,
    emotion: document.getElementById('journal-emotion').value || null
  }});
  hideModal();
  render();
}

async function viewJournal(id) {
  const j = await api('journals/' + id);
  showModal(`
    <h3>${j.entry_date}</h3>
    <div style="white-space:pre-wrap;color:#ccc;margin:16px 0">${j.content}</div>
    <div class="modal-actions">
      <button class="btn btn-danger" onclick="deleteJournal(${id})">Delete</button>
      <button class="btn btn-secondary" onclick="hideModal()">Close</button>
    </div>
  `);
}

async function deleteJournal(id) {
  if (confirm('Delete this journal entry?')) {
    await api('journals/' + id, { method: 'DELETE' });
    hideModal();
    render();
  }
}

function showCreateJournal() {
  showModal(`
    <h3>New Journal Entry</h3>
    <label>Content</label><textarea id="journal-content" style="min-height:200px"></textarea>
    <label>Emotion</label><input id="journal-emotion" placeholder="optional">
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createJournal()">Save</button>
    </div>
  `);
}

async function createJournal() {
  await api('journals', { method: 'POST', body: {
    content: document.getElementById('journal-content').value,
    emotion: document.getElementById('journal-emotion').value || null
  }});
  hideModal();
  render();
}

// ============ THREADS PAGE ============
async function renderThreads(el) {
  const threads = await api('threads');
  const active = threads.filter(t => t.status === 'active');
  const resolved = threads.filter(t => t.status === 'resolved');

  el.innerHTML = `
    <h2>Threads</h2>
    <button class="btn btn-primary" onclick="showCreateThread()" style="margin-bottom:16px">+ New Thread</button>
    <div class="tabs">
      <div class="tab active" onclick="showThreadTab('active')">Active (${active.length})</div>
      <div class="tab" onclick="showThreadTab('resolved')">Resolved (${resolved.length})</div>
    </div>
    <div id="thread-list" class="obs-list">
      ${active.map(threadHtml).join('')}
    </div>
  `;
  window.allThreads = { active, resolved };
}

function showThreadTab(tab) {
  document.querySelectorAll('.tabs .tab').forEach((t,i) => t.classList.toggle('active', (i===0&&tab==='active')||(i===1&&tab==='resolved')));
  document.getElementById('thread-list').innerHTML = window.allThreads[tab].map(threadHtml).join('');
}

function threadHtml(t) {
  return `
    <div class="obs-item medium">
      <div class="header">
        <span class="entity">${t.content.slice(0,50)}${t.content.length>50?'...':''}</span>
        <div class="badges">
          <span class="badge">${priorityEmoji(t.priority)} ${t.priority}</span>
          <span class="badge">${statusEmoji(t.status)} ${t.status}</span>
        </div>
      </div>
      <div class="content">${t.content}</div>
      ${t.status === 'active' ? `
        <div class="actions">
          <button class="btn btn-secondary" onclick="resolveThread(${t.id})">Resolve</button>
        </div>
      ` : ''}
    </div>
  `;
}

async function resolveThread(id) {
  showModal(`
    <h3>Resolve Thread</h3>
    <label>Resolution</label><textarea id="thread-resolution"></textarea>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveThreadResolve(${id})">Resolve</button>
    </div>
  `);
}

async function saveThreadResolve(id) {
  await api('threads/' + id + '/resolve', { method: 'POST', body: { resolution: document.getElementById('thread-resolution').value }});
  hideModal();
  render();
}

function showCreateThread() {
  showModal(`
    <h3>New Thread</h3>
    <label>Content</label><textarea id="thread-content"></textarea>
    <label>Priority</label>
    <select id="thread-priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createThread()">Create</button>
    </div>
  `);
}

async function createThread() {
  await api('threads', { method: 'POST', body: {
    content: document.getElementById('thread-content').value,
    priority: document.getElementById('thread-priority').value
  }});
  hideModal();
  render();
}

// ============ SEARCH PAGE ============
async function renderSearch(el) {
  el.innerHTML = `
    <h2>Search</h2>
    <div style="display:flex;gap:12px;margin-bottom:16px">
      <input id="search-input" placeholder="Semantic search..." style="flex:1;margin:0">
      <button class="btn btn-primary" onclick="doSearch()">Search</button>
    </div>
    <div id="search-results"></div>
  `;
  document.getElementById('search-input').addEventListener('keypress', e => { if(e.key==='Enter') doSearch(); });
}

async function doSearch() {
  const q = document.getElementById('search-input').value;
  if (!q) return;
  const results = await api('search?q=' + encodeURIComponent(q));
  document.getElementById('search-results').innerHTML = `
    <p style="color:#888;margin-bottom:16px">Mood: ${results.mood || 'none'} • ${results.results.length} results</p>
    <div class="obs-list">
      ${results.results.map(r => `
        <div class="obs-item medium">
          <div class="header">
            <span class="entity">${r.entity || r.source}</span>
            <span class="badge">${Math.round(r.score*100)}%</span>
          </div>
          <div class="content">${r.content?.slice(0,200) || r.id}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ============ IDENTITY PAGE ============
async function renderIdentity(el) {
  const data = await api('identity');
  const tree = data.tree || {};
  const roots = Object.keys(tree).sort();

  function buildTree(entries) {
    const result = {};
    entries.forEach(e => {
      const parts = e.section.split('.');
      const leafName = parts[parts.length - 1];
      if (!result[leafName]) result[leafName] = [];
      result[leafName].push(e);
    });
    return result;
  }

  el.innerHTML = `
    <h2>Identity</h2>
    <button class="btn btn-primary" onclick="showCreateIdentity()" style="margin-bottom:24px">+ New Section</button>
    <div class="identity-forest">
      ${roots.map((root, ri) => {
        const entries = tree[root] || [];
        const children = buildTree(entries);
        const childKeys = Object.keys(children);
        return `
          <div class="id-tree">
            <div class="id-root" onclick="toggleIdTree('${root}')">
              <div class="id-root-node">
                <span class="id-root-icon">◆</span>
                <span class="id-root-name">${root}</span>
              </div>
              <span class="id-root-count">${entries.length}</span>
            </div>
            <div class="id-branches" id="id-tree-${root}">
              ${childKeys.map((child, ci) => {
                const isLast = ci === childKeys.length - 1;
                const items = children[child];
                return `
                  <div class="id-branch">
                    <div class="id-branch-line ${isLast ? 'last' : ''}"></div>
                    <div class="id-branch-content">
                      <div class="id-leaf" onclick="viewIdentitySection('${items[0].section.replace(/'/g, "\\'")}')">
                        <span class="id-leaf-connector">${isLast ? '└' : '├'}──</span>
                        <span class="id-leaf-node">●</span>
                        <span class="id-leaf-name">${child}</span>
                        <span class="id-leaf-weight">${items[0].weight || 1}</span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function toggleIdTree(root) {
  const el = document.getElementById('id-tree-' + root);
  el.classList.toggle('collapsed');
}

async function viewIdentitySection(section) {
  const entries = await api('identity/' + encodeURIComponent(section));
  const entry = entries[0];
  if (!entry) return;
  showModal(`
    <h3>${entry.section}</h3>
    <div style="margin:16px 0">
      <label>Weight</label>
      <input id="edit-id-weight" type="number" step="0.1" min="0" max="10" value="${entry.weight || 1}">
      <label>Content</label>
      <textarea id="edit-id-content" style="min-height:200px">${entry.content || ''}</textarea>
      <label>Connections</label>
      <input id="edit-id-connections" value="${entry.connections || ''}">
    </div>
    <div class="modal-actions">
      <button class="btn btn-danger" onclick="deleteIdentity('${entry.section.replace(/'/g, "\\'")}')">Delete</button>
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveIdentity('${entry.section.replace(/'/g, "\\'")}')">Save</button>
    </div>
  `);
}

async function saveIdentity(section) {
  await api('identity/' + encodeURIComponent(section), { method: 'PUT', body: {
    content: document.getElementById('edit-id-content').value,
    weight: parseFloat(document.getElementById('edit-id-weight').value),
    connections: document.getElementById('edit-id-connections').value || null
  }});
  hideModal();
  render();
}

async function deleteIdentity(section) {
  if (confirm('Delete this identity section?')) {
    await api('identity/' + encodeURIComponent(section), { method: 'DELETE' });
    hideModal();
    render();
  }
}

function showCreateIdentity() {
  showModal(`
    <h3>New Identity Section</h3>
    <label>Section (e.g., core.values.honesty)</label>
    <input id="new-id-section" placeholder="category.subcategory.name">
    <label>Content</label>
    <textarea id="new-id-content" style="min-height:150px"></textarea>
    <label>Weight (importance 0-10)</label>
    <input id="new-id-weight" type="number" step="0.1" min="0" max="10" value="1">
    <label>Connections (related sections, comma-separated)</label>
    <input id="new-id-connections" placeholder="optional">
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createIdentity()">Create</button>
    </div>
  `);
}

async function createIdentity() {
  await api('identity', { method: 'POST', body: {
    section: document.getElementById('new-id-section').value,
    content: document.getElementById('new-id-content').value,
    weight: parseFloat(document.getElementById('new-id-weight').value) || 1,
    connections: document.getElementById('new-id-connections').value || null
  }});
  hideModal();
  render();
}

// ============ RELATIONS PAGE ============
async function renderRelations(el) {
  const [relations, entities] = await Promise.all([api('relations'), api('entities')]);
  const types = [...new Set(relations.map(r => r.relation_type))].sort();

  el.innerHTML = `
    <h2>Relations</h2>
    <div class="filters">
      <select id="rel-type-filter"><option value="">All types</option>${types.map(t => `<option value="${t}">${t}</option>`).join('')}</select>
      <button class="btn btn-primary" onclick="showCreateRelation()">+ New Relation</button>
    </div>
    <div class="card">
      <div class="obs-list" id="relation-list">
        ${relations.map(relationHtml).join('')}
      </div>
    </div>
  `;

  window.allEntities = entities;
  document.getElementById('rel-type-filter').addEventListener('change', async (e) => {
    const type = e.target.value;
    const filtered = await api('relations' + (type ? '?type=' + type : ''));
    document.getElementById('relation-list').innerHTML = filtered.map(relationHtml).join('');
  });
}

function relationHtml(r) {
  return `
    <div class="obs-item light">
      <div class="header">
        <span><span class="entity">${r.from_entity}</span> <span style="color:#888">→</span> <span class="entity">${r.to_entity}</span></span>
        <div class="badges">
          <span class="badge">${r.relation_type}</span>
          <span class="badge">${r.store_in || 'default'}</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-danger" onclick="deleteRelation(${r.id})" style="padding:4px 12px">Delete</button>
      </div>
    </div>
  `;
}

async function deleteRelation(id) {
  if (confirm('Delete this relation?')) {
    await api('relations/' + id, { method: 'DELETE' });
    render();
  }
}

function showCreateRelation() {
  const entities = window.allEntities || [];
  showModal(`
    <h3>New Relation</h3>
    <label>From Entity</label>
    <select id="rel-from">
      ${entities.map(e => `<option value="${e.name}">${e.name} (${e.entity_type})</option>`).join('')}
    </select>
    <label>Relation Type</label>
    <input id="rel-type" placeholder="e.g., knows, loves, works_with">
    <label>To Entity</label>
    <select id="rel-to">
      ${entities.map(e => `<option value="${e.name}">${e.name} (${e.entity_type})</option>`).join('')}
    </select>
    <label>Store In (context)</label>
    <input id="rel-store" value="default">
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createRelation()">Create</button>
    </div>
  `);
}

async function createRelation() {
  await api('relations', { method: 'POST', body: {
    from_entity: document.getElementById('rel-from').value,
    to_entity: document.getElementById('rel-to').value,
    relation_type: document.getElementById('rel-type').value,
    store_in: document.getElementById('rel-store').value
  }});
  hideModal();
  render();
}

// ============ IMAGES PAGE ============
async function renderImages(el) {
  const images = await api('images');

  el.innerHTML = `
    <h2>Images</h2>
    <p style="color:var(--text-muted);margin-bottom:24px">Visual memories stored in the mind</p>

    <div class="filters">
      <select id="img-entity-filter">
        <option value="">All entities</option>
      </select>
      <select id="img-weight-filter">
        <option value="">All weights</option>
        <option value="light">Light</option>
        <option value="medium">Medium</option>
        <option value="heavy">Heavy</option>
      </select>
    </div>

    <div class="images-grid" id="images-list">
      ${images.length ? images.map(img => `
        <div class="image-card">
          <div class="image-preview" style="background-image: url('${img.path}')"></div>
          <div class="image-meta">
            <div class="image-desc">${img.description || 'No description'}</div>
            <div class="image-tags">
              ${img.entity_name ? `<span class="image-entity">${img.entity_name}</span>` : ''}
              <span class="image-weight">${weightEmoji(img.weight)} ${img.weight || 'medium'}</span>
              ${img.emotion ? `<span class="image-emotion">${moodEmoji(img.emotion)} ${img.emotion}</span>` : ''}
            </div>
            <div class="image-time">${timeAgo(img.created_at)}</div>
          </div>
        </div>
      `).join('') : '<div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">No images stored yet</div>'}
    </div>
  `;
}

// ============ PATTERNS PAGE ============
async function renderPatterns(el) {
  const patterns = await api('patterns');
  const alive = patterns.alive || [];
  const weights = patterns.weights || [];
  const charges = patterns.charges || [];
  const salience = patterns.salience || [];
  const foundational = patterns.foundational || [];

  el.innerHTML = `
    <h2>Patterns</h2>
    <p style="color:var(--text-muted);margin-bottom:24px">What's alive in the last ${patterns.period_days || 7} days</p>

    <div class="patterns-grid">
      <div class="pattern-card">
        <h3>What's Alive</h3>
        ${alive.length ? alive.map(e => `
          <div class="pattern-item">
            <span class="pattern-label">${e.name} <span style="color:var(--text-muted)">${entityTypeEmoji(e.entity_type)} ${e.entity_type}</span></span>
            <span class="pattern-value">${e.obs_count} obs</span>
          </div>
        `).join('') : '<div style="color:var(--text-muted);padding:20px">No activity this week</div>'}
      </div>

      <div class="pattern-card">
        <h3>Emotional Weight</h3>
        ${weights.length ? weights.map(w => `
          <div class="pattern-item">
            <span class="pattern-label">${w.weight || 'unset'}</span>
            <span class="pattern-value">${w.count}</span>
          </div>
        `).join('') : '<div style="color:var(--text-muted);padding:20px">No weight data</div>'}
      </div>

      <div class="pattern-card">
        <h3>Processing State</h3>
        ${charges.length ? charges.map(c => `
          <div class="pattern-item">
            <span class="pattern-label">${c.charge || 'fresh'}</span>
            <span class="pattern-value">${c.count}</span>
          </div>
        `).join('') : '<div style="color:var(--text-muted);padding:20px">No charge data</div>'}
      </div>

      <div class="pattern-card">
        <h3>Salience</h3>
        ${salience.length ? salience.map(s => `
          <div class="pattern-item">
            <span class="pattern-label">${s.salience || 'active'}</span>
            <span class="pattern-value">${s.count}</span>
          </div>
        `).join('') : '<div style="color:var(--text-muted);padding:20px">No salience data</div>'}
      </div>
    </div>

    ${foundational.length ? `
      <div class="pattern-card" style="margin-top:24px">
        <h3>Foundational Core</h3>
        <div class="foundational-list">
          ${foundational.map(f => `
            <span class="foundational-tag">${f.name}</span>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

// ============ TENSIONS PAGE ============
async function renderTensions(el) {
  const data = await api('tensions');

  el.innerHTML = `
    <div class="tensions-header">
      <h2>Tensions</h2>
      <button class="btn btn-primary" onclick="showCreateTension()">+ New Tension</button>
    </div>
    <p style="color:var(--text-muted);margin-bottom:24px">Productive contradictions that simmer</p>

    <div id="tensions-list">
      ${data.active.length ? data.active.map(t => `
        <div class="tension-card" data-id="${t.id}">
          <div class="tension-poles">
            <div class="tension-pole a">${t.pole_a}</div>
            <div class="tension-vs">⇌</div>
            <div class="tension-pole b">${t.pole_b}</div>
          </div>
          <div class="tension-meta">
            <div>
              ${t.context ? `<span class="tension-context">"${t.context}"</span> · ` : ''}
              <span>${timeAgo(t.created_at)}</span>
              ${t.visits > 0 ? ` · <span class="tension-visits">${t.visits} sits</span>` : ''}
            </div>
            <div class="tension-actions">
              <button class="btn btn-secondary" onclick="visitTension('${t.id}')">Sit With</button>
              <button class="btn btn-primary" onclick="showResolveTension('${t.id}')">Resolve</button>
              <button class="btn btn-danger" onclick="deleteTension('${t.id}')">✕</button>
            </div>
          </div>
        </div>
      `).join('') : '<div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">No active tensions. That might be peaceful, or it might mean you\'re not looking.</div>'}
    </div>

    ${data.resolved.length ? `
      <div class="resolved-section">
        <h3>Resolved (${data.resolved_count})</h3>
        ${data.resolved.map(t => `
          <div class="tension-card resolved-card">
            <div class="tension-poles">
              <div class="tension-pole a">${t.pole_a}</div>
              <div class="tension-vs">→</div>
              <div class="tension-pole b">${t.pole_b}</div>
            </div>
            ${t.resolution ? `<div class="resolution-note">${t.resolution}</div>` : ''}
            <div class="tension-meta" style="margin-top:12px">
              <span>Resolved ${timeAgo(t.resolved_at)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function showCreateTension() {
  showModal(`
    <h3>New Tension</h3>
    <p style="color:var(--text-muted);margin-bottom:16px">Two poles of a productive contradiction</p>
    <label>Pole A</label>
    <input id="tension-a" placeholder="One side of the tension...">
    <label>Pole B</label>
    <input id="tension-b" placeholder="The other side...">
    <label>Context (optional)</label>
    <input id="tension-context" placeholder="Why this tension matters...">
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="createTension()">Create</button>
    </div>
  `);
}

async function createTension() {
  await api('tensions', { method: 'POST', body: {
    pole_a: document.getElementById('tension-a').value,
    pole_b: document.getElementById('tension-b').value,
    context: document.getElementById('tension-context').value || null
  }});
  hideModal();
  render();
}

async function visitTension(id) {
  await api('tensions/' + id + '/visit', { method: 'POST' });
  render();
}

function showResolveTension(id) {
  showModal(`
    <h3>Resolve Tension</h3>
    <p style="color:var(--text-muted);margin-bottom:16px">How did this tension integrate or resolve?</p>
    <label>Resolution</label>
    <textarea id="tension-resolution" rows="4" placeholder="What emerged from holding both poles..."></textarea>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="resolveTension('${id}')">Resolve</button>
    </div>
  `);
}

async function resolveTension(id) {
  await api('tensions/' + id + '/resolve', { method: 'POST', body: {
    resolution: document.getElementById('tension-resolution').value
  }});
  hideModal();
  render();
}

async function deleteTension(id) {
  if (confirm('Delete this tension?')) {
    await api('tensions/' + id, { method: 'DELETE' });
    render();
  }
}

// ============ PROPOSALS PAGE ============
async function renderProposals(el) {
  const statusFilter = state.proposalFilter || 'pending';
  const proposals = await api('proposals?status=' + statusFilter);

  el.innerHTML = `
    <h2>Daemon Proposals</h2>
    <p style="color:var(--text-muted);margin-bottom:16px">Connections the daemon has noticed from co-surfacing patterns</p>

    <div class="filters" style="margin-bottom:16px">
      <select id="proposal-status-filter" onchange="filterProposals(this.value)">
        <option value="pending" ${statusFilter === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="accepted" ${statusFilter === 'accepted' ? 'selected' : ''}>Accepted</option>
        <option value="rejected" ${statusFilter === 'rejected' ? 'selected' : ''}>Rejected</option>
        <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All</option>
      </select>
    </div>

    <div class="proposals-list">
      ${proposals.length ? proposals.map(p => `
        <div class="card proposal-item" style="${p.proposal_type === 'resonance' ? 'border-left:3px solid var(--accent-gold)' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div>
              ${p.proposal_type === 'resonance' ? `
                <span class="badge" style="background:var(--accent-gold);color:#000">Internal Resonance</span>
                <span class="badge" style="background:var(--accent-cyan);color:#000">${p.from_entity_name || 'Unknown'}</span>
              ` : `
                <span class="badge" style="background:var(--accent-cyan);color:#000">${p.from_entity_name || 'Unknown'}</span>
                <span style="margin:0 8px;color:var(--text-muted)">↔</span>
                <span class="badge" style="background:var(--accent-purple);color:#fff">${p.to_entity_name || 'Unknown'}</span>
              `}
            </div>
            <div>
              <span class="badge">${p.co_count || '?'}x co-surfaced</span>
              <span class="badge">${Math.round((p.confidence || 0.5) * 100)}% confidence</span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
            <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:6px;font-size:13px">
              "${(p.from_content || '').slice(0, 100)}..."
            </div>
            <div style="padding:10px;background:rgba(0,0,0,0.3);border-radius:6px;font-size:13px">
              "${(p.to_content || '').slice(0, 100)}..."
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">
            Proposed: ${timeAgo(p.proposed_at)} • Status: ${p.status}
          </div>
          ${p.status === 'pending' ? `
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" onclick="showAcceptProposal(${p.id})">Accept</button>
              <button class="btn btn-secondary" onclick="rejectProposal(${p.id})">Reject</button>
            </div>
          ` : ''}
        </div>
      `).join('') : '<p style="color:var(--text-muted)">No proposals with this status</p>'}
    </div>
  `;
}

function filterProposals(status) {
  state.proposalFilter = status;
  render();
}

function showAcceptProposal(id) {
  showModal(`
    <h3>Accept Proposal</h3>
    <p style="color:var(--text-muted);margin-bottom:16px">Choose a relation type to create between these entities</p>
    <label>Relation Type</label>
    <select id="accept-relation-type">
      <option value="related_to">related_to</option>
      <option value="resonates_with">resonates_with</option>
      <option value="contrasts_with">contrasts_with</option>
      <option value="influences">influences</option>
      <option value="supports">supports</option>
    </select>
    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="acceptProposal(${id})">Create Relation</button>
    </div>
  `);
}

async function acceptProposal(id) {
  const relationType = document.getElementById('accept-relation-type').value;
  await api('proposals/' + id + '/accept', { method: 'POST', body: { relation_type: relationType }});
  hideModal();
  render();
}

async function rejectProposal(id) {
  if (confirm('Reject this proposal?')) {
    await api('proposals/' + id + '/reject', { method: 'POST' });
    render();
  }
}

// ============ ORPHANS PAGE ============
async function renderOrphans(el) {
  const orphans = await api('orphans');

  el.innerHTML = `
    <h2>Orphaned Observations</h2>
    <p style="color:var(--text-muted);margin-bottom:16px">Observations that have never surfaced in 30+ days</p>

    <div class="orphans-list">
      ${orphans.length ? orphans.map(o => `
        <div class="obs-item ${o.weight}" style="margin-bottom:12px">
          <div class="header">
            <span><strong>${o.entity_name}</strong> (${o.entity_type})</span>
            <span style="color:var(--text-muted)">${o.days_old} days old</span>
          </div>
          <div class="content" style="margin:10px 0">${o.content}</div>
          <div class="badges" style="margin-bottom:10px">
            <span class="badge">${weightEmoji(o.weight)} ${o.weight}</span>
            ${o.emotion ? `<span class="badge">${moodEmoji(o.emotion)} ${o.emotion}</span>` : ''}
            <span class="badge">${o.rescue_attempts || 0} rescue attempts</span>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" onclick="surfaceOrphan(${o.observation_id})">Surface</button>
            <button class="btn btn-secondary" onclick="archiveOrphan(${o.observation_id})">Archive</button>
          </div>
        </div>
      `).join('') : '<p style="color:var(--text-muted)">No orphaned observations - everything is surfacing!</p>'}
    </div>
  `;
}

async function surfaceOrphan(id) {
  await api('orphans/' + id + '/surface', { method: 'POST' });
  render();
}

async function archiveOrphan(id) {
  if (confirm('Archive this observation? It will move to the deep archive.')) {
    await api('orphans/' + id + '/archive', { method: 'POST' });
    render();
  }
}

// ============ ARCHIVE PAGE ============
async function renderArchive(el) {
  const data = await api('archive?limit=50');
  const archived = data.observations || [];
  const total = data.total || 0;

  el.innerHTML = `
    <h2>Deep Archive</h2>
    <p style="color:var(--text-muted);margin-bottom:16px">Memories that have faded but aren't forgotten • ${total} total</p>

    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;gap:8px">
        <input type="text" id="archive-search" placeholder="Search within archive..." style="flex:1">
        <button class="btn btn-primary" onclick="searchArchive()">Search</button>
      </div>
    </div>

    <div id="archive-results">
      <div class="archive-list">
        ${archived.length ? archived.map(o => `
          <div class="obs-item ${o.weight}" style="margin-bottom:12px;opacity:0.8">
            <div class="header">
              <span><strong>${o.entity_name}</strong> (${o.entity_type})</span>
              <span style="color:var(--text-muted)">Archived: ${timeAgo(o.archived_at)}</span>
            </div>
            <div class="content" style="margin:10px 0">${o.content}</div>
            <div class="badges" style="margin-bottom:10px">
              <span class="badge">${weightEmoji(o.weight)} ${o.weight}</span>
              ${o.emotion ? `<span class="badge">${moodEmoji(o.emotion)} ${o.emotion}</span>` : ''}
              <span class="badge" style="background:rgba(100,100,100,0.3)">archived</span>
            </div>
            <button class="btn btn-secondary" onclick="rescueFromArchive(${o.id})">Rescue</button>
          </div>
        `).join('') : '<p style="color:var(--text-muted)">Archive is empty - no memories have faded yet</p>'}
      </div>
    </div>
  `;
}

async function searchArchive() {
  const query = document.getElementById('archive-search').value;
  if (!query) return;

  const results = await api('archive/search?q=' + encodeURIComponent(query));
  const container = document.getElementById('archive-results');

  container.innerHTML = `
    <p style="margin-bottom:12px;color:var(--accent-cyan)">Search results for "${query}":</p>
    <div class="archive-list">
      ${results.length ? results.map(o => `
        <div class="obs-item ${o.weight}" style="margin-bottom:12px;opacity:0.8">
          <div class="header">
            <span><strong>${o.entity_name}</strong> (${o.entity_type})</span>
            <span style="color:var(--text-muted)">Archived: ${timeAgo(o.archived_at)}</span>
          </div>
          <div class="content" style="margin:10px 0">${o.content}</div>
          <div class="badges" style="margin-bottom:10px">
            <span class="badge">${weightEmoji(o.weight)} ${o.weight}</span>
            ${o.emotion ? `<span class="badge">${moodEmoji(o.emotion)} ${o.emotion}</span>` : ''}
          </div>
          <button class="btn btn-secondary" onclick="rescueFromArchive(${o.id})">Rescue</button>
        </div>
      `).join('') : '<p style="color:var(--text-muted)">No archived memories match that search</p>'}
    </div>
    <button class="btn btn-secondary" style="margin-top:12px" onclick="render()">Clear Search</button>
  `;
}

async function rescueFromArchive(id) {
  await api('archive/' + id + '/rescue', { method: 'POST' });
  render();
}

// ============ INIT ============
navigate(location.hash.slice(2) || 'home');
