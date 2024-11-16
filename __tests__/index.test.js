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
        expect(title).toBe('JSON Linter, Formatter and Fixer');
    });

    test('it should have a button to copy content', () => {
        const button = document.querySelector('.copy-button');
        expect(button).not.toBeNull();
    });

    test('it should have a section explaining JSON', () => {
        const section = document.querySelector('section');
        const heading = section.querySelector('h3');
        expect(heading.textContent).toBe('What is JSON?');
    });

    test('it should have a footer with a link to GitHub', () => {
        const footer = document.querySelector('footer');
        const link = footer.querySelector('a[href="https://github.com/njoylab/json-linter-tool"]');
        expect(link).not.toBeNull();
    });

    test('it should have all required floating buttons', () => {
        const floatingButtons = document.querySelectorAll('.floating-buttons button');
        const buttonTexts = Array.from(floatingButtons).map(btn => btn.textContent.split(' ')[0]);
        expect(buttonTexts).toEqual(['Lint', 'Minify', 'Clear', 'Save/Load', '?']);
    });

    test('it should have keyboard shortcuts displayed', () => {
        const shortcuts = document.querySelectorAll('.shortcut');
        expect(shortcuts.length).toBeGreaterThan(0);
        expect(shortcuts[0].textContent).toBeDefined();
    });

    test('it should have an editor container with line numbers', () => {
        const editorContainer = document.querySelector('.editor-container');
        const lineNumbers = document.querySelector('#lineNumbers');
        const editor = document.querySelector('#editor');

        expect(editorContainer).not.toBeNull();
        expect(lineNumbers).not.toBeNull();
        expect(editor).not.toBeNull();
        expect(editor.getAttribute('contenteditable')).toBe('true');
    });

    test('it should have a right navigation panel', () => {
        const rightNav = document.querySelector('#rightNav');
        const fileList = document.querySelector('#fileList');
        const downloadBtn = document.querySelector('#downloadJson');
        const saveLocalBtn = document.querySelector('#saveToLocalStorage');

        expect(rightNav).not.toBeNull();
        expect(fileList).not.toBeNull();
        expect(downloadBtn).not.toBeNull();
        expect(saveLocalBtn).not.toBeNull();
    });

    test('it should have all required meta tags', () => {
        const metaTags = document.querySelectorAll('meta');
        const hasDescription = Array.from(metaTags).some(tag => tag.getAttribute('name') === 'description');
        const hasKeywords = Array.from(metaTags).some(tag => tag.getAttribute('name') === 'keywords');
        const hasOgTags = Array.from(metaTags).some(tag => tag.getAttribute('property')?.startsWith('og:'));

        expect(hasDescription).toBeTruthy();
        expect(hasKeywords).toBeTruthy();
        expect(hasOgTags).toBeTruthy();
    });

});