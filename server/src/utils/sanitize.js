const sanitizeHtml = require('sanitize-html');

const sanitizer = (dirty) =>
  sanitizeHtml(dirty, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt'],
      '*': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });

module.exports = { sanitizer };
