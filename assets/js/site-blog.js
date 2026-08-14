(async function () {
  'use strict';
  const result = await getPortfolio(true);
  const d = result.data || {};
  const settings = d.settings || {};
  const posts = d.blog || [];
  const p = settings.profile || {};

  let activeCategory = 'all';

  const iconMap = {
    'Explainable AI': 'bi-bandaid',
    'Computer Vision': 'bi-globe-americas',
    'Deep Learning': 'bi-activity',
    'Academic Life': 'bi-mortarboard',
    Resources: 'bi-book',
  };
  const iconFor = (cat) => iconMap[cat] || 'bi-pencil-square';

  renderPosts(activeCategory);
  renderTags();
  renderRecent();
  renderConnect();
  renderAuthorAndFooter();

  function postCardHtml(post, idx) {
    return `
    <div class="col-md-6" id="post-${idx}">
      <div class="post-card">
        <div class="post-img" style="height:160px;">
          <i class="bi ${iconFor(post.category)}"></i>
          ${post.category ? `<span class="post-tag">${escapeHtml(post.category)}</span>` : ''}
        </div>
        <div class="post-body">
          <div class="post-meta">
            ${post.date ? `<span><i class="bi bi-calendar3"></i>${escapeHtml(post.date)}</span>` : ''}
            ${post.readTime ? `<span><i class="bi bi-clock"></i>${escapeHtml(post.readTime)}</span>` : ''}
          </div>
          <div class="post-title" style="font-size:1.1rem;">${escapeHtml(post.title || '')}</div>
          <div class="post-excerpt">${escapeHtml(post.excerpt || '')}</div>
        </div>
      </div>
    </div>`;
  }

  function renderPosts(filterCat = 'all') {
    const el = document.getElementById('blogPostsContainer');
    if (!posts.length) {
      el.innerHTML = `
        <div class="coming-soon">
          <i class="bi bi-pencil-square"></i>
          <h4>No posts yet</h4>
          <p>Check back soon for new writing on Computer Vision, Medical AI, and research life.</p>
        </div>`;
      return;
    }

    const filtered = filterCat === 'all' ? posts : posts.filter((p) => p.category === filterCat);
    if (!filtered.length) {
      el.innerHTML = `
        <div class="coming-soon">
          <i class="bi bi-search"></i>
          <h4>No posts found for "${escapeHtml(filterCat)}"</h4>
          <p><a href="javascript:void(0)" onclick="filterBlog('all')" style="color:var(--gold);font-weight:600;">Show all posts</a></p>
        </div>`;
      return;
    }

    const featured = filtered.find((p) => p.featured) || filtered[0];
    const rest = filtered.filter((p) => p !== featured);

    let html = `
      <div class="featured-post" id="post-featured">
        <div class="post-img"><i class="bi ${iconFor(featured.category)}"></i></div>
        <div class="post-body">
          <span class="featured-badge">⭐ Featured Post</span>
          <div class="post-meta">
            ${featured.date ? `<span><i class="bi bi-calendar3"></i>${escapeHtml(featured.date)}</span>` : ''}
            ${featured.readTime ? `<span><i class="bi bi-clock"></i>${escapeHtml(featured.readTime)}</span>` : ''}
            ${featured.category ? `<span><i class="bi bi-tag"></i>${escapeHtml(featured.category)}</span>` : ''}
          </div>
          <div class="post-title">${escapeHtml(featured.title || '')}</div>
          <div class="post-excerpt">${escapeHtml(featured.excerpt || '')}</div>
        </div>
      </div>
      <div class="row g-3">${rest.map((p, i) => postCardHtml(p, i)).join('')}</div>
      <div class="coming-soon mt-4">
        <i class="bi bi-pencil-square"></i>
        <h4>More posts coming soon</h4>
        <p>I'm actively writing about my research findings, paper reviews, and AI/ML tutorials. Subscribe below to get notified.</p>
      </div>`;
    el.innerHTML = html;
  }

  window.filterBlog = function (cat) {
    activeCategory = cat;
    renderPosts(cat);
    document.querySelectorAll('#tagCloud .tag').forEach((t) => {
      t.classList.toggle('active', t.dataset.cat === cat);
    });
  };

  function renderTags() {
    const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))];
    const tagEl = document.getElementById('tagCloud');
    if (!tagEl) return;
    tagEl.innerHTML = `
      <a class="tag ${activeCategory === 'all' ? 'active' : ''}" data-cat="all" href="javascript:void(0)" onclick="filterBlog('all')">All</a>
      ${cats.map((c) => `<a class="tag ${activeCategory === c ? 'active' : ''}" data-cat="${escapeHtml(c)}" href="javascript:void(0)" onclick="filterBlog('${escapeHtml(c)}')">${escapeHtml(c)}</a>`).join('')}
    `;
  }

  function renderRecent() {
    const recent = posts.slice(0, 4);
    const recentEl = document.getElementById('recentPostsList');
    if (!recentEl) return;
    recentEl.innerHTML = recent
      .map(
        (post, idx) => `
      <div class="recent-post" onclick="filterBlog('${escapeHtml(post.category || 'all')}'); window.scrollTo({top: 250, behavior: 'smooth'});">
        <div class="recent-icon"><i class="bi ${iconFor(post.category)}"></i></div>
        <div>
          <div class="recent-title"><a href="javascript:void(0)">${escapeHtml(post.title || '')}</a></div>
          <div class="recent-date">${escapeHtml(post.date || '')}</div>
        </div>
      </div>`
      )
      .join('');
  }

  function renderConnect() {
    const s = (settings.profile && settings.profile.socials) || {};
    const links = [
      s.github && { icon: 'bi-github', label: 'GitHub', url: s.github },
      s.linkedin && { icon: 'bi-linkedin', label: 'LinkedIn', url: s.linkedin },
      s.researchgate && { icon: 'bi-journal-bookmark', label: 'ResearchGate', url: s.researchgate },
      p.email && { icon: 'bi-envelope', label: 'Email', url: 'mailto:' + p.email },
    ].filter(Boolean);
    const connEl = document.getElementById('connectLinks');
    if (!connEl) return;
    connEl.innerHTML = links
      .map(
        (l) => `<a href="${escapeHtml(l.url)}" target="_blank" style="font-size:.85rem;color:var(--text-mid);text-decoration:none;display:flex;align-items:center;gap:.6rem;"><i class="bi ${l.icon}" style="color:var(--gold)"></i>${l.label}</a>`
      )
      .join('');
  }

  function renderAuthorAndFooter() {
    if (p.name) {
      const aName = document.getElementById('authorName');
      if (aName) aName.textContent = p.name;
      const fName = document.getElementById('footerName');
      if (fName) fName.textContent = p.name;
    }
    if (p.title) {
      const fTitle = document.getElementById('footerTitle');
      if (fTitle) fTitle.textContent = p.title;
      const aBio = document.getElementById('authorBio');
      if (aBio) aBio.textContent = p.title;
    }
    const fYear = document.getElementById('footerYear');
    if (fYear) fYear.textContent = new Date().getFullYear();
    if (p.email) {
      const el = document.getElementById('footerEmail');
      if (el) {
        el.textContent = p.email;
        el.href = 'mailto:' + p.email;
      }
    }
  }
})();
