export const splitStringInTwo = (_text: string, _specificSearch: string) => {
  const firstIndex = _text.indexOf(_specificSearch)
  const textBeforeCode = _text.substring(0, firstIndex)
  const textAfterCode = _text.substring(firstIndex + _specificSearch.length)
  return {
    before: textBeforeCode,
    after: textAfterCode
  }
}