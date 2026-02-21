/* ============================================================
   Home Page
   ============================================================ */
import htmlContent from './home.html?raw';
import './home.css';

export default function render(container) {
  container.innerHTML = htmlContent;
}
