"use strict";

// Application bootstrap. All feature scripts are loaded with `defer` in dependency order.
newMotif();
ensureSections();
updateHistoryUI();
loadExternalLibrary(true);
if(typeof renderProjectOverview==="function")renderProjectOverview();
if(typeof renderGarmentAssembly==="function")renderGarmentAssembly();
