/* ============================================================
   Polls List Page
   ============================================================ */
import htmlContent from './polls.html?raw';
import './polls.css';
import { getCurrentUser } from '@utils/auth.js';
import { navigateTo } from '../../router.js';

export default function render(container) {
  if (!getCurrentUser()) {
    navigateTo('/login');
    return;
  }
  container.innerHTML = htmlContent;
}
