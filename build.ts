import esbuild from 'esbuild'

esbuild.build({
  platform: 'node',
  target: 'node24',
  bundle: true,
  entryPoints: ['src/setup-pdm.ts', 'src/cache-save.ts'],
  outdir: 'dist',
})
