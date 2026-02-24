import { i18n } from '../i18n/index.js';

/**
 * Advanced Settings Component (Collapsible)
 * - Visibility (public/private)
 * - Results Visibility (after_vote/always/creator_only)
 * - End Date (optional)
 * - Theme (default/blue/green/purple/orange)
 */
export function renderAdvancedSettings(settings = {}, onChange) {
  const defaultSettings = {
    visibility: 'public',
    resultsVisibility: 'after_vote',
    endDate: '',
    theme: 'default',
    ...settings
  };

  const container = document.createElement('div');
  container.className = 'advanced-settings';

  function updateSetting(key, value) {
    defaultSettings[key] = value;
    if (onChange) {
      onChange(defaultSettings);
    }
  }

  container.innerHTML = `
    <style>
      .advanced-settings {
        margin-top: 2rem;
        border: 2px solid var(--border-color, #e5e7eb);
        border-radius: 12px;
        overflow: hidden;
      }

      .advanced-settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        background: var(--bg-secondary, #f9fafb);
        cursor: pointer;
        user-select: none;
        transition: background 0.2s;
      }

      .advanced-settings-header:hover {
        background: var(--bg-hover, #f3f4f6);
      }

      .advanced-settings-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-color, #111827);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
      }

      .settings-icon {
        width: 20px;
        height: 20px;
        color: var(--primary-color, #6366f1);
      }

      .chevron-icon {
        width: 20px;
        height: 20px;
        color: var(--text-secondary, #6b7280);
        transition: transform 0.3s ease;
      }

      .chevron-icon.open {
        transform: rotate(180deg);
      }

      .advanced-settings-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
      }

      .advanced-settings-content.open {
        max-height: 1000px;
      }

      .settings-grid {
        padding: 1.5rem;
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        background: white;
      }

      .setting-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .setting-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-color, #374151);
      }

      .setting-description {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        margin-top: -0.25rem;
      }

      .radio-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .radio-option {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 2px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .radio-option:hover {
        border-color: var(--primary-color, #6366f1);
        background: rgba(99, 102, 241, 0.02);
      }

      .radio-option.selected {
        border-color: var(--primary-color, #6366f1);
        background: rgba(99, 102, 241, 0.05);
      }

      .radio-input {
        margin-top: 0.125rem;
        width: 18px;
        height: 18px;
        accent-color: var(--primary-color, #6366f1);
        cursor: pointer;
      }

      .radio-label-wrapper {
        flex: 1;
      }

      .radio-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-color, #111827);
        display: block;
        cursor: pointer;
      }

      .radio-description {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        margin-top: 0.25rem;
      }

      .date-input {
        padding: 0.75rem;
        border: 2px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        font-size: 0.875rem;
        transition: border-color 0.2s;
      }

      .date-input:focus {
        outline: none;
        border-color: var(--primary-color, #6366f1);
      }

      .theme-selector {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 0.75rem;
      }

      .theme-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border: 2px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .theme-option:hover {
        border-color: var(--primary-color, #6366f1);
      }

      .theme-option.selected {
        border-color: var(--primary-color, #6366f1);
        background: rgba(99, 102, 241, 0.05);
      }

      .theme-preview {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .theme-preview.default { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
      .theme-preview.blue { background: linear-gradient(135deg, #0ea5e9, #06b6d4); }
      .theme-preview.green { background: linear-gradient(135deg, #10b981, #14b8a6); }
      .theme-preview.purple { background: linear-gradient(135deg, #a855f7, #d946ef); }
      .theme-preview.orange { background: linear-gradient(135deg, #f59e0b, #f97316); }

      .theme-name {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-color, #374151);
      }

      @media (max-width: 640px) {
        .theme-selector {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    </style>

    <div class="advanced-settings-header">
      <h3 class="advanced-settings-title">
        <svg class="settings-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
        </svg>
        ${i18n.t('createPoll.actions.advancedSettings')}
      </h3>
      <svg class="chevron-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    </div>

    <div class="advanced-settings-content">
      <div class="settings-grid">
        
        <!-- Visibility -->
        <div class="setting-field">
          <label class="setting-label">${i18n.t('createPoll.fields.visibility')}</label>
          <div class="radio-group">
            <div class="radio-option ${defaultSettings.visibility === 'public' ? 'selected' : ''}" data-value="public">
              <input type="radio" name="visibility" value="public" class="radio-input" ${defaultSettings.visibility === 'public' ? 'checked' : ''}>
              <div class="radio-label-wrapper">
                <span class="radio-label">${i18n.t('createPoll.visibility.public')}</span>
                <span class="radio-description">${i18n.t('createPoll.visibility.publicDesc')}</span>
              </div>
            </div>
            <div class="radio-option ${defaultSettings.visibility === 'private' ? 'selected' : ''}" data-value="private">
              <input type="radio" name="visibility" value="private" class="radio-input" ${defaultSettings.visibility === 'private' ? 'checked' : ''}>
              <div class="radio-label-wrapper">
                <span class="radio-label">${i18n.t('createPoll.visibility.private')}</span>
                <span class="radio-description">${i18n.t('createPoll.visibility.privateDesc')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Visibility -->
        <div class="setting-field">
          <label class="setting-label">${i18n.t('createPoll.fields.resultsVisibility')}</label>
          <div class="radio-group">
            <div class="radio-option ${defaultSettings.resultsVisibility === 'after_vote' ? 'selected' : ''}" data-value="after_vote">
              <input type="radio" name="resultsVisibility" value="after_vote" class="radio-input" ${defaultSettings.resultsVisibility === 'after_vote' ? 'checked' : ''}>
              <div class="radio-label-wrapper">
                <span class="radio-label">${i18n.t('createPoll.resultsVisibility.after_vote')}</span>
                <span class="radio-description">${i18n.t('createPoll.resultsVisibility.after_voteDesc')}</span>
              </div>
            </div>
            <div class="radio-option ${defaultSettings.resultsVisibility === 'always' ? 'selected' : ''}" data-value="always">
              <input type="radio" name="resultsVisibility" value="always" class="radio-input" ${defaultSettings.resultsVisibility === 'always' ? 'checked' : ''}>
              <div class="radio-label-wrapper">
                <span class="radio-label">${i18n.t('createPoll.resultsVisibility.always')}</span>
                <span class="radio-description">${i18n.t('createPoll.resultsVisibility.alwaysDesc')}</span>
              </div>
            </div>
            <div class="radio-option ${defaultSettings.resultsVisibility === 'creator_only' ? 'selected' : ''}" data-value="creator_only">
              <input type="radio" name="resultsVisibility" value="creator_only" class="radio-input" ${defaultSettings.resultsVisibility === 'creator_only' ? 'checked' : ''}>
              <div class="radio-label-wrapper">
                <span class="radio-label">${i18n.t('createPoll.resultsVisibility.creator_only')}</span>
                <span class="radio-description">${i18n.t('createPoll.resultsVisibility.creator_onlyDesc')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- End Date -->
        <div class="setting-field">
          <label class="setting-label">${i18n.t('createPoll.fields.endDate')}</label>
          <p class="setting-description">${i18n.t('createPoll.advancedSettings.endDateHint')}</p>
          <input 
            type="datetime-local" 
            class="date-input" 
            id="end-date-input"
            value="${defaultSettings.endDate}"
          />
        </div>

        <!-- Theme -->
        <div class="setting-field">
          <label class="setting-label">${i18n.t('createPoll.fields.theme')}</label>
          <div class="theme-selector">
            ${['default', 'blue', 'green', 'purple', 'orange'].map(theme => `
              <div class="theme-option ${defaultSettings.theme === theme ? 'selected' : ''}" data-theme="${theme}">
                <div class="theme-preview ${theme}"></div>
                <span class="theme-name">${i18n.t(`createPoll.themes.${theme}`)}</span>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;

  // Toggle collapse/expand
  const header = container.querySelector('.advanced-settings-header');
  const content = container.querySelector('.advanced-settings-content');
  const chevron = container.querySelector('.chevron-icon');

  header.addEventListener('click', () => {
    content.classList.toggle('open');
    chevron.classList.toggle('open');
  });

  // Visibility handlers
  container.querySelectorAll('input[name="visibility"]').forEach(input => {
    input.addEventListener('change', (e) => {
      container.querySelectorAll('.radio-option[data-value]').forEach(opt => {
        if (opt.dataset.value && opt.closest('.setting-field').querySelector('input[name="visibility"]')) {
          opt.classList.toggle('selected', opt.dataset.value === e.target.value);
        }
      });
      updateSetting('visibility', e.target.value);
    });
  });

  // Results Visibility handlers
  container.querySelectorAll('input[name="resultsVisibility"]').forEach(input => {
    input.addEventListener('change', (e) => {
      container.querySelectorAll('.radio-option[data-value]').forEach(opt => {
        if (opt.dataset.value && opt.closest('.setting-field').querySelector('input[name="resultsVisibility"]')) {
          opt.classList.toggle('selected', opt.dataset.value === e.target.value);
        }
      });
      updateSetting('resultsVisibility', e.target.value);
    });
  });

  // End date handler
  const endDateInput = container.querySelector('#end-date-input');
  endDateInput.addEventListener('change', (e) => {
    updateSetting('endDate', e.target.value);
  });

  // Theme handlers
  container.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      container.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.theme === theme);
      });
      updateSetting('theme', theme);
    });
  });

  return container;
}
