import { i18n } from '../i18n/index.js';

/**
 * Poll Type Selector Component — Styled Dropdown
 * Allows user to choose between: Single Choice, Multiple Choice, Rating, Numeric
 */
export function renderPollTypeSelector(selectedType, onSelectType) {
  const pollTypes = [
    {
      id: 'single_choice',
      icon: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="12" r="3.5" fill="currentColor"/>
        </svg>
      `,
      title: i18n.t('createPoll.pollTypes.single_choice.title'),
      description: i18n.t('createPoll.pollTypes.single_choice.description')
    },
    {
      id: 'multiple_choice',
      icon: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M8 12l2.8 2.8L16 9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,
      title: i18n.t('createPoll.pollTypes.multiple_choice.title'),
      description: i18n.t('createPoll.pollTypes.multiple_choice.description')
    },
    {
      id: 'rating',
      icon: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3.7 14.5 9l5.8.8-4.2 4.1 1 5.8L12 17l-5.1 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.7Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      `,
      title: i18n.t('createPoll.pollTypes.rating.title'),
      description: i18n.t('createPoll.pollTypes.rating.description')
    },
    {
      id: 'numeric',
      icon: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M8 4 6 20M18 4l-2 16M4 9h17M3 15h17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `,
      title: i18n.t('createPoll.pollTypes.numeric.title'),
      description: i18n.t('createPoll.pollTypes.numeric.description')
    }
  ];

  const container = document.createElement('div');
  container.className = 'poll-type-selector';

  const selected = pollTypes.find(t => t.id === selectedType) || pollTypes[0];

  container.innerHTML = `
    <style>
      .poll-type-selector {
        position: relative;
        margin: 0.5rem 0;
      }

      .poll-type-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border: 2px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: border-color 0.2s;
        font-family: inherit;
        font-size: 1rem;
        text-align: left;
      }

      .poll-type-trigger:hover,
      .poll-type-trigger:focus {
        border-color: var(--primary-color, #6366f1);
        outline: none;
      }

      .poll-type-trigger-icon {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 6px;
        color: var(--primary-color, #6366f1);
        flex-shrink: 0;
      }

      .poll-type-trigger-icon svg,
      .poll-type-option-icon svg {
        width: 18px;
        height: 18px;
        display: block;
      }

      .poll-type-trigger-text {
        flex: 1;
      }

      .poll-type-trigger-title {
        font-weight: 600;
        color: var(--text-color, #111827);
        font-size: 0.9375rem;
      }

      .poll-type-trigger-desc {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        margin-top: 0.125rem;
      }

      .poll-type-chevron {
        width: 20px;
        height: 20px;
        color: var(--text-secondary, #9ca3af);
        flex-shrink: 0;
        transition: transform 0.2s;
      }

      .poll-type-selector.open .poll-type-chevron {
        transform: rotate(180deg);
      }

      .poll-type-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: white;
        border: 2px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        z-index: 50;
        display: none;
        overflow: hidden;
      }

      .poll-type-selector.open .poll-type-dropdown {
        display: block;
      }

      .poll-type-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: background 0.15s;
      }

      .poll-type-option:hover {
        background: rgba(99, 102, 241, 0.05);
      }

      .poll-type-option.active {
        background: rgba(99, 102, 241, 0.08);
      }

      .poll-type-option-icon {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 6px;
        color: var(--primary-color, #6366f1);
        flex-shrink: 0;
      }

      .poll-type-option-text {
        flex: 1;
      }

      .poll-type-option-title {
        font-weight: 600;
        color: var(--text-color, #111827);
        font-size: 0.875rem;
      }

      .poll-type-option-desc {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
      }

      .poll-type-option .check-icon {
        width: 20px;
        height: 20px;
        color: var(--primary-color, #6366f1);
        flex-shrink: 0;
        display: none;
      }

      .poll-type-option.active .check-icon {
        display: block;
      }
    </style>

    <button type="button" class="poll-type-trigger" id="poll-type-trigger">
      <span class="poll-type-trigger-icon">${selected.icon}</span>
      <span class="poll-type-trigger-text">
        <span class="poll-type-trigger-title">${selected.title}</span>
        <span class="poll-type-trigger-desc">${selected.description}</span>
      </span>
      <svg class="poll-type-chevron" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    </button>

    <div class="poll-type-dropdown" id="poll-type-dropdown">
      ${pollTypes.map(type => `
        <div class="poll-type-option ${selectedType === type.id ? 'active' : ''}" data-type="${type.id}">
          <span class="poll-type-option-icon">${type.icon}</span>
          <span class="poll-type-option-text">
            <span class="poll-type-option-title">${type.title}</span>
            <span class="poll-type-option-desc">${type.description}</span>
          </span>
          <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
      `).join('')}
    </div>
  `;

  const trigger = container.querySelector('#poll-type-trigger');
  const dropdown = container.querySelector('#poll-type-dropdown');

  // Toggle dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.toggle('open');
  });

  // Close on outside click
  document.addEventListener('click', () => {
    container.classList.remove('open');
  });

  container.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Select option
  dropdown.querySelectorAll('.poll-type-option').forEach(option => {
    option.addEventListener('click', () => {
      const type = option.dataset.type;
      const typeData = pollTypes.find(t => t.id === type);

      // Update trigger display
      container.querySelector('.poll-type-trigger-icon').innerHTML = typeData.icon;
      container.querySelector('.poll-type-trigger-title').textContent = typeData.title;
      container.querySelector('.poll-type-trigger-desc').textContent = typeData.description;

      // Update active state
      dropdown.querySelectorAll('.poll-type-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');

      // Close dropdown
      container.classList.remove('open');

      // Callback
      if (onSelectType) {
        onSelectType(type);
      }
    });
  });

  return container;
}
