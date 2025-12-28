
// script.test.js
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Mock localStorage
const localStorageMock = {
    getItem: function (key) {
        return this[key] || null;
    },
    setItem: function (key, value) {
        this[key] = value.toString();
    },
    removeItem: function (key) {
        delete this[key];
    },
    clear: function () {
        Object.keys(this).forEach(key => {
            if (typeof this[key] !== 'function') delete this[key];
        });
    }
};

// Load the HTML file and script
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const script = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8');

// Mock CodeMirror
class MockCodeMirror {
    constructor(element, config) {
        this.element = element;
        this.config = config;
        this.value = '';
        this.history = { undo: 0 };
        this.events = {};
    }
    getValue() { return this.value; }
    setValue(v) {
        this.value = v;
        this.trigger('change');
    }
    clearHistory() { this.history.undo = 0; }
    undo() { this.history.undo--; }
    historySize() { return this.history; }
    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }
    trigger(event) {
        if (this.events[event]) {
            this.events[event].forEach(cb => cb());
        }
    }
    refresh() { }
}

let dom;
let document;
let window;
let mockCMInstance;

beforeEach(() => {
    dom = new JSDOM(html, { runScripts: "dangerously" });
    document = dom.window.document;
    window = dom.window;

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        configurable: true
    });

    // Mock CodeMirror Global
    window.CodeMirror = (el, config) => {
        mockCMInstance = new MockCodeMirror(el, config);
        return mockCMInstance;
    };

    // Mock JQLite
    window.JQLite = class JQLite {
        apply(input, query) {
            try {
                const data = typeof input === 'string' ? JSON.parse(input) : input;
                // Simple mock behavior
                if (query === '.') return { success: true, result: data };
                if (query === 'error') return { success: false, error: 'mock error' };
                return { success: true, result: data };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
    };

    // Mock JSONRepair
    window.JSONRepair = {
        jsonrepair: (str) => str // Mock return same string or fixed
    };

    // Mock Navigator
    Object.defineProperty(window.navigator, 'clipboard', {
        value: {
            writeText: jest.fn().mockResolvedValue()
        },
        writable: true
    });

    // Execute script
    const scriptEl = document.createElement('script');
    scriptEl.textContent = script;
    document.body.appendChild(scriptEl);
});

afterEach(() => {
    window.localStorage.clear();
});

test('should show toast when editor is empty', () => {
    mockCMInstance.setValue('   '); // Emptyish
    const isEmpty = window.isEditorEmpty();
    expect(isEmpty).toBe(true);
    // isEditorEmpty calls showToast
});

test('should format valid JSON (lintCode)', () => {
    const input = '{"a":1}';
    mockCMInstance.setValue(input);

    window.lintCode();

    const output = mockCMInstance.getValue();
    expect(output).toContain('"a": 1'); // Formatted
});

test('should save content to local storage', () => {
    mockCMInstance.setValue('{"key": "value"}');
    window.prompt = jest.fn().mockReturnValue('testFile');
    window.saveToLocal();

    const savedData = JSON.parse(window.localStorage.getItem('lnt_testFile'));
    expect(savedData.content).toBe('{"key": "value"}');
});

test('should handle JSON error and attempt fix', () => {
    mockCMInstance.setValue('{invalid');
    console.log = jest.fn(); // Suppress log

    window.JSONRepair.jsonrepair = jest.fn().mockReturnValue('{}');

    window.lintCode();

    // lintCode -> catch -> fixCode -> getEditorContent -> jsonrepair
    expect(window.JSONRepair.jsonrepair).toHaveBeenCalledWith('{invalid');
});

test('should toggle full screen', () => {
    const section = document.querySelector('section');
    expect(section.classList.contains('full-screen')).toBe(false);

    window.toggleFullScreen();

    expect(section.classList.contains('full-screen')).toBe(true);
});

test('should load example', () => {
    window.loadExample();
    expect(mockCMInstance.getValue()).toContain('John Doe');
});

test('should minify code', () => {
    const input = '{\n  "a": 1\n}';
    mockCMInstance.setValue(input);

    window.minifyCode();

    expect(mockCMInstance.getValue()).toBe('{"a":1}');
});

test('should update file list on save', () => {
    mockCMInstance.setValue('{"key": "value"}');
    window.prompt = jest.fn().mockReturnValue('testFile');
    window.saveToLocal();

    // DOM should update
    const fileList = document.getElementById('fileList');
    expect(fileList.innerHTML).toContain('testFile');
});

test('should handle cleanup/clear', () => {
    mockCMInstance.setValue('abc');
    window.clearCode();
    expect(mockCMInstance.getValue()).toBe('');
});
