/**
 * ==========================================================================
 * OLIVINE MARKETING — EXACT TEXT WIPE-UP TRANSITION MODULE
 * ES Module implementation for StackTactician Portfolio
 * Replaces all legacy fade-ins with staggered word mask wipe-up animations.
 * ==========================================================================
 */

/**
 * Splits text within a container into words wrapped in overflow-hidden masks
 * while preserving existing HTML structures like <br> tags, <strong> tags, and inline elements.
 */
function processNodeWords(container, settings) {
    let wordIndex = 0;

    function processChild(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (!text.trim()) {
                return [document.createTextNode(text)];
            }
            const parts = text.split(/(\s+)/);
            const fragment = [];

            parts.forEach(part => {
                if (/^\s+$/.test(part)) {
                    fragment.push(document.createTextNode(part));
                } else if (part.length > 0) {
                    const wrapper = document.createElement('span');
                    wrapper.className = 'animation-segment-wrapper';

                    const interior = document.createElement('span');
                    interior.className = 'animation-segment-interior';
                    interior.style.transitionDuration = settings.duration;
                    interior.style.transitionTimingFunction = settings.timingFunction;
                    interior.style.transitionDelay = `${wordIndex * settings.delayStep}ms`;
                    interior.textContent = part;

                    wrapper.appendChild(interior);
                    fragment.push(wrapper);
                    wordIndex++;
                }
            });
            return fragment;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            // Preserve void & non-text elements
            if (tagName === 'br' || tagName === 'img' || tagName === 'svg' || tagName === 'code' || tagName === 'pre' || tagName === 'canvas') {
                return [node.cloneNode(true)];
            }
            const cloned = node.cloneNode(false);
            const childFragments = [];
            Array.from(node.childNodes).forEach(child => {
                childFragments.push(...processChild(child));
            });
            childFragments.forEach(child => cloned.appendChild(child));
            return [cloned];
        }
        return [node.cloneNode(true)];
    }

    const newChildren = [];
    Array.from(container.childNodes).forEach(child => {
        newChildren.push(...processChild(child));
    });

    container.innerHTML = '';
    newChildren.forEach(child => container.appendChild(child));
}

/**
 * Attaches IntersectionObserver to target nodes and triggers wipe animations.
 */
export function initWipeElements(selector, options = {}) {
    const defaultOptions = {
        delayStep: 28, // ms delay between staggered words
        threshold: 0.1, // trigger when 10% visible
        duration: '0.85s', // transition speed
        timingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' // exact Olivine curve
    };
    const settings = Object.assign({}, defaultOptions, options);

    const nodes = typeof selector === 'string' 
        ? document.querySelectorAll(selector) 
        : (Array.isArray(selector) || selector instanceof NodeList ? selector : [selector]);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const node = entry.target;
                setTimeout(() => {
                    node.querySelectorAll('.animation-segment-wrapper').forEach(wrapper => {
                        wrapper.classList.add('animation-segmented-flex-fired');
                    });
                }, 40);
                observer.unobserve(node);
            }
        });
    }, { 
        threshold: settings.threshold,
        rootMargin: '0px 0px -40px 0px'
    });

    nodes.forEach(node => {
        if (!node || node.dataset.textWipeInitialized) return;
        node.dataset.textWipeInitialized = 'true';

        processNodeWords(node, settings);
        observer.observe(node);
    });
}

/**
 * Main entrance function: replaces all legacy fade-ins across the site with Text Wipe.
 */
export function initTextWipe(customSelector = null, customOptions = {}) {
    if (customSelector) {
        initWipeElements(customSelector, customOptions);
        return;
    }

    // 1. Headings, Hero Lines & Section Titles (deliberate 28ms stagger)
    initWipeElements(
        [
            '.hero-title > span',
            '.hero-subtitle',
            '.section-number',
            '.section-title',
            '.contact-title',
            '.section-subtitle',
            '.work-name',
            '.role-title',
            '.subsection-title',
            '.detail-title',
            '.feature-title',
            '.text-wipe',
            '[data-text-wipe]'
        ].join(', '),
        { delayStep: 28, duration: '0.85s', threshold: 0.1 }
    );

    // 2. Paragraphs, Descriptions, Bullet Points & Meta Info (faster 14ms stagger for fluid reading)
    initWipeElements(
        [
            '.section-text',
            '.experience-description li',
            '.feature-list li',
            '.experience-date',
            '.company-name',
            '.work-category',
            '.work-year',
            '.social-link-large .reveal-base'
        ].join(', '),
        { delayStep: 14, duration: '0.75s', threshold: 0.08 }
    );
}

// Expose globally for compatibility
if (typeof window !== 'undefined') {
    window.initTextWipe = initTextWipe;
    window.initWipeElements = initWipeElements;
}
