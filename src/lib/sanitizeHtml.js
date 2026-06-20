import DOMPurify from "dompurify";

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "span",
  ],
  ALLOWED_ATTR: ["href", "title", "target", "rel", "class"],
  ALLOW_DATA_ATTR: false,
};

export const sanitizeHtml = (html = "") =>
  DOMPurify.sanitize(html, SANITIZE_OPTIONS);

// TODO: Keep server-side sanitization in the API as the final trust boundary.
