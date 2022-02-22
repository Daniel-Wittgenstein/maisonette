



/*
to do:

- start with suggestions

- clean up ./temp folder on app exit (or better: on app start)

*/

$(window).on("load", () => {
    if (!is_nw_js()) {
        $(".inside-browser").show()
        return
    }
    start()
})


const zoom_levels_to_px = [
    6, 8, 10, 12, 14, 16, 18, 20, 22, 24,
    28, 32, 36, 40, 44, 48 //, 52, 56, 64, 72, 80, 88, 96, 112, 128, 160
];

const settings = {
    zoom_level: 4, //4 -> 14; if you change this initial value, change it in stylesheet, too
    show_console: false,
    show_editor: true,
}

let last_saved_state = false

let table_color = {}

function apply_theme(theme) {
    for (let css_var of theme.css_vars) {
        set_css_var(css_var[0], css_var[1])
    }
    if (theme.table_color) table_color = theme.table_color 

    let th = theme.editor.theme
    code_mirror_editor.setOption("theme", th)
}



const log_info_for_story_creator = true //should be true in deployment. can be turned off while debugging 
const DEBUG = true
const projects_path = './app/projects'
const extension = ".zzz"

//#######
const fs = require('fs')
let chosen_dir = false
let file_watcher = false
let loaded_story_files = []
let last_update = 0
let button_state = {}
let html_template_content = false


//for developing only:
if (DEBUG) {
    let path
    
    path = './app/js'
    fs.watch(path, function() {
        if (location) location.reload()
    })

    path = './app/auto_includes'
    fs.watch(path, function() {
        if (location) location.reload()
    })

    path = './app/css'
    fs.watch(path, function() {
        if (location) location.reload()
    })

    path = './app/'
    fs.watch(path, function() {
        if (location) location.reload()
    })

    path = './app/code-mirror-maisonette-mode'
    fs.watch(path, function() {
        if (location) location.reload()
    })
    

    path = './app/js/test-tools'
    fs.watch(path, function() {
        if (location) location.reload()
    })
}


let time_transpilation = []

function generate_the_story(mode = "test") {
    //mode should be either "test" or "export"
    $("#dev-console-inner").html("") //clear console, very important
    $("#transpile-show-table").html("")
        //because otherwise old errors are shown when they aren't even relevant anymore.
    let time = + new Date()
    let elapsed = time - last_update
    last_update = time
    //console.log(elapsed)
    if (elapsed <= 1000) {
        //better to be on the safe side
        alert("Still working ... You are saving / exporting too fast.")
        return
    }
    //console.log("ok")
    if (!chosen_dir) return
    time_transpilation.start = + new Date()
    let file_list = file_list_from_dir(chosen_dir)
        .filter( n => n.endsWith(".zzz") )
        .map( n => chosen_dir + "/" + n )
    //Reads file from disk in parallel (async).
    //Once all files are read,
    //it proceeds synchronously (normally) with
    //the function start_processing()
    let promises_list = file_list.map ( n => load_file(n) )
    //console.log("processing directory:", chosen_dir)
    //console.log(file_list) //promises_list
    Promise.all(promises_list).then(
        (result) => {
            time_transpilation.finished_reading_files = + new Date()
            start_processing({
                file_list: result,
                mode: mode,
            })
        }
    ).catch ((err) => {
        throw err
    })
}


