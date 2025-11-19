/**
 * @module errorManager/aiContext
 * @description AI context building for error reporting.
 */

/**
 * * Builds AI-friendly context string from error information
 * @param {Object} params - Parameters
 * @param {Object} params.formattedError - Formatted error object
 * @param {Object} params.diagnostics - Diagnostics object
 * @returns {string} AI context string
 */
export function buildAIContext({ formattedError, diagnostics }) {
  const baseInfo = [
    `Error ID: ${formattedError.id || 'unknown'}`,
    `Type: ${formattedError.type}`,
    `Severity: ${formattedError.severity}`,
    `Context: ${formattedError.context}`,
    `Message: ${formattedError.message}`
  ];

  if (formattedError.code) {
    baseInfo.push(`Code: ${formattedError.code}`);
  }

  if (formattedError.status) {
    baseInfo.push(`Status: ${formattedError.status}`);
  }

  if (diagnostics?.debugHints?.length) {
    baseInfo.push('Hints:');
    diagnostics.debugHints.forEach((hint, index) => {
      baseInfo.push(`  ${index + 1}. ${hint.title} - ${hint.detail}`);
    });
  }

  if (diagnostics?.stackFrames?.length) {
    baseInfo.push('Top stack frame:');
    const [topFrame] = diagnostics.stackFrames;
    if (topFrame?.raw) {
      baseInfo.push(`  ${topFrame.raw}`);
    } else {
      baseInfo.push(`  ${topFrame.functionName} at ${topFrame.file}:${topFrame.line}:${topFrame.column}`);
    }
  }

  baseInfo.push(`Fingerprint: ${diagnostics?.fingerprint}`);

  return baseInfo.join('\n');
}

