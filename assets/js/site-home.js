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
  const spotlights   = d.spotlights || [];

  // ── 2. Render every section ────────────────────────────────────────────
  // Each render call is wrapped so one failure doesn't block the others.
  safeRender('Hero',              () => renderHero(settings, spotlights));
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
      { cond: !data.education || !data.education.length, elId: 'educationTimeline', name: 'education', retry: 'retryAll' },
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

  function renderHero(settings, spotlights) {
    const p = settings.profile || {};
    const socials = p.socials || {};
    const stats = p.stats || {};

    const brand = document.getElementById('navBrand');
    if (brand && p.name) brand.textContent = p.name;

    const cvUrl = settings.cvDownloadUrl || (typeof API_BASE !== 'undefined' ? API_BASE + '/cv/download' : 'cv/index.html');
    window.__cvDownloadUrl = cvUrl;

    const items = (spotlights && spotlights.length > 0) ? spotlights : [
      {
        badge: 'Top Publication',
        badgeType: 'badge-pub',
        title: 'Cervical Cancer Cell Classification',
        description: 'Deep Transfer Learning with Attention-guided ResNet & DenseNet models on Pap smear datasets.',
        tag: 'Journal Paper',
        linkUrl: 'publications/index.html',
        linkLabel: 'View Paper'
      },
      {
        badge: 'Latest AI Project',
        badgeType: 'badge-proj',
        title: 'Oral Cancer Detection & Grading',
        description: 'Histopathological image analysis powered by Vision Transformers and Grad-CAM explainability.',
        tag: 'Medical Image AI',
        linkUrl: 'projects/index.html',
        linkLabel: 'Explore'
      },
      {
        badge: 'Research Vision',
        badgeType: 'badge-xai',
        title: 'Explainable & Trustworthy AI',
        description: 'Building interpretable diagnostic models that clinical pathologists and healthcare specialists can trust.',
        tag: 'XAI & Healthcare',
        linkUrl: '#research',
        linkLabel: 'Interests'
      }
    ];

    const dotsHtml = items.map((_, i) => `<span class="s-dot ${i === 0 ? 'active' : ''}" onclick="switchSpotlight(${i})"></span>`).join('');
    const cardsHtml = items.map((item, i) => `
      <div class="spotlight-card ${i === 0 ? 'active' : ''}" data-slide="${i}">
        <div class="spotlight-top-row">
          <div class="spotlight-badge ${escapeHtml(item.badgeType || 'badge-pub')}">
            <i class="bi bi-stars"></i> ${escapeHtml(item.badge || 'Spotlight Highlight')}
          </div>
          ${item.tag ? `<span class="spotlight-tag"><i class="bi bi-hash"></i>${escapeHtml(item.tag)}</span>` : ''}
        </div>
        
        <div class="spotlight-body">
          ${item.image ? `<img src="${escapeHtml(item.image)}" class="spotlight-thumb" alt="${escapeHtml(item.title || '')}" onerror="this.style.display='none'"/>` : ''}
          <div class="spotlight-content">
            <h4 class="spotlight-title" title="${escapeHtml(item.title || '')}">${escapeHtml(item.title || 'Featured Highlight')}</h4>
            <p class="spotlight-desc">${escapeHtml(item.description || 'Explore the research breakthroughs, methodologies, and open-source models.')}</p>
          </div>
        </div>

        <div class="spotlight-footer">
          <span style="font-size:0.68rem;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:4px;">
            <i class="bi bi-lightning-charge-fill" style="font-size:0.7rem;color:rgba(120,169,255,0.7);"></i>
            <span>${i + 1} / ${items.length}</span>
          </span>
          ${item.linkUrl ? `<a href="${escapeHtml(item.linkUrl)}" class="spotlight-link">${escapeHtml(item.linkLabel || 'Explore')} <i class="bi bi-arrow-right"></i></a>` : ''}
        </div>
      </div>
    `).join('');

    document.getElementById('heroContainer').innerHTML = `
      <div class="col-12 col-md-auto text-center text-md-start">
        <div class="hero-avatar-wrap">
          <img src="${p.avatar || getInitialsPlaceholder(p.name)}" class="hero-avatar" alt="${escapeHtml(p.name || '')}"
               onerror="this.onerror=null;this.src='${getInitialsPlaceholder(p.name)}'"/>
          <div class="hero-status-pill">
            <span class="status-pulse-dot"></span> ${escapeHtml(p.heroStatusText || 'Open to research')}
          </div>
        </div>
      </div>
      <div class="col-12 col-lg ps-lg-4">
        <p class="hero-title">${escapeHtml(p.title || 'Graduate Researcher – Computer Vision & AI')}</p>
        <h1 class="hero-name">${escapeHtml(p.name || '')}</h1>
        
        <div class="hero-contact mt-2 mb-3">
          ${p.location ? `<span><i class="bi bi-geo-alt-fill"></i>${escapeHtml(p.location.includes('Rajshahi') ? p.location : 'Rajshahi, Bangladesh')}</span>` : ''}
          ${p.email ? `<a href="mailto:${escapeHtml(p.email)}"><i class="bi bi-envelope-fill"></i>${escapeHtml(p.email)}</a>` : ''}
          ${p.phone ? `<a href="tel:${escapeHtml(p.phone.replace(/[^+\d]/g, ''))}"><i class="bi bi-telephone-fill"></i>${escapeHtml(p.phone)}</a>` : ''}
        </div>

        <div class="hero-socials d-flex flex-wrap gap-2 mb-3">
          ${socials.github ? `<a class="btn btn-sm" href="${escapeHtml(socials.github)}" target="_blank"><i class="bi bi-github me-1"></i>GitHub</a>` : ''}
          ${socials.linkedin ? `<a class="btn btn-sm" href="${escapeHtml(socials.linkedin)}" target="_blank"><i class="bi bi-linkedin me-1"></i>LinkedIn</a>` : ''}
          ${socials.researchgate ? `<a class="btn btn-sm" href="${escapeHtml(socials.researchgate)}" target="_blank"><i class="bi bi-journal-text me-1"></i>ResearchGate</a>` : ''}
          ${socials.scholar ? `<a class="btn btn-sm" href="${escapeHtml(socials.scholar)}" target="_blank"><i class="bi bi-mortarboard me-1"></i>Google Scholar</a>` : ''}
          ${socials.orcid ? `<a class="btn btn-sm" href="${escapeHtml(socials.orcid)}" target="_blank"><i class="bi bi-person-badge me-1"></i>ORCID</a>` : ''}
        </div>

        <div class="hero-stats">
          <div class="hero-stat"><div class="hero-stat-num">${stats.publications ?? 3}</div><div class="hero-stat-label">Publications</div></div>
          <div class="hero-stat"><div class="hero-stat-num">${stats.projects ?? 7}</div><div class="hero-stat-label">Projects</div></div>
          <div class="hero-stat"><div class="hero-stat-num">${stats.awards ?? 2}</div><div class="hero-stat-label">Awards</div></div>
          <div class="hero-stat"><div class="hero-stat-num">${stats.certifications ?? 2}</div><div class="hero-stat-label">Certifications</div></div>
        </div>
      </div>

      <div class="col-12 col-lg-4 ms-auto d-none d-lg-block">
        <div class="hero-spotlight-box">
          <div class="spotlight-header">
            <span class="spotlight-kicker"><i class="bi bi-stars text-primary me-1"></i> SPOTLIGHT HIGHLIGHTS</span>
            <div class="spotlight-indicators" id="spotlightDots">
              ${dotsHtml}
            </div>
          </div>
          
          <div class="spotlight-carousel" id="spotlightCarousel">
            ${cardsHtml}
          </div>
        </div>
      </div>`;

    if (window.initSpotlightCarousel) {
      window.initSpotlightCarousel(items.length);
    }

    // Fix broken hero avatar
    addImageFallbacks(document.getElementById('heroContainer'), getInitialsPlaceholder(p.name));
  }

  function renderObjective(settings) {
    const p = settings.profile || {};
    const about = settings.about || {};

    const kickerEl = document.getElementById('aboutKicker');
    if (kickerEl) kickerEl.textContent = about.kicker || 'ABOUT ME';

    const headlineEl = document.getElementById('aboutHeadline');
    if (headlineEl) headlineEl.textContent = about.headline || 'AI research with a practical mindset.';

    // Dynamic Meta Pills
    const metaRow = document.getElementById('aboutMetaRow');
    if (metaRow) {
      const locText = p.location && p.location.includes('Rajshahi') ? p.location : (p.location || 'Rajshahi, Bangladesh');
      const statusText = about.statusText || 'Open to research opportunities';
      
      let pillsHtml = `
        <span class="badge rounded-pill text-bg-light border px-3 py-2 text-dark" style="font-size:0.83rem;font-weight:500;">
          <i class="bi bi-geo-alt-fill text-primary me-1"></i> <span>${escapeHtml(locText)}</span>
        </span>
      `;

      if (about.pills && about.pills.length > 0) {
        pillsHtml += about.pills.map(pill => {
          const icon = pill.icon || 'bi-cpu';
          const colorClass = pill.colorType ? `text-${pill.colorType}` : 'text-primary';
          return `
            <span class="badge rounded-pill text-bg-light border px-3 py-2 text-dark" style="font-size:0.83rem;font-weight:500;">
              <i class="bi ${escapeHtml(icon)} ${escapeHtml(colorClass)} me-1"></i> <span>${escapeHtml(pill.label || '')}</span>
            </span>
          `;
        }).join('');
      } else {
        // Fallback default pills if none added yet
        pillsHtml += `
          <span class="badge rounded-pill text-bg-light border px-3 py-2 text-dark" style="font-size:0.83rem;font-weight:500;">
            <i class="bi bi-cpu text-primary me-1"></i> <span>AI &amp; Computer Vision</span>
          </span>
          <span class="badge rounded-pill text-bg-light border px-3 py-2 text-dark" style="font-size:0.83rem;font-weight:500;">
            <i class="bi bi-heart-pulse-fill text-danger me-1"></i> <span>Medical Image Analysis</span>
          </span>
        `;
      }

      pillsHtml += `
        <span class="badge rounded-pill text-bg-light border px-3 py-2 text-dark" style="font-size:0.83rem;font-weight:500;">
          <span class="status-pulse-dot me-1"></span> <span>${escapeHtml(statusText)}</span>
        </span>
      `;

      metaRow.innerHTML = pillsHtml;
    }

    const el = document.getElementById('objectiveText');
    if (el) {
      const narrative = (about.text && about.text.trim().length > 0) ? about.text.trim() : '';
      if (narrative.length > 0) {
        // If user entered custom text (supports multiple paragraphs separated by blank lines or direct HTML)
        const paragraphs = narrative.includes('<p>')
          ? narrative
          : narrative
              .split(/\n\s*\n/)
              .map(par => `<p>${par.trim().replace(/\n/g, '<br/>')}</p>`)
              .join('');
        el.innerHTML = paragraphs;
      } else {
        // Default 3-paragraph executive narrative if about_text is empty
        el.innerHTML = `
          <p>I'm a <strong>Computer Science &amp; Engineering graduate</strong> with a strong academic record and a research focus on Artificial Intelligence, Deep Learning, Computer Vision, and Medical Image Analysis.</p>
          <p>My work explores how modern deep learning models can solve challenging visual problems while remaining <strong>interpretable, reliable, and useful in real-world settings</strong>.</p>
          <p>I'm particularly interested in <strong>Explainable AI, multimodal learning, trustworthy AI, and resource-constrained healthcare systems</strong>, with the goal of pursuing advanced research and graduate study.</p>
        `;
      }
    }
  }

  function renderResearchInterests(settings) {
    const list = settings.researchInterests || [];
    const el = document.getElementById('researchInterestsList');
    el.innerHTML = list
      .map(
        (ri) => `
      <div class="col-lg-4 col-md-6 mb-3">
        <div class="cert">
          <div class="cert-inner">
            <div class="cert-face cert-front">
              <div class="badge" style="font-size: 1.8rem;"><i class="bi ${escapeHtml(ri.icon || 'bi-star')}"></i></div>
              <h3>${escapeHtml(ri.topic || '')}</h3>
              <div class="hint">Hover to learn more</div>
            </div>
            <div class="cert-face cert-back" style="padding:20px; text-align:center; display:flex; flex-direction:column; justify-content:center;">
              <h4 style="color:var(--gold-soft); font-family:'DM Sans', sans-serif; font-size:1.1rem; margin-bottom:10px;">${escapeHtml(ri.topic || '')}</h4>
              <div style="font-size:0.85rem; line-height:1.4; opacity:0.9; font-weight:400;">${escapeHtml(ri.desc || '')}</div>
            </div>
          </div>
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
    const el = document.getElementById('educationTimeline');
    if (!el) return;

    if (!education.length) {
      el.innerHTML = '<p class="text-muted">No education records found.</p>';
      return;
    }

    function getStageLabel(e) {
      const deg = (e.degree || '').toLowerCase();
      if (deg.includes('b.sc') || deg.includes('bsc') || deg.includes('bachelor') || deg.includes('undergrad')) return 'Undergraduate';
      if (deg.includes('hsc') || deg.includes('higher secondary')) return 'Higher Secondary';
      if (deg.includes('ssc') || deg.includes('secondary school')) return 'Secondary';
      if (deg.includes('jsc') || deg.includes('junior')) return 'Junior Secondary';
      if (deg.includes('psc') || deg.includes('primary')) return 'Primary';
      return e.year ? `Class of ${e.year}` : 'Academic Stage';
    }

    function getDegreeTitle(e) {
      const deg = e.degree || '';
      const major = e.major && e.major !== '-' ? e.major : '';
      if (deg.toLowerCase().includes('b.sc') || deg.toLowerCase().includes('bsc')) {
        return major ? `B.Sc. in ${major}` : deg;
      }
      if (deg.toUpperCase() === 'HSC') {
        return 'Higher Secondary Certificate (HSC)';
      }
      if (deg.toUpperCase() === 'SSC') {
        return 'Secondary School Certificate (SSC)';
      }
      if (deg.toUpperCase() === 'JSC') {
        return 'Junior School Certificate (JSC)';
      }
      if (deg.toUpperCase() === 'PSC') {
        return 'Primary School Certificate (PSC)';
      }
      return major ? `${deg} – ${major}` : deg;
    }

    function getInstitutionName(e) {
      const inst = e.institution || '';
      if (inst.toLowerCase().includes('north bengal') && !inst.includes('NBIU')) {
        return 'North Bengal International University (NBIU)';
      }
      if (inst.toLowerCase() === 'mymensingh') {
        return 'Notre Dame College, Mymensingh';
      }
      if (inst.toLowerCase() === 'rajshahi') {
        return 'Hat Gangopara, Bagmara, Rajshahi';
      }
      return inst;
    }

    function getMajorLabel(e) {
      const raw = (e.major || '').trim();
      if (!raw || /^[-–—\s/n/a]+$/i.test(raw) || raw.toLowerCase() === 'null') return '';
      return raw;
    }

    function formatGpa(g) {
      if (!g) return '';
      let clean = g.replace(/^(c?gpa\s*:?\s*)/i, '').trim();
      if (clean.includes('/')) {
        const parts = clean.split('/');
        return `${parts[0].trim()} / ${parts[1].trim()}`;
      }
      return clean;
    }

    function getGradeChip(e) {
      const grade = (e.grade || '').trim();
      const major = getMajorLabel(e);
      const deg = (e.degree || '').toLowerCase();

      let gpaStr = '';
      if (grade) {
        const formatted = formatGpa(grade);
        if (deg.includes('b.sc') || deg.includes('bsc') || deg.includes('bachelor') || deg.includes('undergrad')) {
          gpaStr = `CGPA ${formatted}`;
        } else {
          gpaStr = `GPA ${formatted}`;
        }
      }

      if (deg.includes('b.sc') || deg.includes('bsc') || deg.includes('bachelor') || deg.includes('undergrad')) {
        return gpaStr ? `${gpaStr} · 1st in Department` : '1st in Department';
      }

      const extra = major ? (major.toLowerCase().includes('group') ? major : `${major} Group`) : '';
      if (gpaStr && extra) {
        return `${gpaStr} · ${extra}`;
      }
      return gpaStr || extra || '';
    }

    el.innerHTML = education
      .map(
        (e) => `
      <div class="academic-timeline-item">
        <div class="d-flex align-items-baseline justify-content-between flex-wrap gap-2 mb-1">
          <h4 class="ti-degree mb-0">${escapeHtml(getDegreeTitle(e))}</h4>
          ${getGradeChip(e) ? `<span class="ti-grade-chip">${escapeHtml(getGradeChip(e))}</span>` : ''}
        </div>
        <div class="ti-meta d-flex align-items-center gap-2 flex-wrap">
          <span class="ti-stage-badge">${escapeHtml(getStageLabel(e))}</span>
          <span class="ti-dot">&bull;</span>
          <span class="ti-institution">${escapeHtml(getInstitutionName(e))}</span>
          ${e.year ? `<span class="ti-dot">&bull;</span><span class="ti-year">${escapeHtml(e.year)}</span>` : ''}
        </div>
      </div>`
      )
      .join('');
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
    const ownerName = (document.title.split(' –')[0] || '').trim();
    el.innerHTML = preview
      .map(
        (pub, idx) => `
      <div class="pub-card">
        <div class="pub-top d-flex align-items-center gap-2 mb-2">
          <span class="pub-number">[${idx + 1}]</span>
          <div class="pub-badges d-flex gap-2">
            <span class="badge-type badge-${escapeHtml(pub.type || 'conference')}">${escapeHtml(pub.type || 'Conference')}</span>
            <span class="badge-status status-published">${escapeHtml(pub.status || 'Published')}</span>
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
          <div class="abstract-body">${escapeHtml(pub.abstract)}</div>
        </div>`
            : ''
        }
        <div class="pub-links">
          ${pub.pdfLink ? `<a class="pub-link" href="${escapeHtml(pub.pdfLink)}" target="_blank"><i class="bi bi-file-earmark-pdf"></i> PDF</a>` : ''}
          ${pub.doiLink ? `<a class="pub-link btn-outline" href="${escapeHtml(pub.doiLink)}" target="_blank"><i class="bi bi-box-arrow-up-right"></i> DOI / IEEE</a>` : ''}
        </div>
      </div>`
      )
      .join('') || '<p class="text-muted">No publications yet.</p>';
  }

  function projectCardHtml(p) {
    const desc = p.description || '';
    const isLong = desc.length > 110;
    return `
      <div class="col-md-6 col-lg-4">
        <div class="project-card">
          <div class="project-img"><i class="bi bi-cpu"></i></div>
          <div class="project-body">
            <div class="project-title">${escapeHtml(p.title || '')}</div>
            <div class="project-desc${isLong ? ' collapsed' : ''}">${escapeHtml(desc)}</div>
            ${isLong ? `<button type="button" class="btn-learn-more" onclick="toggleProjectDesc(this)">Learn More <i class="bi bi-chevron-down ms-1"></i></button>` : ''}
            <div class="mb-2">${(p.tech || []).map((t) => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('')}</div>
            <div class="project-links">
              ${p.githubLink ? `<a href="${escapeHtml(p.githubLink)}" target="_blank"><i class="bi bi-github me-1"></i>GitHub</a>` : ''}
              ${p.paperLink ? `<a href="${escapeHtml(p.paperLink)}" target="_blank"><i class="bi bi-box-arrow-up-right me-1"></i>Live Project</a>` : ''}
            </div>
            <small class="text-muted mt-2 d-block">${escapeHtml(p.year || '')}</small>
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
        ${info.fatherName ? `<div class="info-row"><span class="info-label"><i class="bi bi-person me-2"></i>Father's Name</span><span class="info-value">${escapeHtml(info.fatherName)}</span></div>` : ''}
        ${info.motherName ? `<div class="info-row"><span class="info-label"><i class="bi bi-person-heart me-2"></i>Mother's Name</span><span class="info-value">${escapeHtml(info.motherName)}</span></div>` : ''}
        ${info.dob ? `<div class="info-row"><span class="info-label"><i class="bi bi-calendar-event me-2"></i>Date of Birth</span><span class="info-value">${escapeHtml(info.dob)}</span></div>` : ''}
        ${info.religion ? `<div class="info-row"><span class="info-label"><i class="bi bi-moon-stars me-2"></i>Religion</span><span class="info-value">${escapeHtml(info.religion)}</span></div>` : ''}
        ${info.nid ? `<div class="info-row"><span class="info-label"><i class="bi bi-person-vcard me-2"></i>NID</span><span class="info-value">${escapeHtml(info.nid)}</span></div>` : ''}`;
    }
    if (rightEl) {
      const socials = p.socials || {};
      rightEl.innerHTML = `
        ${info.maritalStatus ? `<div class="info-row"><span class="info-label"><i class="bi bi-heart me-2"></i>Marital Status</span><span class="info-value">${escapeHtml(info.maritalStatus)}</span></div>` : ''}
        ${info.bloodGroup ? `<div class="info-row"><span class="info-label"><i class="bi bi-droplet-half me-2"></i>Blood Group</span><span class="info-value">${escapeHtml(info.bloodGroup)}</span></div>` : ''}
        ${info.nationality ? `<div class="info-row"><span class="info-label"><i class="bi bi-flag me-2"></i>Nationality</span><span class="info-value">${escapeHtml(info.nationality)}</span></div>` : ''}
        ${info.address ? `<div class="info-row"><span class="info-label"><i class="bi bi-house-door me-2"></i>Address</span><span class="info-value">${escapeHtml(info.address)}</span></div>` : ''}
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
