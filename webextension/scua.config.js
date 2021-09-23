import typescript from '@rollup/plugin-typescript';
import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import css from 'rollup-plugin-css-only';
import json from '@rollup/plugin-json';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: './main.ts',
	output: {
		sourcemap: false,
		name: 'scua',
		format: 'iife',
		file: 'build/scua.js',
		intro: 'const global = window;',  // Massive hack for rollup.
	},
	plugins: [
		nodePolyfills({
			crypto: false,   // We will use WebCrypto.
			include: ['../node_modules/**/*.ts', '../src/**/*.ts', '**/*.ts'],
		}),

		svelte({
			preprocess: sveltePreprocess({ sourceMap: !production }),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production,
        customElement: false
			}
		}),

		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: 'scua.css' }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: false,
			dedupe: ['svelte']
		}),
		typescript({
			include: ['*.ts', '../src/**/*.ts'],
			sourceMap: !production,
			inlineSources: !production
		}),

		commonjs({
			include: [
				// 'default' is not exported.
				'node_modules/webextension-polyfill/dist/browser-polyfill.js',

				// Rewrite `require`.
				'node_modules/@transmute/did-key-common/dist/*.js',

				'node_modules/ipfs*/**/*.js',
				'../node_modules/**/*.js',
		  	'../src/**/*.js',
			],
		}),

		// Because `elliptic`'s package.json was being imported by dependencies.
		// Frontend engineering is *wild*.
		json(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('build'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

