// ─── Homepage renderer ───────────────────────────────────────────────────
// Uses the combined /api/portfolio endpoint (via api.js getPortfolio) for a
// single round-trip, with stale-while-revalidate caching. Each section has
// an individual retry mechanism so one failed section doesn't blank out the
// rest of the page.
(async function () {
  'use strict';

  // ── 1. Load portfolio data ─────────────────────────────────────────────
  const result = await getPortfolio();
  const d = result.data;
  const loadError = result.error;

  // Extract sub-objects (safe even if d is sparse)
  const settings     = d.settings || {};
  const education    = d.education || [];
  const experience   = d.experience || [];
  const publications = d.publications || [];
  const projects     = d.projects || [];
  const certifications = d.certifications || [];
  const awards       = d.awards || [];
  const activities   = d.activities || [];
  const gallery      = d.gallery || [];
  const references   = d.references || [];

  // ── 2. Render every section ────────────────────────────────────────────
  // Each render call is wrapped so one failure doesn't block the others.
  safeRender('Hero',              () => renderHero(settings));
  safeRender('Objective',         () => renderObjective(settings));
  safeRender('Research Interests',() => renderResearchInterests(settings));
  safeRender('Experience',        () => renderExperience(experience));
  safeRender('Education',         () => renderEducation(education));
  safeRender('Publications',      () => renderPublications(publications));
  safeRender('Projects',          () => renderProjects(projects));
  safeRender('Certifications',    () => renderCertifications(certifications));
  safeRender('Skills',            () => renderSkills(settings));
  safeRender('Awards',            () => renderAwardsAndActivities(awards, activities));
  safeRender('Gallery',           () => renderGallery(gallery));
  safeRender('Contact Info',     () => renderContactInfo(settings));
  safeRender('References',        () => renderReferences(references));
  safeRender('Footer',            () => renderFooter(settings));

  // If the initial load had an error and returned empty data, show
  // error states in sections that got no content:
  if (loadError) {
    showSectionErrors(d);
  }

  // ── Helper: safe render wrapper ────────────────────────────────────────
  function safeRender(label, fn) {
    try { fn(); } catch (e) { console.error(`Error rendering ${label}:`, e); }
  }

  // ── Show error states for empty sections when load failed ──────────────
  function showSectionErrors(data) {
    const checks = [
      { cond: !data.settings || !data.settings.profile, elId: 'heroContainer', name: 'profile', retry: 'retryAll' },
      { cond: !data.settings || !data.settings.profile, elId: 'objectiveText', name: 'career summary', retry: 'retryAll' },
      { cond: !data.education || !data.education.length, elId: 'educationTableBody', name: 'education', retry: 'retryAll', isTable: true },
      { cond: !data.experience || !data.experience.length, elId: 'experienceTimeline', name: 'work experience', retry: 'retryAll' },
      { cond: !data.publications || !data.publications.length, elId: 'pubList', name: 'publications', retry: 'retryAll' },
      { cond: !data.certifications || !data.certifications.length, elId: 'certificationsList', name: 'certifications', retry: 'retryAll' },
      { cond: !data.awards || !data.awards.length, elId: 'awardsList', name: 'awards', retry: 'retryAll' },
      { cond: !data.gallery || !data.gallery.length, elId: 'galleryGrid', name: 'gallery', retry: 'retryAll' },
      { cond: !data.references || !data.references.length, elId: 'referencesList', name: 'references', retry: 'retryAll' },
    ];
    checks.forEach(c => {
      if (c.cond) {
        const el = document.getElementById(c.elId);
        if (el) {
          if (c.isTable) {
            el.innerHTML = `<tr><td colspan="5">${errorStateHtml(c.name, c.retry)}</td></tr>`;
          } else {
            el.innerHTML = errorStateHtml(c.name, c.retry);
          }
        }
      }
    });
  }

  // Global retry function — clear cache and reload
  window.retryAll = function() {
    try { sessionStorage.removeItem('portfolio_cache'); } catch(e) {}
    window.location.reload();
  };

  // ── RENDER FUNCTIONS ───────────────────────────────────────────────────

  function renderHero(settings) {
    const p = settings.profile || {};
    const socials = p.socials || {};
    const stats = p.stats || {};
    document.title = `${p.name || 'Portfolio'} – Academic Portfolio`;
    const brand = document.getElementById('navBrand');
    if (brand && p.name) brand.textContent = p.name;

    const cvUrl = settings.cvDownloadUrl || 'cv/index.html';

    document.getElementById('heroContainer').innerHTML = `
      <div class="col-12 col-md-4 text-center text-md-end pe-md-4">
        <img src="${p.avatar || getInitialsPlaceholder(p.name)}" class="hero-avatar" alt="${escapeHtml(p.name || '')}"
             onerror="this.onerror=null;this.src='${getInitialsPlaceholder(p.name)}'"/>
      </div>
      <div class="col-12 col-md-8 text-center text-md-start ps-md-4">
        <p class="hero-title">${escapeHtml(p.title || '')}</p>
        <h1 class="hero-name">${escapeHtml(p.name || '')}</h1>
        <div class="hero-contact mt-3 mb-3">
          ${p.email ? `<a href="mailto:${escapeHtml(p.email)}"><i class="bi bi-envelope-fill"></i>${escapeHtml(p.email)}</a>` : ''}
          ${p.phone ? `<a href="tel:${escapeHtml(p.phone.replace(/[^+\d]/g, ''))}"><i class="bi bi-telephone-fill"></i>${escapeHtml(p.phone)}</a>` : ''}
          ${p.location ? `<a href="#"><i class="bi bi-geo-alt-fill"></i>${escapeHtml(p.location)}</a>` : ''}
        </div>

        <div class="hero-socials d-flex flex-wrap gap-2 mb-3">
          ${socials.github ? `<a class="btn btn-sm" href="${escapeHtml(socials.github)}" target="_blank"><i class="bi bi-github me-1"></i>GitHub</a>` : ''}
          ${socials.linkedin ? `<a class="btn btn-sm" href="${escapeHtml(socials.linkedin)}" target="_blank"><i class="bi bi-linkedin me-1"></i>LinkedIn</a>` : ''}
          ${socials.researchgate ? `<a class="btn btn-sm" href="${escapeHtml(socials.researchgate)}" target="_blank"><i class="bi bi-journal-text me-1"></i>ResearchGate</a>` : ''}
          ${socials.scholar ? `<a class="btn btn-sm" href="${escapeHtml(socials.scholar)}" target="_blank"><i class="bi bi-mortarboard me-1"></i>Google Scholar</a>` : ''}
          ${socials.orcid ? `<a class="btn btn-sm" href="${escapeHtml(socials.orcid)}" target="_blank"><i class="bi bi-person-badge me-1"></i>ORCID</a>` : ''}
        </div>
        <div class="d-flex flex-wrap gap-3 mb-3 mt-3">
          <a class="hero-cta" href="publications/index.html"><i class="bi bi-journal-text"></i> View Publications</a>
          <a class="hero-cta-secondary" href="cv/index.html"><i class="bi bi-file-earmark-person"></i> Download CV</a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="hero-stat-num">${stats.publications ?? 0}</div><div class="hero-stat-label">Publications</div></div>
          <div class="hero-stat"><div class="hero-stat-num">${stats.projects ?? 0}</div><div class="hero-stat-label">Projects</div></div>
          <div class="hero-stat"><div class="hero-stat-num">${stats.awards ?? 0}</div><div class="hero-stat-label">Awards</div></div>
          <div class="hero-stat"><div class="hero-stat-num">${stats.certifications ?? 0}</div><div class="hero-stat-label">Certifications</div></div>
        </div>
      </div>`;

    // Fix broken hero avatar
    addImageFallbacks(document.getElementById('heroContainer'), getInitialsPlaceholder(p.name));
  }

  function renderObjective(settings) {
    const text = (settings.profile && settings.profile.objective) || '';
    if (text) {
      document.getElementById('objectiveText').textContent = text;
    }
  }

  function renderResearchInterests(settings) {
    const list = settings.researchInterests || [];
    const el = document.getElementById('researchInterestsList');
    el.innerHTML = list
      .map(
        (ri) => `
      <div class="col-6 col-md-4 col-lg-2">
        <div class="interest-card">
          <div class="interest-icon"><i class="bi ${escapeHtml(ri.icon || 'bi-star')}"></i></div>
          <div class="interest-topic">${escapeHtml(ri.topic || '')}</div>
          <div class="interest-desc">${escapeHtml(ri.desc || '')}</div>
        </div>
      </div>`
      )
      .join('') || '<div class="col-12 text-muted text-center">No research interests added yet.</div>';
  }

  function renderExperience(experience) {
    const el = document.getElementById('experienceTimeline');
    el.innerHTML = experience
      .map(
        (exp) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <h5>${escapeHtml(exp.title || '')}</h5>
          <div class="org">${escapeHtml(exp.org || '')}</div>
          <div class="period">${escapeHtml(exp.period || '')}</div>
          <ul>${(exp.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        </div>
      </div>`
      )
      .join('') || '<p class="text-muted">No experience entries yet.</p>';
  }

  function renderEducation(education) {
    const el = document.getElementById('educationTableBody');
    const thead = document.getElementById('educationThead');

    if (education.length) {
      // Show the thead now that we have data
      if (thead) thead.classList.remove('edu-thead-hidden');

      el.innerHTML = education
        .map(
          (e) => `
        <tr>
          <td><strong>${escapeHtml(e.degree || '')}</strong></td>
          <td>${escapeHtml(e.major || '')}</td>
          <td>${escapeHtml(e.institution || '')}</td>
          <td>${escapeHtml(e.year || '')}</td>
          <td><span class="grade-badge">${escapeHtml(e.grade || '')}</span></td>
        </tr>`
        )
        .join('');
    } else {
      el.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No education entries yet.</td></tr>';
    }
  }

  function pubBadgeClass(type) {
    return { conference: 'badge-conference', journal: 'badge-journal', thesis: 'badge-thesis' }[type] || 'badge-conference';
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

  function renderPublications(publications) {
    const el = document.getElementById('pubList');
    // Homepage shows only a short preview (max 3), full list lives on /publications
    const preview = publications.slice(0, 3);
    el.innerHTML = preview
      .map(
        (pub) => `
      <div class="pub-card">
        <div class="pub-thumb"><i class="bi bi-file-earmark-text"></i></div>
        <div class="flex-grow-1">
          <div class="mb-1">
            <span class="pub-type-badge ${pubBadgeClass(pub.type)}">${escapeHtml(pub.type || '')}</span>
            <span class="pub-status status-published">● ${escapeHtml(pub.status || '')}</span>
          </div>
          <div class="pub-ieee" style="margin-bottom:.5rem;">
            <span class="pub-authors">${formatAuthors(pub.authors, document.title.split(' –')[0])},</span>
            <span class="pub-title">"${escapeHtml(pub.title || '')},"</span>
            <span class="pub-venue">${escapeHtml(pub.venue || '')},</span>
            <span class="pub-year">${escapeHtml(pub.year || '--')}</span>.
          </div>
          <div class="pub-links">
            ${pub.doiLink ? `<a href="${escapeHtml(pub.doiLink)}" target="_blank"><i class="bi bi-box-arrow-up-right me-1"></i>DOI / IEEE</a>` : ''}
            ${pub.pdfLink ? `<a href="${escapeHtml(pub.pdfLink)}" target="_blank"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</a>` : ''}
          </div>
        </div>
      </div>`
      )
      .join('') || '<p class="text-muted">No publications yet.</p>';
  }

  function projectCardHtml(p) {
    return `
      <div class="col-md-6 col-lg-4">
        <div class="project-card">
          <div class="project-img"><i class="bi bi-cpu"></i></div>
          <div class="project-body">
            <div class="project-title">${escapeHtml(p.title || '')}</div>
            <div class="project-desc">${escapeHtml(p.description || '')}</div>
            <div class="mb-2">${(p.tech || []).map((t) => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('')}</div>
            <div class="project-links">
              ${p.githubLink ? `<a href="${escapeHtml(p.githubLink)}" target="_blank"><i class="bi bi-github me-1"></i>GitHub</a>` : ''}
              ${p.paperLink ? `<a href="${escapeHtml(p.paperLink)}" target="_blank"><i class="bi bi-journal-text me-1"></i>Paper</a>` : ''}
            </div>
            <small class="text-muted">${escapeHtml(p.year || '')}</small>
          </div>
        </div>
      </div>`;
  }

  function renderProjects(projects) {
    const thesis = projects.find((p) => p.category === 'thesis');
    const research = projects.filter((p) => p.category === 'research');
    const dev = projects.filter((p) => p.category === 'development');

    document.getElementById('thesisCardContainer').innerHTML = thesis
      ? `
      <div class="thesis-card">
        <div class="thesis-label"><i class="bi bi-mortarboard-fill me-1"></i>Final Year Thesis &middot; ${escapeHtml(thesis.year || '')}</div>
        <div class="thesis-title">${escapeHtml(thesis.title || '')}</div>
        <p class="thesis-desc">${escapeHtml(thesis.description || '')}</p>
        <div class="mb-3">${(thesis.tech || []).map((t) => `<span class="thesis-chip">${escapeHtml(t)}</span>`).join('')}</div>
        <div class="d-flex gap-2 flex-wrap">
          ${thesis.githubLink ? `<a class="thesis-link" href="${escapeHtml(thesis.githubLink)}" target="_blank"><i class="bi bi-github"></i> GitHub</a>` : ''}
          <a class="thesis-link" href="publications/index.html"><i class="bi bi-journal-text"></i> Related Paper</a>
        </div>
      </div>`
      : '';

    document.getElementById('researchProjectsList').innerHTML =
      research.map(projectCardHtml).join('') || '<div class="col-12 text-muted text-center">No research projects yet.</div>';
    document.getElementById('experienceProjectsList').innerHTML =
      dev.map(projectCardHtml).join('') || '<div class="col-12 text-muted text-center">No project-experience entries yet.</div>';
  }

  function renderCertifications(certifications) {
    const el = document.getElementById('certificationsList');
    el.innerHTML = certifications
      .map(
        (c) => `
      <div class="col-lg-4 col-md-6">
        <div class="cert">
          <div class="cert-inner">
            <div class="cert-face cert-front">
              <div class="badge">★</div>
              <h3>${escapeHtml(c.title || '')}</h3>
              <div class="hint">Hover to verify</div>
            </div>
            <div class="cert-face cert-back">
              <div><div class="issuer">${escapeHtml(c.issuer || '')}</div><div class="date">Issued ${escapeHtml(c.year || '')}</div></div>
              <div>
                 <div class="id">ID: ${escapeHtml(c.id || 'N/A')}</div>
                 ${c.verifyLink ? `<a class="verify" href="${escapeHtml(c.verifyLink)}" target="_blank">Verify credential &rarr;</a>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>`
      )
      .join('') || '<div class="col-12 text-muted text-center">No certifications yet.</div>';

    // Fix any broken cert images (not used in new design, but kept for logic)
    addImageFallbacks(el, getGenericPlaceholder());
  }

  function skillGroupHtml(label, icon, items) {
    if (!items || !items.length) return '';
    return `
      <div class="skill-group">
        <div class="skill-group-label"><i class="bi ${icon} me-1"></i>${label}</div>
        ${items.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
      </div>`;
  }

  function renderSkills(settings) {
    const s = settings.skills || {};
    document.getElementById('skillsGroups').innerHTML = `
      <div class="col-md-6">
        ${skillGroupHtml('Programming Languages', 'bi-code-slash', s.languages)}
        ${skillGroupHtml('Libraries & Frameworks', 'bi-layers', s.frameworks)}
      </div>
      <div class="col-md-6">
        ${skillGroupHtml('Tools & Platforms', 'bi-tools', s.tools)}
        ${skillGroupHtml('Research Methods', 'bi-search', s.researchMethods)}
      </div>`;

    const langs = settings.spokenLanguages || [];
    document.getElementById('spokenLanguagesList').innerHTML = langs
      .map(
        (l) => `
      <div class="col-4 col-md-3 col-lg-2">
        <div class="lang-card"><div class="lang-name">${escapeHtml(l.name || '')}</div><div class="lang-level">${escapeHtml(l.level || '')}</div></div>
      </div>`
      )
      .join('');
  }

  function renderAwardsAndActivities(awards, activities) {
    const awardsEl = document.getElementById('awardsList');
    awardsEl.innerHTML =
      awards
        .map(
          (a) => `
      <div class="award-item">
        <div class="award-icon"><i class="bi bi-trophy-fill"></i></div>
        ${a.image ? `<img src="${escapeHtml(a.image)}" class="award-thumb" alt="${escapeHtml(a.title || '')}" loading="lazy"
             onerror="this.onerror=null;this.src='${getGenericPlaceholder()}'"
             onclick="showImageModal(this.src,'${escapeHtml(a.title || '')}')"/>` : ''}
        <div>
          <div class="award-title">${escapeHtml(a.title || '')}</div>
          <div class="award-meta">${escapeHtml(a.org || '')} · ${escapeHtml(a.year || '')}</div>
        </div>
      </div>`
        )
        .join('') || '<p class="text-muted">No awards yet.</p>';

    // Fix broken award images
    addImageFallbacks(awardsEl, getGenericPlaceholder());

    document.getElementById('activitiesList').innerHTML = activities
      .map((a) => `<div class="activity-item"><i class="bi bi-chevron-right"></i>${escapeHtml(a.text || '')}</div>`)
      .join('');
  }

  function renderGallery(gallery) {
    galleryEvents = gallery; // used by the lightbox functions already defined inline in index.html
    const el = document.getElementById('galleryGrid');
    el.innerHTML = gallery
      .map(
        (ev, idx) => `
      <div class="gallery-item" onclick="openLightbox(${idx})">
        <img src="${escapeHtml((ev.photos && ev.photos[0] && ev.photos[0].src) || '')}" alt="${escapeHtml(ev.title || '')}" loading="lazy"
             onerror="this.onerror=null;this.src='${getGenericPlaceholder()}'"/>
        <span class="gallery-photo-badge"><i class="bi bi-images"></i> ${(ev.photos || []).length}</span>
        <div class="gallery-overlay">
          <div class="gallery-caption">${escapeHtml(ev.title || '')}</div>
          <div class="gallery-year">
            <span><i class="bi bi-calendar3 me-1"></i>${escapeHtml(ev.year || '')}</span>
            <span><i class="bi bi-images me-1"></i>${(ev.photos || []).length} photos</span>
          </div>
        </div>
      </div>`
      )
      .join('') || '<div class="text-muted text-center">No gallery events yet.</div>';

    // Fix broken gallery images
    addImageFallbacks(el, getGenericPlaceholder());
  }

  function renderContactInfo(settings) {
    const p = settings.profile || {};
    const info = settings.personalInfo || {};
    const leftEl = document.getElementById('contactInfoLeft');
    const rightEl = document.getElementById('contactInfoRight');
    if (leftEl) {
      leftEl.innerHTML = `
        ${p.email ? `<div class="info-row"><span class="info-label"><i class="bi bi-envelope me-2"></i>Email</span><span class="info-value"><a href="mailto:${escapeHtml(p.email)}" style="color:var(--gold);text-decoration:none;">${escapeHtml(p.email)}</a></span></div>` : ''}
        ${p.phone ? `<div class="info-row"><span class="info-label"><i class="bi bi-telephone me-2"></i>Phone</span><span class="info-value"><a href="tel:${escapeHtml(p.phone.replace(/[^+\d]/g, ''))}" style="color:var(--text-dark);text-decoration:none;">${escapeHtml(p.phone)}</a></span></div>` : ''}
        ${p.location ? `<div class="info-row"><span class="info-label"><i class="bi bi-geo-alt me-2"></i>Location</span><span class="info-value">${escapeHtml(p.location)}</span></div>` : ''}
        ${info.nationality ? `<div class="info-row"><span class="info-label"><i class="bi bi-flag me-2"></i>Nationality</span><span class="info-value">${escapeHtml(info.nationality)}</span></div>` : ''}`;
    }
    if (rightEl) {
      const socials = p.socials || {};
      rightEl.innerHTML = `
        ${socials.github ? `<div class="info-row"><span class="info-label"><i class="bi bi-github me-2"></i>GitHub</span><span class="info-value"><a href="${escapeHtml(socials.github)}" target="_blank" style="color:var(--gold);text-decoration:none;">rashelmahmudrabbi</a></span></div>` : ''}
        ${socials.linkedin ? `<div class="info-row"><span class="info-label"><i class="bi bi-linkedin me-2"></i>LinkedIn</span><span class="info-value"><a href="${escapeHtml(socials.linkedin)}" target="_blank" style="color:var(--gold);text-decoration:none;">rashelmahmudrabbi</a></span></div>` : ''}
        ${socials.scholar ? `<div class="info-row"><span class="info-label"><i class="bi bi-mortarboard me-2"></i>Google Scholar</span><span class="info-value"><a href="${escapeHtml(socials.scholar)}" target="_blank" style="color:var(--gold);text-decoration:none;">View Profile</a></span></div>` : ''}
        ${socials.orcid ? `<div class="info-row"><span class="info-label"><i class="bi bi-person-badge me-2"></i>ORCID</span><span class="info-value"><a href="${escapeHtml(socials.orcid)}" target="_blank" style="color:var(--gold);text-decoration:none;">0009-0004-6070-4496</a></span></div>` : ''}`;
    }
  }

  function renderReferences(references) {
    document.getElementById('referencesList').innerHTML = references
      .map(
        (r) => `
      <div class="col-md-6">
        <div class="ref-card">
          <div class="ref-name">${escapeHtml(r.name || '')}</div>
          <div class="ref-role">${escapeHtml(r.role || '')}</div>
          <div class="ref-org">${escapeHtml(r.org || '')}</div>
          ${r.note ? `<div class="ref-mini-org"><b>${escapeHtml(r.note)}</b></div>` : ''}
          <div class="ref-contact">
            ${r.phone ? `<a href="tel:${escapeHtml(r.phone.replace(/[^+\d]/g, ''))}"><i class="bi bi-telephone me-1"></i>${escapeHtml(r.phone)}</a>` : ''}
            ${r.email ? `<a href="mailto:${escapeHtml(r.email)}"><i class="bi bi-envelope me-1"></i>${escapeHtml(r.email)}</a>` : ''}
          </div>
        </div>
      </div>`
      )
      .join('') || '<div class="col-12 text-muted text-center">No references yet.</div>';
  }

  function renderFooter(settings) {
    const p = settings.profile || {};
    if (settings.footerText) document.getElementById('footerText').textContent = settings.footerText;
    document.getElementById('footerYear').textContent = new Date().getFullYear();
    if (p.name) document.getElementById('footerName').textContent = p.name;
    if (p.title) document.getElementById('footerTitle').textContent = p.title;
  }
})();
