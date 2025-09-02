
        // Smooth scrolling animation
        document.addEventListener('DOMContentLoaded', function() {
            // Add smooth reveal animation to experience items
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);

            // Initially hide items (excluding skill items now since they're in carousel)
            const animateItems = document.querySelectorAll('.experience-item, .project-card');
            animateItems.forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(30px)';
                item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
                observer.observe(item);
            });

            // Contact modal functionality con animaciones
            const contactButtons = document.querySelectorAll('.resume-btn, .hero-resume-btn');
            const contactModal = document.getElementById('resumeModal');
            const closeModal = document.getElementById('closeModal');
            const downloadCVEsp = document.getElementById('downloadCVEsp');
            const downloadCVEng = document.getElementById('downloadCVEng');

            // Open modal con animación
            contactButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    contactModal.style.display = 'flex';
                    contactModal.classList.remove('closing');
                    // Forzar reflow antes de agregar la clase active
                    contactModal.offsetHeight;
                    contactModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            });

            // Close modal con animación
            const closeModalFunc = () => {
                contactModal.classList.remove('active');
                contactModal.classList.add('closing');
                
                // Esperar a que termine la animación antes de ocultar
                setTimeout(() => {
                    contactModal.style.display = 'none';
                    contactModal.classList.remove('closing');
                    document.body.style.overflow = 'auto';
                }, 300);
            };

            closeModal.addEventListener('click', closeModalFunc);

            // Close modal when clicking outside
            contactModal.addEventListener('click', (e) => {
                if (e.target === contactModal) {
                    closeModalFunc();
                }
            });

            // Close modal with Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && contactModal.classList.contains('active')) {
                    closeModalFunc();
                }
            });

            // Download CV functionality
            downloadCVEsp.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = 'cv/cvEsp.pdf';
                link.download = 'CV_Emanuel_Vazquez_Español.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            downloadCVEng.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = 'cv/cvEng.pdf';
                link.download = 'CV_Emanuel_Vazquez_English.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            // Add floating animation to hero section
            const heroImage = document.querySelector('.profile-image');
            let floatDirection = 1;
            
            setInterval(() => {
                const currentTransform = heroImage.style.transform || 'translateY(0px)';
                const currentY = parseFloat(currentTransform.match(/translateY\(([^)]+)px\)/) || [0, 0])[1];
                const newY = currentY + (floatDirection * 0.5);
                
                if (Math.abs(newY) > 10) {
                    floatDirection *= -1;
                }
                
                heroImage.style.transform = `translateY(${newY}px)`;
            }, 50);
        });