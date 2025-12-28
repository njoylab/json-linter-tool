
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
    const section = document.querySelector('section');
    section.classList.toggle('full-screen');
    const closeButton = document.querySelector('.close-button');
    closeButton.style.display = section.classList.contains('full-screen') ? 'block' : 'none';
    editor.refresh();
}

/**
 * Loads example JSON data into the editor
 */
function loadExample() {
    const exampleJSON = `{
  "name": "John Doe",
  "age": 30,
  "isStudent": false,
  "courses": [
    "Math",
    "Science"
  ],
  "address": {
    "street": "123 Main St",
    "city": "Anytown"
  }
}`;
    editor.setValue(exampleJSON);
    toggleFullScreen();
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
            case 'h': // Help
                break;
        }
    }
});

// Initialize file list
updateFileList();
