import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'index.js',
    output: {
        file: "../public/js/firebase.js",
        format: 'es'
    },
    plugins: [nodeResolve()]
};