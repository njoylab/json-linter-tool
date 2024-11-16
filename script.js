const editor = document.getElementById('editor');
const lineNumbers = document.getElementById('lineNumbers');
let charCount = 0;

/**
 * Checks if the current device is a mobile device based on window width
 * @returns {boolean} True if the device is mobile, false otherwise
 */
function isMobile() {
    return window.innerWidth <= 768;
}

/**
 * Handles input events in the editor, including syntax highlighting and cursor position
 * @param {InputEvent} event - The input event object
 */
function handleEditorInput(event) {
    const lastCharInput = event.data;
    debounce(() => {
        try {
            const text = editor.innerText;
            const currentTextLength = text.length;
            if (text.trim()) {
                let range = saveCursorPosition();
                // if last character is a newline, move the cursor one position to the right
                const isDelete = currentTextLength < charCount;
                if (lastCharInput === null && !isDelete) {
                    range = range + 1;
                }
                editor.innerHTML = highlightJSON(text);
                restoreCursorPosition(range);
                charCount = currentTextLength;
            }
        } catch (e) {
            console.log('Highlighting error:', e);
        }
    }, 500)();
    updateLineNumbers();
}

/**
 * Handles paste events, formatting JSON if valid
 * @param {ClipboardEvent} e - The clipboard event object
 */
function handlePaste(e) {
    e.preventDefault();
    let text = (e.clipboardData || window.clipboardData).getData('text/plain');
    try {
        const parsed = JSON.parse(text);
        text = JSON.stringify(parsed, null, 2);
    } catch (e) { }
    const highlighted = highlightJSON(text);

    // Use Range and Selection APIs to insert HTML
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    selection.deleteFromDocument(); // Remove current selection
    const range = selection.getRangeAt(0);
    const fragment = range.createContextualFragment(highlighted);
    range.insertNode(fragment);


    updateLineNumbers();
}

/**
 * Handles clicks on line numbers to toggle code folding
 * @param {MouseEvent} e - The click event object
 */
function handleLineNumberClick(e) {
    const lineNumber = e.target.dataset.line;
    if (lineNumber !== undefined) {
        toggleCollapse(parseInt(lineNumber));
    }
}

/**
 * Creates a debounced version of a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), wait);
    };
}

/**
 * Updates the line numbers in the editor gutter
 * Adds collapsible line indicators for objects and arrays
 * @returns {void} 
 */
function updateLineNumbers() {
    const content = editor.innerText;
    const lines = content.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    lineNumbers.innerHTML = lines.map((line, index) => {
        const isCollapsible = isObjectOrArrayLine(line);
        const lineClass = isCollapsible ? 'collapsible-line' : '';
        return `<div data-line="${index}" class="${lineClass}">${index + 1}</div>`;
    }).join('');
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
    if (editor.innerText.trim() === '') {
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
        const content = editor.innerText;
        const parsed = JSON.parse(content);
        const jsonContent = JSON.stringify(parsed, null, 2);
        editor.innerHTML = highlightJSON(jsonContent);
    } catch (error) {
        fixCode();
    }
    // put the cursor at the end of the text
    restoreCursorPosition(editor.innerText.length);
    updateLineNumbers();
}

/**
 * Attempts to repair invalid JSON using JSONRepair library
 * @throws {Error} If JSON cannot be repaired
 */
function fixCode() {
    try {
        const { jsonrepair } = JSONRepair;
        const parsedData = jsonrepair(editor.textContent);
        editor.innerHTML = highlightJSON(parsedData);
    } catch (error) {
        showToast(error.message, 'error');
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
        const content = editor.innerText;
        const parsed = JSON.parse(content);
        editor.innerHTML = highlightJSON(JSON.stringify(parsed));
    } catch (error) {
        handleJSONError(error);
    }
    updateLineNumbers();
}

/**
 * Handles JSON parsing errors with detailed position information
 * @param {Error} error - The JSON parsing error
 */
