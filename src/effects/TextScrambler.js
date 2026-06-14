// ============================================
// Scramble Text on Hover (Phase 5)
// ============================================
export class TextScrambler {
    constructor(element, triggerElement = null) {
        this.element = element;
        this.triggerElement = triggerElement || element;
        this.originalText = element.textContent;
        this.chars = '!@#$01_x*?[]{}<>-+=';
        this.isAnimating = false;
        this.frameRequest = null;

        this.triggerElement.addEventListener('mouseenter', () => this.scramble());
    }

    scramble() {
        if (this.isAnimating) {
            cancelAnimationFrame(this.frameRequest);
        }

        this.isAnimating = true;
        let frame = 0;
        const totalFrames = 25; // Speed of resolving
        const textLength = this.originalText.length;

        const tick = () => {
            let output = '';
            let completeCount = 0;

            for (let i = 0; i < textLength; i++) {
                const threshold = (frame / totalFrames) * textLength;

                if (this.originalText[i] === ' ') {
                    output += ' ';
                    if (i < threshold) completeCount++;
                } else if (i < threshold) {
                    output += this.originalText[i];
                    completeCount++;
                } else if (i < threshold + 3) {
                    output += this.chars[Math.floor(Math.random() * this.chars.length)];
                } else {
                    output += this.chars[Math.floor(Math.random() * this.chars.length)];
                }
            }

            this.element.textContent = output;

            if (completeCount < textLength) {
                frame++;
                this.frameRequest = requestAnimationFrame(tick);
            } else {
                this.isAnimating = false;
                this.element.textContent = this.originalText;
            }
        };

        this.frameRequest = requestAnimationFrame(tick);
    }
}

export function initTextScramble() {
    // Hero Title Spans
    const heroSpans = document.querySelectorAll('.hero-title span');
    heroSpans.forEach(span => new TextScrambler(span));

    // Section Titles
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => new TextScrambler(title));

    // Work Item Names
    const workItems = document.querySelectorAll('.work-item');
    workItems.forEach(item => {
        const name = item.querySelector('.work-name');
        if (name) {
            new TextScrambler(name, item);
        }
    });

    // Buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => new TextScrambler(btn));
}