function show_transpilation_results(org_code, js_code, data) {
    function add_row(nr, line, line2, col = false) {
        let nu = $(`<tr><td>${nr}</td><td>${line}</td><td>${line2}</td></tr>`)
        el.append(nu)
        if (col) {
            nu.css("background", col)
        }
    }
    //console.log(1111, org_code)
    //console.log(1111, js_code)
    //populate_table()
    let el = $("#transpile-show-table")
    el.html("")
    add_row("", "MaisonetteScript", "JavaScript")
    let lines = org_code.split("\n")
    let lines2 = js_code.split("\n")
    let i = -1
    //lines2 should be exactly one line longer than lines and it
    //should be just a closer line (???! hopefully?)
    for (let line2 of lines2) {
        i++
        let txt2 = line2
        let txt1 = lines[i]
        let color = false
        if (!txt1 && txt1 !== "") txt1 = "NO MORE LINES"
        if (txt1.trim().startsWith("#")) color = table_color.block_start
        if (txt1.trim().startsWith("run:")) color = table_color.special_command
        if (txt1.trim().startsWith("props:")) color = table_color.special_command
        if (txt1.trim().startsWith("if ")) color = table_color.special_command
        if (txt1.trim().startsWith("each ")) color = table_color.special_command
        if (txt1.trim().startsWith("loop ")) color = table_color.special_command
        if (txt1.trim().startsWith("end")) color = table_color.special_command
        if (txt1.trim().startsWith("else")) color = table_color.special_command
        begin1 = txt1.trim().substr(0, 5)
        //console.log("begin", begin1)
        if (!color && !txt2.includes(begin1)) {
            color = table_color.diff
        }
        add_row(i + 1, txt1, txt2, color)
    }
    $(".dev-box").show()

    add_row("", "", "", false)
    add_row("", "additional data:", "", false)
    for (let item of data) {
        let entry = item.meta_data_entry
        add_row(entry.line_nr, entry.name_of_command, entry.original_line, false)
    }
}

function retrieve_syntax_error(code) {
    let useful_error
    window.onerror = (...args) => {
        useful_error = args
        return true
    }
    let s = document.createElement('script')
    s.appendChild(document.createTextNode(
        "function ________________$32u4h23n3g4hg3___() {;\n" +
            code +
        "\n}"))
    document.body.appendChild(s)
    window.onerror = null
    return useful_error
}

function show_transpilation_error(e) {
    //let ltxt2 = e.text ? "Line text 2: '" + e.text + "' (should be identical to line text)": ""
    let l = e.offending_line
    if (!l) l = {}

    let line_error_show_text = `The error happened in line: ${e.line_nr}`

    if (!e.line_nr || !Number(e.line_nr)) {
        if (e.offending_block) {
            let add = `(inside the 'run:' sub-block)`
            let offb = e.offending_block_header
            if (
                offb &&
                    (
                        offb.trim().startsWith('option')
                        ||
                        offb.trim().startsWith('function')
                    )
                ) {
                add = ""
            }
            line_error_show_text = `The error happened somewhere in the 
            block that starts with the line: '#${e.offending_block_header}'
            (line ${e.offending_block[0].line_nr}) ${add}`
            e.line_nr = e.offending_block[0].line_nr
        } else {
            line_error_show_text = "unknown line"
        }
    }


    if (e.js_syntax_error) {
        let useful_error = retrieve_syntax_error(e.wrong_syntax_code)
        console.log(useful_error)
        if (useful_error && useful_error[2]) {
            let line_nr = useful_error[2] - 2
            //now add parent sub-block offset
            line_nr += e.sub_block_parent_offset
            console.log("<<<<<", line_nr, e.sub_block_parent_end)
            if (line_nr > e.sub_block_parent_end) {
                //leave e.line_nr as it is
                line_error_show_text += ` (This might be caused by an unclosed brace.)`
            } else {
                line_error_show_text = "Line nr.: " + line_nr
                e.line_nr = line_nr
            }
        }
    }


    let html = ``
    let list = [
        ["Error:", e.msg],
        ["File:", e.file_path],
        ["", line_error_show_text],
        ["Line text:", l.line],
        ["Block:", e.offending_block_header],
        ["Sub-block", l.tmp_type],
    ]

    for (let item of list) {
        if ( item[1] || item[1] == 0 ) {
            html += `<p>${item[0]} ${item[1]}</p>`
        }
    }

    html += "<p>(Transpilation Error)</p>"

    if (e.offending_block) {
        html += `<p>Surrounding block:</p><div class = "error-text-code-show">`
        for (let line of e.offending_block) {
            let cl = ""
            if (line.line_nr === e.line_nr) cl = "error-text-code-show-highlighted"
            html += `<p class="${cl}">${line.line_nr}&nbsp;${line.line}</p>`
        }
        html += "</div>"
    }

    $(".error-box-inner").html(html)

    show_error_box()


    editor_set_error_at_line(e.line_nr)
    
    $("#dev-console-inner").html(html)
}


