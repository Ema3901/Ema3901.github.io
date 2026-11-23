document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Tema claro / oscuro ----------
    const root = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    }

    // ---------- Año del footer ----------
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    // ---------- Aparición suave al hacer scroll ----------
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => {
        const siblings = el.parentElement.querySelectorAll(':scope > .reveal');
        const idx = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = `${Math.min(idx, 5) * 0.06}s`;
        revealObserver.observe(el);
    });

    // ---------- Carrusel del stack (duplica cada fila una vez) ----------
    document.querySelectorAll('.marquee-track').forEach(track => {
        Array.from(track.children).forEach(item => {
            const clone = item.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });
    });

    // ---------- Efecto de escritura en el hero ----------
    const typingEl = document.getElementById('typing');
    const phrases = [
        'Desarrollador autodidacta',
        'Aspirante a LLM & ML Engineer',
        'Python | C# | .NET | WebAssembly'
    ];
    if (typingEl && !reduceMotion) {
        let p = 0, i = phrases[0].length, deleting = true;
        const tick = () => {
            const word = phrases[p];
            if (deleting) {
                i--;
                typingEl.textContent = word.slice(0, i);
                if (i === 0) {
                    deleting = false;
                    p = (p + 1) % phrases.length;
                    return setTimeout(tick, 350);
                }
                return setTimeout(tick, 35);
            }
            i++;
            typingEl.textContent = phrases[p].slice(0, i);
            if (i === phrases[p].length) {
                deleting = true;
                return setTimeout(tick, 2200);
            }
            setTimeout(tick, 65);
        };
        setTimeout(tick, 2200);
    }

    // ---------- Indicador de scroll que te sigue ----------
    const indicator = document.getElementById('scrollIndicator');
    const sections = Array.from(document.querySelectorAll('section[id], .section'));
    if (indicator) {
        const label = indicator.querySelector('.label');
        const icon = indicator.querySelector('i');

        const update = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
            indicator.style.setProperty('--progress', `${(progress * 100).toFixed(1)}%`);

            const atEnd = progress > 0.97;
            indicator.classList.toggle('top', atEnd);
            if (label) label.textContent = atEnd ? 'arriba' : 'scroll';
            icon.className = atEnd ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
            indicator.setAttribute('aria-label', atEnd ? 'Volver arriba' : 'Ir a la siguiente sección');
        };

        indicator.addEventListener('click', () => {
            if (indicator.classList.contains('top')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const next = sections.find(s => s.getBoundingClientRect().top > 100);
            if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        });

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    // ---------- Link activo en la navbar ----------
    const navLinks = document.querySelectorAll('.nav-links a');
    if (navLinks.length) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('section[id]').forEach(s => navObserver.observe(s));
    }

    // ---------- Modal de contacto ----------
    const modal = document.getElementById('contactModal');
    const closeBtn = document.getElementById('closeModal');
    if (!modal || !closeBtn) return;
    let lastFocus = null;

    const html = document.documentElement;
    const supportsGutter = window.CSS && CSS.supports && CSS.supports('scrollbar-gutter', 'stable');

    const lockScroll = () => {
        if (!supportsGutter) {
            const sbw = window.innerWidth - html.clientWidth;
            html.style.setProperty('--sbw', `${sbw}px`);
            html.classList.add('no-gutter');
        }
        html.classList.add('modal-open');
    };

    const unlockScroll = () => {
        html.classList.remove('modal-open', 'no-gutter');
        html.style.removeProperty('--sbw');
    };

    const openModal = () => {
        lastFocus = document.activeElement;
        modal.style.display = 'flex';
        modal.classList.remove('closing');
        modal.offsetHeight; // forzar reflow para que corra la transición
        modal.classList.add('active');
        lockScroll();
        closeBtn.focus();
    };

    const closeModal = () => {
        modal.classList.remove('active');
        modal.classList.add('closing');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
            unlockScroll();
            if (lastFocus) lastFocus.focus({ preventScroll: true });
        }, 200);
    };

    document.querySelectorAll('.open-contact').forEach(btn => btn.addEventListener('click', openModal));
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    // Copiar email
    const copyBtn = document.getElementById('copyEmail');
    if (copyBtn && navigator.clipboard) {
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(copyBtn.dataset.email);
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<i class="fas fa-check"></i> copiado';
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = '<i class="far fa-copy"></i> copiar';
                }, 1800);
            } catch (_) { /* sin permisos de portapapeles */ }
        });
    } else if (copyBtn) {
        copyBtn.style.display = 'none';
    }
});
