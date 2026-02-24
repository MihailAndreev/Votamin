import { i18n } from '../i18n/index.js';

/**
 * Poll Rating Editor Component
 * Displays a read-only 5-star rating visualization
 * Backend will auto-generate 5 options ("1" to "5")
 */
export function renderPollRatingEditor() {
  const container = document.createElement('div');
  container.className = 'poll-rating-editor';
  
  container.innerHTML = `
    <style>
      .poll-rating-editor {
        padding: 2rem;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
        border: 2px dashed var(--primary-color, #6366f1);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
      }

      .rating-preview-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-color, #111827);
        margin: 0;
      }

      .rating-stars {
        display: flex;
        gap: 0.5rem;
      }

      .rating-star {
        width: 48px;
        height: 48px;
        color: #fbbf24;
        filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
        animation: starPulse 2s ease-in-out infinite;
      }

      .rating-star:nth-child(1) {
        animation-delay: 0s;
      }
      .rating-star:nth-child(2) {
        animation-delay: 0.2s;
      }
      .rating-star:nth-child(3) {
        animation-delay: 0.4s;
      }
      .rating-star:nth-child(4) {
        animation-delay: 0.6s;
      }
      .rating-star:nth-child(5) {
        animation-delay: 0.8s;
      }

      @keyframes starPulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
      }

      .rating-labels {
        display: flex;
        justify-content: space-between;
        width: 100%;
        max-width: 300px;
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        margin-top: 0.5rem;
      }

      .rating-info {
        text-align: center;
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
        line-height: 1.6;
        max-width: 400px;
      }

      .rating-scale {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
      }

      .rating-scale-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .rating-scale-number {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border: 2px solid var(--border-color, #e5e7eb);
        border-radius: 50%;
        font-weight: 600;
        color: var(--text-color, #374151);
      }

      .rating-scale-star {
        width: 20px;
        height: 20px;
        color: #fbbf24;
      }

      @media (max-width: 480px) {
        .rating-stars {
          gap: 0.25rem;
        }
        
        .rating-star {
          width: 40px;
          height: 40px;
        }
      }
    </style>

    <p class="rating-preview-title">
      ${i18n.t('createPoll.pollTypes.rating.description')}
    </p>

    <div class="rating-stars">
      ${Array.from({ length: 5 }, (_, i) => `
        <svg class="rating-star" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      `).join('')}
    </div>

    <div class="rating-labels">
      <span>1</span>
      <span>2</span>
      <span>3</span>
      <span>4</span>
      <span>5</span>
    </div>

    <p class="rating-info">
      Participants will rate from 1 to 5 stars.<br/>
      5 options will be automatically created.
    </p>
  `;

  return container;
}
