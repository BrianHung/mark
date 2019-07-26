function saveTextAsFile(filename, value) {

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

    function getDisplay(element) {
        return window.getComputedStyle(element).getPropertyValue("display")
    }

    body.addEventListener("keydown",  function(event) {
        // Listen for shift+enter.
        // Switches from render to editor.
        // Switches to next cell and creates if needed.
        if (event.keyCode == 13 &&  event.shiftKey) {

            // Check if target is within a cell element.
            let cell = event.target.closest(".cell")
            if (cell != null) {

                let editor = cell.querySelector(".cell-editor")
                let render = cell.querySelector(".cell-render")

                // Check if render is displayed.
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

            // Target is outside a cell element.
            } else {
                cell = document.querySelector(".cell")
                if (cell == null) {
                    cell = addCell()
                }
            }
        }

        // Listen for enter.
        // Switches to editor from render.
        if (event.keyCode == 13 && !event.shiftKey) {
            // Check if target is within a cell element.
            let cell = event.target.closest(".cell")
            if (cell != null) {

                let editor = cell.querySelector(".cell-editor")
                let render = cell.querySelector(".cell-render")

                // Check if editor is displayed.
                if (getDisplay(editor) == "none") {
                    // Prevent enter from creating new line.
                    event.preventDefault()
                    displayEditor(event)
                }
            // Target is outside a cell element.
            } else {
                // Do nothing.
            }
        }

        // Listen for shift+backspace.
        // Deletes the cell.
        if (event.keyCode ==  8 &&  event.shiftKey) {
            // Check if target is within a cell element.
            let cell = event.target.closest(".cell")
            if (cell != null) {
                let prev = cell.previousElementSibling
                if (prev != null && prev.className == "cell") {
                    prev.focus()
                }
                cell.parentElement.removeChild(cell)
            // Target is outside a cell element.
            } else {
                // Do nothing.
            }
        }

        if (event.keyCode == 38 && !event.shiftKey) {
            // Check if target is within a cell element.
            let cell = event.target.closest(".cell")
            if (cell != null) {

                let editor = cell.querySelector(".cell-editor")
                let render = cell.querySelector(".cell-render")
                let cursor = editor.CodeMirror.getCursor()

                let lineNum = 0
                let charNum = 0

                if (getDisplay(render) != "none"
                // This triggers because of a CodeMirror key event.
                || (cursor.line == lineNum && cursor.ch == charNum)) {

                    let prev = cell.previousElementSibling
                    if (prev != null && prev.className == "cell") {

                        let editor = prev.querySelector(".cell-editor")
                        let render = prev.querySelector(".cell-render")

                        // Focus on prev editor if displayed.
                        if (getDisplay(render) == "none") {
                            editor.CodeMirror.focus()
                        } else {
                            prev.focus()
                        }

                    // No cell above current cell.
                    } else {
                        // Do nothing.
                    }
                }

            // Target is outside a cell element.
            } else {
                // Do nothing.
            }
        }

        if (event.keyCode == 40 && !event.shiftKey) {
            // Check if target is within a cell element.
            let cell = event.target.closest(".cell")
            if (cell != null) {

                let editor = cell.querySelector(".cell-editor")
                let render = cell.querySelector(".cell-render")
                let cursor = editor.CodeMirror.getCursor()

                let lineNum = editor.CodeMirror.lastLine()
                let charNum = editor.CodeMirror.getLine(lineNum).length

                if (getDisplay(render) != "none"
                // This triggers because of a CodeMirror key event.
                || (cursor.line == lineNum && cursor.ch == charNum)) {

                    let next = cell.nextElementSibling
                    if (next != null && next.className == "cell") {

                        let editor = next.querySelector(".cell-editor")
                        let render = next.querySelector(".cell-render")

                        // Focus on prev editor if displayed.
                        if (getDisplay(render) == "none") {
                            editor.CodeMirror.focus()
                        } else {
                            next.focus()
                        }

                    // No cell above current cell.
                    } else {
                        // Do nothing.
                    }
                }

            // Target is outside a cell element.
            } else {
                // Do nothing.
            }
        }

        // Listen for shift+up-arrow.
        if (event.keyCode == 38 &&  event.shiftKey) {
            // Check if target is within a cell element.
            let cell = event.target.closest(".cell")
            if (cell != null) {
                let editor = cell.querySelector(".cell-editor")
                let render = cell.querySelector(".cell-render")
                if (getDisplay(render) != "none") {
                    let prev = cell.previousElementSibling
                    if (prev != null && prev.className == "cell") {
                        cell.parentElement.insertBefore(cell, prev)
                        cell.focus()
                    }
                }
            }
        }

        // Listen for shift+dw-arrow.
        if (event.keyCode == 40 && event.shiftKey) {
            // Check if target is within a cell element.
            let cell = event.target.closest(".cell")
            if (cell != null) {
                let editor = cell.querySelector(".cell-editor")
                let render = cell.querySelector(".cell-render")
                if (getDisplay(render) != "none") {
                    let next = cell.nextElementSibling
                    if (next != null && next.className == "cell") {
                        next.parentElement.insertBefore(next, cell)
                        cell.focus()
                    }
                }
            }
        }

        if (event.keyCode == 83
        && (navigator.platform.match("Mac") ? event.metaKey : event.ctrlKey)) {
            event.preventDefault()

            let editor = body.querySelectorAll(".editor")
            let text   = ""

            for(let edit of editor) {
                text += edit.CodeMirror.getValue() + "\n\n"
            }

            saveTextAsFile(document.title + ".txt", text)
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
