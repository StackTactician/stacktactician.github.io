// ============================================
// Back to Top functionality
// ============================================
export function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    const progressCircle = backToTopBtn.querySelector('.progress-ring-circle');
    const circumference = 2 * Math.PI * 22; // 138.23

    window.addEventListener('scroll', () => {
        // Toggle visibility class
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }

        // Calculate scroll progress percentage
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        if (docHeight > 0 && progressCircle) {
            const scrollPercent = Math.min(Math.max(scrollTop / docHeight, 0), 1);
            const offset = circumference - (scrollPercent * circumference);
            progressCircle.style.strokeDashoffset = offset.toFixed(2);
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
