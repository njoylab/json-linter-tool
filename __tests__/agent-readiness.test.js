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

    test('static markdown artifact exists for agents', () => {
        const markdown = read('index.md');
        expect(markdown).toContain('# JSON Linter, Formatter, and Fixer');
        expect(markdown).toContain('WebMCP tools');
    });

    test('static hosting headers advertise markdown alternates', () => {
        const headers = read('_headers');
        expect(headers).toContain('Link: </index.md>; rel="alternate"; type="text/markdown"');
        expect(headers).toContain('Link: </jq-playground/index.md>; rel="alternate"; type="text/markdown"');
    });
});
