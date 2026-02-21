/* ============================================================
   Admin Page
   ============================================================ */
import htmlContent from './admin.html?raw';
import './admin.css';
import { getCurrentUser } from '@utils/auth.js';
import { navigateTo } from '../../router.js';

export default function render(container) {
  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }
  container.innerHTML = htmlContent;
}
