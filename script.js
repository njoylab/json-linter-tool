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

function getEditorContent() {
    return editor.innerText.replaceAll(' ', '');
}

/**
 * Handles input events in the editor, including syntax highlighting and cursor position
 * @param {InputEvent} event - The input event object
 */
function handleEditorInput(event) {
    const lastCharInput = event.data;
    // whitelabel some characters that are not important to highlight (like spaces and tabs)
    if (!lastCharInput || lastCharInput.match(/[ \t]/)) {
        updateLineNumbers();
        return;
    }
    //  debounce(() => {

    try {
        const text = getEditorContent();
        if (text.trim()) {
            let range = saveCursorPosition();
            // Use the modified highlightJSON function
            editor.innerHTML = highlightJSON(text);
            restoreCursorPosition(range);
        }
    } catch (e) {
        console.log('Highlighting error:', e);
    }
    //}, 1500)();
}

/**
 * Handles paste events, formatting JSON if valid
 * @param {ClipboardEvent} e - The clipboard event object
 */
function handlePaste(e) {
    e.preventDefault();
    let text = (e.clipboardData || window.clipboardData).getData('text/plain');

    // Sanitize the pasted text
    text = sanitizePastedText(text);

    try {
        const parsed = JSON.parse(text);
        text = JSON.stringify(parsed, null, 2); // Format with 2 spaces
    } catch (e) {
        // If parsing fails, keep the sanitized text as-is
    }

    const highlighted = highlightJSON(text);

    // Use Range and Selection APIs to insert HTML
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    selection.deleteFromDocument();
    const range = selection.getRangeAt(0);
    const fragment = range.createContextualFragment(highlighted);
    range.insertNode(fragment);

    updateLineNumbers();
}

/**
 * Sanitizes pasted text by normalizing whitespace
 * @param {string} text - The text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizePastedText(text) {
    return text
        // Replace tabs with spaces
        .replace(/\t/g, '  ')
        // Replace multiple spaces with two spaces
        .replace(/ {3,}/g, '  ')
        // Replace multiple newlines with single newlines
        .replace(/\n{3,}/g, '\n\n')
        // Remove spaces at the end of lines
        .replace(/[ \t]+$/gm, '')
        // Remove spaces before commas
        .replace(/\s+,/g, ',')
        // Ensure single space after commas
        .replace(/,(\S)/g, ', $1')
        // Remove spaces inside empty brackets/braces
        .replace(/\{\s+\}/g, '{}')
        .replace(/\[\s+\]/g, '[]')
        // Remove spaces around colons (but keep one space after)
        .replace(/\s*:\s*/g, ': ')
        // Trim leading/trailing whitespace
        .trim();
}

/**
 * Creates a debounced version of a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} The debounced function
 */
/*function debounce(func, wait) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, arguments), wait);
    };
}*/

/**
 * Updates the line numbers in the editor gutter
 * Adds collapsible line indicators for objects and arrays
 * @returns {void} 
 */
