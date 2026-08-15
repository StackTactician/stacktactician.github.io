# Olivine Marketing — Exact Text Wipe-Up Transition

This module provides the **exact text wipe-up transition** extracted directly from **[Olivine Marketing](https://www.olivinemarketing.com/)**.

---

## 📁 Files Included
1. [`text-wipe-transition.js`](file:///c:/Users/Sysfall/Kode/Daveol/text-wipe-transition.js) — **Self-contained, plug-and-play JavaScript file** (automatically injects required CSS styles, detects viewport entry with `IntersectionObserver`, and splits text into word segments).
2. [`text-wipe-transition.css`](file:///c:/Users/Sysfall/Kode/Daveol/text-wipe-transition.css) — **Standalone CSS rules** if you prefer managing styles manually.

---

## 🚀 Quick Start (Vanilla HTML / Static Sites)

### 1. Include the script
```html
<script src="text-wipe-transition.js"></script>
```

### 2. Add `class="text-wipe"` or `data-text-wipe` to any heading or text
```html
<h1 class="text-wipe">A boutique product marketing agency for high-growth tech companies.</h1>
<h2 data-text-wipe>Accelerate your growth with data-driven strategy.</h2>
```
*The script will automatically detect the element, wrap each word into an overflow-hidden mask, and wipe them up smoothly when they scroll into view.*

---

## ⚙️ Custom Configuration (Optional)

You can customize the speed, delay, and timing curve:

```javascript
initTextWipe('.custom-headline', {
  delayStep: 35,                                // milliseconds between each word
  duration: '0.85s',                            // transition speed
  timingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)', // exact Olivine deceleration curve
  threshold: 0.15                               // trigger when 15% visible
});
```

---

## ⚛️ Usage in React / Next.js / Vue

### React Component Example:
{% raw %}
```jsx
import { useEffect, useRef } from 'react';

export function TextWipe({ text, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.querySelectorAll('.animation-segment-wrapper').forEach(w => {
          w.classList.add('animation-segmented-flex-fired');
        });
        observer.unobserve(el);
      }
    }, { threshold: 0.1 });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(' ');

  return (
    <h1 ref={containerRef} className={className}>
      {words.map((word, i) => (
        <span key={i} className="animation-segment-wrapper" style={{ display: 'inline-flex', overflow: 'hidden', marginRight: '0.28em' }}>
          <span
            className="animation-segment-interior"
            style={{
              display: 'inline-block',
              transition: 'transform 0.85s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.85s ease',
              transitionDelay: `${i * 32}ms`
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </h1>
  );
}
```
{% endraw %}