function show_error_box(){
    $(".error-box-inner").show()
    $(".preview").hide()    
}

function hide_error_box(){
    $(".error-box-inner").hide()
    $(".preview").show()
}


function open_dev_console() {
    $("#dev-console").show()
}

function close_dev_console() {
    $("#dev-console").hide()
}

function show_transpilation_success_message(transpiled_js_files) {
    let parent = $("#dev-console-inner")

    parent.append(`
    <p>Success! I converted the story to JavaScript.</p>
    `)

    let amount = Object.keys(transpiled_js_files).length


    let tt = time_transpilation
    parent.append(`
    <p>Read ${amount} maisonette files in: ${tt.finished_reading_files - tt.start} ms / Translated all files in: ${tt.js_end - tt.finished_reading_files} ms</p>
    `)

    for (let key of Object.keys(transpiled_js_files)) {
        let value = transpiled_js_files[key]
        let parag = $(`<p></p>`)
        let el = $(`
            <a href="#" id="info-button">show translation of '${key}'</a>
        `)
        el.on ("click", () => {
            show_transpilation_results(value.original, value.transpiled_js, value.data)
        })
        parent.append(parag)
        parag.append(el)

        let q = value.info.cache_ops
        parag.append(`
            (blocks from cache: ${q.from_cache.length}, retranslated: 
            ${q.retranspiled.length})
        `)
    }

}



function log_for_story_creator(p) {
    return //disabled for now.

    //info for story creator.
    //this is different from
    //temporary debug info
    //for maisonette developers
    if (!log_info_for_story_creator)
    return
    console.log("%c" + p, "border: 1px solid green; padding: 8px; border-radius: 4px;")
}
const info = log_for_story_creator


function process_file(obj) {
    info ("translating file: '"+obj.path + "'")
    let story_content = obj.content
    let transpiled_res = maisonette_transpiler.transpile_msn_to_js(story_content,
        {file_path: obj.path})

    if (transpiled_res.error) {
        //console.log("ERROR")
        //console.log(transpiled_js)
        transpiled_res.file_path = obj.path
        show_transpilation_error(transpiled_res)
        return {
            error: true,
        }
    }

    return {
        error: false,
        transpiled_js: transpiled_res.js,
        info: transpiled_res.info,
        data: transpiled_res.data
    }
}

function sort_file_list_alphabetically_no_prop(file_list) {
    return file_list.sort()
}

function sort_file_list_alphabetically(file_list, prop) {
    file_list = file_list
        .sort((a, b) => a[prop].localeCompare(b[prop]))
    return file_list
}

