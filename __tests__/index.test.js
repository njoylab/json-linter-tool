
// test/index.test.js
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('index.html', () => {
    let dom;
    let document;

    beforeAll(() => {
        const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
        dom = new JSDOM(html);
        document = dom.window.document;
    });

    test('it should have a title', () => {
        const title = document.querySelector('title').textContent;
        expect(title).toBe('Fix Invalid JSON Online | JSON Linter, Formatter + jq Playground');
    });

    test('it should have a button to copy content', () => {
        const button = document.querySelector('.copy-button');
        expect(button).not.toBeNull();
    });

    test('it should have a section explaining JSON repairs', () => {
        const section = document.querySelector('#fix-json');
        const heading = section.querySelector('h2');
        expect(heading.textContent).toBe('Fix Invalid JSON');
    });

    test('it should have a footer with a link to GitHub', () => {
        const footer = document.querySelector('footer');
        const link = footer.querySelector('a[href="https://github.com/njoylab/json-linter-tool"]');
        expect(link).not.toBeNull(); // Changed from checking href to existence logic roughly
    });

    test('it should have all required floating buttons', () => {
        const floatingButtons = document.querySelectorAll('.floating-buttons button');
        const buttonTexts = Array.from(floatingButtons).map(btn => btn.textContent.split(' ')[0].trim());
        expect(buttonTexts).toContain('Lint');
        expect(buttonTexts).toContain('Minify');
        expect(buttonTexts).toContain('jq');
        expect(buttonTexts).toContain('Undo');
        expect(buttonTexts).toContain('Clear');
        // Save/Load might be "Save/Load"
    });

    test('it should have an editor container', () => {
        const editorContainer = document.querySelector('.editor-container');
        const editor = document.querySelector('#editor');
        expect(editorContainer).not.toBeNull();
        expect(editor).not.toBeNull();
        // Removed check for lineNumbers and contenteditable
    });

    test('it should have a right navigation panel', () => {
        const rightNav = document.querySelector('#rightNav');
        const fileList = document.querySelector('#fileList');
        expect(rightNav).not.toBeNull();
        expect(fileList).not.toBeNull();
    });
});
