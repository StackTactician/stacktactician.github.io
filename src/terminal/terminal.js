// ============================================
// Interactive Terminal
// ============================================
export function initTerminal() {
    const input = document.getElementById('terminalInput');
    const output = document.getElementById('terminalOutput');
    if (!input || !output) return;

    const commands = {
        help: () => {
            return `Available commands:
  <span class="terminal-cmd">help</span>          - Show this help message
  <span class="terminal-cmd">download --resume</span> - Download my resume
  <span class="terminal-cmd">about</span>         - Learn about me
  <span class="terminal-cmd">skills</span>        - List my skills
  <span class="terminal-cmd">contact</span>       - Get my contact info
  <span class="terminal-cmd">clear</span>         - Clear the terminal`;
        },
        'download --resume': () => {
            // Trigger download
            const link = document.createElement('a');
            link.href = 'assets/resume.pdf';
            link.download = 'Mubarak_Mustapha_Resume.pdf';
            link.click();
            return 'Downloading resume...';
        },
        about: () => {
            document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
            return 'Scrolling to About section...';
        },
        skills: () => {
            return `My skills:
  • Scripting
  • Python
  • Django / FastAPI
  • SQL
  • Basic Linux`;
        },
        contact: () => {
            return `Contact me:
  Email: mmmoyosore09@gmail.com
  GitHub: github.com/StackTactician
  LinkedIn: linkedin.com/in/mubarak-mustapha-75b4b6300`;
        },
        clear: () => {
            output.innerHTML = '';
            return null; // No output
        }
    };

    const addLine = (text, isCommand = false) => {
        if (text === null) return;
        const line = document.createElement('div');
        line.className = 'terminal-line';

        if (isCommand) {
            const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            line.innerHTML = `<span class="terminal-prompt">$</span> ${escaped}`;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
        } else {
            // Typing animation for output
            output.appendChild(line); // Append empty line first

            let i = 0;
            // Preserving HTML tags during typing is tricky, so for simplicity we'll 
            // set innerHTML immediately but hide it, then reveal chars? 
            // Actually, simplest consistent way for this scale is to just type plain text 
            // or render HTML immediately if it contains tags to avoid breaking markup.

            if (text.includes('<')) {
                // If contains HTML (like the help command), render immediately for safety
                line.innerHTML = text.replace(/\n/g, '<br>');
                output.scrollTop = output.scrollHeight;
            } else {
                // Plain text - type it out
                const typeChar = () => {
                    if (i < text.length) {
                        line.textContent += text.charAt(i);
                        i++;
                        output.scrollTop = output.scrollHeight;
                        setTimeout(typeChar, 10); // 10ms speed
                    }
                };
                typeChar();
            }
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.trim().toLowerCase();
            if (!cmd) return;

            addLine(input.value, true);
            input.value = '';

            const handler = commands[cmd];
            if (handler) {
                const result = handler();
                addLine(result);
            } else {
                addLine(`Command not found: ${cmd}. Type <span class="terminal-cmd">help</span> for available commands.`);
            }
        }
    });

    // Minimize/restore toggle
    const terminal = document.getElementById('terminal');
    const minimizeBtn = document.getElementById('terminalMinimize');
    const header = document.getElementById('terminalHeader');

    let ignoreNextClick = false;

    if (minimizeBtn && terminal) {
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop click from bubbling up to the terminal container
            if (ignoreNextClick) {
                ignoreNextClick = false;
                return;
            }
            terminal.classList.toggle('minimized');
            minimizeBtn.innerHTML = terminal.classList.contains('minimized') ? '&gt;_' : '−';
        });
    }

    // Focus terminal when clicking on it, or restore if minimized
    terminal?.addEventListener('click', (e) => {
        if (ignoreNextClick) {
            ignoreNextClick = false;
            return;
        }
        if (terminal.classList.contains('minimized')) {
            terminal.classList.remove('minimized');
            if (minimizeBtn) minimizeBtn.innerHTML = '−';
            setTimeout(() => input.focus(), 150);
        } else {
            if (e.target.closest('.terminal-minimize')) return;
            input.focus();
        }
    });

    // Make terminal draggable via header
    if (terminal && header) {
        let isDragging = false;
        let startX, startY;
        let initialLeft, initialTop;
        let terminalWidth, terminalHeight;
        let hasMoved = false;

        const onStart = (e) => {
            if (e.type === 'mousedown' && e.button !== 0) return;

            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

            // Don't drag if clicking minimize button unless minimized
            if (!terminal.classList.contains('minimized') && e.target.closest('.terminal-minimize')) {
                return;
            }

            isDragging = true;
            hasMoved = false;
            startX = clientX;
            startY = clientY;

            const rect = terminal.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            terminalWidth = rect.width;
            terminalHeight = rect.height;

            terminal.style.bottom = 'auto';
            terminal.style.right = 'auto';
            terminal.style.left = `${initialLeft}px`;
            terminal.style.top = `${initialTop}px`;
            terminal.classList.add('dragging');

            if (e.type === 'mousedown') {
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onEnd);
            } else {
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend', onEnd);
            }
        };

        const onMove = (e) => {
            if (!isDragging) return;
            if (e.type === 'touchmove') e.preventDefault();

            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                hasMoved = true;
            }

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            const minLeft = 0;
            const maxLeft = window.innerWidth - terminalWidth;
            const minTop = 0;
            const maxTop = window.innerHeight - terminalHeight;

            newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
            newTop = Math.max(minTop, Math.min(newTop, maxTop));

            terminal.style.left = `${newLeft}px`;
            terminal.style.top = `${newTop}px`;
        };

        const onEnd = () => {
            isDragging = false;
            terminal.classList.remove('dragging');

            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);

            if (hasMoved) {
                ignoreNextClick = true;
                setTimeout(() => {
                    ignoreNextClick = false;
                }, 50);
            }
        };

        header.addEventListener('mousedown', onStart);
        header.addEventListener('touchstart', onStart, { passive: true });
    }
}