function start_processing(result) {
    let elxx = document.getElementById('preview-iframe')
    elxx.src = ""

    let file_list = result.file_list
    let mode = result.mode

    file_list = sort_file_list_alphabetically(file_list, "path")

    let transpiled_js_files = {}

    for (let file of file_list) {
        let original = file.content
        let result = process_file(file)
        if (result.error) {
            info (`Error while trying to translate the file '${file.path}'`)
            return false
        }
        info ("The file was successfully translated.")
        result.original = original
        transpiled_js_files[file.path] = result
    }

    time_transpilation.js_end = + new Date()

    show_transpilation_success_message(transpiled_js_files)
    
    hide_error_box()

    if (!chosen_dir) {
        alert("No chosen directory.")
        return
    }

    //get additional file names:
    //both files inside project folder
    //and inside auto_includes:
    let collector = {}
    let mapper = {
        js: "js",
        css: "css",
    }

    let dirs = ["./app/auto_includes", chosen_dir] //auto-include
        //scripts are added BEFORE custom ones. This is guaranteed and important.

    for (let dir of dirs) {
        //console.log(22222, dir, file_list_from_dir(dir))
        file_list_from_dir(dir).forEach(
            n => {
                //console.log(99991, dir, n)
                let ext = get_file_extension(n)
                let target
                target = mapper[ext]
                if (target) {
                    if (!collector[target]) collector[target] = []
                    collector[target].push(dir + "/" + n)
                }
            }
        )
    }


    //Note: temporarily generated index.html resides in nw/temp (not in directory 'app')
    
    /*
    Note:
    (For exporting, it would be tempting to use only one directory for both
    auto_includes_path and user_path, but then there might be name conflicts, of course,
    if the user has a file named, say, script.js and the auto_includes_path does too.
    Therefore we keep it separated. But we put everything into sub-folders.
    The final exported game will only have index.html and one folder at the top level)

    */

    let parts = chosen_dir.split("/")
    let project_name = parts[parts.length - 1]
    let index_name = "index.html"
    let auto_includes_path = `../app/auto_includes`
    let user_path = `../app/projects/${project_name}`
    let asset_path = `../app/projects/${project_name}/assets`
    let transpiled_files_path = '.'

    if (mode === "export") {
        auto_includes_path = `./app/auto`
        user_path = `./app/user`
        asset_path = `./app/assets`
        transpiled_files_path = './app/transpiled'
    }

    let html = create_html_page(transpiled_js_files, collector, html_template_content,
        auto_includes_path, user_path, asset_path, transpiled_files_path)
        
    if (html.error) {
        show_transpilation_error(html)
        return
    }

    //console.log("FINISHED html", html)

    let export_dir
    if (mode === "export") {
        try {
            export_dir = do_export(transpiled_js_files, html, auto_includes_path, user_path,
                asset_path, transpiled_files_path, collector)    
        } catch(e) {
            alert(`Error trying to export the story: ${e}`)
            return false
        }
        if (!export_dir) return //alert with Please Wait was already shown.
        alert(`I successfully exported the story to '${export_dir}'`)
        return true
    }

    if (!fs.existsSync("./temp")) {
        fs.mkdirSync("./temp")
    }

    try {
        fs.writeFileSync( "./temp/index.html", html, {encoding: 'utf8'} )
    } catch(e) {
        console.log("error: ", e)
        alert("Fatal error: could not write ./temp/index.html: " + e)
        return
    }


    //write all transpiled files to disk as js files into folder "temp":
    for ( let key of Object.keys(transpiled_js_files) ) {
        let val = transpiled_js_files[key]
        let parts = key.split("/")
        let name = parts[parts.length-1].replace(".zzz", "")
        fs.writeFileSync( "./temp/"+name+".js", val.transpiled_js, {encoding: 'utf8'} )
    }

    //this object will be passed to the iframe,
    //so it can send back signals to the editor

    let access_editor = {
        report_error: iframe_reports_error,
    }

    let el = document.getElementById('preview-iframe')
    el.src = "../temp/index.html"



    return true

    //window.location.href = "/index-temp.html"
}



function iframe_reports_error(err) {
    /* We could pass the entire error object from the iframe to the Maisonette
    tool and display it inside the Maisonette tool. The problem with
    this is that the exported HTML page should show runtime errors, too.
    That's why we display runtime errors directly inside the exported HTML page.
    We just report the line number back.*/
    console.log("reports error at line number", err.lineno, err)

    editor_set_error_at_line(err.lineno)

}


function get_file_extension(str) {
    //returns empty string for filenames
    //that do not have a dot at all
    let x = str.split('.')
    if (x.length <= 1) return ""
    return x.pop()
}

