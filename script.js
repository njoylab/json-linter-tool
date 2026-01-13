
// Initialize CodeMirror through the global object
const editor = CodeMirror(document.getElementById('editor'), {
    mode: "application/json",
    theme: "dracula",
    lineNumbers: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
    inputStyle: "contenteditable",
    matchBrackets: true,
    autoCloseBrackets: true,
    viewportMargin: Infinity,
    lint: true,
    tabSize: 2,
    indentWithTabs: false
});

// Update undo button state on history events
editor.on('change', updateUndoButton);
// 'historyAdded' isn't a standard event in CM5 logic usually, 'change' covers most. 
// We can also poll or wrap, but 'change' is good enough.

const seoData = {
    useCases: [
        {
            id: 'trailing-comma',
            group: 'fix',
            title: 'Trailing commas',
            description: 'Remove trailing commas in objects and arrays (trailing comma json).',
            slug: '/fix-json/trailing-comma'
        },
        {
            id: 'single-quotes',
            group: 'fix',
            title: 'Single quotes',
            description: 'Convert single quotes JSON into valid double-quoted strings.',
            slug: '/fix-json/single-quotes'
        },
        {
            id: 'unquoted-keys',
            group: 'fix',
            title: 'Unquoted keys',
            description: 'Add quotes around unquoted object keys for strict JSON.',
            slug: '/fix-json/unquoted-keys'
        },
        {
            id: 'comments',
            group: 'fix',
            title: 'Comments in JSON',
            description: 'Strip // and /* */ comments (comments in json).',
            slug: '/fix-json/comments'
        },
        {
            id: 'missing-commas',
            group: 'fix',
            title: 'Missing commas',
            description: 'Repair missing commas between properties or array items.',
            slug: '/fix-json/missing-commas'
        },
        {
            id: 'missing-brackets',
            group: 'fix',
            title: 'Missing brackets or quotes',
            description: 'Close unbalanced braces, brackets, or quotes.',
            slug: '/fix-json/missing-brackets'
        },
        {
            id: 'jq-identity',
            group: 'jq',
            title: 'Identity',
            filter: '.',
            description: 'Return the input as-is.',
            sample: `{
  "status": "ok",
  "users": [
    { "name": "Ada", "age": 33 },
    { "name": "Bruno", "age": 17 },
    { "name": "Carla", "age": 29 }
  ]
}`,
            slug: '/jq/identity'
        },
        {
            id: 'jq-key',
            group: 'jq',
            title: 'Access .key',
            filter: '.users',
            description: 'Extract a field from JSON.',
            sample: `{
  "team": "api",
  "users": [
    { "name": "Ada", "role": "dev" },
    { "name": "Bruno", "role": "intern" }
  ]
}`,
            slug: '/jq/key'
        },
        {
            id: 'jq-array-iter',
            group: 'jq',
            title: 'Array iterator',
            filter: '.[]',
            description: 'Stream each item in an array.',
            sample: `[
  { "name": "Ada", "age": 33 },
  { "name": "Bruno", "age": 17 },
  { "name": "Carla", "age": 29 }
]`,
            slug: '/jq/array-iterator'
        },
        {
            id: 'jq-index',
            group: 'jq',
            title: 'Array index',
            filter: '.[0]',
            description: 'Pick an element by index.',
            sample: `[
  { "name": "Ada", "role": "dev" },
  { "name": "Bruno", "role": "intern" }
]`,
            slug: '/jq/index'
        },
        {
            id: 'jq-keys',
            group: 'jq',
            title: 'keys',
            filter: 'keys',
            description: 'List all keys in an object.',
            sample: `{
  "id": 7,
  "name": "Ada",
  "active": true
}`,
            slug: '/jq/keys'
        },
        {
            id: 'jq-length',
            group: 'jq',
            title: 'length',
            filter: 'length',
            description: 'Count array length or string size.',
            sample: `[
  "alpha",
  "beta",
  "gamma"
]`,
            slug: '/jq/length'
        },
        {
            id: 'jq-map',
            group: 'jq',
            title: 'map(.name)',
            filter: 'map(.name)',
            description: 'Map a field from each array item.',
            sample: `[
  { "name": "Ada", "age": 33 },
  { "name": "Bruno", "age": 17 },
  { "name": "Carla", "age": 29 }
]`,
            slug: '/jq/map'
        },
        {
            id: 'jq-select',
            group: 'jq',
            title: 'select(.age > 18)',
            filter: 'select(.age > 18)',
            description: 'Filter array items by condition.',
            sample: `[
  { "name": "Ada", "age": 33 },
  { "name": "Bruno", "age": 17 },
  { "name": "Carla", "age": 29 }
]`,
            slug: '/jq/select'
        },
        {
            id: 'jq-sort-by',
            group: 'jq',
            title: 'sort_by(.name)',
            filter: 'sort_by(.name)',
            description: 'Sort array items by a field.',
            sample: `[
  { "name": "Carla", "age": 29 },
  { "name": "Ada", "age": 33 },
  { "name": "Bruno", "age": 17 }
]`,
            slug: '/jq/sort-by'
        },
        {
            id: 'pretty-print',
            group: 'task',
            title: 'Pretty print',
            description: 'Format JSON with stable indentation for reviews and diffs.',
            slug: '/tasks/pretty-print'
        },
        {
            id: 'minify',
            group: 'task',
            title: 'Minify',
            description: 'Strip whitespace for smaller payloads and faster copy/paste.',
            slug: '/tasks/minify'
        },
        {
            id: 'extract-field',
            group: 'task',
            title: 'Extract field',
            description: 'Use jq .key or .users[].name to extract field from json.',
            slug: '/tasks/extract-field'
        },
        {
            id: 'filter-array',
            group: 'task',
            title: 'Filter array',
            description: 'Filter arrays with select(.age > 18) or similar predicates.',
            slug: '/tasks/filter-array'
        },
        {
            id: 'sort-keys',
            group: 'task',
            title: 'Sort keys',
            description: 'Inspect or sort keys with keys | sort for quick audits.',
            slug: '/tasks/sort-keys'
        },
        {
            id: 'remove-duplicates',
            group: 'task',
            title: 'Remove duplicates',
            description: 'Use unique to remove duplicate values from arrays.',
            slug: '/tasks/remove-duplicates'
        }
    ],
    faqs: [
        {
            question: 'Is it free?',
            answer: 'Yes. The JSON linter, formatter, and jq playground are free to use.'
        },
        {
            question: 'Does it upload my data?',
            answer: 'No. Everything runs locally in your browser, and your JSON never leaves your device.'
        },
        {
            question: 'Can it fix invalid JSON?',
            answer: 'Yes. It can repair trailing commas, single quotes, comments in JSON, and missing commas or brackets.'
        },
        {
            question: 'Does it support jq?',
            answer: 'Yes. It supports jq-like filters such as .key, map(), select(), sort_by(), unique, and more.'
        },
        {
            question: 'Why does my API return invalid JSON?',
            answer: 'Common causes are debug comments, trailing commas, unquoted keys, or mixed quotes in logs or templates.'
        },
        {
            question: 'How to find JSON error line/column?',
            answer: 'Run lint to see the exact parse error line and column, then fix or auto-repair the highlighted part.'
        }
    ]
};

