(async function () {
  'use strict';
  const result = await getPortfolio();
  const d = result.data || {};
  const settings = d.settings || {};
  const posts = d.blog || [];
  const p = settings.profile || {};

  const iconMap = {
    'Explainable AI': 'bi-bandaid',
    'Computer Vision': 'bi-globe-americas',
    'Deep Learning': 'bi-activity',
    'Academic Life': 'bi-mortarboard',
    Resources: 'bi-book',
  };
  const iconFor = (cat) => iconMap[cat] || 'bi-pencil-square';

  renderPosts();
  renderTags();
  renderRecent();
  renderConnect();
  renderAuthorAndFooter();

  function postCardHtml(post) {
    return `
    <div class="col-md-6">
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

  function renderPosts() {
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
    const featured = posts.find((p) => p.featured) || posts[0];
    const rest = posts.filter((p) => p !== featured);

    let html = `
      <div class="featured-post">
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
      <div class="row g-3">${rest.map(postCardHtml).join('')}</div>
      <div class="coming-soon mt-4">
        <i class="bi bi-pencil-square"></i>
        <h4>More posts coming soon</h4>
        <p>I'm actively writing about my research findings, paper reviews, and AI/ML tutorials. Subscribe below to get notified.</p>
      </div>`;
    el.innerHTML = html;
  }

  function renderTags() {
    const cats = [...new Set(posts.map((p) => p.category).filter(Boolean))];
    document.getElementById('tagCloud').innerHTML = cats.map((c) => `<a class="tag" href="#">${escapeHtml(c)}</a>`).join('');
  }

  function renderRecent() {
    const recent = posts.slice(0, 4);
    document.getElementById('recentPostsList').innerHTML = recent
      .map(
        (post) => `
      <div class="recent-post">
        <div class="recent-icon"><i class="bi ${iconFor(post.category)}"></i></div>
        <div>
          <div class="recent-title"><a href="#">${escapeHtml(post.title || '')}</a></div>
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
    document.getElementById('connectLinks').innerHTML = links
      .map(
        (l) => `<a href="${escapeHtml(l.url)}" target="_blank" style="font-size:.85rem;color:var(--text-mid);text-decoration:none;display:flex;align-items:center;gap:.6rem;"><i class="bi ${l.icon}" style="color:var(--gold)"></i>${l.label}</a>`
      )
      .join('');
  }

  function renderAuthorAndFooter() {
    if (p.name) {
      document.getElementById('authorName').textContent = p.name;
      document.getElementById('footerName').textContent = p.name;
    }
    if (p.title) document.getElementById('footerTitle').textContent = p.title;
    if (p.objective) document.getElementById('authorBio').textContent = p.title || document.getElementById('authorBio').textContent;
    document.getElementById('footerYear').textContent = new Date().getFullYear();
    if (p.email) {
      const el = document.getElementById('footerEmail');
      el.textContent = p.email;
      el.href = 'mailto:' + p.email;
    }
  }
})();