function do_export(transpiled_js_files, html, auto_includes_path, user_path, asset_path, transpiled_files_path,
    collector) {

    //create "exports" directory, if it does not exist:
    if ( !fs.existsSync("./app/exports") ) {
        fs.mkdirSync("./app/exports")
    }

    //create new directory with timestamp name:
    let parts = chosen_dir.split("/")
    let name = parts[parts.length - 1]
    let date = new Date()
    let day = date.getUTCDate()
    let month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"][date.getUTCMonth()]
    let year = date.getUTCFullYear()
    let h = (date.getHours() + "").padStart(2, "0")
    let m = (date.getMinutes() + "").padStart(2, "0")
    let s = (date.getSeconds() + "").padStart(2, "0")
    
    let dir_name = `${name}-${day}-${month}-${year}---${h}-${m}-${s}`
    let nu_dir = "./app/exports/" + dir_name

    if ( fs.existsSync(nu_dir) ) {
        alert("Still exporting. Please wait.")
        return false
    }

    fs.mkdirSync(nu_dir)

    //write index.html:
    fs.writeFileSync(nu_dir + "/index.html", html, {encoding: 'utf8'})

    //create "app" sub directory inside exported project folder:
    fs.mkdirSync(nu_dir + "/app")

    //create sub directories inside "app":
    fs.mkdirSync(nu_dir + "/app/auto")
    fs.mkdirSync(nu_dir + "/app/user")
    fs.mkdirSync(nu_dir + "/app/assets")
    fs.mkdirSync(nu_dir + "/app/transpiled")
    
    //copy asset files:
    if ( fs.existsSync(chosen_dir + "/assets") ) {
        copy_files(chosen_dir + "/assets", nu_dir + "/app/assets")
    }

    //copy auto_include and user files to new directories
        //auto_includes and user, respectively (js and css files):
    let props = ["js", "css"]
    for (let prop of props) {
        for (let item of collector[prop]) {
            let target = nu_dir + "/app/user"
            if (item.startsWith("./app/auto_includes/")) {
                target = nu_dir + "/app/auto"
            }
            let parts = item.split("/")
            let name = parts[parts.length - 1]
            fs.copyFileSync(item, target + "/" + name)
        }
    }

    //write transpiled js-files (originating from .zzz files) to directory:
    for ( let key of Object.keys(transpiled_js_files) ) {
        let val = transpiled_js_files[key]
        let parts = key.split("/")
        let name = parts[parts.length-1].replace(".zzz", "")
        fs.writeFileSync( nu_dir+"/app/transpiled/"+name+".js", val.transpiled_js, {encoding: 'utf8'} )
    }

    return nu_dir
}


function copy_files(org_dir, target_dir) {
    //copies (not moves) all files from directory to another directory
    let lst = file_list_from_dir(org_dir)
    for (let file of lst) {
        let res = fs.copyFileSync(org_dir + "/" + file, target_dir + "/" + file)
        if (!res) return false
    }
    return true
}


function debug_test_eval_transpiled_js(code) {
    window.m$ = {
        r: () => {},
        t: () => {}
    }
    yes = true
    no = false
    af = 3
    eval(code)
}

function load_file(path) {
    return new Promise ((resolve, reject) => {
        fs.readFile(
            path,
            'utf-8',
            function(err, content) {
                if (err) {
                    reject("error reading " + path )
                }
                resolve({
                    path: path,
                    content: content,
                })
            }
        )
    })
}


function file_list_from_dir(dir_name) {
    let lst = fs.readdirSync(dir_name)
    lst = sort_file_list_alphabetically_no_prop(lst)
    return lst
}


/*
function show_console() {
    settings.show_console = true
    $("#show-console").val("show")
    make_error_box_small()
}

function hide_console() {
    settings.show_console = false
    $("#show-console").val("dont")
    make_error_box_small() 
}

function init_console_shower() {
    $("#show-console").on ("change", () => {
        let val = $("#show-console").val()
        if (val === "show") {
            show_console()
        } else {
            hide_console()
        }
    })
}

*/


function zoom_in() {
    settings.zoom_level++
    zoom_to(settings.zoom_level)
}


