(async function () {
  'use strict';
  
  const result = await getPortfolio();
  const d = result.data || {};
  const projects = d.projects || [];
  const settings = d.settings || {};

  const research = projects.filter((p) => p.category === 'research' || p.category === 'thesis');
  const dev = projects.filter((p) => p.category === 'development');
  const featured = projects.filter((p) => p.featured);
  const thesis = projects.filter((p) => p.category === 'thesis');

  const years = [...new Set(projects.map((p) => p.year).filter(Boolean))].sort().reverse();

  renderFilterBar();
  renderProjectsContainer();
  renderFooter(settings);

  function renderFilterBar() {
    const el = document.getElementById('filterBarButtons');
    const buttons = [
      `<button class="filter-btn active" onclick="filterProjects('all',this)">All (${projects.length})</button>`,
      `<button class="filter-btn" onclick="filterProjects('research',this)">Research (${research.length})</button>`,
      `<button class="filter-btn" onclick="filterProjects('development',this)">Development (${dev.length})</button>`,
      ...years.map((y) => `<button class="filter-btn" onclick="filterProjects('${escapeHtml(y)}',this)">${escapeHtml(y)}</button>`),
    ];
    el.insertAdjacentHTML('beforeend', buttons.join(''));
  }

  function techChips(tech, cls) {
    return (tech || []).map((t) => `<span class="${cls}">${escapeHtml(t)}</span>`).join('');
  }

  function featuredCardHtml(p) {
    return `
    <div class="col-12 filterable" data-year="${escapeHtml(p.year || '')}" data-type="research">
      <div class="featured-card">
        <div class="featured-img"><i class="bi bi-activity"></i><span class="featured-badge">&#11088; Featured Research</span></div>
        <div class="featured-body">
          <div class="d-flex flex-wrap gap-2 mb-2">
            <span class="accuracy-badge"><i class="bi bi-calendar me-1"></i>${escapeHtml(p.year || '')}</span>
          </div>
          <div class="featured-title">${escapeHtml(p.title || '')}</div>
          <p class="featured-desc">${escapeHtml(p.description || '')}</p>
          <div class="mb-3">${techChips(p.tech, 'tech-chip')}</div>
          <div class="d-flex gap-2 flex-wrap">
            ${p.githubLink ? `<a class="project-link" href="${escapeHtml(p.githubLink)}" target="_blank"><i class="bi bi-github"></i> GitHub</a>` : ''}
            <a class="project-link secondary" href="../publications/index.html"><i class="bi bi-journal-text"></i> Thesis & Publication</a>
          </div>
        </div>
      </div>
    </div>`;
  }

  function thesisCardHtml(p) {
    return `
    <div class="thesis-card filterable" data-year="${escapeHtml(p.year || '')}" data-type="research">
      <div class="thesis-label"><i class="bi bi-mortarboard-fill me-1"></i>Final Year Thesis &middot; ${escapeHtml(p.year || '')}</div>
      <div class="thesis-title">${escapeHtml(p.title || '')}</div>
      <p class="thesis-desc">${escapeHtml(p.description || '')}</p>
      <div class="mb-3">${techChips(p.tech, 'thesis-chip')}</div>
      <div class="d-flex gap-2 flex-wrap">
        ${p.githubLink ? `<a class="thesis-link" href="${escapeHtml(p.githubLink)}" target="_blank"><i class="bi bi-github"></i> GitHub</a>` : ''}
        <a class="thesis-link" href="../publications/index.html"><i class="bi bi-journal-text"></i> Related Paper</a>
      </div>
    </div>`;
  }

  function projectCardHtml(p, badgeClass, badgeLabel, iconClass) {
    const desc = p.description || '';
    const isLong = desc.length > 110;
    return `
    <div class="col-md-6 col-lg-4 filterable" data-year="${escapeHtml(p.year || '')}" data-type="${escapeHtml(p.category || '')}">
      <div class="project-card">
        <div class="project-img${badgeClass === 'dev-badge' ? ' proj-bg' : ''}">
          <i class="bi ${iconClass}"></i>
          <span class="project-year-badge">${escapeHtml(p.year || '')}</span>
          <span class="project-type-badge ${badgeClass}">${badgeLabel}</span>
        </div>
        <div class="project-body">
          <div class="project-title">${escapeHtml(p.title || '')}</div>
          <div class="project-desc${isLong ? ' collapsed' : ''}">${escapeHtml(desc)}</div>
          ${isLong ? `<button type="button" class="btn-learn-more" onclick="toggleProjectDesc(this)">Learn More <i class="bi bi-chevron-down ms-1"></i></button>` : ''}
          <div class="tech-chips">${techChips(p.tech, 'tech-chip')}</div>
          <div class="project-links">
            ${p.githubLink ? `<a class="project-link" href="${escapeHtml(p.githubLink)}" target="_blank"><i class="bi bi-github"></i> GitHub</a>` : ''}
            ${p.paperLink ? `<a class="project-link secondary" href="${escapeHtml(p.paperLink)}" target="_blank"><i class="bi bi-journal-text"></i> Paper</a>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderProjectsContainer() {
    const el = document.getElementById('projectsContainer');
    if (!projects.length) {
      el.innerHTML = '<p class="text-center text-muted py-5">No projects added yet.</p>';
      return;
    }

    const researchGridItems = research.filter((p) => p.category === 'research' && !p.featured);

    let html = '';
    html += `
      <div class="section-divider" id="research-section">
        <h2><i class="bi bi-journal-code section-icon"></i>Research Projects</h2>
        <p>Deep learning systems for medical imaging, remote sensing, and signal processing</p>
        <hr class="section-line gold-line">
      </div>`;

    featured.forEach((p) => (html += featuredCardHtml(p)));
    thesis.forEach((p) => (html += thesisCardHtml(p)));

    if (researchGridItems.length) {
      html += `<div class="row g-4">${researchGridItems
        .map((p) => projectCardHtml(p, '', 'Research', 'bi-cpu'))
        .join('')}</div>`;
    }

    if (dev.length) {
      html += `
        <div class="section-divider mt-4" id="dev-section">
          <h2><i class="bi bi-code-square section-icon"></i>Project Experience</h2>
          <p>Full-stack web applications built with Django, Bootstrap, and modern tooling</p>
          <hr class="section-line">
        </div>
        <div class="row g-4">${dev.map((p) => projectCardHtml(p, 'dev-badge', 'Development', 'bi-window-stack')).join('')}</div>`;
    }

    el.innerHTML = html;
  }

  function renderFooter(settings) {
    const p = settings.profile || {};
    document.getElementById('footerYear').textContent = new Date().getFullYear();
    if (p.name) document.getElementById('footerName').textContent = p.name;
    if (p.title) document.getElementById('footerTitle').textContent = p.title;
    if (p.email) {
      const el = document.getElementById('footerEmail');
      el.textContent = p.email;
      el.href = 'mailto:' + p.email;
    }
  }
})();