/**
 * Checks if the current device is a mobile device based on window width
 * @returns {boolean} True if the device is mobile, false otherwise
 */
function isMobile() {
    return window.innerWidth <= 768;
}

function getEditorContent() {
    return editor.getValue();
}

/**
 * Displays a toast message to the user
 * @param {string} message - The message to display
 * @param {('success'|'error')} [type='success'] - The type of toast message
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.offsetHeight; // Force reflow
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

/**
 * Checks if the editor is empty
 * @returns {boolean} True if editor is empty, false otherwise
 */
function isEditorEmpty() {
    if (getEditorContent().trim() === '') {
        showToast('Editor is empty', 'error');
        return true;
    }
    return false;
}

function replaceEditorContent(content) {
    const doc = editor.getDoc();
    editor.operation(() => {
        const lastLine = doc.lineCount() - 1;
        const lastCh = doc.getLine(lastLine).length;
        doc.replaceRange(content, { line: 0, ch: 0 }, { line: lastLine, ch: lastCh });
    });
    editor.setCursor(0, 0);
}

/**
 * Formats and validates JSON content in the editor
 * @throws {Error} If JSON is invalid
 */
function lintCode() {
    if (isEditorEmpty()) {
        return;
    }

    try {
        const content = getEditorContent();
        const parsed = JSON.parse(content);
        const jsonContent = JSON.stringify(parsed, null, 2);
        editor.setValue(jsonContent);
        // Reset cursor to start or keep? CM resets usually.
    } catch (error) {
        console.log("Lint error, attempting fix:", error);
        fixCode();
    }
}

