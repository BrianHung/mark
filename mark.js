/**
 * Displays the editor.
 * @return undefined
 */
function displayEditor(cell) {
    if (cell.editing) {
        cell.editor.style.display =  "none"
        cell.render.style.display =  "block"
        cell.editing = !cell.editing
        cell.focus()
    } else {
        cell.render.style.display =  "none"
        cell.editor.style.display =  "block"
        cell.editing = !cell.editing
        cell.editor.CodeMirror.focus()
    }
}

/**
 * Displays the render.
 * @return undefined
 */
function displayRender(cell) {
    const emptyText = `<p><em> empty cell </em></p>`
    cell.render.innerHTML = markdown.render(cell.editor.CodeMirror.getValue()) || emptyText
    displayEditor(cell)
}

/**
 * Returns json representation of text based on ipynb format.
 * @return json
 */
function saveTextAsJson() {
    let cells  = []
    for(let cell of document.querySelectorAll(".cell")) {
        let mirror = cell.editor.CodeMirror
        let temp = {}
        temp.cell_type = mirror.getOption("mode")
        temp.source    = mirror.getValue()
        temp.editing   = cell.editing
        cells.push(temp)
    }
    return JSON.stringify({metadata: {}, cells: cells})
}
/**
 * Returns json representation of text based on ipynb format.
 * @return json
 */
function saveTextAsMark() {
    let mark = ""
    for(let cell of document.querySelectorAll(".cell")) {
        let mirror = cell.editor.CodeMirror
        mark += mirror.getValue() + "\n<br>\n"
    }
    return mark
}

/**
 * Initializes the page from json representation.
 * @return undefined
 */
function initPageFmJson(body, json) {

    for(let cell of document.querySelectorAll(".cell")) {
        cell.parentNode.removeChild(cell)
    }

    let cells = json.cells
    for(let c of cells) {
        let o = Object.assign({}, defaultOptions, {mode: c.cell_type, value: c.source})
        addCell(body, null, mirrorOptions=o, editing=c.editing)
    }
}
/**
 * Initializes the page from mark representation.
 * @return undefined
 */
function initPageFmMark(body, text) {
    let texts = text.split("\n<br>\n")
    for(let t of texts) {
        let o = Object.assign({}, defaultOptions, {mode: "gfm", value: t})
        addCell(body, null, mirrorOptions=o, editing=true)
    }
}

/**
 * Adds a cell to the parent parameter.
 * @return dom element
 */
function addCell(parent, nextCell=null, mirrorOptions=defaultOptions, editing=true) {
    // Create temporary element to initialize cell.
    let temp = document.createElement("div")
    temp.innerHTML = `<div class="cell" tabindex="0"><div class="cell-render"></div></div>`

    // Insert cell into view before CodeMirror (prevents default).
    let cell = temp.firstChild
    parent.insertBefore(cell, null)

    // Create CodeMirror instance for cell.
    let mirror = CodeMirror(cell, mirrorOptions)
    mirror.getWrapperElement().className += " " + "cell-editor"
    mirror.refresh()

    // Create shorthands to reference editor and render.
    cell.editor = cell.querySelector(".cell-editor")
    cell.render = cell.querySelector(".cell-render")

    // Display editor if editing is true.
    editing ? displayEditor(cell) : displayRender(cell)
    return cell
}

/**
 * Saves markdown representation of text.
 * @return undefined
 */
function saveTextAsFile(value, filename, type="text/plain;charset=utf-8") {

    var text = new Blob([value], {type: type});
    let file = document.createElement("a");
    file.download = filename;
    file.href = window.URL.createObjectURL(text);
    // file.onclick = destroyClickedElement;
    // file.style.display = "none";
    // file.body.appendChild(download);
    file.click();
}

function downloadJson() {
    saveTextAsFile(saveTextAsJson(), "text.json", "application/json")
}

function downloadMark() {
    saveTextAsFile(saveTextAsMark(), "text.md")
}

const defaultOptions = {
    mode: "gfm",
    lineWrapping: true,
    theme: "default",
    autofocus: true,
    extraKeys: {
        "F11": function(cm) {
            cm.setOption("fullScreen",  !cm.getOption("fullScreen"))
        },
        "Esc": function(cm) {
            if(cm.getOption("fullScreen")) {
                cm.setOption("fullScreen", false)
            }
        }
    }
}