function handleJSONError(error) {
    const position = error.message.match(/position (\d+)/);
    let resultMessage;
    if (position) {
        const charIndex = parseInt(position[1]);
        const lines = editor.textContent.substring(0, charIndex).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        resultMessage = `Invalid JSON at line ${line}, column ${column}: ${error.message}`;
    } else {
        resultMessage = `Invalid JSON: ${error.message}`;
    }
    showToast(resultMessage, 'error');
}

/**
 * Clears all content from the editor and updates line numbers
 * @returns {void}
 */
function clearCode() {
    editor.innerText = '';
    updateLineNumbers();
}


/**
 * Applies syntax highlighting to JSON text
 * @param {string} text - The JSON text to highlight
 * @returns {string} HTML string with syntax highlighting
 */
function highlightJSON(text) {
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return text.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
                match = match.slice(0, -1);
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return cls === 'json-key' ? `<span class="${cls}">${match}</span>:` : `<span class="${cls}">${match}</span>`;
    });
}

/**
 * Copies the editor content to clipboard and shows a confirmation
 * @returns {Promise<void>} A promise that resolves when the copy is complete
 * @throws {Error} If clipboard access fails
 */
async function copyContent() {
    try {
        const content = editor.innerText;
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

/**
 * Toggles code block collapse state
 * @param {number} lineNumber - The line number to toggle
 */
function toggleCollapse(lineNumber) {
    const codeLineElements = editor.childNodes;
    const lineElement = codeLineElements[lineNumber];
    const line = lineElement.textContent.trim();
    if (!isObjectOrArrayLine(line)) return;

    const endLine = findMatchingBrace(codeLineElements, lineElement);
    if (endLine === -1) return;

    const isCurrentlyCollapsed = lineElement.classList.contains('collapsed-line');

    if (!isCurrentlyCollapsed) {
        for (let i = lineNumber + 1; i < endLine; i++) {
            codeLineElements[i].classList.add('hidden-line');
        }
        lineElement.classList.add('collapsed-line');
        const placeholder = document.createElement('div');
        placeholder.className = 'collapse-placeholder';
        placeholder.textContent = `... ${endLine - lineNumber - 1} lines hidden ...`;
        placeholder.addEventListener('click', () => toggleCollapse(lineNumber));
        lineElement.parentNode.insertBefore(placeholder, codeLineElements[endLine]);
    } else {
        for (let i = lineNumber + 1; i < endLine; i++) {
            codeLineElements[i].classList.remove('hidden-line');
        }
        lineElement.classList.remove('collapsed-line');
        const placeholder = lineElement.parentNode.querySelector('.collapse-placeholder');
        if (placeholder) placeholder.remove();
    }
}
/**
 * Checks if a line contains an opening brace/bracket for an object/array
 * @param {string} line - The line of code to check
 * @returns {boolean} True if line ends with { or [, false otherwise
 */
function isObjectOrArrayLine(line) {
    return /[{\[][ ]*$/.test(line.trim());
}

/**
 * Finds the matching closing brace/bracket for an opening one
 * @param {NodeList} lines - The lines of code to search through
 * @param {number} startLine - The line number containing the opening brace
 * @returns {number} The line number of the matching closing brace, or -1 if not found
 */
function findMatchingBrace(lines, startLine) {
    const startChar = lines[startLine].trim().slice(-1);
    const endChar = startChar === '{' ? '}' : ']';
    let depth = 1;

    for (let i = startLine + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        for (let char of line) {
            if (char === '{' || char === '[') depth++;
            if (char === '}' || char === ']') depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

/**
 * Saves current cursor position in the editor
 * @returns {number} The current caret position
 */
function saveCursorPosition() {
    return CaretUtil.getCaretPosition(editor);
}

/**
 * Restores cursor position in the editor
 * @param {number} saved - The position to restore to
 * @returns {boolean} Always returns false
 */
function restoreCursorPosition(saved) {
    if (saved && editor) {
        CaretUtil.setCaretPosition(editor, saved)
    }
    return false;
}

/**
 * Synchronizes scrolling between the line numbers and editor
 * Makes the line numbers scroll in sync with the editor content
 * @returns {void}
 */
function syncScroll() {
    lineNumbers.scrollTop = editor.scrollTop;
}

// CaretUtil library, based on
// https://stackoverflow.com/questions/6249095/41034697#41034697
var CaretUtil = {};

/**
 * Set the caret position inside a contentEditable container
 */
CaretUtil.setCaretPosition = function (container, position) {
    if (position >= 0) {
        var selection = window.getSelection();
        var range = CaretUtil.createRange(container, { count: position });
        if (range != null) {
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
};

/**
 * Get the current caret position inside a contentEditable container
 */
CaretUtil.getCaretPosition = function (container) {
    var selection = window.getSelection();
    var charCount = -1;
    var node;
    if (selection.focusNode != null) {
        if (CaretUtil.isDescendantOf(selection.focusNode, container)) {
            node = selection.focusNode;
            charCount = selection.focusOffset;
            while (node != null) {
                if (node == container) {
                    break;
                }
                if (node.previousSibling != null) {
                    node = node.previousSibling;
                    charCount += node.textContent.length;
                } else {
                    node = node.parentNode;
                    if (node == null) {
                        break;
                    }
                }
            }
        }
    }
    return charCount;
};


/**
 * Returns true if the node is a descendant (or equal to) a parent
 */
CaretUtil.isDescendantOf = function (node, parent) {
    while (node != null) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
};

/**
 * Creates a range for setting caret position in contentEditable elements
 * @param {Node} node - The DOM node to create range in
 * @param {Object} chars - Object containing count of characters to set range end
 * @param {Range} [range] - Optional existing range to modify
 * @returns {Range} The created or modified range
 */
CaretUtil.createRange = function (node, chars, range) {
    if (range == null) {
        range = window.document.createRange();
        range.selectNode(node);
        range.setStart(node, 0);
    }
    if (chars.count == 0) {
        range.setEnd(node, chars.count);
    } else if (node != null && chars.count > 0) {
        if (node.nodeType == 3) {
            if (node.textContent.length < chars.count) {
                chars.count -= node.textContent.length;
            } else {
                range.setEnd(node, chars.count);
                chars.count = 0;
            }
        } else {
            var _g = 0;
            var _g1 = node.childNodes.length;
            while (_g < _g1) {
                var lp = _g++;
                range = CaretUtil.createRange(node.childNodes[lp], chars, range);
                if (chars.count == 0) {
                    break;
                }
            }
        }
    }
    return range;
};

/**
 * Toggles full screen mode for the main section
 * Shows/hides close button based on full screen state
 */
function toggleFullScreen() {
    const section = document.querySelector('section');
    section.classList.toggle('full-screen');
    const closeButton = document.querySelector('.close-button');
    closeButton.style.display = section.classList.contains('full-screen') ? 'block' : 'none';
}

/**
 * Loads example JSON data into the editor
 * Formats and updates line numbers after loading
 */
function loadExample() {
    const exampleJSON = `{
        "name": "John Doe",
        "age": 30,
        "isStudent": false,
        "courses": ["Math", "Science"],
        "address": {
            "street": "123 Main St",
            "city": "Anytown"
        }
    }`;
    document.getElementById('editor').innerText = exampleJSON;
    lintCode();
    updateLineNumbers();
    toggleFullScreen();
}

/**
 * Toggles the visibility of the right navigation panel
 */
function toggleRightNav() {
    const rightNav = document.getElementById('rightNav');
    rightNav.classList.toggle('open');
}

/**
 * Closes the right navigation panel
 */
function closeNav() {
    const rightNav = document.getElementById('rightNav');
    rightNav.classList.remove('open');
}

/**
 * Gets the storage key name for a file
 * @param {string} fileName - Name of the file
 * @returns {string} Storage key with prefix
 */
function getKeyName(fileName) {
    return "lnt_" + fileName;
}

/**
 * Gets the original file name from a storage key
 * @param {string} keyName - Storage key name
 * @returns {string} Original file name without prefix
 */
function getFileName(keyName) {
    return keyName.replace("lnt_", "");
}

/**
 * Gets list of all JSON files saved in local storage
 * @returns {string[]} Array of storage keys for JSON files
 */
function getFileList() {
    return Object.keys(localStorage).filter(key => key.startsWith("lnt_"));
}

/**
 * Saves JSON content to local storage
 * @returns {void}
 */
function saveToLocal() {
    if (isEditorEmpty()) {
        return;
    }

    const jsonContent = document.getElementById('editor').innerText;
    const fileName = prompt('Enter the name of the file to save:');
    if (fileName) {
        const fileData = {
            content: jsonContent,
            date: new Date().toLocaleString()
        };
        localStorage.setItem(getKeyName(fileName), JSON.stringify(fileData));
        updateFileList();
    }
}

/**
 * Updates the file list in the right navigation panel
 * Displays either a help message if no files exist, or a list of saved files
 * with options to load, delete and rename them
 * @returns {void}
 */
function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = ''; // Clear existing list
    const files = getFileList();

    if (files.length === 0) {
        const helpText = document.createElement('li');
        helpText.style.display = 'flex';
        helpText.style.alignItems = 'center';
        helpText.style.color = '#888';
        helpText.style.padding = '10px';
        helpText.style.fontSize = '14px';
        helpText.style.lineHeight = '1.5';
        helpText.style.whiteSpace = 'normal'; // Ensure text wraps if needed
        helpText.style.textAlign = 'center';
        helpText.innerHTML = `
            No files saved. Use the 💾 button to store your JSON data. The file will be saved in your browser's local storage. Use ⬇️ to save the file to your computer.
        `;
        fileList.appendChild(helpText);


    } else {
        for (const fileName of files) {
            const fileData = JSON.parse(localStorage.getItem(fileName));

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span onclick="loadFromLocal('${fileName}')">${getFileName(fileName)}</span>
                <span class="file-date" onclick="loadFromLocal('${fileName}')">${fileData.date.toLocaleString()}</span>
                <button onclick="deleteFile('${fileName}')">🗑️</button>
                <button onclick="renameFile('${fileName}')">✏️</button>
            `;
            fileList.appendChild(listItem);
        }
    }
}

/**
 * Loads JSON content from local storage
 * @param {string} fileName - The name of the file to load
 */
function loadFromLocal(fileName) {
    const fileData = JSON.parse(localStorage.getItem(fileName));
    if (fileData) {
        document.getElementById('editor').innerText = fileData.content;
    } else {
        alert('No JSON found in local storage.');
    }
    lintCode();
    updateLineNumbers();
    if (isMobile()) {
        toggleRightNav();
    }
}

/**
 * Deletes a saved JSON file from local storage
 * @param {string} fileName - The name of the file to delete
 */
function deleteFile(fileName) {
    if (confirm(`Are you sure you want to delete ${getFileName(fileName)}?`)) {
        localStorage.removeItem(fileName);
        updateFileList();
    }
}

/**
 * Renames a saved JSON file in local storage
 * @param {string} oldName - The current name of the file to rename
 */
function renameFile(oldName) {
    const newName = prompt('Enter the new name for the file:', getFileName(oldName));
    if (newName && newName !== getFileName(oldName)) {
        const content = localStorage.getItem(oldName);
        localStorage.setItem(getKeyName(newName), content);
        localStorage.removeItem(oldName);
        updateFileList();
    }
}

/**
 * Downloads the current JSON content as a file
 */
function downloadJSON() {
    if (isEditorEmpty()) {
        return;
    }

    const jsonContent = document.getElementById('editor').innerText;
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
}

editor.addEventListener('input', handleEditorInput);
editor.addEventListener('paste', handlePaste);
lineNumbers.addEventListener('click', handleLineNumberClick);
editor.addEventListener('scroll', syncScroll);

document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.altKey) {
        switch (event.key.toLowerCase()) {
            case 'l':
                lintCode();
                break;
            case 'm':
                minifyCode();
                break;
            case 'backspace':
                clearCode();
                break;
            case 'c':
                copyContent();
                break;
            case 'd':
                downloadJSON();
                break;
            case 's':
                saveToLocal();
                break;
            case 'o':
                toggleRightNav();
                break;
            case 'h':
                toggleFullScreen();
                break;
        }
        // prevent default behavior
        event.preventDefault();
    }
});
// Call updateFileList on page load to initialize the file list
document.addEventListener('DOMContentLoaded', updateFileList);
