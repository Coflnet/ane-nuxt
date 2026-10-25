// Nuxt's renderer adds `x-powered-by: Nuxt` to every SSR response and offers no
// option to disable it, so drop the header before the response is sent.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    for (const name of Object.keys(response.headers ?? {})) {
      if (name.toLowerCase() === 'x-powered-by') Reflect.deleteProperty(response.headers, name)
    }
  })
  nitroApp.hooks.hook('beforeResponse', (event) => {
    removeResponseHeader(event, 'x-powered-by')
  })
})
