import { i18n } from '../i18n/index.js';

/**
 * Advanced Settings Component (Collapsible)
 * - Results Visibility (participants/author)
 * - End Date (optional)
 */
export function renderAdvancedSettings(settings = {}, onChange) {
  const defaultSettings = {
    resultsVisibility: 'participants',
    endDate: '',
    ...settings
  };

  const minimumDateTime = getCurrentLocalDateTimeValue();
  const [minimumDate, minimumTime] = minimumDateTime.split('T');

  function splitDateTimeValue(dateTimeValue) {
    if (!dateTimeValue || typeof dateTimeValue !== 'string') {
      return { date: '', time: '' };
    }

    const [datePart = '', timePart = ''] = dateTimeValue.split('T');
    return {
      date: datePart,
      time: timePart.slice(0, 5)
    };
  }

  const initialEndDate = splitDateTimeValue(defaultSettings.endDate);
  const [initialHour = '', initialMinute = ''] = initialEndDate.time
    ? initialEndDate.time.split(':')
    : ['', ''];
  const hourOptions = Array.from({ length: 24 }, (_, hour) => {
    const value = String(hour).padStart(2, '0');
    return `<option value="${value}" ${value === initialHour ? 'selected' : ''}>${value}</option>`;
  }).join('');
  const minuteOptions = Array.from({ length: 60 }, (_, minute) => {
    const value = String(minute).padStart(2, '0');
    return `<option value="${value}" ${value === initialMinute ? 'selected' : ''}>${value}</option>`;
  }).join('');

  function getCurrentLocalDateTimeValue() {
    const now = new Date();
    const localOffsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - localOffsetMs).toISOString().slice(0, 16);
  }

  const container = document.createElement('div');
  container.className = 'advanced-settings';
  const radioGroupId = `adv-${Math.random().toString(36).slice(2, 10)}`;
  const resultsVisibilityGroupName = `resultsVisibility-${radioGroupId}`;

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
        width: 100%;
        max-width: 100%;
        min-width: 0;
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
        min-width: 0;
        overflow-wrap: anywhere;
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
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }

      .setting-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        min-width: 0;
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
        width: 100%;
        min-width: 0;
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
        width: 100%;
        max-width: 100%;
        min-width: 0;
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
        min-width: 0;
      }

      .radio-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-color, #111827);
        display: block;
        cursor: pointer;
        overflow-wrap: anywhere;
      }

      .radio-description {
        font-size: 0.75rem;
        color: var(--text-secondary, #6b7280);
        margin-top: 0.25rem;
        overflow-wrap: anywhere;
      }

      .date-input {
        padding: 0.75rem;
        border: 2px solid var(--border-color, #e5e7eb);
        border-radius: 8px;
        font-size: 0.875rem;
        transition: border-color 0.2s;
      }

      .date-time-group {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 0.75rem;
      }

      .time-select-group {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        gap: 0.5rem;
        align-items: center;
      }

      .time-select {
        font-variant-numeric: tabular-nums;
      }

      .time-separator {
        font-weight: 700;
        color: var(--text-secondary, #6b7280);
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

      @media (max-width: 420px) {
        .advanced-settings-header {
          padding: 0.85rem 1rem;
        }

        .advanced-settings-title {
          font-size: 0.94rem;
        }

        .settings-grid {
          padding: 1rem;
          gap: 1.1rem;
        }

        .radio-option {
          padding: 0.65rem;
          gap: 0.6rem;
        }

        .radio-label {
          font-size: 0.84rem;
        }

        .radio-description {
          font-size: 0.78rem;
          line-height: 1.35;
        }

        .date-time-group {
          grid-template-columns: 1fr;
        }

        .time-select-group {
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
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
        
        <!-- Results Visibility -->
        <div class="setting-field">
          <label class="setting-label">${i18n.t('createPoll.fields.resultsVisibility')}</label>
          <div class="radio-group">
            <label class="radio-option ${defaultSettings.resultsVisibility === 'participants' ? 'selected' : ''}" data-value="participants">
              <input type="radio" name="${resultsVisibilityGroupName}" value="participants" data-setting="resultsVisibility" class="radio-input" ${defaultSettings.resultsVisibility === 'participants' ? 'checked' : ''}>
              <div class="radio-label-wrapper">
                <span class="radio-label">${i18n.t('createPoll.resultsVisibility.participants')}</span>
                <span class="radio-description">${i18n.t('createPoll.resultsVisibility.participantsDesc')}</span>
              </div>
            </label>
            <label class="radio-option ${defaultSettings.resultsVisibility === 'author' ? 'selected' : ''}" data-value="author">
              <input type="radio" name="${resultsVisibilityGroupName}" value="author" data-setting="resultsVisibility" class="radio-input" ${defaultSettings.resultsVisibility === 'author' ? 'checked' : ''}>
              <div class="radio-label-wrapper">
                <span class="radio-label">${i18n.t('createPoll.resultsVisibility.author')}</span>
                <span class="radio-description">${i18n.t('createPoll.resultsVisibility.authorDesc')}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- End Date -->
        <div class="setting-field">
          <label class="setting-label">${i18n.t('createPoll.fields.endDate')}</label>
          <p class="setting-description">${i18n.t('createPoll.advancedSettings.endDateHint')}</p>
          <div class="date-time-group">
            <input 
              type="date" 
              class="date-input" 
              id="end-date-date-input"
              value="${initialEndDate.date}"
              min="${minimumDate}"
            />
            <div class="time-select-group">
              <select class="date-input time-select" id="end-date-hour-input">
                <option value="">HH</option>
                ${hourOptions}
              </select>
              <span class="time-separator">:</span>
              <select class="date-input time-select" id="end-date-minute-input">
                <option value="">MM</option>
                ${minuteOptions}
              </select>
            </div>
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

  function syncRadioSelection(groupName) {
    const inputs = container.querySelectorAll(`input[name="${groupName}"]`);
    inputs.forEach((input) => {
      const option = input.closest('.radio-option');
      if (option) {
        option.classList.toggle('selected', input.checked);
      }
    });
  }

  [resultsVisibilityGroupName].forEach((groupName) => {
    const inputs = container.querySelectorAll(`input[name="${groupName}"]`);
    inputs.forEach((input) => {
      input.addEventListener('change', (e) => {
        syncRadioSelection(groupName);
        const settingKey = e.target.dataset.setting;
        if (settingKey) {
          updateSetting(settingKey, e.target.value);
        }
      });
    });

    syncRadioSelection(groupName);
  });

  // End date handlers (date + time, 24h format)
  const endDateDateInput = container.querySelector('#end-date-date-input');
  const endDateHourInput = container.querySelector('#end-date-hour-input');
  const endDateMinuteInput = container.querySelector('#end-date-minute-input');

  function getCurrentMinimumParts() {
    const currentMinDateTime = getCurrentLocalDateTimeValue();
    const [currentMinDate, currentMinTime] = currentMinDateTime.split('T');
    return { currentMinDate, currentMinTime };
  }

  function combineDateTime(dateValue, timeValue) {
    if (!dateValue) {
      return '';
    }

    const normalizedTime = timeValue || '00:00';
    return `${dateValue}T${normalizedTime}`;
  }

  function parseMinutes(timeValue) {
    const [hours = '0', minutes = '0'] = String(timeValue || '00:00').split(':');
    return (Number(hours) * 60) + Number(minutes);
  }

  function getSelectedTimeValue() {
    if (!endDateHourInput.value || !endDateMinuteInput.value) {
      return '';
    }

    return `${endDateHourInput.value}:${endDateMinuteInput.value}`;
  }

  function setSelectedTimeValue(timeValue) {
    const [hours = '', minutes = ''] = String(timeValue || '').split(':');
    endDateHourInput.value = hours;
    endDateMinuteInput.value = minutes;
  }

  function updateTimeSelectConstraints(selectedDate, currentMinDate, currentMinTime) {
    const hourOptionsList = Array.from(endDateHourInput.options).slice(1);
    const minuteOptionsList = Array.from(endDateMinuteInput.options).slice(1);

    hourOptionsList.forEach((option) => {
      option.disabled = false;
    });

    minuteOptionsList.forEach((option) => {
      option.disabled = false;
    });

    if (!selectedDate || selectedDate !== currentMinDate) {
      return;
    }

    const minMinutes = parseMinutes(currentMinTime);
    const minHour = Math.floor(minMinutes / 60);
    const minMinute = minMinutes % 60;

    hourOptionsList.forEach((option) => {
      const hour = Number(option.value);
      option.disabled = (hour * 60) + 59 < minMinutes;
    });

    const selectedHour = Number(endDateHourInput.value);
    if (!Number.isNaN(selectedHour) && selectedHour === minHour) {
      minuteOptionsList.forEach((option) => {
        option.disabled = Number(option.value) < minMinute;
      });
    }
  }

  function syncEndDateSetting() {
    const { currentMinDate, currentMinTime } = getCurrentMinimumParts();
    endDateDateInput.min = currentMinDate;

    const selectedDate = endDateDateInput.value;
    const selectedTime = getSelectedTimeValue();

    if (!selectedDate) {
      endDateHourInput.value = '';
      endDateMinuteInput.value = '';
      updateSetting('endDate', '');
      return;
    }

    if (!selectedTime) {
      setSelectedTimeValue(selectedDate === currentMinDate ? currentMinTime : '00:00');
    }

    updateTimeSelectConstraints(selectedDate, currentMinDate, currentMinTime);

    if (endDateHourInput.selectedOptions[0]?.disabled) {
      setSelectedTimeValue(selectedDate === currentMinDate ? currentMinTime : '00:00');
      updateTimeSelectConstraints(selectedDate, currentMinDate, currentMinTime);
    }

    if (endDateMinuteInput.selectedOptions[0]?.disabled) {
      setSelectedTimeValue(selectedDate === currentMinDate ? currentMinTime : '00:00');
      updateTimeSelectConstraints(selectedDate, currentMinDate, currentMinTime);
    }

    const normalizedSelectedTime = getSelectedTimeValue() || (selectedDate === currentMinDate ? currentMinTime : '00:00');
    const combined = combineDateTime(endDateDateInput.value, normalizedSelectedTime);
    const currentMinimum = `${currentMinDate}T${currentMinTime}`;

    if (combined && combined < currentMinimum) {
      endDateDateInput.value = currentMinDate;
      setSelectedTimeValue(currentMinTime);
      updateTimeSelectConstraints(currentMinDate, currentMinDate, currentMinTime);
      updateSetting('endDate', currentMinimum);
      return;
    }

    updateSetting('endDate', combined);
  }

  syncEndDateSetting();

  endDateDateInput.addEventListener('change', () => {
    syncEndDateSetting();
  });

  endDateHourInput.addEventListener('change', () => {
    syncEndDateSetting();
  });

  endDateMinuteInput.addEventListener('change', () => {
    syncEndDateSetting();
  });

  return container;
}
