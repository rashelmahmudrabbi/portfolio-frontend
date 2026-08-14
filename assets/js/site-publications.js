(async function () {
  'use strict';
  
  const result = await getPortfolio(true);
  const d = result.data || {};
  const publications = d.publications || [];
  const settings = d.settings || {};
  const ownerName = (settings.profile && settings.profile.name) || '';

  const typeBadge = { conference: 'badge-conference', journal: 'badge-journal', thesis: 'badge-thesis' };
  const typeLabel = { conference: 'Conference Paper', journal: 'Journal Article', thesis: 'Thesis' };
  const statusBadge = {
    published: 'status-published',
    'under-review': 'status-under-review',
    completed: 'status-completed',
    accepted: 'status-accepted',
    preprint: 'status-preprint',
  };
  const statusLabel = {
    published: 'Published',
    'under-review': 'Under Review',
    completed: 'Completed',
    accepted: 'Accepted',
    preprint: 'Preprint',
  };

  renderStats();
  renderFilterBar();
  renderList();
  renderFooter(settings);

  function renderStats() {
    const total = publications.length;
    const published = publications.filter((p) => p.status === 'published').length;
    const journal = publications.filter((p) => p.type === 'journal').length;
    const conference = publications.filter((p) => p.type === 'conference').length;
    const thesis = publications.filter((p) => p.type === 'thesis').length;
    document.getElementById('statsBar').innerHTML = `
      <div class="col-auto stat-item"><div class="stat-num">${total}</div><div class="stat-label">Total Papers</div></div>
      <div class="col-auto stat-item"><div class="stat-num">${published}</div><div class="stat-label">Published</div></div>
      <div class="col-auto stat-item"><div class="stat-num">${journal}</div><div class="stat-label">Journal</div></div>
      <div class="col-auto stat-item"><div class="stat-num">${conference}</div><div class="stat-label">Conference</div></div>
      <div class="col-auto stat-item"><div class="stat-num">${thesis}</div><div class="stat-label">Thesis</div></div>`;
  }

  function renderFilterBar() {
    const journal = publications.filter((p) => p.type === 'journal').length;
    const conference = publications.filter((p) => p.type === 'conference').length;
    const thesis = publications.filter((p) => p.type === 'thesis').length;
    const el = document.getElementById('filterBarButtons');
    el.insertAdjacentHTML(
      'beforeend',
      `
      <button class="filter-btn all active" onclick="filterPubs('all',this)">All (${publications.length})</button>
      ${journal ? `<button class="filter-btn" onclick="filterPubs('journal',this)">Journal (${journal})</button>` : ''}
      ${conference ? `<button class="filter-btn" onclick="filterPubs('conference',this)">Conference (${conference})</button>` : ''}
      ${thesis ? `<button class="filter-btn" onclick="filterPubs('thesis',this)">Thesis (${thesis})</button>` : ''}`
    );
  }

  // Helper to bold the owner's name in the authors list
  function formatAuthors(authorsStr, nameToBold) {
    let escAuth = escapeHtml(authorsStr || '');
    if (nameToBold) {
      const regex = new RegExp('(' + escapeHtml(nameToBold).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')', 'gi');
      escAuth = escAuth.replace(regex, '<strong>$1</strong>');
    }
    return escAuth;
  }

  function pubCardHtml(pub, number) {
    const tBadge = typeBadge[pub.type] || 'badge-conference';
    const tLabel = typeLabel[pub.type] || pub.type;
    const sBadge = statusBadge[pub.status] || 'status-published';
    const sLabel = statusLabel[pub.status] || pub.status;
    const abstractId = 'abstract-' + number;
    return `
    <div class="pub-card ${escapeHtml(pub.type || '')}" data-type="${escapeHtml(pub.type || '')}" data-status="${escapeHtml(pub.status || '')}">
      <div class="pub-top d-flex align-items-center gap-2 mb-2">
        <span class="pub-number">[${number}]</span>
        <div class="pub-badges d-flex gap-2">
          <span class="badge-type ${tBadge}">${escapeHtml(tLabel)}</span>
          <span class="badge-status ${sBadge}">${escapeHtml(sLabel)}</span>
        </div>
      </div>
      <h3 class="pub-title">${escapeHtml(pub.title || '')}</h3>
      <div class="pub-authors mb-1">${formatAuthors(pub.authors, ownerName)}</div>
      <div class="pub-venue-row mb-2">
        <span class="pub-venue">${escapeHtml(pub.venue || '')}</span>
        ${pub.year ? ` <span class="pub-dot">&middot;</span> <span class="pub-year">${escapeHtml(pub.year)}</span>` : ''}
      </div>
      ${
        pub.abstract
          ? `<div class="pub-abstract-toggle" onclick="this.classList.toggle('open')">
        <span class="abstract-label"><i class="bi bi-chevron-right abstract-arrow"></i> Abstract</span>
        <div class="abstract-body" id="${abstractId}">${formatRichText(pub.abstract)}</div>
      </div>`
          : ''
      }
      <div class="pub-links">
        ${pub.pdfLink ? `<a class="pub-link" href="${escapeHtml(resolveAssetUrl(pub.pdfLink, true))}" target="_blank"><i class="bi bi-file-earmark-pdf"></i> PDF</a>` : ''}
        ${pub.doiLink ? `<a class="pub-link btn-outline" href="${escapeHtml(pub.doiLink)}" target="_blank"><i class="bi bi-box-arrow-up-right"></i> DOI / IEEE</a>` : ''}
      </div>
    </div>`;
  }

  function renderList() {
    const container = document.getElementById('pubListContainer');
    if (!publications.length) {
      container.innerHTML = `
        <div class="empty-state" id="emptyState">
          <i class="bi bi-search"></i>
          <p>No publications added yet.</p>
        </div>`;
      return;
    }

    const sorted = [...publications].sort((a, b) => (b.year || '0').localeCompare(a.year || '0'));
    let html = '';
    let currentYear = null;
    sorted.forEach((pub, idx) => {
      const yearKey = pub.year || 'Ongoing';
      if (yearKey !== currentYear) {
        html += `<div class="year-divider"><span>${escapeHtml(yearKey)}</span></div>`;
        currentYear = yearKey;
      }
      html += pubCardHtml(pub, idx + 1);
    });
    html += `
      <div class="empty-state d-none" id="emptyState">
        <i class="bi bi-search"></i>
        <p>No publications match this filter.</p>
      </div>`;
    container.innerHTML = html;
  }

  function renderFooter(settings) {
    const p = settings.profile || {};
    document.getElementById('footerYear').textContent = new Date().getFullYear();
    if (p.name) document.getElementById('footerName').textContent = p.name;
    if (p.title) document.getElementById('footerTitle').textContent = p.title;
    if (p.email) {
      const el = document.getElementById('footerEmail');
      if (el) {
        el.textContent = p.email;
        el.href = 'mailto:' + p.email;
      }
    }
  }
})();
