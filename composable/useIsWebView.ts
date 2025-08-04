export const useIsWebView = () => {
  return useState<boolean>('isSpecialHeaderPresent', () => false)
}
