(async function () {
  'use strict';
  const result = await getPortfolio(true);
  const d = result.data || {};
  const settings = d.settings || {};
  const education = d.education || [];
  const experience = d.experience || [];
  const publications = d.publications || [];
  const projects = d.projects || [];
  const certifications = d.certifications || [];
  const awards = d.awards || [];
  const activities = d.activities || [];
  const references = d.references || [];

  const p = settings.profile || {};
  const socials = p.socials || {};
  const skills = settings.skills || {};
  const langs = settings.spokenLanguages || [];
  const info = settings.personalInfo || {};

  document.title = `Curriculum Vitae – ${p.name || 'RASHEL MAHMUD RABBI'}`;
  const cvUpdatedEl = document.getElementById('cvLastUpdated');
  if (cvUpdatedEl) cvUpdatedEl.textContent = settings.cvLastUpdated || new Date().getFullYear();

  const downloadBtn = document.getElementById('cvDownloadBtn');
  if (downloadBtn) {
    downloadBtn.href = settings.cvDownloadUrl || (typeof getCvDownloadUrl === 'function' ? getCvDownloadUrl() : (API_BASE + '/cv/download'));
  }

  function skillGroup(label, items) {
    if (!items || !items.length) return '';
    return `<div class="skill-group"><div class="skill-group-label">${escapeHtml(label)}</div>${items
      .map((i) => `<span class="skill-tag">${escapeHtml(i)}</span>`)
      .join('')}</div>`;
  }

  const researchInterestsHtml = (settings.researchInterests || [])
    .map((ri) => skillGroup(ri.topic, (ri.desc || '').split(',').map((s) => s.trim()).filter(Boolean)))
    .join('');

  const educationRows = education
    .map(
      (e) => `
    <tr>
      <td><strong>${escapeHtml(e.degree || '')}</strong></td>
      <td>${escapeHtml(e.institution || '')}</td>
      <td>${escapeHtml(e.major || '')}</td>
      <td>${escapeHtml(e.year || '')}</td>
      <td><span class="grade-badge">${escapeHtml(e.grade || '')}</span></td>
    </tr>`
    )
    .join('');

  const experienceHtml = experience
    .map(
      (exp) => `
    <div class="cv-item">
      <div class="cv-dot"></div>
      <div class="cv-item-card">
        <div class="cv-item-title">${escapeHtml(exp.title || '')}</div>
        <div class="cv-item-org">${escapeHtml(exp.org || '')}</div>
        <div class="cv-item-meta"><span><i class="bi bi-calendar3"></i>${escapeHtml(exp.period || '')}</span></div>
        <div class="cv-item-desc"><ul>${(exp.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul></div>
      </div>
    </div>`
    )
    .join('');

  const pubBadge = { conference: 'badge-conference', journal: 'badge-journal', thesis: 'badge-journal' };
  const publicationsHtml = publications
    .slice(0, 3)
    .map(
      (pub) => `
    <div class="pub-mini">
      <div><span class="pub-mini-badge ${pubBadge[pub.type] || 'badge-conference'}">${escapeHtml(pub.type || '')}</span><span class="status-published">${escapeHtml(
        pub.status || ''
      )}</span></div>
      <div class="pub-mini-title">${escapeHtml(pub.title || '')}</div>
      <div class="pub-mini-meta">${escapeHtml(pub.authors || '')} &nbsp;·&nbsp; ${escapeHtml(pub.venue || '')}, ${escapeHtml(pub.year || '')}</div>
      ${pub.doiLink ? `<div class="mt-1"><a href="${escapeHtml(pub.doiLink)}" target="_blank" style="font-size:.78rem;color:var(--gold);text-decoration:none;font-weight:500;"><i class="bi bi-box-arrow-up-right me-1"></i>DOI / Link</a></div>` : ''}
    </div>`
    )
    .join('') || '<p class="text-muted">No publications added yet.</p>';

  const research = projects.filter((pr) => pr.category === 'research' || pr.category === 'thesis');
  const dev = projects.filter((pr) => pr.category === 'development');
  const researchProjectsHtml = research
    .map(
      (pr) => `
    <div class="cv-item-card mb-2">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:.3rem;">
        <div style="font-weight:700;color:var(--navy);">${escapeHtml(pr.title || '')}</div>
        <span style="font-size:.75rem;color:var(--gold);font-weight:600;">${escapeHtml(pr.year || '')}</span>
      </div>
      <div style="font-size:.83rem;color:var(--text-mid);margin-top:.3rem;line-height:1.6;">${formatRichText(pr.description || '')}</div>
      <div style="margin-top:.4rem;">${(pr.tech || []).map((t) => `<span class="skill-tag" style="font-size:.72rem;">${escapeHtml(t)}</span>`).join('')}</div>
    </div>`
    )
    .join('');
  const devProjectsHtml = dev
    .map(
      (pr) => `
    <div class="cv-item-card">
      <div style="font-weight:700;color:var(--navy);">${escapeHtml(pr.title || '')}</div>
      <div style="font-size:.8rem;color:var(--gold);">${(pr.tech || []).join(' · ')} &nbsp;·&nbsp; ${escapeHtml(pr.year || '')}</div>
      <div style="font-size:.82rem;color:var(--text-mid);margin-top:.3rem;">${formatRichText(pr.description || '')}</div>
    </div>`
    )
    .join('');

  const awardsHtml =
    awards
      .map(
        (a) => `
    <div class="cv-item-card mb-2">
      <div style="font-weight:600;color:var(--navy);font-size:.92rem;">${escapeHtml(a.title || '')}</div>
      <div style="font-size:.8rem;color:var(--text-mid);">${escapeHtml(a.org || '')} &nbsp;·&nbsp; ${escapeHtml(a.year || '')}</div>
    </div>`
      )
      .join('') || '<p class="text-muted">No awards yet.</p>';

  const activitiesHtml = activities.map((a) => `<li>${escapeHtml(a.text || '')}</li>`).join('');

  const certificationsHtml =
    certifications
      .map(
        (c) => `
    <div class="cv-item-card">
      <div style="font-weight:600;color:var(--navy);">${escapeHtml(c.title || '')}</div>
      <div style="font-size:.82rem;color:var(--gold);">${escapeHtml(c.issuer || '')} &nbsp;·&nbsp; ${escapeHtml(c.year || '')}</div>
      <div style="font-size:.8rem;margin-top:.4rem;display:flex;gap:.8rem;flex-wrap:wrap;">
        ${c.verifyLink ? `<a href="${escapeHtml(c.verifyLink)}" target="_blank" style="color:var(--gold);text-decoration:none;"><i class="bi bi-patch-check me-1"></i>Verify</a>` : ''}
        ${c.pdfLink ? `<a href="${escapeHtml(resolveAssetUrl(c.pdfLink, true))}" target="_blank" style="color:var(--gold);text-decoration:none;"><i class="bi bi-file-earmark-pdf me-1"></i>PDF</a>` : ''}
      </div>
    </div>`
      )
      .join('') || '<p class="text-muted">No certifications yet.</p>';

  const languagesHtml =
    langs
      .map(
        (l) => `
    <div class="cv-item-card" style="min-width:160px;">
      <div style="font-weight:700;color:var(--navy);">${escapeHtml(l.name || '')}</div>
      <div style="font-size:.8rem;color:var(--gold);font-weight:500;">${escapeHtml(l.level || '')}</div>
    </div>`
      )
      .join('') || '';

  const referencesHtml =
    references
      .map(
        (r) => `
    <div class="ref-mini">
      <div class="ref-mini-name">${escapeHtml(r.name || '')}</div>
      <div class="ref-mini-role">${escapeHtml(r.role || '')}</div>
      <div class="ref-mini-org">${escapeHtml(r.org || '')}</div>
      ${r.note ? `<div class="ref-mini-org"><b>${escapeHtml(r.note)}</b></div>` : ''}
      ${r.phone ? `<a href="tel:${escapeHtml(r.phone.replace(/[^+\d]/g, ''))}"><i class="bi bi-telephone me-1"></i>${escapeHtml(r.phone)}</a>` : ''}
      ${r.email ? `<a href="mailto:${escapeHtml(r.email)}"><i class="bi bi-envelope me-1"></i>${escapeHtml(r.email)}</a>` : ''}
    </div>`
      )
      .join('') || '<p class="text-muted">No references added yet.</p>';

  const avatarUrl = resolveAssetUrl(p.avatar, true) || getInitialsPlaceholder(p.name);

  document.getElementById('cvWrapper').innerHTML = `
    <div class="pdf-note">
      <i class="bi bi-info-circle"></i>
      To save as PDF: click <strong>Print Page</strong> above and choose "Save as PDF" in your browser print dialog.
    </div>

    <div class="cv-profile-card">
      <img src="${avatarUrl}" class="cv-avatar" alt="${escapeHtml(p.name || '')}" onerror="this.onerror=null;this.src='${getInitialsPlaceholder(p.name)}'"/>
      <div>
        <div class="cv-name">${escapeHtml(p.name || '')}</div>
        <div class="cv-title-text">${escapeHtml(p.title || '')}</div>
        <div class="cv-contact-row">
          ${p.email ? `<div class="cv-contact-item"><i class="bi bi-envelope"></i><a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a></div>` : ''}
          ${p.phone ? `<div class="cv-contact-item"><i class="bi bi-telephone"></i>${escapeHtml(p.phone)}</div>` : ''}
          ${p.location ? `<div class="cv-contact-item"><i class="bi bi-geo-alt"></i>${escapeHtml(p.location)}</div>` : ''}
          ${socials.github ? `<div class="cv-contact-item"><i class="bi bi-github"></i><a href="${escapeHtml(socials.github)}" target="_blank">GitHub</a></div>` : ''}
          ${socials.linkedin ? `<div class="cv-contact-item"><i class="bi bi-linkedin"></i><a href="${escapeHtml(socials.linkedin)}" target="_blank">LinkedIn</a></div>` : ''}
          ${socials.researchgate ? `<div class="cv-contact-item"><i class="bi bi-globe"></i><a href="${escapeHtml(socials.researchgate)}" target="_blank">ResearchGate</a></div>` : ''}
          ${socials.scholar ? `<div class="cv-contact-item"><i class="bi bi-mortarboard"></i><a href="${escapeHtml(socials.scholar)}" target="_blank">Google Scholar</a></div>` : ''}
          ${socials.orcid ? `<div class="cv-contact-item"><i class="bi bi-person-badge"></i><a href="${escapeHtml(socials.orcid)}" target="_blank">ORCID</a></div>` : ''}
        </div>
      </div>
    </div>

    <div class="cv-section">
      <div class="cv-section-title"><i class="bi bi-person-lines-fill"></i>Career Summary</div>
      <div style="background:var(--navy);border-left:4px solid var(--gold);color:#e8e8f0;padding:1.2rem 1.5rem;border-radius:8px;font-size:.95rem;line-height:1.8;">
        ${escapeHtml(p.objective || '')}
      </div>
    </div>

    ${researchInterestsHtml ? `<div class="cv-section"><div class="cv-section-title"><i class="bi bi-lightbulb"></i>Research Interests</div><div class="skills-grid">${researchInterestsHtml}</div></div>` : ''}

    <div class="cv-section">
      <div class="cv-section-title"><i class="bi bi-mortarboard"></i>Education</div>
      <table class="table edu-table">
        <thead><tr><th>Degree</th><th>Institution / Board</th><th>Major</th><th>Year</th><th>Grade</th></tr></thead>
        <tbody>${educationRows || '<tr><td colspan="5" class="text-center text-muted">No education entries yet.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="cv-section">
      <div class="cv-section-title"><i class="bi bi-briefcase"></i>Research Experience</div>
      <div class="cv-timeline">${experienceHtml || '<p class="text-muted">No experience entries yet.</p>'}</div>
    </div>

    <div class="cv-section">
      <div class="cv-section-title"><i class="bi bi-journal-text"></i>Publications</div>
      ${publicationsHtml}
      <div class="mt-2"><a href="../publications/index.html" style="font-size:.83rem;color:var(--gold);text-decoration:none;font-weight:500;">View all publications →</a></div>
    </div>

    <div class="cv-section">
      <div class="cv-section-title"><i class="bi bi-journal-code"></i>Key Projects</div>
      ${researchProjectsHtml ? `<div style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--text-mid);margin-bottom:.6rem;">Research Projects</div>${researchProjectsHtml}` : ''}
      ${devProjectsHtml ? `<div style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--text-mid);margin-bottom:.6rem;">Project Experience</div><div class="two-col">${devProjectsHtml}</div>` : ''}
      <div class="mt-2"><a href="../projects/index.html" style="font-size:.83rem;color:var(--gold);text-decoration:none;font-weight:500;">View all projects →</a></div>
    </div>

    <div class="cv-section">
      <div class="cv-section-title"><i class="bi bi-tools"></i>Technical Skills</div>
      <div class="skills-grid">
        ${skillGroup('Programming Languages', skills.languages)}
        ${skillGroup('Libraries & Frameworks', skills.frameworks)}
        ${skillGroup('Tools & Platforms', skills.tools)}
        ${skillGroup('Research Methods', skills.researchMethods)}
      </div>
    </div>

    <div class="two-col">
      <div class="cv-section">
        <div class="cv-section-title"><i class="bi bi-trophy"></i>Awards</div>
        ${awardsHtml}
      </div>
      <div class="cv-section">
        <div class="cv-section-title"><i class="bi bi-people"></i>Activities</div>
        <div class="cv-item-card"><ul style="margin:0;padding-left:1.1rem;font-size:.88rem;color:var(--text-mid);line-height:2;">${activitiesHtml}</ul></div>
      </div>
    </div>

    <div class="cv-section">
      <div class="cv-section-title"><i class="bi bi-patch-check"></i>Certifications</div>
      <div class="two-col">${certificationsHtml}</div>
    </div>

    ${languagesHtml ? `<div class="cv-section"><div class="cv-section-title"><i class="bi bi-translate"></i>Languages</div><div class="d-flex gap-3 flex-wrap">${languagesHtml}</div></div>` : ''}

    ${info.fatherName || info.motherName || info.dob || info.religion || info.nationality || info.nid || info.bloodGroup || info.maritalStatus || info.address ? `
    <div class="cv-section">
      <div class="cv-section-title"><i class="bi bi-card-heading"></i>Personal Information</div>
      <div class="two-col">
        <div>
          ${info.fatherName ? `<div class="info-row" style="display:flex;padding:7px 0;border-bottom:1px solid var(--border);"><span style="width:140px;font-size:.78rem;font-weight:700;text-transform:uppercase;color:var(--text-mid);letter-spacing:.5px;">Father's Name</span><span style="font-size:.88rem;color:var(--navy);font-weight:500;">${escapeHtml(info.fatherName)}</span></div>` : ''}
          ${info.motherName ? `<div class="info-row" style="display:flex;padding:7px 0;border-bottom:1px solid var(--border);"><span style="width:140px;font-size:.78rem;font-weight:700;text-transform:uppercase;color:var(--text-mid);letter-spacing:.5px;">Mother's Name</span><span style="font-size:.88rem;color:var(--navy);font-weight:500;">${escapeHtml(info.motherName)}</span></div>` : ''}
          ${info.dob ? `<div class="info-row" style="display:flex;padding:7px 0;border-bottom:1px solid var(--border);"><span style="width:140px;font-size:.78rem;font-weight:700;text-transform:uppercase;color:var(--text-mid);letter-spacing:.5px;">Date of Birth</span><span style="font-size:.88rem;color:var(--navy);font-weight:500;">${escapeHtml(info.dob)}</span></div>` : ''}
          ${info.religion ? `<div class="info-row" style="display:flex;padding:7px 0;border-bottom:1px solid var(--border);"><span style="width:140px;font-size:.78rem;font-weight:700;text-transform:uppercase;color:var(--text-mid);letter-spacing:.5px;">Religion</span><span style="font-size:.88rem;color:var(--navy);font-weight:500;">${escapeHtml(info.religion)}</span></div>` : ''}
          ${info.nid ? `<div class="info-row" style="display:flex;padding:7px 0;border-bottom:1px solid var(--border);"><span style="width:140px;font-size:.78rem;font-weight:700;text-transform:uppercase;color:var(--text-mid);letter-spacing:.5px;">NID</span><span style="font-size:.88rem;color:var(--navy);font-weight:500;">${escapeHtml(info.nid)}</span></div>` : ''}
        </div>
        <div>
          ${info.maritalStatus ? `<div class="info-row" style="display:flex;padding:7px 0;border-bottom:1px solid var(--border);"><span style="width:140px;font-size:.78rem;font-weight:700;text-transform:uppercase;color:var(--text-mid);letter-spacing:.5px;">Marital Status</span><span style="font-size:.88rem;color:var(--navy);font-weight:500;">${escapeHtml(info.maritalStatus)}</span></div>` : ''}
          ${info.bloodGroup ? `<div class="info-row" style="display:flex;padding:7px 0;border-bottom:1px solid var(--border);"><span style="width:140px;font-size:.78rem;font-weight:700;text-transform:uppercase;color:var(--text-mid);letter-spacing:.5px;">Blood Group</span><span style="font-size:.88rem;color:var(--navy);font-weight:500;">${escapeHtml(info.bloodGroup)}</span></div>` : ''}
          ${info.nationality ? `<div class="info-row" style="display:flex;padding:7px 0;border-bottom:1px solid var(--border);"><span style="width:140px;font-size:.78rem;font-weight:700;text-transform:uppercase;color:var(--text-mid);letter-spacing:.5px;">Nationality</span><span style="font-size:.88rem;color:var(--navy);font-weight:500;">${escapeHtml(info.nationality)}</span></div>` : ''}
          ${info.address ? `<div class="info-row" style="display:flex;padding:7px 0;border-bottom:1px solid var(--border);"><span style="width:140px;font-size:.78rem;font-weight:700;text-transform:uppercase;color:var(--text-mid);letter-spacing:.5px;">Address</span><span style="font-size:.88rem;color:var(--navy);font-weight:500;">${escapeHtml(info.address)}</span></div>` : ''}
        </div>
      </div>
    </div>` : ''}

    <div class="cv-section">
      <div class="cv-section-title"><i class="bi bi-person-check"></i>References</div>
      <div class="two-col">${referencesHtml}</div>
    </div>
  `;

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
