Version 3 lazy-loading patch

Files:
- ApplianceAttributionDashboard.jsx: removes the separate "Add Version 3 JSON" control and loads Version 3 automatically.
- consumerData.js: removes the large embedded Version 3 array so it is no longer bundled with the initial JavaScript.
- public/consumerDataV3.json: extracted Version 3 readings (original data values preserved).

Install:
1. Replace your existing ApplianceAttributionDashboard.jsx and consumerData.js with the versions in this package.
2. Copy consumerDataV3.json into your project's public/ folder (create the folder if needed).
3. Restart the development server and refresh the dashboard.

Assumption: the app serves files from a root-relative public path, so the dashboard fetches /consumerDataV3.json.