/**
 * Attempts to repair invalid JSON using JSONRepair library
 * @throws {Error} If JSON cannot be repaired
 */
function fixCode() {
    try {
        const { jsonrepair } = JSONRepair;
        const currentContent = getEditorContent();
        if (!currentContent.trim()) return;

        // jsonrepair returns the fixed string
        const parsedData = jsonrepair(currentContent);

        // Format it
        const parsedObj = JSON.parse(parsedData);
        editor.setValue(JSON.stringify(parsedObj, null, 2));
        showToast('JSON fixed and formatted', 'success');
    } catch (error) {
        handleJSONError(error);
    }
}

/**
 * Minifies JSON content in the editor
 * @throws {Error} If JSON is invalid
 */
function minifyCode() {
    if (isEditorEmpty()) {
        return;
    }

    try {
        const content = getEditorContent();
        const parsed = JSON.parse(content);
        editor.setValue(JSON.stringify(parsed));
    } catch (error) {
        handleJSONError(error);
    }
}

/**
 * Handles JSON parsing errors with detailed position information
 * @param {Error} error - The JSON parsing error
 */
function handleJSONError(error) {
    showToast(`Invalid JSON: ${error.message}`, 'error');
}

/**
 * Clears all content from the editor
 * @returns {void}
 */
function clearCode() {
    editor.setValue('');
    editor.clearHistory();
}

/**
 * Copies the editor content to clipboard and shows a confirmation
 * @returns {Promise<void>} A promise that resolves when the copy is complete
 */
