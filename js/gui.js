
/*

Simple GUI window manager.
Just displays some simple windows.

provides the following hooks:
    
    + gui_window_manager.request_new_project: open a window of type: "Create New Project"
        parameters: 1. callback function to be called when the user has created a new project:
            will be passed name of the new project as string (without dir prefix)

    + gui_window_manager.request_open_project: open a window of type: "Open Existing Project"
        parameters: 1. callback function to be called when the user has created a new project:
            will be passed name of the project as string (without dir prefix)

    + gui_window_manager.alert: displays a simple notification / warning window
        parameters: 1. message string

*/

gui_window_manager = (function() {


    class GuiWindow {
        constructor(title, main, bottom, on_open) {
            this.construct_window(title, main, bottom, on_open)
            return this
        }

        construct_window(title, main, bottom, on_open) {
            let signature = rnd(1, 100_000_000_000)
            this.window_signature = signature
            let el = $(`
            <div class="center-wrapper">
                <div class="center-inner">
                    <div class="window-top">
                        <div class="window-top-title">${title}</div>
                        <div class="window-top-close-button">
                            <button id="close-button-${signature}" class="close-window-button-proper">✖</button>
                        </div>
                    </div>
                    <div class="window-main">
                        ${main}
                    </div>
                    <div class="window-bottom">
                        ${bottom}
                    </div>
                </div>
            </div>`)
            $("body").append(el)
            this.jq_el = el
            $("body").on("keydown." + signature, (e) => {
                //console.log("window", this.window_signature, "press key", e.key)
                if (e.key === "Escape") {
                    this.close_window()
                }
            })

            $("#close-button-" + signature).on("click", e => {
                    this.close_window()
                }
            )

            if (on_open) on_open(this)
        }
        
        close_window() {
            //remove keyboard event:
            $("body").off("keydown."+this.window_signature)
            //remove dom element:
            this.jq_el.remove()
        }
    }



    function open_new_project_window(callback) {
        let title = `Create a new project`
        let main = `Name for the new project:<br><br>
        (only latin letters, numbers and underscore are allowed)
        <br><br>
        <input class="new-prj-input" type="text">`
        let win = new GuiWindow(title, main, "", (gui_window) => {
            $(".new-prj-input").focus()
            $(".new-prj-input").on("keydown", (e) => {
                setTimeout( () => {
                    let v =  $(".new-prj-input").val()
                    if ( /^[a-z0-9_]+$/i.test(v) ) {
                        $(".new-prj-input").removeClass("invalid")
                    } else {
                        $(".new-prj-input").addClass("invalid")
                    }
                }, 50)
                if (e.key === "Enter") {
                    let v = $(".new-prj-input").val()
                    if (/^[a-z0-9_]+$/i.test(v)) {
                        callback(v)
                        gui_window.close_window()
                    } else {
                        my_alert(`Invalid project name.`)
                    }
                }
            })
        })
    }

    function my_alert(n) {
        new  GuiWindow("!", n, "")
    }


    function open_open_project_window(callback) {
        let r = rnd(1, 100_000_000)
        let win = new GuiWindow("Open Project",
            `<div class="open-prj-window${r}"></div>`,
            "", ((gui_win) => {
            populate_open_project_window(gui_win, r, callback)
        }))
    }


    function populate_open_project_window(gui_win, r,  callback) {
        let list = []
        let dir_name = "./app/projects/"
        list = file_list_from_dir(dir_name)
        let el = $(`.open-prj-window${r}`)

        for (let item of list) {
            let txt = item
            if (is_valid_proj_name(item)) {
                let html = `
                    <div class="project-entry">
                        <div class="project-entry-left">
                            ${txt}
                        </div>
                        <div class="project-entry-right">
                            <button class = "my-button" id=""
                                >open</button>
                        </div>
                    </div>
                    `
                let el = $(html)
                $(`.open-prj-window${r}`).append(el)

                el.on("click", () => {
                    gui_win.close_window()
                    callback(item)
                })
            } else {
                let html = `
                    <div class="project-entry">
                        <div class="project-entry-left forbidden-project">
                            ${txt}
                        </div>
                        <div class="project-entry-right">
                            Project folder name should not contain illegal characters.
                            I cannot open this project.
                        </div>
                    </div>               
                `
                let el = $(html)
                $(`.open-prj-window${r}`).append(el)
            }

        }
    }

    return {
        request_new_project: open_new_project_window,
        request_open_project: open_open_project_window,
        alert: my_alert,
    }

})()