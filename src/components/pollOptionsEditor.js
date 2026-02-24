import { i18n } from '../i18n/index.js';

/**
 * Poll Options Editor Component
 * Dynamic list of options for Single Choice and Multiple Choice polls
 * Minimum 2 options required
 */
export function renderPollOptionsEditor(options = ['', ''], onChange) {
  const container = document.createElement('div');
  container.className = 'poll-options-editor';

  function updateOptions(newOptions) {
    options = newOptions;
    if (onChange) {
      onChange(newOptions);
    }
    render();
  }

  function addOption() {
    const newOptions = [...options, ''];
    updateOptions(newOptions);
  }

  function removeOption(index) {
    if (options.length <= 2) return; // Minimum 2 options
    const newOptions = options.filter((_, i) => i !== index);
    updateOptions(newOptions);
  }

  function updateOption(index, value) {
    const newOptions = [...options];
    newOptions[index] = value;
    options = newOptions;
    if (onChange) {
      onChange(newOptions);
    }
  }

  function render() {
    container.innerHTML = `
      <style>
        .poll-options-editor {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .option-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .option-number {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-color, #6366f1);
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .option-input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .option-input:focus {
          outline: none;
          border-color: var(--primary-color, #6366f1);
        }

        .option-input.error {
          border-color: var(--error-color, #ef4444);
        }

        .remove-option-btn {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 2px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          cursor: pointer;
          color: var(--text-secondary, #6b7280);
          transition: all 0.2s;
          padding: 0;
        }

        .remove-option-btn:hover:not(:disabled) {
          background: var(--error-color, #ef4444);
          border-color: var(--error-color, #ef4444);
          color: white;
        }

        .remove-option-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .add-option-btn {
          align-self: flex-start;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: 2px dashed var(--primary-color, #6366f1);
          border-radius: 8px;
          color: var(--primary-color, #6366f1);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .add-option-btn:hover {
          background: rgba(99, 102, 241, 0.05);
        }

        .options-hint {
          font-size: 0.875rem;
          color: var(--text-secondary, #6b7280);
          margin-top: 0.5rem;
        }
      </style>

      <div class="options-list">
        ${options.map((option, index) => `
          <div class="option-item" data-index="${index}">
            <div class="option-number">${index + 1}</div>
            <input 
              type="text" 
              class="option-input" 
              placeholder="${i18n.t('createPoll.placeholders.option').replace('{number}', index + 1)}"
              value="${option}"
              data-index="${index}"
            />
            <button 
              class="remove-option-btn" 
              data-index="${index}"
              ${options.length <= 2 ? 'disabled' : ''}
              title="${i18n.t('createPoll.actions.removeOption')}"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 5L15 15M5 15L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>

      <button class="add-option-btn">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 5V15M5 10H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        ${i18n.t('createPoll.actions.addOption')}
      </button>

      <p class="options-hint">
        ${i18n.t('createPoll.validation.minTwoOptions')}
      </p>
    `;

    // Add event listeners for inputs
    container.querySelectorAll('.option-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        updateOption(index, e.target.value);
      });
    });

    // Add event listeners for remove buttons
    container.querySelectorAll('.remove-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.closest('button').dataset.index);
        removeOption(index);
      });
    });

    // Add event listener for add button
    const addBtn = container.querySelector('.add-option-btn');
    if (addBtn) {
      addBtn.addEventListener('click', addOption);
    }
  }

  render();
  return container;
}