async function copyContent() {
    try {
        const content = getEditorContent();
        await navigator.clipboard.writeText(content);
        const copyButton = document.querySelector('.copy-button');
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Copied!
            `;
        setTimeout(() => copyButton.innerHTML = originalText, 2000);
    } catch (err) {
        showToast('Failed to copy content', 'error');
    }
}

function undoEdit() {
    editor.undo();
}

function updateUndoButton() {
    const undoBtn = document.getElementById('undo-button');
    const count = editor.historySize().undo;
    if (count > 0) {
        undoBtn.disabled = false;
        undoBtn.style.opacity = '1';
    } else {
        undoBtn.disabled = true;
        undoBtn.style.opacity = '0.5';
    }
}

/**
 * Toggles full screen mode for the main section
 */
function toggleFullScreen() {
    const section = document.getElementById('seo-content');
    if (!section) return;
    const isDesktop = window.innerWidth >= 1024;
    const isHidden = section.classList.contains('is-hidden');
    if (isHidden) {
        section.classList.remove('is-hidden');
        section.classList.add('is-visible');
    }
    if (isDesktop) {
        section.classList.remove('full-screen');
        section.classList.toggle('side-panel');
    } else {
        section.classList.remove('side-panel');
        section.classList.toggle('full-screen');
    }
    const closeButton = document.querySelector('.close-button');
    const isOpen = section.classList.contains('full-screen') || section.classList.contains('side-panel');
    closeButton.style.display = isOpen ? 'block' : 'none';
    if (isOpen) {
        section.scrollTop = 0;
    } else {
        section.classList.remove('is-visible');
        section.classList.add('is-hidden');
    }
    editor.refresh();
}

/**
 * Loads example JSON data into the editor
 */
function loadExample() {
    const exampleJSON = `{
  'name': "John Doe",
  "age": 30,
  "isStudent": false,
  "courses": [
    "Math",
    "Science",
  ],
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
  }
}`;
    replaceEditorContent(exampleJSON);
    showToast('Sample JSON loaded', 'success');
}

/**
 * Toggles the visibility of the right navigation panel
 */
function toggleRightNav() {
    const rightNav = document.getElementById('rightNav');
    rightNav.classList.toggle('open');
}

function closeNav() {
    const rightNav = document.getElementById('rightNav');
    rightNav.classList.remove('open');
}

// Storage helpers
function getKeyName(fileName) {
    return "lnt_" + fileName;
}

function getFileName(keyName) {
    return keyName.replace("lnt_", "");
}

function getFileList() {
    return Object.keys(localStorage).filter(key => key.startsWith("lnt_"));
}

function saveToLocal() {
    if (isEditorEmpty()) {
        return;
    }

    const jsonContent = getEditorContent();
    const fileName = prompt('Enter the name of the file to save:');
    if (fileName) {
        const fileData = {
            content: jsonContent,
            date: new Date().toLocaleString()
        };
        localStorage.setItem(getKeyName(fileName), JSON.stringify(fileData));
        updateFileList();
        showToast(`Saved ${fileName}`, 'success');
    }
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
    const files = getFileList();

    if (files.length === 0) {
        const helpText = document.createElement('li');
        Object.assign(helpText.style, {
            display: 'flex', alignItems: 'center', color: '#888',
            padding: '10px', fontSize: '14px', lineHeight: '1.5',
            whiteSpace: 'normal', textAlign: 'center'
        });
        helpText.innerHTML = `
            No files saved. Use the 💾 button to store your JSON data. The file will be saved in your browser's local storage. Use ⬇️ to save the file to your computer.
        `;
        fileList.appendChild(helpText);
    } else {
        for (const fileName of files) {
            try {
                const fileData = JSON.parse(localStorage.getItem(fileName));
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <span onclick="loadFromLocal('${fileName}')">${getFileName(fileName)}</span>
                    <span class="file-date" onclick="loadFromLocal('${fileName}')">${fileData.date.toLocaleString()}</span>
                    <button onclick="deleteFile('${fileName}')">🗑️</button>
                    <button onclick="renameFile('${fileName}')">✏️</button>
                `;
                fileList.appendChild(listItem);
            } catch (e) { }
        }
    }
}

function loadFromLocal(fileName) {
    try {
        const fileData = JSON.parse(localStorage.getItem(fileName));
        if (fileData) {
            editor.setValue(fileData.content);
            showToast(`Loaded ${getFileName(fileName)}`, 'success');
        } else {
            alert('No JSON found in local storage.');
        }
        if (isMobile()) {
            toggleRightNav();
        }
    } catch (e) {
        showToast('Error loading file', 'error');
    }
}

function deleteFile(fileName) {
    if (confirm(`Are you sure you want to delete ${getFileName(fileName)}?`)) {
        localStorage.removeItem(fileName);
        updateFileList();
    }
}

function renameFile(oldName) {
    const newName = prompt('Enter the new name for the file:', getFileName(oldName));
    if (newName && newName !== getFileName(oldName)) {
        const content = localStorage.getItem(oldName);
        localStorage.setItem(getKeyName(newName), content);
        localStorage.removeItem(oldName);
        updateFileList();
    }
}

function downloadJSON() {
    if (isEditorEmpty()) {
        return;
    }
    const jsonContent = getEditorContent();
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
}

// JQ Modal Logic
const jqModal = document.getElementById('jq-modal');
const jqInput = document.getElementById('jq-query-input');

