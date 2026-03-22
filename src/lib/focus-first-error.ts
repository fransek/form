export function focusFirstError(
  results: {
    isValid: boolean;
    ref: HTMLElement | null;
  }[],
  scrollOffset: number,
) {
  const firstInvalidField = results
    .filter((field) => !field.isValid && field.ref)
    .map((field) => field.ref!)
    .sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1,
    )
    .at(0);

  if (!firstInvalidField) {
    return;
  }

  firstInvalidField.focus();
  const rect = firstInvalidField.getBoundingClientRect();
  window.scrollTo({
    top: rect.top + window.scrollY - scrollOffset,
  });
}
