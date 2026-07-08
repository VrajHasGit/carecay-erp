import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installDialogOverride } from './utils/nativeDialogOverride.js'

// ── Boot: apply saved theme + font before first render (no FOUC) ──
let savedTheme = localStorage.getItem('cc_theme') || 'navy-white';
const validThemes = ['black-darkblue', 'navy-white', 'black-gold', 'darkblue-orange', 'white-green', 'grey-blue', 'maroon-cream'];
if (!validThemes.includes(savedTheme)) savedTheme = 'navy-white';

let savedFont = localStorage.getItem('cc_font') || 'space';
document.body.setAttribute('data-theme', savedTheme);
document.body.setAttribute('data-font', savedFont);

// ── Override native browser dialogs (confirm/alert/prompt) ──
// Must be called before any user interaction to ensure no native dialogs appear.
installDialogOverride();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

