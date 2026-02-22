/* ============================================================
   Home Page
   ============================================================ */
import htmlContent from './home.html?raw';
import './home.css';
import { i18n } from '../../i18n/index.js';

export default function render(container) {
  container.innerHTML = htmlContent;
  
  // Load translations after HTML is rendered
  i18n.loadTranslations();
}
