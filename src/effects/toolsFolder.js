function getToolName(tool) {
    return tool.getAttribute('aria-label') || tool.getAttribute('title') || 'Tool';
}

function buildPreviewIcon(tool, index) {
    const icon = document.createElement('span');
    icon.className = 'tools-folder-preview-icon';
    icon.style.setProperty('--slot', index);
    icon.innerHTML = tool.innerHTML;
    return icon;
}

function setExpanded(folder, isExpanded) {
    const panel = folder.querySelector('.tools-folder-panel');
    const button = folder.querySelector('.tools-folder-cover');
    const tools = [...folder.querySelectorAll('.tools-folder-panel .skill')];

    folder.classList.toggle('is-open', isExpanded);
    button.setAttribute('aria-expanded', String(isExpanded));
    panel.setAttribute('aria-hidden', String(!isExpanded));

    tools.forEach((tool, index) => {
        tool.style.setProperty('--tool-index', index);
    });
}

function wireDragSquash(folder) {
    const cover = folder.querySelector('.tools-folder-cover');
    let startX = 0;
    let startY = 0;
    let dragging = false;

    const reset = () => {
        cover.style.setProperty('--drag-x', '0px');
        cover.style.setProperty('--drag-y', '0px');
        cover.style.setProperty('--drag-scale-x', '1');
        cover.style.setProperty('--drag-scale-y', '1');
        cover.classList.add('is-snapping');
        window.setTimeout(() => cover.classList.remove('is-snapping'), 360);
        dragging = false;
    };

    cover.addEventListener('pointerdown', (event) => {
        dragging = true;
        startX = event.clientX;
        startY = event.clientY;
        cover.classList.remove('is-snapping');
        cover.setPointerCapture(event.pointerId);
    });

    cover.addEventListener('pointermove', (event) => {
        if (!dragging) return;
        const dx = Math.max(-18, Math.min(18, event.clientX - startX));
        const dy = Math.max(-18, Math.min(18, event.clientY - startY));
        const stretch = Math.min(0.08, Math.hypot(dx, dy) / 280);

        cover.style.setProperty('--drag-x', `${dx}px`);
        cover.style.setProperty('--drag-y', `${dy}px`);
        cover.style.setProperty('--drag-scale-x', String(1 + stretch));
        cover.style.setProperty('--drag-scale-y', String(1 - stretch * 0.75));
    });

    cover.addEventListener('pointerup', reset);
    cover.addEventListener('pointercancel', reset);
    cover.addEventListener('lostpointercapture', reset);
}

export function initToolsFolder() {
    const skills = document.querySelector('#about .subsection .skills');
    if (!skills || skills.classList.contains('tools-folder-panel')) return;

    const tools = [...skills.querySelectorAll('.skill')];
    if (!tools.length) return;

    const folder = document.createElement('div');
    folder.className = 'tools-folder';

    const cover = document.createElement('button');
    cover.className = 'tools-folder-cover';
    cover.type = 'button';
    cover.setAttribute('aria-expanded', 'false');
    cover.setAttribute('aria-controls', 'tools-folder-panel');
    cover.innerHTML = `
        <span class="tools-folder-preview" aria-hidden="true"></span>
        <span class="tools-folder-label">Open toolkit</span>
    `;

    const preview = cover.querySelector('.tools-folder-preview');
    tools.slice(0, 9).forEach((tool, index) => preview.appendChild(buildPreviewIcon(tool, index)));

    const hint = document.createElement('p');
    hint.className = 'tools-folder-hint';
    hint.textContent = 'Tap the folder to expand my stack.';

    skills.id = 'tools-folder-panel';
    skills.classList.add('tools-folder-panel');
    skills.setAttribute('aria-hidden', 'true');
    tools.forEach((tool) => tool.setAttribute('title', getToolName(tool)));

    skills.replaceWith(folder);
    folder.append(cover, skills, hint);

    cover.addEventListener('click', () => setExpanded(folder, !folder.classList.contains('is-open')));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && folder.classList.contains('is-open')) setExpanded(folder, false);
    });

    wireDragSquash(folder);
    setExpanded(folder, false);
}
