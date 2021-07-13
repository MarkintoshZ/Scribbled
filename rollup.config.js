import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      name: 'scribbled',
      file: 'dist/scribbled.js',
      format: 'iife'
    },
    {
      name: 'scribbled',
      file: 'dist/scribbled.min.js',
      format: 'iife',
      plugins: [terser()]
    },
  ],
  plugins: [typescript()],
  watch: {
    include: ['src/**/*']
  }
};