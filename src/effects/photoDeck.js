// ============================================
// Fan-Out Photo Deck Interactions
// ============================================
export function initPhotoDeck() {
    const deck = document.querySelector('.photo-deck');
    if (!deck) return;

    const cards = deck.querySelectorAll('.photo-card');
    const captions = document.querySelectorAll('.photo-caption');

    const setActiveCard = (card) => {
        cards.forEach(c => c.classList.remove('active'));
        captions.forEach(cap => cap.classList.remove('active'));

        if (card) {
            card.classList.add('active');
            deck.classList.add('fanned');
            
            // Activate corresponding caption
            const index = Array.from(cards).indexOf(card);
            const caption = document.getElementById(`caption-card-${index + 1}`);
            if (caption) {
                caption.classList.add('active');
            }
        } else {
            deck.classList.remove('fanned');
        }
    };

    // Toggle fan state on clicking the deck container if it's not fanned yet
    deck.addEventListener('click', (e) => {
        const isFanned = deck.classList.contains('fanned');
        if (!isFanned) {
            deck.classList.add('fanned');
            e.stopPropagation();
        }
    });

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const isFanned = deck.classList.contains('fanned');
            const isActive = card.classList.contains('active');
            
            if (!isFanned) {
                setActiveCard(card);
            } else {
                if (isActive) {
                    setActiveCard(null);
                } else {
                    setActiveCard(card);
                }
            }
        });
    });

    // Tap/Click outside to collapse and unfocus
    document.addEventListener('click', (e) => {
        if (!deck.contains(e.target)) {
            setActiveCard(null);
        }
    });
}