function openJQModal() {
    if (isEditorEmpty()) return;
    jqModal.style.display = 'flex';
    jqInput.focus();
}

function closeJQModal() {
    jqModal.style.display = 'none';
}

function insertJQExample(text) {
    jqInput.value = text;
    jqInput.focus();
}

function toggleJQHelp() {
    const help = document.getElementById('jq-help');
    help.style.display = help.style.display === 'none' ? 'block' : 'none';
}

function applyJQFilter() {
    const query = jqInput.value.trim();
    if (!query) return;

    try {
        const content = getEditorContent();

        // Use JQLite class
        const jq = new JQLite();
        const result = jq.apply(content, query);

        if (result.success) {
            if (result.result !== undefined) {
                // If result is object/array, format it. If primitive, just show it.
                // Usually we expect JSON output.
                let output;
                if (typeof result.result === 'object' && result.result !== null) {
                    output = JSON.stringify(result.result, null, 2);
                } else {
                    output = String(result.result);
                }
                editor.setValue(output);
                closeJQModal();
                showToast('Filter applied', 'success');
            } else {
                showToast('Filter returned no result', 'info');
            }
        } else {
            showToast('Filter error: ' + result.error, 'error');
        }

    } catch (e) {
        showToast('Error applying filter: ' + e.message, 'error');
    }
}

function renderFixErrors() {
    const list = document.getElementById('fix-errors-list');
    if (!list) return;
    list.innerHTML = '';

    const fixes = seoData.useCases.filter(item => item.group === 'fix');
    for (const item of fixes) {
        const li = document.createElement('li');
        const title = document.createElement('strong');
        title.textContent = `${item.title}:`;
        li.appendChild(title);
        li.appendChild(document.createTextNode(` ${item.description}`));
        list.appendChild(li);
    }
}

function renderJqExamples() {
    const grid = document.getElementById('jq-examples-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const examples = seoData.useCases.filter(item => item.group === 'jq');
    for (const example of examples) {
        const card = document.createElement('div');
        card.className = 'jq-example-card';
        card.dataset.exampleId = example.id;

        const title = document.createElement('h3');
        title.textContent = example.title;

        const codeButton = document.createElement('button');
        codeButton.type = 'button';
        codeButton.className = 'code-snippet';
        const code = document.createElement('code');
        code.textContent = example.filter;
        codeButton.appendChild(code);
        codeButton.addEventListener('click', () => tryJQExample(example.id));

        const description = document.createElement('p');
        description.textContent = example.description;

        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'try-button';
        action.textContent = 'Try this';
        action.addEventListener('click', () => tryJQExample(example.id));

        card.appendChild(title);
        card.appendChild(codeButton);
        card.appendChild(description);
        card.appendChild(action);
        grid.appendChild(card);
    }
}

function renderCommonTasks() {
    const grid = document.getElementById('common-tasks-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const tasks = seoData.useCases.filter(item => item.group === 'task');
    for (const task of tasks) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.dataset.useCase = task.slug;

        const title = document.createElement('h3');
        title.textContent = task.title;

        const description = document.createElement('p');
        description.textContent = task.description;

        card.appendChild(title);
        card.appendChild(description);
        grid.appendChild(card);
    }
}

function renderFaq() {
    const grid = document.getElementById('faq-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const item of seoData.faqs) {
        const faq = document.createElement('div');
        faq.className = 'faq-item';

        const question = document.createElement('h3');
        question.textContent = item.question;

        const answer = document.createElement('p');
        answer.textContent = item.answer;

        faq.appendChild(question);
        faq.appendChild(answer);
        grid.appendChild(faq);
    }
}

function tryJQExample(exampleId) {
    const example = seoData.useCases.find(item => item.id === exampleId);
    if (!example || !example.sample) return;

    replaceEditorContent(example.sample);
    jqInput.value = example.filter;
    openJQModal();
    showToast('Example loaded. Apply the filter or undo to restore.', 'info');
}

/**
 * Loads JSON from URL parameters:
 * - ?url=... loads JSON from an external URL
 * - ?json=... loads compressed JSON data (LZ-String)
 */
async function loadJSONFromURL() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const externalUrl = urlParams.get('url');
        const compressed = urlParams.get('json');

        // Priority 1: Load from external URL
        if (externalUrl) {
            try {
                // Validate URL to prevent javascript: or data: schemes
                const parsedUrl = new URL(externalUrl);
                if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                    showToast('Only HTTP/HTTPS URLs are allowed', 'error');
                    return;
                }

                showToast('Loading JSON from URL...', 'success');

                const response = await fetch(externalUrl);

                if (!response.ok) {
                    showToast(`Failed to load URL: ${response.status} ${response.statusText}`, 'error');
                    return;
                }

                const content = await response.text();

                // Validate it's valid JSON
                try {
                    JSON.parse(content);
                    editor.setValue(content);
                    // Format it nicely
                    lintCode();
                    showToast('JSON loaded from external URL', 'success');
                } catch (e) {
                    showToast('Invalid JSON from external URL', 'error');
                }

                return;
            } catch (error) {
                if (error.name === 'TypeError' && error.message.includes('URL')) {
                    showToast('Invalid URL format', 'error');
                } else {
                    showToast(`Error loading from URL: ${error.message}`, 'error');
                }
                return;
            }
        }

        // Priority 2: Load from compressed parameter
        if (compressed) {
            // Decompress using LZ-String
            const decompressed = LZString.decompressFromEncodedURIComponent(compressed);

            if (!decompressed) {
                showToast('Failed to decompress JSON from URL', 'error');
                return;
            }

            // Validate it's valid JSON
            try {
                JSON.parse(decompressed);
                editor.setValue(decompressed);
                // Format it nicely
                lintCode();
                showToast('JSON loaded from URL', 'success');
            } catch (e) {
                showToast('Invalid JSON in URL parameter', 'error');
            }
        }
    } catch (error) {
        console.error('Error loading JSON from URL:', error);
        showToast('Error loading JSON from URL', 'error');
    }
}

