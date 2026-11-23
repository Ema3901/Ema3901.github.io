document.addEventListener('DOMContentLoaded', () => {
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

    // ---------- Aparición al hacer scroll ----------
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});
