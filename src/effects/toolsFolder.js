function getToolName(tool) {
    return tool.getAttribute('aria-label') || tool.getAttribute('title') || 'Tool';
}

let isAnimating = false;

function openFolder(folder) {
    if (isAnimating) return;
    isAnimating = true;

    const wrapper = folder.parentElement;
    folder._wrapper = wrapper; // Save wrapper reference

    const grid = folder.querySelector('.tools-folder-grid');
    const skills = [...grid.querySelectorAll('.skill')];
    const backdrop = document.querySelector('.tools-backdrop');

    wrapper.classList.add('active-parent');
    backdrop.classList.add('active');

    // Make folder itself unfocusable, and skills focusable
    folder.setAttribute('tabindex', '-1');
    skills.forEach(skill => skill.setAttribute('tabindex', '0'));

    // 1. FIRST: Get initial screen bounding rects in closed state (measure before portal)
    const firstFolderRect = folder.getBoundingClientRect();
    const firstSkillRects = skills.map(skill => skill.getBoundingClientRect());

    // Cache these closed rects on the folder object so closeFolder can use them directly
    folder._closedFolderRect = firstFolderRect;
    folder._closedSkillRects = firstSkillRects;

    // 2. STATE CHANGE & PORTAL: Append to body to avoid parent filter/blur/stacking issues, and add active class
    document.body.appendChild(folder);
    folder.classList.add('active');

    // 3. LAST: Get final target bounding rects in open modal state
    const lastFolderRect = folder.getBoundingClientRect();
    const lastSkillRects = skills.map(skill => skill.getBoundingClientRect());

    // 4. INVERT: Calculate offsets and scales based on centers
    const scaleP = firstFolderRect.width / lastFolderRect.width;

    const C_p_first = {
        x: firstFolderRect.left + firstFolderRect.width / 2,
        y: firstFolderRect.top + firstFolderRect.height / 2
    };
    const C_p_last = {
        x: lastFolderRect.left + lastFolderRect.width / 2,
        y: lastFolderRect.top + lastFolderRect.height / 2
    };

    const folderDeltaX = C_p_first.x - C_p_last.x;
    const folderDeltaY = C_p_first.y - C_p_last.y;

    // Apply parent invert transform instantly
    folder.style.transform = `translate(${folderDeltaX}px, ${folderDeltaY}px) scale(${scaleP})`;
    folder.style.transition = 'none';

    // Apply child icon invert transforms instantly
    skills.forEach((skill, idx) => {
        if (idx < 9) {
            const firstRect = firstSkillRects[idx];
            const lastRect = lastSkillRects[idx];

            const C_c_first = {
                x: firstRect.left + firstRect.width / 2,
                y: firstRect.top + firstRect.height / 2
            };
            const C_c_last = {
                x: lastRect.left + lastRect.width / 2,
                y: lastRect.top + lastRect.height / 2
            };

            const scaleCInitial = firstRect.width / lastRect.width;
            const scaleC = scaleCInitial / scaleP;

            const translateCX = (C_c_first.x - C_p_first.x) / scaleP - (C_c_last.x - C_p_last.x);
            const translateCY = (C_c_first.y - C_p_first.y) / scaleP - (C_c_last.y - C_p_last.y);

            skill.style.transform = `translate(${translateCX}px, ${translateCY}px) scale(${scaleC})`;
        } else {
            // Explode from closed folder center
            const lastRect = lastSkillRects[idx];
            const C_c_last = {
                x: lastRect.left + lastRect.width / 2,
                y: lastRect.top + lastRect.height / 2
            };

            const translateCX = 0 - (C_c_last.x - C_p_last.x);
            const translateCY = 0 - (C_c_last.y - C_p_last.y);

            skill.style.transform = `translate(${translateCX}px, ${translateCY}px) scale(0.2)`;
            skill.style.opacity = '0';
        }
        skill.style.transition = 'none';
    });

    // Force reflow
    folder.offsetHeight;

    // 5. PLAY: Animate to identity (transform: none)
    const folderTransition = 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.48s ease, border-radius 0.48s ease, box-shadow 0.48s ease';
    folder.style.transition = folderTransition;
    folder.style.transform = '';

    const skillTransition = 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-radius 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.48s cubic-bezier(0.16, 1, 0.3, 1)';
    skills.forEach((skill, idx) => {
        skill.style.transition = skillTransition;
        skill.style.transform = '';
        if (idx >= 9) {
            const staggerDelay = (idx - 9) * 0.03;
            skill.style.transitionDelay = `${staggerDelay}s`;
            skill.style.opacity = '1';
        } else {
            skill.style.transitionDelay = '0s';
        }
    });

    // Focus first skill for screen readers
    skills[0]?.focus();

    // Clean up
    const onTransitionEnd = (e) => {
        if (e.target === folder && e.propertyName === 'transform') {
            folder.style.transition = '';
            folder.style.transform = '';
            skills.forEach(skill => {
                skill.style.transition = '';
                skill.style.transform = '';
                skill.style.transitionDelay = '';
                skill.style.opacity = '';
            });
            folder.removeEventListener('transitionend', onTransitionEnd);
            isAnimating = false;
        }
    };
    folder.addEventListener('transitionend', onTransitionEnd);
}

