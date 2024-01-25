import esbuild from 'esbuild'

esbuild.build({
  platform: 'node',
  format: 'esm',
  target: 'node20',
  bundle: true,
  entryPoints: ['src/setup-pdm.ts', 'src/cache-save.ts'],
  outdir: 'dist',
})
