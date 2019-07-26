function getDisplay(element) {
    return window.getComputedStyle(element).getPropertyValue("display")
}

function saveTextAsJson() {

    let cells  = []
    let editor = document.querySelectorAll(".cell-editor")

    for(let e of editor) {
        let m = e.CodeMirror
        let c = {}

        c.cell_type = m.getOption("mode")
        c.source    = m.getValue()
        c.editor    = getDisplay(e)

        cells.push(c)
    }

    return JSON.stringify({metadata: {}, cells: cells})
}

function initPgFromJson(json) {

}


function saveTextAsFile(value, filename) {

    var textFileAsBlob = new Blob([value], {
        type: "text/plain;charset=utf-8"
    });

    let download = document.createElement("a");
    download.download  = filename + ".txt";
    download.href = window.URL.createObjectURL(textFileAsBlob);
    download.onclick = destroyClickedElement;
    download.style.display = "none";
    document.body.appendChild(download);

    download.click();
}

var default_options = {
    mode: "gfm",
    lineWrapping: true,
    theme: "default",
    autofocus: true,
    extraKeys: {
        "F11": function(cm) {
            cm.setOption("fullScreen",  !cm.getOption("fullScreen"))
        },
        "Esc": function(cm) {
            if (cm.getOption("fullScreen")) {
                cm.setOption("fullScreen", false)
            }
        },
    }
}

var cells = document.querySelectorAll(".cell")
for (let cell of cells) {
    var code = CodeMirror(cell, default_options)
    code.getWrapperElement().className += " " + "cell-editor"
}

function EventListener(body) {

    function addCell(referenceCell) {
        // Create temporary element to initialize cell.
        let temp = document.createElement("div")
        temp.innerHTML = `<div class="cell" tabindex="0"><div class="cell-render"></div></div>`

        let cell = temp.firstChild
        body.insertBefore(cell, referenceCell)

        // Create CodeMirror instance for cell.
        var code = CodeMirror(cell, default_options)
        code.getWrapperElement().className += " " + "cell-editor"
        return cell
    }

    function displayEditor(event) {
        // Initialize temporary elements.
        let cell = event.target.closest(".cell")
        let editor = cell.querySelector(".cell-editor")
        let render = cell.querySelector(".cell-render")

        if (editor.style.display == "none") {
            editor.style.display =  "block"
            render.style.display =  "none"
            editor.CodeMirror.focus()
        } else {
            editor.style.display =  "none"
            render.style.display =  "block"
            cell.focus()
        }

    }

    function displayRender(event) {
        // Initialize temporary elements.
        let cell = event.target.closest(".cell")
        let editor = cell.querySelector(".cell-editor")
        let render = cell.querySelector(".cell-render")

        const emptyText  = `<p><em> empty cell </em></p>`
        render.innerHTML = markdown.render(editor.CodeMirror.getValue()) || emptyText

        displayEditor(event)
    }

    body.addEventListener("keydown",  function(event) {
        // Event target is with-in a cell element.
        let cell = event.target.closest(".cell")
        if (cell != null) {

            let editor = cell.querySelector(".cell-editor")
            let render = cell.querySelector(".cell-render")
            let mirror = editor.CodeMirror

            switch(event.keyCode) {
                case  8: // backspace
                    if (event.shiftKey) {
                        let prev = cell.previousElementSibling
                        if (prev != null && prev.className == "cell") {
                            prev.focus()
                        }
                        cell.parentElement.removeChild(cell)
                    }
                    break
                case 13: // enter
                    if (event.shiftKey) {
                        // Display render if not displayed.
                        if (getDisplay(render) == "none") {
                            displayRender(event)
                        // Focus on next cell if render is displayed.
                        } else {
                            cell = cell.nextElementSibling
                            if (cell == null || cell.className != "cell") {
                                cell = addCell(cell)
                            } else {
                                cell.focus()
                            }
                        }
                    } else {
                        // Check editor if not displayed.
                        if (getDisplay(editor) == "none") {
                            // Prevent enter from creating new line.
                            event.preventDefault()
                            displayEditor(event)
                        }
                    }
                    break
                case 27: // esc
                    if (getDisplay(editor) != "none") {
                        cell.focus()
                    }
                    break
                case 38: // up-arrow
                    if (event.shiftKey) {
                        if (getDisplay(render) != "none") {
                            let prev = cell.previousElementSibling
                            if (prev != null && prev.className == "cell") {
                                cell.parentElement.insertBefore(cell, prev)
                                cell.focus()
                            }
                        }
                    } else {
                        let cursor = mirror.getCursor()
                        let lineNum = 0
                        let charNum = 0
                        // This triggers because of a CodeMirror key event.
                        let frstLine = (cursor.line == lineNum && cursor.ch == charNum)
                        if (getDisplay(render) != "none" || frstLine) {
                            let prev = cell.previousElementSibling
                            if (prev != null && prev.className == "cell") {
                                let editor = prev.querySelector(".cell-editor")
                                let render = prev.querySelector(".cell-render")
                                let mirror = editor.CodeMirror
                                // Focus on prev editor if displayed.
                                if (getDisplay(render) == "none") {
                                    mirror.focus()
                                } else {
                                    prev.focus()
                                }
                            }
                        }
                    }
                    break
                case 40: // dw-arrow
                    if (event.shiftKey) {
                        if (getDisplay(render) != "none") {
                            let next = cell.nextElementSibling
                            if (next != null && next.className == "cell") {
                                next.parentElement.insertBefore(next, cell)
                                cell.focus()
                            }
                        }
                    } else {
                        let cursor  = mirror.getCursor()
                        let lineNum = mirror.lastLine()
                        let charNum = mirror.getLine(lineNum).length
                        // This triggers because of a CodeMirror key event.
                        let lastLine = (cursor.line == lineNum && cursor.ch == charNum)
                        if (getDisplay(render) != "none" || lastLine) {
                            let next = cell.nextElementSibling
                            if (next != null && next.className == "cell") {
                                let editor = next.querySelector(".cell-editor")
                                let render = next.querySelector(".cell-render")
                                let mirror = editor.CodeMirror
                                // Focus on prev editor if displayed.
                                if (getDisplay(render) == "none") {
                                    mirror.focus()
                                } else {
                                    next.focus()
                                }
                            }
                        }
                    }
                    break
                case 74: // j
                    mirror.setOption("mode", "javascript")
                    break
                case 77: // m
                    mirror.setOption("mode", "gfm")
                    mirror.refresh()
                    break
                case 80: // p
                    mirror.setOption("mode", "python")
                    mirror.refresh()
                    break
            }
        // Event target is outside a cell.
        } else {
            switch (event.keyCode) {
                case 13:
                    if (event.shiftKey) {
                        cell = document.querySelector(".cell")
                        if (cell == null) {
                            cell = addCell()
                        }
                    }
                    break
            }
        }
    })

    body.addEventListener("dblclick", function(event) {
        // Check if target is within a cell element.
        let cell = event.target.closest(".cell")
        if (cell != null) {

            let editor = cell.querySelector(".cell-editor")
            let render = cell.querySelector(".cell-render")

            // Check if editor is displayed.
            if (getDisplay(editor) == "none") {
                displayEditor(event)
            }
        // Target is outside a cell element.
        } else {
            // Do nothing.
        }
    })
}