function closeFolder(folder) {
    if (isAnimating) return;
    isAnimating = true;

    const wrapper = folder._wrapper;
    const grid = folder.querySelector('.tools-folder-grid');
    const skills = [...grid.querySelectorAll('.skill')];
    const backdrop = document.querySelector('.tools-backdrop');

    backdrop.classList.remove('active');
    wrapper.classList.remove('active-parent');

    // Make folder focusable, and skills unfocusable
    folder.setAttribute('tabindex', '0');
    skills.forEach(skill => skill.setAttribute('tabindex', '-1'));

    // 1. FIRST: Get current bounds (centered modal state)
    const firstFolderRect = folder.getBoundingClientRect();
    const firstSkillRects = skills.map(skill => skill.getBoundingClientRect());

    // 2. LAST: Retrieve cached target bounds of the closed state
    const lastFolderRect = folder._closedFolderRect;
    const lastSkillRects = folder._closedSkillRects;

    // 3. INVERT: Calculate offsets based on centers
    const scaleP = lastFolderRect.width / firstFolderRect.width;

    const C_p_first = {
        x: firstFolderRect.left + firstFolderRect.width / 2,
        y: firstFolderRect.top + firstFolderRect.height / 2
    };
    const C_p_last = {
        x: lastFolderRect.left + lastFolderRect.width / 2,
        y: lastFolderRect.top + lastFolderRect.height / 2
    };

    const folderDeltaX = C_p_last.x - C_p_first.x;
    const folderDeltaY = C_p_last.y - C_p_first.y;

    // Set transitions to none instantly to ensure starting from identity (expanded state)
    folder.style.transition = 'none';
    skills.forEach(skill => {
        skill.style.transition = 'none';
        skill.style.transform = '';
        skill.style.opacity = '';
    });

    // Force layout reflow
    folder.offsetHeight;

    // Enable transitions for play phase
    const folderTransition = 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.48s ease, border-radius 0.48s ease, box-shadow 0.48s ease';
    folder.style.transition = folderTransition;

    const skillTransition = 'transform 0.48s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease, border-radius 0.48s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.48s cubic-bezier(0.16, 1, 0.3, 1)';
    skills.forEach(skill => {
        skill.style.transition = skillTransition;
    });

    // 4. PLAY: Animate folder and items back to their closed target coordinate offsets
    folder.style.transform = `translate(${folderDeltaX}px, ${folderDeltaY}px) scale(${scaleP})`;

    skills.forEach((skill, idx) => {
        const firstRect = firstSkillRects[idx];
        const lastRect = lastSkillRects[idx];

        if (idx < 9) {
            const C_c_first = {
                x: firstRect.left + firstRect.width / 2,
                y: firstRect.top + firstRect.height / 2
            };
            const C_c_last = {
                x: lastRect.left + lastRect.width / 2,
                y: lastRect.top + lastRect.height / 2
            };

            const scaleCInitial = lastRect.width / firstRect.width;
            const scaleC = scaleCInitial / scaleP;

            // Invert translation calculation for closing transition
            const translateCX = (C_c_last.x - C_p_last.x) - (C_c_first.x - C_p_first.x) * scaleP;
            const translateCY = (C_c_last.y - C_p_last.y) - (C_c_first.y - C_p_first.y) * scaleP;

            skill.style.transform = `translate(${translateCX}px, ${translateCY}px) scale(${scaleC})`;
        } else {
            // Non-shared items (10th+) scale and slide back to the closed folder center
            const C_c_first = {
                x: firstRect.left + firstRect.width / 2,
                y: firstRect.top + firstRect.height / 2
            };

            const translateCX = 0 - (C_c_first.x - C_p_first.x);
            const translateCY = 0 - (C_c_first.y - C_p_first.y);

            skill.style.transform = `translate(${translateCX}px, ${translateCY}px) scale(0.2)`;
            skill.style.opacity = '0';
        }
    });

    // Clean up and restore DOM hierarchy
    const onTransitionEnd = (e) => {
        if (e.target === folder && e.propertyName === 'transform') {
            folder.style.transition = '';
            folder.style.transform = '';
            skills.forEach(skill => {
                skill.style.transition = '';
                skill.style.transform = '';
                skill.style.opacity = '';
            });

            // Permanent restore folder to its wrapper in DOM flow
            folder.classList.remove('active');
            wrapper.appendChild(folder);

            // Restore focus to folder card for keyboard access
            folder.focus();

            folder.removeEventListener('transitionend', onTransitionEnd);
            isAnimating = false;
        }
    };
    folder.addEventListener('transitionend', onTransitionEnd);
}

