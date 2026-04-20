const fs = require('fs');
const path = require('path');

function read(filePath) {
    return fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf8');
}

describe('agent readiness artifacts', () => {
    test('robots.txt declares Content-Signal preferences', () => {
        const robots = read('robots.txt');
        expect(robots).toContain('Content-Signal: ai-train=yes, search=yes, ai-input=yes');
    });

    test('worker adds Link headers and markdown negotiation', () => {
        const worker = read('_worker.js');
        expect(worker).toContain('rel="alternate"; type="text/markdown"');
        expect(worker).toContain('text/markdown; charset=utf-8');
        expect(worker).toContain('x-markdown-tokens');
    });
});