function zoom_out() {
    settings.zoom_level--
    zoom_to(settings.zoom_level)  
}

function zoom_to(level) {
    settings.zoom_level = level
    if (settings.zoom_level > zoom_levels_to_px.length - 1) {
        settings.zoom_level = zoom_levels_to_px.length - 1
    }
    if (settings.zoom_level < 0) {
        settings.zoom_level = 0
    }
    set_css_var("text_size", zoom_levels_to_px[settings.zoom_level] + "px")
}

function set_css_var(css_var, val) {
    document.documentElement.style.setProperty('--' + css_var, val)
}


function click_tab(tab) {
    $(".tab").addClass("unslctd")
    $("#tab-"+tab).removeClass("unslctd")

    $(".tab-box").hide()
    $(".tab-box-"+tab).show()
    
    if (tab === "help") {
        let h = $(".tab-box-help").first().html().trim()
        if (h === "") {
            //set help contents for the first time
            //we don't do this on startup to potentially
            //save a bit of time on startup
            init_help_box()
        }
    }
}
    
function init_help_box() {
    let html = markdown_to_html(msn_help_contents)
    $(".tab-box-help").html(html)
    help_processor.do($(".tab-box-help"))
}


function markdown_to_html(md) {
    let html
    md = md.replaceAll("_", "&#x5f;")
    let converter = new showdown.Converter()
    html = converter.makeHtml(md)
    return html
}

/*
function make_error_box_big() {
    //no matter whether settings.show_console is true or not,
    //on error, console is always opened and made big
    $(".show-error-to-user-box").show()
    $(".show-error-to-user-box").css("height", "70vh")
    $(".show-error-to-user-box").css("border", "4px solid #A00")
}

function make_error_box_small() {
    if (!settings.show_console) {
        $(".show-error-to-user-box").css("display", "none")
        return
    }

    $(".show-error-to-user-box").show()
    $(".show-error-to-user-box").css("height", "140px")
    $(".show-error-to-user-box").css("border", "1px solid #555")
}
*/

function load_html_template() {
    let res
    let path = "./app/html_template/index.html"
    try {
        res = fs.readFileSync(
            path,
            'utf-8'
        )
    } catch(e) {
        alert(`Fatal error: The index.html template file seems to have been moved or deleted.
        Could not find the file: '${path}'`)
        return
    }
    html_template_content = res
}


function init_code_editor() {
    let el = document.getElementById("main-box-column-editor")
    

    
    let cm = CodeMirror(el, {
        value: `
            #thing
            name: 'mine'
            #rule take bottle
            if x and y
            Hallo!
            run:
                x = 2
            props:
                name: 3


































                #video sd

                #audio

                #title Me

                #author myself

                #meta <something>

        `,
        mode:  "simplemode",
        theme: "msnnight",
        lineNumbers: true,
    })

    cm.setSize("100%", "100%") //only works like this, not via css file

    code_mirror_editor = cm //make global

    cm.on("change", () => {
        if (editor_has_errors) {
            editor_has_errors = false
            editor_clear_errors()
        }
    })

}

let code_mirror_editor
let editor_has_errors = false

function editor_set_error_at_line(line_nr) {
    if (!line_nr || !Number(line_nr)) return
    line_nr--
    code_mirror_editor.scrollIntoView({line: line_nr})
    code_mirror_editor.markText({line: line_nr, ch: 0}, {line: line_nr, ch:1000}, {
        className: "editor-error-line"
    })
    editor_has_errors = true
}

function editor_clear_errors() {
    code_mirror_editor.doc.getAllMarks().forEach( m => m.clear() )
}


let date = new Date()
let day = date.getUTCDate()
let month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"][date.getUTCMonth()]


