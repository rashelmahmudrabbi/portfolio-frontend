// Determine the base path dynamically based on where this script is loaded from
const scriptSrc = document.currentScript.src;
const DATA_URL = scriptSrc.replace('assets/js/config.js', 'assets/data/data.json');