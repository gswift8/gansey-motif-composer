"use strict";

// Application bootstrap. All feature scripts are loaded with `defer` in dependency order.
newMotif();
ensureSections();
updateHistoryUI();
loadExternalLibrary(true);
if(typeof renderProjectOverview==="function")renderProjectOverview();
if(typeof renderGarmentAssembly==="function")renderGarmentAssembly();

if(typeof renderMeasurements==="function")renderMeasurements();

if(typeof renderPanelSpecifications==="function")renderPanelSpecifications();

if(typeof renderSmartLayout==="function")renderSmartLayout();

if(typeof renderPrintPreview==="function")renderPrintPreview();