function start() {

    let win = nw.Window.get()
    win.on("close", () => {
        let r = check_if_saved_and_ask()
        if (r) win.close(true)
    })

    init_code_editor()
    
    //init_console_shower()
    
    //hide_console()

    load_html_template()

    apply_theme(themes[0])
    let i = -1
    for (let theme of themes) {
        i++
        let el = `<option value="${i}">${theme.name}</option>`
        $("#themes").append(el)
    }

    $("#themes").on("change", (ev) => {
        let v = $("#themes").val()
        apply_theme(themes[v])
    })

    $(".dev-box").hide()

    hide_error_box()


    set_button_state("export", false)
    set_button_state("reload", false)    

    if (DEBUG) {
        open_project("demo_project")
    }

    if (settings.show_editor) {
        show_editor()
    } else {
        hide_editor()
    }

    init_editor_shower()

    init_keyboard_shortcuts()

    generate_the_story()

    
    if (DEBUG) {
        let win = nw.Window.get()
        win.showDevTools()
        win.width = window.screen.width
        win.height = Math.round(window.screen.height * 0.57)
        win.moveTo(0, 0)
        /* This is broken, but nw.js is just broken in this regard.
        It always does what the heck it wants when it comes
        to window positions. */ 
    }
    
            init_help_box() //testing only

}

function init_keyboard_shortcuts() {


    window.onkeydown = function(e) {
        if( (e.metaKey || e.ctrlKey) ) {
            if (e.key === "+") zoom_in()
            else if (e.key === "-") zoom_out()
            else if (e.key === "s") click_save()
        }
    }      
}



function init_editor_shower() {
    $("#show-editor").on("change", () => {
        let val = $("#show-editor").val()
        if (val === "only-editor") {
            show_editor()
        } else if (val === "only-play") {
            hide_editor()
        } else if (val === "editor-play") {
            show_editor()
            $(".main-box").css("flex-direction", "row")
        } else if (val === "play-editor") {
            show_editor()
            $(".main-box").css("flex-direction", "row-reverse")
        }
    })
}

function show_editor() {
    $("#main-box-column-editor").css("display", "flex")
    $("#main-box-column-preview").css("width", "50vw")    
    settings.show_editor = true
}

function hide_editor() {
    $("#main-box-column-editor").css("display", "none")    
    $("#main-box-column-preview").css("width", "100vw")
    settings.show_editor = false
}


function create_project(name) {
    //fish fishy
    //create "exports" directory, if it does not exist:
    if ( fs.existsSync("./app/projects/" + name) ) {
        alert(`A project with this name exists already. Aborting.`)
        return
    }

    //create new project directory:
    try {
        fs.mkdirSync("./app/projects/" + name)
        fs.mkdirSync("./app/projects/" + name + "/assets")
        fs.writeFileSync( "./app/projects/"+name+"/story.zzz",
            `\n#title ${name}\n#author Unnamed Author\n`, {encoding: 'utf8'} )
    } catch(e) {
        alert("Error trying to create the project directory.")
        return
    }

    alert(`I created a new project named '${name}'`)

    open_project(name)
}


function click_new_project() {
    let r = check_if_saved_and_ask()
    if (!r) return
    gui_window_manager.request_new_project(create_project)
}

function click_open_project() {
    let r = check_if_saved_and_ask()
    if (!r) return
    gui_window_manager.request_open_project(open_project)
}

function check_if_saved_and_ask() {
    if (!valid_story_zzz_file_exists) return true
    let v = code_mirror_editor.getValue()
    if (v !== last_saved_state) {
        let r = confirm(`You have unsaved changes. `+
        `Choose "OK" to proceed anyway and lose the changes. `)
        return r
    }
    return true
}



function open_project(name) {
    document.title = name + " - Maisonette"
    chosen_dir = "./app/projects/" + name //not 'let'! chosen_dir is global
    set_button_state("export", true)
    set_button_state("reload", true)
    register_the_watcher(chosen_dir)
    editor_open_file("./app/projects/"+ name + "/story.zzz", "story.zzz")
    //generate_the_story() //disabled for testing debug
}

let valid_story_zzz_file_exists = false

