/* ============================================================
   Dashboard Page
   ============================================================ */
import htmlContent from './dashboard.html?raw';
import './dashboard.css';
import { getCurrentUser } from '@utils/auth.js';
import { navigateTo } from '../../router.js';

export default function render(container) {
  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }
  container.innerHTML = htmlContent;
}