export function initToolsFolder() {
    const skillsContainer = document.querySelector('#about .subsection .skills');
    if (!skillsContainer) return;

    const tools = [...skillsContainer.querySelectorAll('.skill')];
    if (!tools.length) return;

    // Create backdrop if it does not exist
    let backdrop = document.querySelector('.tools-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'tools-backdrop';
        document.body.appendChild(backdrop);
    }

    // Set up global click listener on the backdrop once
    backdrop.addEventListener('click', () => {
        const activeFolder = document.querySelector('.tools-folder.active');
        if (activeFolder) {
            closeFolder(activeFolder);
        }
    });

    // Define categories and their corresponding tools
    const categories = [
        {
            title: "Languages & Frameworks",
            tools: ["Python", "Rust", "Django", "FastAPI", "SQL"]
        },
        {
            title: "DevOps & OS",
            tools: ["Docker", "Kali Linux", "PowerShell"]
        },
        {
            title: "Editors & Shell",
            tools: ["VS Code", "Vim"]
        }
    ];

    // Create the folders grid container
    const foldersContainer = document.createElement('div');
    foldersContainer.className = 'tools-folders-container';

    // Build each folder dynamically
    categories.forEach(category => {
        const wrapper = document.createElement('div');
        wrapper.className = 'tools-folder-wrapper';

        const folder = document.createElement('div');
        folder.className = 'tools-folder';
        folder.setAttribute('tabindex', '0'); // Make focusable when closed

        const openTitle = document.createElement('div');
        openTitle.className = 'tools-folder-title';
        openTitle.textContent = category.title;
        folder.appendChild(openTitle);

        const grid = document.createElement('div');
        grid.className = 'tools-folder-grid';
        folder.appendChild(grid);

        let matchedToolsCount = 0;

        category.tools.forEach(toolName => {
            // Find matching tool inside original list (case insensitive or exact check)
            const tool = tools.find(t => getToolName(t) === toolName);
            if (tool) {
                matchedToolsCount++;
                tool.setAttribute('tabindex', '-1'); // Unfocusable when folder is closed

                // Add text label span if not already present
                let label = tool.querySelector('.skill-label');
                if (!label) {
                    label = document.createElement('span');
                    label.className = 'skill-label';
                    label.textContent = toolName;
                    tool.appendChild(label);
                }

                grid.appendChild(tool);

                // Prevent links from navigating while folder is closed
                tool.addEventListener('click', (event) => {
                    if (!folder.classList.contains('active')) {
                        event.preventDefault();
                        event.stopPropagation();
                        openFolder(folder);
                    }
                });
            }
        });

        // Only add the folder to the screen if it contains tools
        if (matchedToolsCount > 0) {
            const folderLabel = document.createElement('div');
            folderLabel.className = 'tools-folder-label';
            folderLabel.textContent = category.title;

            wrapper.appendChild(folder);
            wrapper.appendChild(folderLabel);
            foldersContainer.appendChild(wrapper);

            // Folder click event to expand it
            folder.addEventListener('click', (event) => {
                if (folder.classList.contains('active')) {
                    event.stopPropagation();
                } else {
                    openFolder(folder);
                }
            });

            // Keyboard support (Enter/Space)
            folder.addEventListener('keydown', (event) => {
                if (!folder.classList.contains('active') && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    openFolder(folder);
                }
            });
        }
    });

    // Replace the original skills grid in DOM
    skillsContainer.replaceWith(foldersContainer);
}
