(async function () {
  'use strict';
  const result = await getPortfolio(true);
  const d = result.data || {};
  const settings = d.settings || {};
  const courses = d.courses || [];
  const t = settings.teaching || {};
  const p = settings.profile || {};

  const roleIcons = ['bi-award', 'bi-people', 'bi-mortarboard', 'bi-book', 'bi-star', 'bi-lightbulb'];
  const areaIcons = ['bi-eye', 'bi-diagram-3', 'bi-heart-pulse', 'bi-lightbulb', 'bi-globe', 'bi-code-slash'];

  const rolesHtml = (t.roles || [])
    .map(
      (r, i) => `
      <div class="col-md-6">
        <div class="role-card h-100">
          <div class="role-icon"><i class="bi ${roleIcons[i % roleIcons.length]}"></i></div>
          <div class="role-title">${escapeHtml(r.title || '')}</div>
          <div class="role-desc">${escapeHtml(r.desc || '')}</div>
        </div>
      </div>`
    )
    .join('');

  const coursesHtml =
    courses
      .map(
        (c) => `
    <div class="course-card">
      <div class="course-header">
        <div class="course-title">${escapeHtml(c.name || '')}</div>
      </div>
      <div class="course-meta">
        <span><i class="bi bi-building"></i>${escapeHtml(c.institution || '')}</span>
        <span><i class="bi bi-calendar3"></i>${escapeHtml(c.period || '')}</span>
        <span><i class="bi bi-person-badge"></i>${escapeHtml(c.role || '')}</span>
      </div>
    </div>`
      )
      .join('') || '<p class="text-muted">No courses added yet.</p>';

  const half = Math.ceil((t.areas || []).length / 2);
  const areasCol = (items, offset) =>
    items
      .map(
        (a, i) => `
    <div class="teaching-skill"><i class="bi ${areaIcons[(i + offset) % areaIcons.length]}"></i><div class="teaching-skill-text"><strong>${escapeHtml(
          a.topic || ''
        )}</strong> — ${escapeHtml(a.desc || '')}</div></div>`
      )
      .join('');

  const areas = t.areas || [];
  const areasHtml = `
    <div class="row g-3 mb-5">
      <div class="col-md-6">
        <div style="background:var(--section-bg);border:1px solid var(--border);border-radius:10px;padding:1.2rem 1.4rem;">
          ${areasCol(areas.slice(0, half), 0)}
        </div>
      </div>
      <div class="col-md-6">
        <div style="background:var(--section-bg);border:1px solid var(--border);border-radius:10px;padding:1.2rem 1.4rem;">
          ${areasCol(areas.slice(half), half)}
        </div>
      </div>
    </div>`;

  document.getElementById('teachingContent').innerHTML = `
    <div class="philosophy-card">
      <h4><i class="bi bi-lightbulb me-2"></i>Teaching Philosophy</h4>
      ${formatRichText(t.philosophy || '')}
    </div>

    <div class="section-title">Teaching Roles</div>
    <div class="row g-3 mb-5">${rolesHtml || '<p class="text-muted">No roles added yet.</p>'}</div>

    <div class="section-title">Courses &amp; Workshops Contributed To</div>
    ${coursesHtml}

    <div class="section-title mt-5">Areas I Can Teach</div>
    ${areasHtml}

    <div class="mentor-note">
      <i class="bi bi-chat-heart"></i>
      <h5>Open to Mentoring &amp; Collaboration</h5>
      <div>${formatRichText(t.mentoringText || '')} ${
    p.email ? `Feel free to reach out at <a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>` : ''
  }</div>
    </div>`;

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
})();
