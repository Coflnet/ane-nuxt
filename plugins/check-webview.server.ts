import { useIsWebView } from '~/composable/useIsWebView'

export default defineNuxtPlugin(() => {
  const targetString = 'FlutterWebView'

  const targetHeader = 'x-app-client'

  const isPresentState = useIsWebView()

  const headers = useRequestHeaders()

  // Check if the target header contains the target string
  const headerValue = headers[targetHeader] || ''
  isPresentState.value = headerValue.includes(targetString)
})