function editor_open_file(path, name) {
    let txt
    try {
        txt = fs.readFileSync(
            path,
            'utf-8'
        )
    } catch(e) {
        valid_story_zzz_file_exists = false
        code_mirror_editor.setValue("<Not editable>")
        code_mirror_editor.setOption("readOnly", true)
        alert(`I found no file with name '${name}' inside the project folder. `+
            `This project can still be built, but it cannot be edited inside Maisonette.`)
        
        return
    }
    valid_story_zzz_file_exists = true
    last_saved_state = txt
    code_mirror_editor.setValue(txt)
    code_mirror_editor.setOption("readOnly", false)
}

/*

*/


function click_save() {
    if (!chosen_dir) {
        alert(`No open project.`)
        return
    }
    if (!valid_story_zzz_file_exists) {
        alert(`No 'story.zzz' file to save to.`)
        return
    }
    let txt = code_mirror_editor.getValue()

    //write file:
    try {
        fs.writeFileSync( chosen_dir +"/story.zzz", txt, {encoding: 'utf8'} )
    } catch(e) {
        alert(`Error while trying to write story.zzz. ${e}`)
        return
    }

    last_saved_state = txt
    set_button_state("save", false)
    setTimeout(() => {
        set_button_state("save", true)     
    }, 500) //just a visual feedback
}

function click_backup() {
    alert("Doesn't work yet. Please copy your project folder manually and store the copy in a safe destination.")
}

function set_button_state(button_key, n) {
    let button = $("#" + button_key)
    if (n) {
        button_state[button_key] = true
        button.removeClass("my-button-disabled")
    } else {
        button_state[button_key] = false
        button.addClass("my-button-disabled")
    }
}

let last_auto_update = 0
const auto_update_interval_min = 500 //the file
    //watcher may trigger twice for a single file change,
    //so this prevents too many automatic story rebuilds in a short time.

function register_the_watcher(dir) {
    if (file_watcher) {
        file_watcher.close()
    }
    file_watcher = fs.watch(chosen_dir, function() {
        /*
            NOTES:
            - Sometimes errors in this function fail silently,
                without showing anything in the console. Maybe
                some try{} catch{} interference???  
                
            - The fs.watch function is not 100% cross-platform
                and may have quirks (the node documentation
                says this, not me.)
            
            - This function may fire twice for one file change
                (that's probably one of the quirks). That's why we check
                the elapsed time.

            - The arguments passed to this function are not
            necessarily reliable (per the node.js docs), so we don't
            use them.

            - There may be no reliable way to detect whether
            a file change came from our own app or from the outside.
            At least we did not find one, yet. That's why we do not
            even try to distinguish, at least for now. The caveat is
            that if you open story.zzz in Maisonette and in another editor
            at the same time and proceed to edit the file in both apps
            simultaneously, you will wreak havoc upon Codemirror
            (meaning: Codemirror will show the file contents incorrectly.)
            We could mitigate this by auto-updating the Codemirror content
            on each file change (even of file changes we trigger
            ourselves with "save", because like we said above,
            we have no way of distinguishing the origin of a file change),
            but that:
                a) seems a bit perverse performance-wise 
                b) might cause other trouble like Codemirror scrolling
                up (potentially, not really tested)
            -> The current solution is simply to strongly discourage
            the user from editing "story.zzz" simultaneously in
            Maisonette and another editor.
        */
        let time = + new Date()
        let elapsed = time - last_auto_update
        if (elapsed < auto_update_interval_min) return
        generate_the_story()
        last_auto_update = time
    })
}


function click_export() {
    if (!button_state.export) return
    generate_the_story("export")
}

function click_reload() {
    if (!button_state.reload) return
    generate_the_story()
}


function click_debug() {
    /* show dev tools only for iframe (doesn't seem to work, though?)*/
    let elxx = document.getElementById('preview-iframe')
    let win = nw.Window.get()
    win.showDevTools(elxx)
}

let nw_clipboard = nw.Clipboard.get()

function set_clipboard(txt) {
    nw_clipboard.set(txt, 'text')
}