function updateLineNumbers() {
    const contentLines = editor.querySelectorAll('.code-line');
    const lineNumberHTML = [];
    let i = 0;

    while (i < contentLines.length) {
        const line = contentLines[i];
        const isCollapsed = line.classList.contains('collapsed');
        const isHidden = line.style.display === 'none';
        const lineText = line.textContent;
        const isCollapsible = isObjectOrArrayLine(lineText.trim());
        const lineClass = isCollapsible ? 'collapsible-line' : '';
        const collapseIndicator = isCollapsible ? (isCollapsed ? '▶' : '▼') : '';
        const lineNumber = i + 1;

        if (isCollapsed) {
            // Add line number for the collapsed line
            lineNumberHTML.push(`<div data-line="${i}" class="${lineClass}" data-indicator="${collapseIndicator}">${lineNumber}</div>`);

            // Find matching closing brace/bracket
            const matchingLine = findMatchingBraceInEditor(Array.from(contentLines), i);
            const collapsedLinesCount = matchingLine - i;

            // Skip collapsed lines
            i = matchingLine + 1;
        } else if (isHidden) {
            // Skip hidden lines (they are part of a collapsed block)
            i++;
        } else {
            // Add line number for visible line
            lineNumberHTML.push(`<div data-line="${i}" class="${lineClass}" data-indicator="${collapseIndicator}">${lineNumber}</div>`);
            i++;
        }
    }

    lineNumbers.innerHTML = lineNumberHTML.join('');
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
        editor.innerHTML = highlightJSON(jsonContent);
        restoreCursorPosition(content.length);
    } catch (error) {
        console.log(error);
        fixCode();
    }
    // put the cursor at the end of the text

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
        const content = getEditorContent();
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
    // Escape HTML characters but preserve spaces
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const lines = text.split('\n');

    const highlightedLines = lines.map(line => {
        // Preserve leading whitespace exactly as is
        const leadingSpaces = line.match(/^(\s*)/)[0];
        const lineContent = line.slice(leadingSpaces.length);

        // Match key and any following structure
        const keyMatch = lineContent.match(/^("[^"]*"\s*:\s*)([\{\[])?(.*)$/);
        if (keyMatch) {
            const [, keyPart, bracePart = '', restOfLine] = keyMatch;

            const highlightedKey = keyPart.replace(/(".*?")(\s*:)(\s*)/, (match, p1, p2, p3) => {
                // Preserve spaces after the colon
                return `<span class="json-key">${p1}</span>${p2}${p3}`;
            });

            const highlightedBrace = bracePart ? `<span class="json-brace">${bracePart}</span>` : '';
            const highlightedRest = restOfLine.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^\\"]|[^\\"])*"|[\{\}\[\]]|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|,)/g, match => {
                return highlightMatch(match);
            });

            return `<div class="code-line">${leadingSpaces}${highlightedKey}${highlightedBrace}${highlightedRest}</div>`;
        } else {
            // Regular line highlighting
            const highlightedLine = lineContent.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^\\"]|[^\\"])*"|[\{\}\[\]]|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|,)/g, match => {
                return highlightMatch(match);
            });
            return `<div class="code-line">${leadingSpaces}${highlightedLine}</div>`;
        }
    });

    return highlightedLines.join('');
}

/**
 * Highlights a match in the JSON text
 * @param {string} match - The match to highlight
 * @returns {string} HTML string with highlighted match
 */
function highlightMatch(match) {
    let cls = 'json-number';
    if (/^"/.test(match)) {
        cls = 'json-string';
    } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
    } else if (/null/.test(match)) {
        cls = 'json-null';
    } else if (/[\{\}\[\]]/.test(match)) {
        cls = 'json-brace';
    } else if (/^,$/.test(match)) {
        cls = 'json-comma';
    }
    return `<span class="${cls}">${match}</span>`;
}

/**
 * Copies the editor content to clipboard and shows a confirmation
 * @returns {Promise<void>} A promise that resolves when the copy is complete
 * @throws {Error} If clipboard access fails
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

/**
 * Checks if a line contains an opening brace/bracket for an object/array
 * @param {string} line - The line of code to check
 * @returns {boolean} True if line contains { or [, false otherwise
 */
