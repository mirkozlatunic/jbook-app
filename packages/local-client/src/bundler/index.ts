import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

let initPromise: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = esbuild.initialize({
      worker: true,
      wasmURL: 'https://unpkg.com/esbuild-wasm@0.27.3/esbuild.wasm',
    });
  }
  return initPromise;
}

export default async function bundle(
  rawCode: string,
): Promise<{ code: string; err: string }> {
  await ensureInitialized();

  try {
    const result = await esbuild.build({
      entryPoints: ['index.js'],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(rawCode)],
      define: {
        'process.env.NODE_ENV': '"production"',
        global: 'window',
      },
      jsxFactory: '_React.createElement',
      jsxFragment: '_React.Fragment',
    });

    const output = result.outputFiles[0];
    if (!output) {
      throw new Error('Build produced no output files');
    }
    return { code: output.text, err: '' };
  } catch (err) {
    if (err instanceof Error) {
      return {
        code: '',
        err: err.message,
      };
    } else {
      throw err;
    }
  }
}
