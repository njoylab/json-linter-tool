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
        expect(worker).toContain('rel="api-catalog"');
        expect(worker).toContain('rel="describedby"');
        expect(worker).toContain('rel="alternate"; type="text/markdown"');
        expect(worker).toContain('text/markdown; charset=utf-8');
        expect(worker).toContain('x-markdown-tokens');
    });

    test('agent skills index uses the discovery schema', () => {
        const index = JSON.parse(read('.well-known/agent-skills/index.json'));
        expect(index.$schema).toBe('https://schemas.agentskills.io/discovery/0.2.0/schema.json');
        expect(index.skills.length).toBeGreaterThan(0);
    });

    test('api catalog exists and exposes a linkset array', () => {
        const catalog = JSON.parse(read('.well-known/api-catalog'));
        expect(Array.isArray(catalog.linkset)).toBe(true);
    });
});
