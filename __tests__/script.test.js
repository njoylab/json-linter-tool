
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

    // Mock LZString
    window.LZString = {
        compressToEncodedURIComponent: (str) => btoa(str).replace(/=/g, ''),
        decompressFromEncodedURIComponent: (str) => {
            try {
                return atob(str);
            } catch (e) {
                return null;
            }
        }
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

test('should generate shareable URL with compressed JSON', async () => {
    const testJSON = '{"test": "data", "number": 123}';
    mockCMInstance.setValue(testJSON);

    await window.shareJSON();

    // Check that clipboard.writeText was called
    expect(window.navigator.clipboard.writeText).toHaveBeenCalled();

    // Get the URL that was copied
    const copiedURL = window.navigator.clipboard.writeText.mock.calls[0][0];

    // Verify URL structure
    expect(copiedURL).toContain('?json=');

    // Extract compressed data
    const urlParams = new URLSearchParams(copiedURL.split('?')[1]);
    const compressed = urlParams.get('json');
    expect(compressed).toBeTruthy();

    // Verify decompression works
    const decompressed = window.LZString.decompressFromEncodedURIComponent(compressed);
    expect(decompressed).toBe(testJSON);
});

test('should not share invalid JSON', async () => {
    mockCMInstance.setValue('{invalid json}');

    // Mock showToast to verify error message
    const originalShowToast = window.showToast;
    window.showToast = jest.fn();

    await window.shareJSON();

    // Should not copy to clipboard
    expect(window.navigator.clipboard.writeText).not.toHaveBeenCalled();

    // Restore original
    window.showToast = originalShowToast;
});

test('should load JSON from URL parameter', () => {
    const testJSON = '{"loaded": "from URL"}';
    const compressed = window.LZString.compressToEncodedURIComponent(testJSON);

    // Spy on URLSearchParams to mock the location.search
    const originalURLSearchParams = window.URLSearchParams;
    window.URLSearchParams = class extends originalURLSearchParams {
        constructor(search) {
            super(`?json=${compressed}`);
        }
    };

    // Call loadJSONFromURL
    window.loadJSONFromURL();

    // Editor should contain the decompressed JSON, formatted
    const editorValue = mockCMInstance.getValue();
    expect(editorValue).toContain('"loaded"');
    expect(editorValue).toContain('"from URL"');

    // Restore
    window.URLSearchParams = originalURLSearchParams;
});

test('should handle invalid compressed data in URL', () => {
    // Spy on URLSearchParams to mock invalid compressed data
    const originalURLSearchParams = window.URLSearchParams;
    window.URLSearchParams = class extends originalURLSearchParams {
        constructor(search) {
            super('?json=invalid_compressed_data');
        }
    };

    // Mock showToast to verify error handling
    const originalShowToast = window.showToast;
    window.showToast = jest.fn();

    window.loadJSONFromURL();

    // Editor should remain empty or unchanged
    // showToast should have been called with error

    window.showToast = originalShowToast;
    window.URLSearchParams = originalURLSearchParams;
});

test('should do nothing when no URL parameter present', () => {
    // Spy on URLSearchParams to mock empty search
    const originalURLSearchParams = window.URLSearchParams;
    window.URLSearchParams = class extends originalURLSearchParams {
        constructor(search) {
            super('');
        }
    };

    const initialValue = mockCMInstance.getValue();
    window.loadJSONFromURL();

    // Editor value should not change
    expect(mockCMInstance.getValue()).toBe(initialValue);

    // Restore
    window.URLSearchParams = originalURLSearchParams;
});