/**
 * Generates a shareable URL with compressed JSON and copies to clipboard
 */
function shareJSON() {
    if (isEditorEmpty()) {
        return;
    }

    try {
        const content = getEditorContent();

        // Validate JSON first
        try {
            JSON.parse(content);
        } catch (e) {
            showToast('Please fix JSON errors before sharing', 'error');
            return;
        }

        // Compress using LZ-String
        const compressed = LZString.compressToEncodedURIComponent(content);

        // Generate URL
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?json=${compressed}`;

        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast(`Shareable URL copied to clipboard (${shareUrl.length} chars)`, 'success');
        }).catch(() => {
            // Fallback: show the URL in a prompt
            prompt('Copy this URL to share:', shareUrl);
        });

    } catch (error) {
        console.error('Error generating share URL:', error);
        showToast('Error generating shareable URL', 'error');
    }
}

// Shortcuts
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.altKey) {
        switch (e.key.toLowerCase()) {
            case 'l': e.preventDefault(); lintCode(); break;
            case 'm': e.preventDefault(); minifyCode(); break;
            case 'q': e.preventDefault(); openJQModal(); break;
            case 'backspace': // Check if this catches Ctrl+Alt+Backspace
            case 'delete':
                e.preventDefault(); clearCode(); break;
            case 'c': e.preventDefault(); copyContent(); break;
            case 'd': e.preventDefault(); downloadJSON(); break;
            case 's': e.preventDefault(); saveToLocal(); break;
            case 'o': e.preventDefault(); toggleRightNav(); break;
            case 'u': e.preventDefault(); shareJSON(); break;
            case 'h': // Help
                break;
        }
    }
});

// Render SEO content blocks from data
renderFixErrors();
renderJqExamples();
renderCommonTasks();
renderFaq();

// Initialize file list
updateFileList();

// Load JSON from URL parameter if present
loadJSONFromURL();
