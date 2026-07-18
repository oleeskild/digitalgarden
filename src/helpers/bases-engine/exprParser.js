const jsep = require("jsep");

/**
 * Parse an expression string into a jsep AST.
 * @param {string} expression - The expression to parse
 * @returns {object} The jsep AST node
 * @throws {Error} If input is empty or not a string
 */
function parseExpression(expression) {
	if (typeof expression !== "string") {
		throw new Error("Expression must be a string");
	}
	if (expression.trim() === "") {
		throw new Error("Expression must not be empty");
	}
	try {
		return jsep(expression);
	} catch (err) {
		throw new Error('Failed to parse expression "' + expression + '": ' + err.message);
	}
}

module.exports = { parseExpression };
