// Because of the error discussed here, this uses version
// 1.20.1 of sanitize-html instead of the latest version:
// https://github.com/apostrophecms/sanitize-html/issues/335
import sanitizeHtml from 'sanitize-html';

export const sanitize = (html) => {
	let sanitizedHtml = sanitizeHtml(html, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat([
			'h1',
			'h2',
			'img',
			'span',
		]),
		allowedAttributes: false,
	});
	return sanitizedHtml;
}
