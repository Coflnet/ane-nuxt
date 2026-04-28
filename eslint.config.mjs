import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

const config = createConfigForNuxt({
  features: {
    typescript: true,
    tooling: true,
    stylistic: true,
  },
})

config.override('nuxt/vue/rules', current => ({
  ...current,
  rules: {
    ...current.rules,
    'vue/multi-word-component-names': 'off',
  },
}))

config.override('nuxt/typescript/rules', current => ({
  ...current,
  rules: {
    ...current.rules,
    '@typescript-eslint/no-unused-vars': 'warn',
  },
}))

export default config
