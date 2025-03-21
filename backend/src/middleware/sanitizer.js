import sanitizeHtml from 'sanitize-html';

export const sanitizeInputs = (req, res, next) => {
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = sanitizeHtml(value, {
          allowedTags: [],  // Disallow all HTML tags
          allowedAttributes: {} // Disallow all HTML attributes
        });
      }
    }
  }
  
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {}
        });
      }
    }
  }
  
  next();
};