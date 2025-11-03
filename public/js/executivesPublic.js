// js/executivesPublic.js
const API_BASE = '/api/v1';

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('executives-grid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/user/active-board`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { data } = await res.json();
    const execs = Array.isArray(data) ? data : [];

    if (execs.length === 0) {
      grid.innerHTML = '<p class="text-center text-muted">No active executives.</p>';
      return;
    }

    grid.innerHTML = execs.map(ex => `
      <div class="main-developer-card">
        <div class="developer-card">
          <div class="developer-img">
            <img src="${ex.image || 'https://via.placeholder.com/300/667eea/fff?text=' + (ex.name?.[0] || 'E')}" 
                 alt="${ex.name}"
                 onerror="this.src='https://via.placeholder.com/300/ccc/999?text=No+Image'">
          </div>
          <div class="developer-content">
            <h4>${ex.name}</h4>
            <p><span>${ex.position}</span></p>
            ${ex.bio ? `<p class="exec-bio">${ex.bio}</p>` : ''}
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Load failed:', err);
    grid.innerHTML = '<p class="text-center text-danger">Failed to load executives.</p>';
  }
});