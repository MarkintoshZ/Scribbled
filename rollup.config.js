import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    name: 'written',
    file: 'build/bundle.js',
    format: 'iife'
  },
  plugins: [typescript()],
  watch: {
    include: ['src/**/*']
  }
};