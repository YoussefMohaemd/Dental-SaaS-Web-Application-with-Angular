# Forms and Files Behavior Policy

Status: approved for the current static/in-memory application boundary.

## Forms

The Forms feature is a showcase/pattern surface. Its controls use local component state and are not a production persistence workflow. Changes to this page must preserve its current markup, tokens, spacing, focus states, and responsive behavior.

## Order Files

Order Files is an in-memory prototype. Upload progress, preview, retry, and delete are session-local and do not call a backend endpoint. The accepted file policy is shared with sub-order scan behavior:

- Accepted extensions: `STL`, `PLY`, `OBJ`, `JPG`, `PNG`, `PDF`, `DCM`.
- Maximum size: 100 MB per file.
- Duplicate names are rejected case-insensitively within the current session.
- A single selection is limited to the existing ten-file intake limit.
- Invalid input is reported through the existing page state without changing valid-file rendering or dropzone geometry.

Create Order records an explicit empty `fileReferences` collection for each service until a backend or durable upload boundary exists. No claim should describe these local selections as uploaded server files.

## Validation Boundary

Behavior is validated with component/service tests when the repository test runner is available, plus production compilation and browser walkthroughs. The current repository does not contain `karma.conf.js`; therefore Karma execution is a known validation gap and must not be represented as a passing test result.