function EventListener(body) {

    const cellContainer = body.querySelector(".cell-container")

    body.addEventListener("keydown",  function(event) {
        // Event target is with-in a cell element.
        // console.log(event, event.code, event.shiftKey, event.target)
        let cell = event.target.closest(".cell")
        if(cell != null) {
            switch(event.code) {
                case "Backspace":
                    if(event.shiftKey) {
                        let prev = cell.previousElementSibling
                        if(prev != null && prev.className == "cell") {
                            prev.focus()
                        }
                        cell.parentElement.removeChild(cell)
                    }
                    break
                case "Enter":
                    console.log("enter")
                    if(event.shiftKey) {
                        // Display render if not displayed.
                        console.log(cell, cell.editing)
                        if(cell.editing) {
                            displayRender(cell)
                        // Focus on next cell if render is displayed.
                        } else {
                            let next = cell.nextElementSibling
                            if(next == null || next.className != "cell") {
                                event.preventDefault()
                                cell = addCell(cellContainer, next)
                            } else {
                                next.focus()
                            }
                        }
                    } else {
                        // Check editor if not displayed.
                        if(!cell.editing) {
                            // Prevent enter from creating new line.
                            event.preventDefault()
                            displayEditor(cell)
                        }
                    }
                    break
                case "Escape":
                    if(cell.editing) {
                        cell.focus()
                    }
                    break
                case "ArrowUp":
                    if(event.shiftKey) {
                        if(!cell.editing) {
                            let prev = cell.previousElementSibling
                            if(prev != null && prev.className == "cell") {
                                cell.parentElement.insertBefore(cell, prev)
                                cell.focus()
                            }
                        }
                    } else {
                        let mirror  = cell.editor.CodeMirror
                        let cursor  = mirror.getCursor()
                        let lineNum = 0
                        let charNum = 0
                        // This triggers because of a CodeMirror key event.
                        let frstLine = (cursor.line == lineNum && cursor.ch == charNum)
                        if(!cell.editing || frstLine) {
                            let prev = cell.previousElementSibling
                            if(prev != null && prev.className == "cell") {
                                // Focus on prev editor if displayed.
                                if(prev.editing) {
                                    let mirror = prev.editor.CodeMirror
                                    mirror.focus()
                                } else {
                                    prev.focus()
                                }
                            }
                        }
                    }
                    break
                case "ArrowDown":
                    if(event.shiftKey) {
                        if(!cell.editing) {
                            let next = cell.nextElementSibling
                            if(next != null && next.className == "cell") {
                                next.parentElement.insertBefore(next, cell)
                                cell.focus()
                            }
                        }
                    } else {
                        let mirror  = cell.editor.CodeMirror
                        let cursor  = mirror.getCursor()
                        let lineNum = mirror.lastLine()
                        let charNum = mirror.getLine(lineNum).length
                        // This triggers because of a CodeMirror key event.
                        let lastLine = (cursor.line == lineNum && cursor.ch == charNum)
                        if(!cell.editing || lastLine) {
                            let next = cell.nextElementSibling
                            if(next != null && next.className == "cell") {
                                // Focus on prev editor if displayed.
                                if(next.editing) {
                                    let mirror = next.editor.CodeMirror
                                    mirror.focus()
                                } else {
                                    next.focus()
                                }
                            }
                        }
                    }
                    break
                case "j": // j
                    cell.editor.CodeMirror.setOption("mode", "javascript")
                    break
                case "m": // m
                    cell.editor.CodeMirror.setOption("mode", "gfm")
                    break
                case "p": // p
                    cell.editor.CodeMirror.setOption("mode", "python")
                    break
            }
        // Event target is outside a cell.
        } else {
            switch (event.code) {
                case "Enter":
                    if(event.shiftKey) {
                        cell = document.querySelector(".cell")
                        if(cell == null) {
                            event.preventDefault()
                            event.stopPropagation()
                            cell = addCell(cellContainer)

                        }
                    }
                    break
            }
        }
    })

    body.addEventListener("dblclick", function(event) {
        // Check if target is within a cell element.
        /*
        let cell = event.target.closest(".cell")
        if(cell == null) {
            body.dispatchEvent(new KeyboardEvent('keydown', {
                code: "Enter", shiftKey: true
            }))
        }
        */
    })
}
