/**
 * Shared AST Utilities for TypeScript parsing
 *
 * Common functions used across multiple integration services for
 * parsing and extracting information from TypeScript AST nodes.
 */

import * as ts from "typescript";
import type { Export } from "./types";

/**
 * Extract export information from a TypeScript AST node
 *
 * @param node - The AST node to extract export information from
 * @param exports - Array to push export information to
 * @param isDefault - Whether this is a default export
 * @param useDefaultName - If true, use "default" as name for default exports instead of actual name
 */
export function extractExport(
	node: ts.Node,
	exports: Export[],
	isDefault: boolean,
	useDefaultName = false,
): void {
	if (ts.isFunctionDeclaration(node) && node.name) {
		exports.push({
			name: isDefault && useDefaultName ? "default" : node.name.text,
			type: "function",
			isDefault,
		});
	} else if (ts.isClassDeclaration(node) && node.name) {
		exports.push({
			name: isDefault && useDefaultName ? "default" : node.name.text,
			type: "class",
			isDefault,
		});
	} else if (ts.isVariableStatement(node)) {
		node.declarationList.declarations.forEach((decl) => {
			if (ts.isIdentifier(decl.name)) {
				exports.push({
					name: isDefault && useDefaultName ? "default" : decl.name.text,
					type: "const",
					isDefault,
				});
			}
		});
	} else if (ts.isTypeAliasDeclaration(node)) {
		exports.push({
			name: isDefault && useDefaultName ? "default" : node.name.text,
			type: "type",
			isDefault,
		});
	} else if (ts.isInterfaceDeclaration(node)) {
		exports.push({
			name: isDefault && useDefaultName ? "default" : node.name.text,
			type: "interface",
			isDefault,
		});
	}
}

/**
 * Determine the type of an export expression
 *
 * @param expression - The TypeScript expression to analyze
 * @returns The export type (function, class, or const)
 */
export function getExportType(expression: ts.Expression): Export["type"] {
	if (ts.isFunctionExpression(expression) || ts.isArrowFunction(expression)) {
		return "function";
	}
	if (ts.isClassExpression(expression)) {
		return "class";
	}
	return "const";
}
