// Control Scheme Clarification & Fix
// HOTFIX: Resolved Tab/I key conflict

// CORRECT CONTROL SCHEME:
// Tab    → Pip-Boy (opens at Map tab by default)
// I      → Pip-Boy Inventory Tab (opens Pip-Boy if closed, switches to inventory tab)
// M      → Tactical/Commander View
// Escape → Close Pip-Boy or Dialogue
// W/A/S/D→ Movement
// Space  → Jump
// Shift  → Sprint
// Ctrl   → Crouch
// R      → Reload
// V      → Fire Mode
// F      → Interact
// Left Click → Fire weapon
// Right Click → Aim down sights
// F2     → Toggle Editor

// TAB KEY HANDLER:
// - Only in Pip-Boy system (omni-pipboy-system.js)
// - Opens Pip-Boy at Map tab by default
// - Closes Pip-Boy if already open
// - No longer conflicts with inventory

// I KEY HANDLER (UPDATED):
// - Opens Pip-Boy with Inventory tab active
// - If Pip-Boy already open, switches to inventory tab
// - Avoids dual Tab/I opening same system

console.log('%c[HOTFIX] Tab/I key conflict resolved', 'color: #0f6; font-weight: bold');
console.log('Tab   → Pip-Boy (Map tab)');
console.log('I     → Pip-Boy (Inventory tab)');
