# Security Notes

`npm audit --omit=dev` still reports `immutable <3.8.3` through `react-draft-wysiwyg` -> `draft-js`.
NPM reports no safe fix for this dependency chain.

Recommendation: replace `react-draft-wysiwyg`/`draft-js` with a maintained editor such as TipTap, Lexical, or another editor with an actively maintained dependency tree. Until that replacement is complete, all HTML rendering must continue to pass through `src/lib/sanitizeHtml.js`, and the backend should sanitize rich text before persistence.
