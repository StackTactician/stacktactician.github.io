// ============================================
// Contact Form Handling (Formspree)
// ============================================
export function initContactForm() {
    const form = document.getElementById('contactForm');

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn = form.querySelector('.btn-submit');
            const btnText = btn?.querySelector('.btn-text');
            if (!btn || !btnText) return;
            const originalText = btnText.textContent;

            // Check custom validity
            const nameInput = form.querySelector('#name');
            const emailInput = form.querySelector('#email');
            const messageInput = form.querySelector('#message');

            let errorMsg = '';
            if (!nameInput || !nameInput.value.trim()) {
                errorMsg = 'PLEASE ENTER YOUR NAME';
            } else if (!emailInput || !emailInput.value.trim()) {
                errorMsg = 'PLEASE ENTER YOUR EMAIL';
            } else if (emailInput && !emailInput.checkValidity()) {
                errorMsg = 'PLEASE ENTER A VALID EMAIL';
            } else if (!messageInput || !messageInput.value.trim()) {
                errorMsg = 'PLEASE ENTER YOUR MESSAGE';
            }

            if (errorMsg) {
                // Shake and show error text
                btnText.textContent = errorMsg;
                btn.classList.add('error');

                setTimeout(() => {
                    btnText.textContent = originalText;
                    btn.classList.remove('error');
                }, 3000);
                return;
            }

            // Set loading state
            btnText.textContent = 'SENDING...';
            btn.classList.add('loading');

            const data = new FormData(form);
            const action = form.action;

            try {
                const response = await fetch(action, {
                    method: 'POST',
                    body: data,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Success
                    btnText.textContent = 'MESSAGE SENT!';
                    btn.classList.add('success');
                    form.reset();

                    // Reset button after 3 seconds
                    setTimeout(() => {
                        btnText.textContent = originalText;
                        btn.classList.remove('loading', 'success');
                    }, 3000);
                } else {
                    // Error
                    btnText.textContent = 'SEND FAILED!';
                    btn.classList.add('error');

                    setTimeout(() => {
                        btnText.textContent = originalText;
                        btn.classList.remove('loading', 'error');
                    }, 3000);
                }
            } catch (error) {
                btnText.textContent = 'NETWORK ERROR!';
                btn.classList.add('error');
                setTimeout(() => {
                    btnText.textContent = originalText;
                    btn.classList.remove('loading', 'error');
                }, 3000);
            }
        });
    }
}
