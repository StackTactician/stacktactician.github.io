/**
 * ==========================================================================
 * OLIVINE MARKETING — EXACT TEXT WIPE-UP TRANSITION MODULE
 * Extracted directly from olivinemarketing.com source code.
 * Zero external dependencies. Plug & Play for any website or framework.
 * ==========================================================================
 *
 * HOW TO USE:
 * 1. Include this file: <script src="text-wipe-transition.js"></script>
 * 2. Add class="text-wipe" or data-text-wipe to any heading, paragraph, or title:
 *    <h1 class="text-wipe">Your Headline Here</h1>
 * 
 * OR initialize programmatically with custom selectors:
 *    initTextWipe('.my-custom-heading', { delayStep: 30, duration: '0.85s' });
 */

(function () {
  // 1. Inject Exact Olivine CSS Styles automatically
  const styleId = 'olivine-text-wipe-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .animation-segment-wrapper {
        display: inline-flex;
        overflow: hidden;
        vertical-align: top;
        margin-right: 0.28em;
      }

      .animation-segment-wrapper .animation-segment-interior {
        display: inline-block;
        opacity: 0;
        transform: translate(0, 105%);
        transition-property: transform, opacity;
        transition-duration: 0.85s;
        transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
        will-change: transform, opacity;
      }

      .animation-segment-wrapper.animation-segmented-flex-fired .animation-segment-interior,
      .animation-segmented-flex-fired .animation-segment-interior {
        opacity: 1;
        transform: translate(0, 0);
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Core Text Splitter and Viewport Observer
  function initTextWipe(selector = '.text-wipe, [data-text-wipe], .hero-main-title, .page-title, .section-title', options = {}) {
    const defaultOptions = {
      delayStep: 30, // ms delay between each staggered word
      threshold: 0.1, // trigger when 10% visible
      duration: '0.85s', // transition duration
      timingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' // exact Olivine deceleration curve
    };
    const settings = Object.assign({}, defaultOptions, options);

    const nodes = typeof selector === 'string' ? document.querySelectorAll(selector) : [selector];

    nodes.forEach(node => {
      if (!node || node.dataset.textWipeInitialized) return;
      node.dataset.textWipeInitialized = 'true';

      const rawText = node.innerText.trim();
      const words = rawText.split(/\s+/);
      if (!words.length || words[0] === '') return;

      // Wrap each word in an overflow-hidden mask
      node.innerHTML = words.map((word, idx) => `
        <span class="animation-segment-wrapper">
          <span class="animation-segment-interior" style="
            transition-duration: ${settings.duration};
            transition-timing-function: ${settings.timingFunction};
            transition-delay: ${idx * settings.delayStep}ms;
          ">${word}</span>
        </span>
      `).join(' ');

      // Trigger animation on viewport entry
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              node.querySelectorAll('.animation-segment-wrapper').forEach(wrapper => {
                wrapper.classList.add('animation-segmented-flex-fired');
              });
            }, 50);
            observer.unobserve(node);
          }
        });
      }, { threshold: settings.threshold });

      observer.observe(node);
    });
  }

  // Expose to global window
  window.initTextWipe = initTextWipe;

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initTextWipe());
  } else {
    initTextWipe();
  }
})();
