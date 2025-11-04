// js/executivesPublic.js
// const API_BASE = '/api/v1';

// Utility: Safely escape HTML to prevent XSS
const escapeHTML = (str) => {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
};

// Utility: Generate safe placeholder image URL
const getPlaceholderImage = (initial) => {
  const text = encodeURIComponent(initial || 'E');
  return `https://via.placeholder.com/300/667eea/ffffff?text=${text}`;
};

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('executives-grid');
  if (!grid) {
    console.warn('Element #executives-grid not found.');
    return;
  }

  // Show loading state
  grid.innerHTML = '<p class="text-center text-muted">Loading executives...</p>';

  try {
    // Use GET method (correct for public data)
    const res = await fetch(`${API_BASE}/u/board`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        // 'X-Requested-With': 'XMLHttpRequest', // optional
      },
      cache: 'no-cache' // optional: prevent stale cache
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.log(errorText)
      throw new Error(`HTTP ${res.status}: ${res.statusText} ${errorText}`.trim());
    }

    const { data } = await res.json();
    // console.log(data)
    const execs = Array.isArray(data) ? data : [];

    if (execs.length === 0) {
      grid.innerHTML = '<p class="text-center text-muted">No active executives.</p>';
      return;
    }

    // Render executives safely
    grid.innerHTML = execs.map(ex => {
      const name = ex.name || 'Unknown Executive';
      const initial = name.charAt(0).toUpperCase();
      const imageUrl = ex.image && ex.image.trim() ? ex.image : getPlaceholderImage(initial);

      return `
        <div class="main-developer-card">
          <div class="developer-card">
            <div class="developer-img">
              <img 
                src="${imageUrl}"
                alt="${escapeHTML(name)}"
                onerror="this.onerror=null; this.src='${getPlaceholderImage(initial)}';"
                loading="lazy">
            </div>
            <div class="developer-content">
              <h4>${escapeHTML(name)}</h4>
              <p><span>${escapeHTML(ex.position || 'Executive')}</span></p>
              ${ex.bio ? `<p class="exec-bio">${escapeHTML(ex.bio)}</p>` : ''}
            </div>
          </div>
        </div>
      `.trim();
    }).join('');

  } catch (err) {
    console.error('Failed to load executives:', err);
    grid.innerHTML = `
      <p class="text-center text-danger">
        Failed to load executives. 
        <a href="javascript:location.reload();" class="text-decoration-underline">Retry</a>
      </p>
    `;
  }
});