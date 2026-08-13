// Theme toggle
function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme') === 'dark';
  root.setAttribute('data-theme', isDark ? 'light' : 'dark');
  const knob = document.querySelector('#themeToggle .knob');
  if (knob) knob.textContent = isDark ? '☀' : '☾';
}

// Scroll top button
window.addEventListener('scroll', () => {
  const btn = document.getElementById('scrollTop');
  if (btn) {
    btn.style.display = window.scrollY > 300 ? 'flex' : 'none';
  }
});

// Scroll to top action
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('scrollTop');
  if (btn) {
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});

// Optional: Intersection Observer for simple scroll reveal animations
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  const hiddenElements = document.querySelectorAll('.section-wrapper, .content-section, .blog-section, .pub-section, .projects-section, .cv-wrapper');
  hiddenElements.forEach((el) => {
    // Add default hidden styles directly to avoid FOUC if JS is disabled
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
  });
});

// Toggle project description expand/collapse
function toggleProjectDesc(btn) {
  const desc = btn.previousElementSibling;
  if (!desc) return;
  const isCollapsed = desc.classList.contains('collapsed');
  if (isCollapsed) {
    desc.classList.remove('collapsed');
    btn.innerHTML = `Show Less <i class="bi bi-chevron-up ms-1"></i>`;
  } else {
    desc.classList.add('collapsed');
    btn.innerHTML = `Learn More <i class="bi bi-chevron-down ms-1"></i>`;
  }
}

