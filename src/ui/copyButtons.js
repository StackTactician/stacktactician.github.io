// ============================================
// Copy Social Links to Clipboard (Phase 3)
// ============================================
export function initCopyButtons() {
    const buttons = document.querySelectorAll('.copy-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const textToCopy = btn.getAttribute('data-copy');
            if (!textToCopy) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                
                // Trigger checkmark path-draw animation
                btn.classList.add('copied');
                
                setTimeout(() => {
                    btn.classList.remove('copied');
                }, 3000);
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }
        });
    });
}
