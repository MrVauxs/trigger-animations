import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
})
