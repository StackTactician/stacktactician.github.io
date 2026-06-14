import { Scene3D } from './three/Scene3D.js';
import { initSmoothScroll } from './ui/smoothScroll.js';
import { initScrollAnimations } from './effects/scrollAnimations.js';
import { initNavigationScroll } from './ui/navigation.js';
import { initThemeToggle } from './ui/themeToggle.js';
import { simulateLoading } from './ui/loadingScreen.js';
import { initBackToTop } from './ui/backToTop.js';
import { initMobileMenu } from './ui/mobileMenu.js';
import { initTerminal } from './terminal/terminal.js';
import { initContactForm } from './ui/contactForm.js';
import { initWorkAccordion } from './ui/workAccordion.js';
import { initSpotlightGlow } from './effects/spotlightGlow.js';
import { initPhotoDeck } from './effects/photoDeck.js';
import { initMagneticElements } from './effects/magneticElements.js';
import { initNavPill } from './effects/navPill.js';
import { initScrollReveal } from './effects/scrollReveal.js';
import { initCopyButtons } from './ui/copyButtons.js';
import { initParallax } from './effects/parallax.js';
import { initTextScramble } from './effects/TextScrambler.js';
import { initToolsFolder } from './effects/toolsFolder.js';

let scene3DInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle({
        getScene: () => scene3DInstance
    });

    simulateLoading(() => {
        scene3DInstance = new Scene3D();
        scene3DInstance.setLightMode(document.body.classList.contains('light-mode'));

        initSmoothScroll();
        initScrollAnimations();
        initNavigationScroll();
        initBackToTop();
        initMobileMenu();
        initTerminal();
        initContactForm();
        initWorkAccordion();
        initSpotlightGlow();
        initMagneticElements();
        initNavPill();
        initScrollReveal();
        initCopyButtons();
        initPhotoDeck();
        initParallax();
        initTextScramble();
        initToolsFolder();
    });
});
