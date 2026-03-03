/* ============================================
   JARINRAKSA OY — main.js
   ============================================ */

(function () {
  'use strict';

  /* ── HAMBURGER MENU ─────────────────────── */
  const hamburger  = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });

    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ── STICKY HEADER SHADOW ───────────────── */
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    window.addEventListener('scroll', () => {
      siteHeader.style.boxShadow = window.scrollY > 20
        ? '0 4px 24px rgba(13,34,64,0.32)'
        : '0 2px 16px rgba(13,34,64,0.25)';
    }, { passive: true });
  }

  /* ── SMOOTH SCROLL FOR ANCHOR LINKS ─────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navHeight = siteHeader ? siteHeader.offsetHeight : 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── INTERSECTION OBSERVER: FADE-UP ─────── */
  const fadeSelectors = [
    '.feature-card',
    '.masonry-card',
    '.takuu-item',
    '.meista-text',
    '.meista-image',
    '.stat-item',
    '.form-intro',
    '.contact-form'
  ];

  const fadeTargets = document.querySelectorAll(fadeSelectors.join(', '));
  fadeTargets.forEach(el => el.classList.add('fade-up'));

  if ('IntersectionObserver' in window) {
    const fadeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const siblings = Array.from(entry.target.parentElement.children);
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 80, 400);

        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);

        fadeObserver.unobserve(entry.target);
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

    fadeTargets.forEach(el => fadeObserver.observe(el));
  } else {
    fadeTargets.forEach(el => el.classList.add('visible'));
  }

  /* ── STATS COUNTER ANIMATION ─────────────── */
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');

  function animateCounter(el) {
    const target   = parseInt(el.getAttribute('data-target'), 10);
    const duration = 1600;
    const startTime = performance.now();

    function step(now) {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && statNumbers.length > 0) {
    const statsBar = document.querySelector('.stats-bar');
    if (statsBar) {
      const statsObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          statNumbers.forEach(animateCounter);
          statsObserver.unobserve(entry.target);
        });
      }, { threshold: 0.25 });

      statsObserver.observe(statsBar);
    }
  } else {
    statNumbers.forEach(el => {
      el.textContent = el.getAttribute('data-target');
    });
  }

  /* ── CONTACT FORM ───────────────────────── */
  const form       = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (form && formStatus) {

    /* Clear field error styling on input */
    form.querySelectorAll('[required]').forEach(field => {
      field.addEventListener('input', () => {
        field.style.borderColor = '';
        if (formStatus.classList.contains('error')) {
          formStatus.textContent = '';
          formStatus.className   = 'form-status';
        }
      });
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const origText  = submitBtn.textContent;

      /* Client-side validation */
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#b91c1c';
          isValid = false;
        }
      });

      if (!isValid) {
        formStatus.textContent = 'Täytä pakolliset kentät (merkitty *).';
        formStatus.className   = 'form-status error';
        const firstInvalid = form.querySelector('[required]:placeholder-shown, [required][value=""]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      /* Submit */
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Lähetetään...';
      formStatus.textContent = '';
      formStatus.className   = 'form-status';

      try {
        const response = await fetch(form.action, {
          method:  'POST',
          body:    new FormData(form),
          headers: { Accept: 'application/json' }
        });

        if (response.ok) {
          formStatus.textContent = 'Tarjouspyyntö lähetetty. Palaamme asiaan 24 tunnin sisällä arkipäivisin.';
          formStatus.className   = 'form-status success';
          form.reset();
          form.querySelectorAll('input, textarea, select').forEach(f => {
            f.style.borderColor = '';
          });
        } else {
          let errMsg = 'Lähetys epäonnistui. Soita numeroon 040 0450902.';
          try {
            const json = await response.json();
            if (json.errors && json.errors.length > 0) {
              errMsg = json.errors.map(err => err.message).join(' ');
            }
          } catch (_) { /* ignore parse errors */ }
          formStatus.textContent = errMsg;
          formStatus.className   = 'form-status error';
        }
      } catch (_) {
        formStatus.textContent = 'Verkkovirhe. Tarkista yhteys ja yritä uudelleen tai soita 040 0450902.';
        formStatus.className   = 'form-status error';
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = origText;
      }
    });
  }

})();