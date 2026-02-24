/* ============================================================
   New Poll Page - Wizard Implementation
   ============================================================ */
import htmlContent from './pollNew.html?raw';
import './pollNew.css';
import { getCurrentUser } from '@utils/auth.js';
import { showToast } from '@utils/toast.js';
import { i18n } from '../../../i18n/index.js';
import { navigateTo } from '../../../router.js';
import { renderPollTypeSelector } from '../../../components/pollTypeSelector.js';
import { renderPollOptionsEditor } from '../../../components/pollOptionsEditor.js';
import { renderPollRatingEditor } from '../../../components/pollRatingEditor.js';
import { renderPollNumericEditor } from '../../../components/pollNumericEditor.js';
import { renderAdvancedSettings } from '../../../components/advancedSettings.js';
import { getLoaderMarkup } from '@components/loader.js';
import { validatePoll, validateForPublish, sanitizePollData } from '../../../utils/pollValidation.js';
import { supabaseClient as supabase } from '../../../utils/supabase.js';

export default function render(container) {
  const user = getCurrentUser();
  if (!user) {
    navigateTo('/login');
    return;
  }

  container.innerHTML = htmlContent;

  // Wizard state
  const wizardState = {
    currentStep: 0,
    pollData: {
      question: '',
      description: '',
      kind: 'single_choice',
      options: ['', ''],
      minValue: null,
      maxValue: null,
      visibility: 'public',
      resultsVisibility: 'after_vote',
      endDate: '',
      theme: 'default'
    }
  };

  const steps = [
    { id: 'create', label: i18n.t('createPoll.wizard.steps.create') },
    { id: 'preview', label: i18n.t('createPoll.wizard.steps.preview') },
    { id: 'publish', label: i18n.t('createPoll.wizard.steps.publish') },
    { id: 'share', label: i18n.t('createPoll.wizard.steps.share') }
  ];

  // Initialize wizard
  initWizard();

  function initWizard() {
    renderStepper();
    renderStepContent();
    updateNavigation();
    updateBackLink();
  }

  function renderStepper() {
    const stepperContainer = container.querySelector('#wizard-stepper');
    stepperContainer.innerHTML = steps.map((step, index) => `
      <div class="wizard-step ${index === wizardState.currentStep ? 'active' : ''} ${index < wizardState.currentStep ? 'completed' : ''}" data-step="${index}">
        <div class="step-indicator">
          ${index < wizardState.currentStep ? `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          ` : index + 1}
        </div>
        <span class="step-label">${step.label}</span>
      </div>
    `).join('');
  }

  function renderStepContent() {
    const contentContainer = container.querySelector('#wizard-content');
    contentContainer.innerHTML = '';

    switch (wizardState.currentStep) {
      case 0:
        renderCreateStep(contentContainer);
        break;
      case 1:
        renderPreviewStep(contentContainer);
        break;
      case 2:
        renderPublishStep(contentContainer);
        break;
      case 3:
        renderShareStep(contentContainer);
        break;
    }
  }

  function renderCreateStep(contentContainer) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-content active';

    // Question field
    const questionSection = document.createElement('div');
    questionSection.className = 'step-section';
    questionSection.innerHTML = `
      <div class="form-field">
        <label class="form-label">${i18n.t('createPoll.fields.question')}</label>
        <input 
          type="text" 
          class="form-input" 
          id="poll-question"
          placeholder="${i18n.t('createPoll.placeholders.question')}"
          value="${wizardState.pollData.question}"
        />
        <div class="form-error" id="question-error" style="display: none;"></div>
      </div>

      <div class="form-field">
        <label class="form-label">${i18n.t('createPoll.fields.description')}</label>
        <textarea 
          class="form-textarea" 
          id="poll-description"
          placeholder="${i18n.t('createPoll.placeholders.description')}"
        >${wizardState.pollData.description}</textarea>
      </div>
    `;

    // Poll type selector
    const typeSection = document.createElement('div');
    typeSection.className = 'step-section';
    typeSection.innerHTML = `<h3 class="step-section-title">${i18n.t('createPoll.fields.pollType')}</h3>`;
    const typeSelector = renderPollTypeSelector(wizardState.pollData.kind, (type) => {
      wizardState.pollData.kind = type;
      // Reset options when type changes
      if (type === 'single_choice' || type === 'multiple_choice') {
        if (!Array.isArray(wizardState.pollData.options) || wizardState.pollData.options.length < 2) {
          wizardState.pollData.options = ['', ''];
        }
      }
      renderOptionsEditor();
    });
    typeSection.appendChild(typeSelector);

    // Options editor container
    const optionsSection = document.createElement('div');
    optionsSection.className = 'step-section';
    optionsSection.id = 'options-section';

    function renderOptionsEditor() {
      optionsSection.innerHTML = '';

      if (wizardState.pollData.kind === 'single_choice' || wizardState.pollData.kind === 'multiple_choice') {
        optionsSection.innerHTML = `<h3 class="step-section-title">${i18n.t('createPoll.fields.options')}</h3>`;
        const optionsEditor = renderPollOptionsEditor(wizardState.pollData.options, (newOptions) => {
          wizardState.pollData.options = newOptions;
        });
        optionsSection.appendChild(optionsEditor);
      } else if (wizardState.pollData.kind === 'rating') {
        optionsSection.innerHTML = `<h3 class="step-section-title">${i18n.t('createPoll.fields.options')}</h3>`;
        const ratingEditor = renderPollRatingEditor();
        optionsSection.appendChild(ratingEditor);
      } else if (wizardState.pollData.kind === 'numeric') {
        optionsSection.innerHTML = `<h3 class="step-section-title">${i18n.t('createPoll.fields.options')}</h3>`;
        const numericEditor = renderPollNumericEditor(
          wizardState.pollData.minValue,
          wizardState.pollData.maxValue,
          ({ min, max }) => {
            wizardState.pollData.minValue = min;
            wizardState.pollData.maxValue = max;
          }
        );
        optionsSection.appendChild(numericEditor);
      }
    }

    renderOptionsEditor();

    // Advanced settings
    const advancedSection = document.createElement('div');
    advancedSection.className = 'step-section';
    const advancedSettings = renderAdvancedSettings(
      {
        visibility: wizardState.pollData.visibility,
        resultsVisibility: wizardState.pollData.resultsVisibility,
        endDate: wizardState.pollData.endDate,
        theme: wizardState.pollData.theme
      },
      (settings) => {
        wizardState.pollData.visibility = settings.visibility;
        wizardState.pollData.resultsVisibility = settings.resultsVisibility;
        wizardState.pollData.endDate = settings.endDate;
        wizardState.pollData.theme = settings.theme;
      }
    );
    advancedSection.appendChild(advancedSettings);

    // Append all sections
    stepDiv.appendChild(questionSection);
    stepDiv.appendChild(typeSection);
    stepDiv.appendChild(optionsSection);
    stepDiv.appendChild(advancedSection);
    contentContainer.appendChild(stepDiv);

    // Add event listeners
    const questionInput = stepDiv.querySelector('#poll-question');
    const descriptionInput = stepDiv.querySelector('#poll-description');

    questionInput.addEventListener('input', (e) => {
      wizardState.pollData.question = e.target.value;
    });

    descriptionInput.addEventListener('input', (e) => {
      wizardState.pollData.description = e.target.value;
    });
  }

  function renderPreviewStep(contentContainer) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-content active';

    const { question, description, kind, options, minValue, maxValue, endDate, theme } = wizardState.pollData;

    stepDiv.innerHTML = `
      <div class="preview-container">
        <h2 class="step-section-title">${i18n.t('createPoll.preview.title')}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">${i18n.t('createPoll.preview.subtitle')}</p>

        <div class="preview-card" data-theme="${theme}">
          <h3 class="preview-question">${question || i18n.t('createPoll.preview.questionFallback')}</h3>
          ${description ? `<p class="preview-description">${description}</p>` : ''}

          <div class="preview-meta">
            <div class="preview-meta-item">
              <strong>${i18n.t('dashboard.table.columns.type')}:</strong>
              ${i18n.t(`dashboard.kind.${kind}`)}
            </div>
            <div class="preview-meta-item">
              <strong>${i18n.t('createPoll.fields.theme')}:</strong>
              ${i18n.t(`createPoll.themes.${theme}`)}
            </div>
            ${endDate ? `
              <div class="preview-meta-item">
                <strong>${i18n.t('createPoll.preview.closesOn').replace('{date}', new Date(endDate).toLocaleString())}</strong>
              </div>
            ` : `
              <div class="preview-meta-item">
                <strong>${i18n.t('createPoll.preview.noEndDate')}</strong>
              </div>
            `}
          </div>

          ${renderPreviewOptions()}
        </div>
      </div>
    `;

    contentContainer.appendChild(stepDiv);

    function renderPreviewOptions() {
      if (kind === 'single_choice' || kind === 'multiple_choice') {
        return `
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${options.map((opt, i) => `
              <div style="padding: 1rem; border: 2px solid var(--border-color); border-radius: 8px; display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 20px; height: 20px; border: 2px solid var(--primary-color); border-radius: ${kind === 'single_choice' ? '50%' : '4px'};"></div>
                <span>${opt || i18n.t('createPoll.placeholders.option').replace('{number}', i + 1)}</span>
              </div>
            `).join('')}
          </div>
        `;
      } else if (kind === 'rating') {
        return `
          <div style="display: flex; justify-content: center; gap: 0.5rem; padding: 1.5rem;">
            ${Array.from({ length: 5 }, () => `
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            `).join('')}
          </div>
        `;
      } else if (kind === 'numeric') {
        return `
          <div style="padding: 1.5rem; text-align: center;">
            <input 
              type="number" 
              style="width: 200px; padding: 0.875rem; border: 2px solid var(--border-color); border-radius: 8px; text-align: center; font-size: 1.25rem; font-family: monospace;"
              placeholder="${minValue !== null ? `Min: ${minValue}` : ''} ${maxValue !== null ? `Max: ${maxValue}` : ''}"
              disabled
            />
            <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
              ${minValue !== null || maxValue !== null
                ? `${i18n.t('createPoll.preview.rangeLabel')} ${minValue ?? '—'} ${i18n.t('createPoll.preview.to')} ${maxValue ?? '—'}`
                : i18n.t('createPoll.preview.noRangeLimits')}
            </p>
          </div>
        `;
      }
    }
  }

  function renderPublishStep(contentContainer) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-content active';

    stepDiv.innerHTML = `
      <div style="max-width: 600px; margin: 0 auto; text-align: center;">
        <h2 class="step-section-title">${i18n.t('createPoll.publish.readyTitle')}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">
          ${i18n.t('createPoll.publish.readySubtitle')}
        </p>

        <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center;">
          <div style="width: 100%; max-width: 400px; padding: 1.5rem; background: white; border: 2px solid var(--border-color); border-radius: 12px; text-align: left;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem;">${i18n.t('createPoll.publish.summaryTitle')}</h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
              <div><strong>${i18n.t('createPoll.publish.summaryQuestion')}:</strong> ${wizardState.pollData.question}</div>
              <div><strong>${i18n.t('createPoll.publish.summaryType')}:</strong> ${i18n.t(`dashboard.kind.${wizardState.pollData.kind}`)}</div>
              <div><strong>${i18n.t('createPoll.publish.summaryVisibility')}:</strong> ${i18n.t(`createPoll.visibility.${wizardState.pollData.visibility}`)}</div>
              <div><strong>${i18n.t('createPoll.publish.summaryResults')}:</strong> ${i18n.t(`createPoll.resultsVisibility.${wizardState.pollData.resultsVisibility}`)}</div>
            </div>
          </div>

          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 1rem;">
            ${i18n.t('createPoll.publish.summaryHint')}
          </p>
        </div>
      </div>
    `;

    contentContainer.appendChild(stepDiv);
  }

  function renderShareStep(contentContainer) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-content active';

    const pollId = wizardState.createdPollId;
    const shareCode = wizardState.shareCode;
    const shareUrl = shareCode ? `${window.location.origin}/p/${shareCode}` : '';

    stepDiv.innerHTML = `
      <div class="share-container">
        <svg class="share-success-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>

        <h2 class="share-title">${i18n.t('createPoll.share.title')}</h2>
        <p class="share-description">${i18n.t('createPoll.share.subtitle')}</p>

        ${shareUrl ? `
          <div class="share-link-container">
            <label class="share-link-label">${i18n.t('createPoll.share.linkLabel')}</label>
            <input 
              type="text" 
              class="share-link-input" 
              value="${shareUrl}"
              readonly
              id="share-url-input"
            />
            <button class="wizard-btn wizard-btn-primary" id="btn-copy-link">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
              </svg>
              ${i18n.t('createPoll.actions.copyLink')}
            </button>
          </div>

          <div class="share-actions">
            <a href="/p/${shareCode}" class="wizard-btn wizard-btn-outline">
              ${i18n.t('createPoll.actions.viewPoll')}
            </a>
            <button class="wizard-btn wizard-btn-secondary" id="btn-create-another">
              ${i18n.t('createPoll.actions.createAnother')}
            </button>
          </div>
        ` : getLoaderMarkup()}
      </div>
    `;

    contentContainer.appendChild(stepDiv);

    // Copy link handler
    const copyBtn = stepDiv.querySelector('#btn-copy-link');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const input = stepDiv.querySelector('#share-url-input');
        input.select();
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast(i18n.t('createPoll.share.copySuccess'), 'success');
        }).catch(() => {
          showToast(i18n.t('createPoll.share.copyError'), 'error');
        });
      });
    }

    // Create another handler
    const createAnotherBtn = stepDiv.querySelector('#btn-create-another');
    if (createAnotherBtn) {
      createAnotherBtn.addEventListener('click', () => {
        navigateTo('/polls/new');
      });
    }
  }

  function updateNavigation() {
    const btnBack = container.querySelector('#btn-back');
    const btnNext = container.querySelector('#btn-next');
    const btnSaveDraft = container.querySelector('#btn-save-draft');
    const btnBackText = container.querySelector('#btn-back-text');
    const btnNextText = container.querySelector('#btn-next-text');
    const btnSaveDraftText = container.querySelector('#btn-save-draft-text');

    // Update button labels
    btnBackText.textContent = i18n.t('createPoll.actions.back');
    btnSaveDraftText.textContent = i18n.t('createPoll.actions.saveAsDraft');

    // Back button
    if (wizardState.currentStep === 0) {
      btnBack.style.display = 'none';
    } else if (wizardState.currentStep === 3) {
      btnBack.style.display = 'none';
    } else {
      btnBack.style.display = 'flex';
    }

    // Save as draft button (only show on step 2 - Publish)
    if (wizardState.currentStep === 2) {
      btnSaveDraft.style.display = 'flex';
    } else {
      btnSaveDraft.style.display = 'none';
    }

    // Next button
    if (wizardState.currentStep === 3) {
      btnNext.style.display = 'none';
    } else {
      btnNext.style.display = 'flex';
      if (wizardState.currentStep === 2) {
        btnNextText.textContent = i18n.t('createPoll.actions.publish');
      } else {
        btnNextText.textContent = i18n.t('createPoll.actions.next');
      }
    }

    // Event listeners
    btnBack.onclick = () => goToStep(wizardState.currentStep - 1);
    btnNext.onclick = handleNextClick;
    btnSaveDraft.onclick = () => savePoll('draft');
  }

  function updateBackLink() {
    const backLink = container.querySelector('#back-to-dashboard');
    const backLinkText = container.querySelector('#back-link-text');
    
    if (wizardState.currentStep === 3) {
      backLinkText.textContent = i18n.t('dashboard.sidebar.myPolls');
      backLink.onclick = (e) => {
        e.preventDefault();
        navigateTo('/dashboard');
      };
    } else {
      backLinkText.textContent = i18n.t('dashboard.sidebar.myPolls');
      backLink.onclick = (e) => {
        e.preventDefault();
        navigateTo('/dashboard');
      };
    }
  }

  function handleNextClick() {
    if (wizardState.currentStep === 0) {
      // Validate step 1
      const validation = validatePoll(wizardState.pollData);
      if (!validation.isValid) {
        displayValidationErrors(validation.errors);
        return;
      }
    } else if (wizardState.currentStep === 2) {
      // Publish the poll
      savePoll('open');
      return;
    }

    goToStep(wizardState.currentStep + 1);
  }

  function displayValidationErrors(errors) {
    if (errors.question) {
      const questionError = container.querySelector('#question-error');
      if (questionError) {
        questionError.textContent = errors.question;
        questionError.style.display = 'flex';
        container.querySelector('#poll-question').classList.add('error');
      }
    }

    if (errors.options) {
      showToast(errors.options, 'error');
    }

    if (errors.numeric) {
      showToast(errors.numeric, 'error');
    }
  }

  async function savePoll(status) {
    try {
      const sanitized = sanitizePollData(wizardState.pollData);

      const allowMultipleChoices = sanitized.kind === 'multiple_choice';
      const descriptionHtml = sanitized.description
        ? `<p>${sanitized.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
        : null;
      
      // Insert poll
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .insert({
          title: sanitized.question,
          description_html: descriptionHtml,
          kind: sanitized.kind,
          allow_multiple_choices: allowMultipleChoices,
          visibility: sanitized.visibility,
          results_visibility: sanitized.results_visibility,
          theme: sanitized.theme,
          ends_at: sanitized.ends_at,
          status: status,
          owner_id: user.id
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Insert options (if applicable)
      if (sanitized.options && sanitized.options.length > 0) {
        const optionsToInsert = sanitized.options.map((text, index) => ({
          poll_id: poll.id,
          text,
          position: index + 1
        }));

        const { error: optionsError } = await supabase
          .from('poll_options')
          .insert(optionsToInsert);

        if (optionsError) throw optionsError;
      }

      // Generate share code if publishing
      if (status === 'open') {
        const shareCode = generateShareCode();
        const { error: shareError } = await supabase
          .from('poll_shares')
          .insert({
            poll_id: poll.id,
            share_code: shareCode,
            created_by: user.id
          });

        if (shareError) throw shareError;

        wizardState.createdPollId = poll.id;
        wizardState.shareCode = shareCode;

        showToast(i18n.t('createPoll.publish.published'), 'success');
        goToStep(3); // Go to share step
      } else {
        showToast(i18n.t('createPoll.publish.draftSaved'), 'success');
        navigateTo('/dashboard');
      }
    } catch (error) {
      console.error('Error saving poll:', error);
      showToast(i18n.t('createPoll.publish.error'), 'error');
    }
  }

  function generateShareCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  function goToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) return;
    
    wizardState.currentStep = stepIndex;
    renderStepper();
    renderStepContent();
    updateNavigation();
    updateBackLink();

    // Scroll to top
    window.scrollTo(0, 0);
  }
}
