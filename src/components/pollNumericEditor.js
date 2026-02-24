import { i18n } from '../i18n/index.js';

/**
 * Poll Numeric Editor Component
 * Min/Max value inputs for numeric polls
 */
export function renderPollNumericEditor(minValue = '', maxValue = '', onChange) {
  const container = document.createElement('div');
  container.className = 'poll-numeric-editor';

  function updateValues(newMin, newMax) {
    if (onChange) {
      onChange({ min: newMin, max: newMax });
    }
  }

  container.innerHTML = `
    <style>
      .poll-numeric-editor {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 2rem;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
        border: 2px solid var(--border-color, #e5e7eb);
        border-radius: 12px;
      }

      .numeric-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .numeric-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .numeric-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-color, #374151);
      }

      .numeric-input-wrapper {
        position: relative;
      }

      .numeric-input {
        width: 100%;
        padding: 0.875rem 1rem;
        padding-left: 2.5rem;
        border: 2px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        font-size: 1.125rem;
        font-weight: 500;
        transition: border-color 0.2s;
        font-family: 'Courier New', monospace;
      }

      .numeric-input:focus {
        outline: none;
        border-color: var(--primary-color, #6366f1);
      }

      .numeric-input.error {
        border-color: var(--error-color, #ef4444);
      }

      .numeric-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-secondary, #9ca3af);
        font-size: 1rem;
        font-weight: 600;
        pointer-events: none;
      }

      .numeric-hint {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        line-height: 1.4;
      }

      .numeric-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 1.5rem;
        background: white;
        border: 2px dashed var(--primary-color, #6366f1);
        border-radius: 8px;
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
      }

      .numeric-preview-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color, #6366f1);
        font-family: 'Courier New', monospace;
      }

      .numeric-range-bar {
        flex: 1;
        max-width: 200px;
        height: 8px;
        background: linear-gradient(90deg, #06b6d4 0%, #6366f1 50%, #8b5cf6 100%);
        border-radius: 4px;
        position: relative;
      }

      .numeric-info {
        text-align: center;
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        line-height: 1.6;
      }

      .error-message {
        color: var(--error-color, #ef4444);
        font-size: 0.875rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .error-icon {
        width: 16px;
        height: 16px;
      }

      @media (max-width: 640px) {
        .numeric-fields {
          grid-template-columns: 1fr;
        }

        .numeric-preview {
          flex-direction: column;
        }

        .numeric-range-bar {
          width: 100%;
          max-width: none;
        }
      }
    </style>

    <div class="numeric-fields">
      <div class="numeric-field">
        <label class="numeric-label">${i18n.t('createPoll.fields.minValue')}</label>
        <div class="numeric-input-wrapper">
          <span class="numeric-icon">#</span>
          <input 
            type="number" 
            class="numeric-input" 
            id="numeric-min"
            placeholder="${i18n.t('createPoll.placeholders.minValue')}"
            value="${minValue}"
          />
        </div>
        <span class="numeric-hint">${i18n.t('createPoll.numericEditor.optionalMinHint')}</span>
      </div>

      <div class="numeric-field">
        <label class="numeric-label">${i18n.t('createPoll.fields.maxValue')}</label>
        <div class="numeric-input-wrapper">
          <span class="numeric-icon">#</span>
          <input 
            type="number" 
            class="numeric-input" 
            id="numeric-max"
            placeholder="${i18n.t('createPoll.placeholders.maxValue')}"
            value="${maxValue}"
          />
        </div>
        <span class="numeric-hint">${i18n.t('createPoll.numericEditor.optionalMaxHint')}</span>
      </div>
    </div>

    <div class="numeric-preview">
      <span>${i18n.t('createPoll.numericEditor.rangeLabel')}</span>
      <span class="numeric-preview-value" id="range-display">
        ${minValue || '—'} ${i18n.t('createPoll.numericEditor.to')} ${maxValue || '—'}
      </span>
      <div class="numeric-range-bar"></div>
    </div>

    <p class="numeric-info">
      ${i18n.t('createPoll.numericEditor.info')}<br/>
      ${i18n.t('createPoll.numericEditor.constraintsInfo')}
    </p>

    <div class="error-message" id="validation-error" style="display: none;">
      <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
      </svg>
      <span id="error-text"></span>
    </div>
  `;

  const minInput = container.querySelector('#numeric-min');
  const maxInput = container.querySelector('#numeric-max');
  const rangeDisplay = container.querySelector('#range-display');
  const errorMessage = container.querySelector('#validation-error');
  const errorText = container.querySelector('#error-text');

  function validateAndUpdate() {
    const min = minInput.value ? parseFloat(minInput.value) : null;
    const max = maxInput.value ? parseFloat(maxInput.value) : null;

    // Update display
    rangeDisplay.textContent = `${min !== null ? min : '—'} ${i18n.t('createPoll.numericEditor.to')} ${max !== null ? max : '—'}`;

    // Validation
    if (min !== null && max !== null && min >= max) {
      errorMessage.style.display = 'flex';
      errorText.textContent = i18n.t('createPoll.validation.minLessThanMax');
      minInput.classList.add('error');
      maxInput.classList.add('error');
    } else {
      errorMessage.style.display = 'none';
      minInput.classList.remove('error');
      maxInput.classList.remove('error');
    }

    updateValues(min, max);
  }

  minInput.addEventListener('input', validateAndUpdate);
  maxInput.addEventListener('input', validateAndUpdate);

  return container;
}
