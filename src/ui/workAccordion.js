// ============================================
// Work Item Accordion Toggle
// ============================================
export function initWorkAccordion() {
    document.querySelectorAll('.work-item-header').forEach(header => {
        header.addEventListener('click', () => {
            const wrapper = header.closest('.work-item-wrapper');
            if (wrapper) wrapper.classList.toggle('expanded');
        });
    });
}
