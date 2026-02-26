import bg from './locales/bg.js';
import en from './locales/en.js';

const translations = { bg, en };

function detectLanguage() {
  // 1. Check localStorage
  const saved = localStorage.getItem('votamin_lang');
  if (saved && translations[saved]) return saved;
  
  // 2. Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (translations[browserLang]) return browserLang;
  
  // 3. Default to Bulgarian
  return 'bg';
}

let currentLang = detectLanguage();

export const i18n = {
  getCurrentLang() {
    return currentLang;
  },

  setLang(lang) {
    if (translations[lang]) {
      currentLang = lang;
      localStorage.setItem('votamin_lang', lang);
      document.documentElement.lang = lang;
      this.loadTranslations();
      // Dispatch custom event for components to react to language change
      window.dispatchEvent(new CustomEvent('votamin:language-changed', { detail: { lang } }));
    }
  },

  t(key) {
    const keys = key.split('.');
    let value = translations[currentLang];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    return value || key;
  },

  loadTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      
      // Preserve HTML structure if present
      if (el.children.length === 0) {
        el.textContent = translation;
      } else {
        // For elements with children, only replace text nodes
        el.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = translation;
          }
        });
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', this.t(key));
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      el.setAttribute('aria-label', this.t(key));
    });
  },

  getAvailableLanguages() {
    return [
      { code: 'bg', name: 'Български', flag: '🇧🇬' },
      { code: 'en', name: 'English', flag: '🇬🇧' }
    ];
  }
};

// Set initial language attribute
document.documentElement.lang = currentLang;

// Global access for debugging
window.i18n = i18n;

// Global function for language switching
window.changeLanguage = function(langCode) {
  i18n.setLang(langCode);
};
