---
type: user
created: 2026-05-26
updated: 2026-05-26
---

# User Preferences

## Environment & System
- **OS**: Windows
- **Shell**: PowerShell (execution policy restrictions: use `cmd /c` prefix for scripts and global CLIs like `npm` or `ag-kit`)
- **Global Tools**: `@vudovn/ag-kit` (installed globally via `npm install -g`)

## Project Workflow
- **Reminder**: The user wants to be reminded to run `ag-kit init` in every new project.
- **Workflow for new projects**:
  1. Open the new project in the workspace.
  2. Prompt the user/remind the user to run `ag-kit init` (or propose running `cmd /c ag-kit init`) to set up the `.agent` folder and local developer rules.