function isObjectOrArrayLine(line) {
    return /[\{\[]/.test(line.trim());
}

/**
 * Finds the matching closing brace/bracket for an opening one
 * @param {NodeList} lines - The lines of code to search through
 * @param {number} startLine - The line number containing the opening brace
 * @returns {number} The line number of the matching closing brace, or -1 if not found
 */
function findMatchingBrace(lines, startLine) {
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

/**
 * Finds the matching closing brace/bracket for an opening one in the editor content
 * @param {Array} lines - The array of code line elements
 * @param {number} startLine - The line number containing the opening brace
 * @returns {number} The line number of the matching closing brace, or -1 if not found
 */
function findMatchingBraceInEditor(lines, startLine) {
    const startText = lines[startLine].textContent;
    const startCharMatch = startText.match(/[\{\[]/);
    if (!startCharMatch) return -1;

    const startChar = startCharMatch[0];
    const endChar = startChar === '{' ? '}' : ']';
    let depth = 1;

    for (let i = startLine + 1; i < lines.length; i++) {
        const lineText = lines[i].textContent;
        for (let char of lineText) {
            if (char === startChar) depth++;
            if (char === endChar) depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

/**
 * Toggles code block collapse state
 * @param {number} lineNumber - The line number to toggle
 */
/**
 * Toggles collapse/expand of code blocks in the editor
 * @param {number} startLine - The line number where the block starts
 */
function toggleCollapse(startLine) {
    const editorLines = editor.querySelectorAll('.code-line');
    const contentLines = Array.from(editorLines);

    const matchingLine = findMatchingBraceInEditor(contentLines, startLine);

    if (matchingLine === -1) {
        return;
    }

    // Toggle collapsed state
    const isCollapsed = contentLines[startLine].classList.contains('collapsed');

    if (isCollapsed) {
        // Expand
        for (let i = startLine + 1; i <= matchingLine; i++) {
            contentLines[i].style.display = '';
        }
        // Restore original content
        const originalContent = contentLines[startLine].dataset.originalContent;
        if (originalContent) {
            contentLines[startLine].innerHTML = originalContent;
        }
        contentLines[startLine].classList.remove('collapsed');

        // If there is a comma on the line after the collapsed block, hide it
        if (contentLines[matchingLine + 1] && contentLines[matchingLine + 1].classList.contains('comma-line')) {
            contentLines[matchingLine + 1].style.display = 'none';
        }
    } else {
        // Collapse
        for (let i = startLine + 1; i <= matchingLine; i++) {
            contentLines[i].style.display = 'none';
        }
        // Check for comma after the block
        const l = contentLines[matchingLine].textContent.trim();
        let hasComma = l.length > 0 && l[l.length - 1] === ',';

        if (contentLines[matchingLine + 1]) {
            const nextLineText = contentLines[matchingLine + 1].textContent.trim();
            if (nextLineText === ',') {
                hasComma = true;
                contentLines[matchingLine + 1].classList.add('comma-line');
                contentLines[matchingLine + 1].style.display = 'none';
            }
        }

        // Modify the starting line to indicate collapsed block
        const lineContent = contentLines[startLine].innerHTML;
        contentLines[startLine].dataset.originalContent = lineContent;

        // Determine the opening and closing brace/bracket
        const startText = contentLines[startLine].textContent;
        const startCharMatch = startText.match(/[\{\[]/);
        const startChar = startCharMatch ? startCharMatch[0] : '';
        const endChar = startChar === '{' ? '}' : startChar === '[' ? ']' : '';
        // check if the line has a comma
        //hasComma = contentLines[matchingLine].textContent.trim() === ',';

        // Update line content to show collapsed indicator
        contentLines[startLine].innerHTML = lineContent.replace(
            /([\{\[])/,
            `$1<span class="ellipsis">...${endChar}${hasComma ? ',' : ''}</span>`
        );
        contentLines[startLine].classList.add('collapsed');
    }
    updateLineNumbers();
}

editor.addEventListener('input', handleEditorInput);
editor.addEventListener('paste', handlePaste);
/**
 * Handles clicks on line numbers to collapse or expand code blocks
 */
lineNumbers.addEventListener('click', function (e) {
    const target = e.target;

    if (target.classList.contains('collapsible-line')) {
        const lineIndex = parseInt(target.dataset.line);
        toggleCollapse(lineIndex);
    } else if (target.classList.contains('collapsed-lines')) {
        // Ignore clicks on the collapsed lines placeholder
        return;
    }
});
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
