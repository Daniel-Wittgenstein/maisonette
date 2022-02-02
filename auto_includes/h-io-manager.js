
/*

The IO-manager handles inout/output and sets global vars.
This is the app entry point.

*/


//SET GLOBALS:

yes = true
no = false

;(function() {

    //setup the functions that will be used
    //by the user-generated scripts to load data into the world_manager:
    //(entry points for transpiled maisonette
    //(.zzz) files):
    //#################################



    let props = [
        "r", "f", "t", "v", "img", 
        "aud", "vid", "meta_title",
        "meta_author", "meta_meta", "rel",
        "o", "cm"
    ]
    
    m$ = {}

    let global_loading_error = false

    for (let prop of props) {
        m$[prop] = (file_name, line_nr, org_text, ...args) => {
            if (global_loading_error) return
            //console.log(prop, args)
            let result = world_manager.load_block(prop, file_name, line_nr, org_text, args)
            if (result.error) {
                let err = {}
                err.filename = file_name
                err.lineno = line_nr
                err.message = result.msg + " --- The error occurred in line: " + org_text
                err.message = escape_html(err.message)
                err.error = "Malformed block"
                err.dev_type = "Loading time error"
                show_custom_load_block_error(err)
                global_loading_error = true
            }
        }
    }

    //#################################


    //define error handling:

    window.addEventListener('error',
        (...args) => {
            //console.log("error", args)
            args[0].dev_type = "JavaScript runtime error"
            show_error(args[0])
        }
    )

    function show_custom_load_block_error(err) {
        show_error(err)
    }

    function show_error(err) {
        let err_text = get_error_text(err)
        $("body").prepend(err_text)
        try {
            parent.iframe_reports_error(err)
        } catch(e) {
            //just ignore. means we are running inside the browser
        }
    }

    function get_error_text(e) {
        let m = {} //MAISONETTE_LAST_EXEC
        let short_filename
        if (e.filename) {
            short_filename = file_name_from_path(e.filename)
            short_filename = short_filename.replace(".js", ".zzz")                
        } 
        let out = `
            <p>${e.message ? e.message : e.msg}</p>
            <p>Line number: ${e.lineno}</p>
            <p>File name: ${short_filename}</p>
            <p>Type: ${e.error}</p>
            <p>(${e.dev_type})</p>
        `
        //var errt = new Error();

        //console.log(38828832,  errt.stack)

        if (m.text) {
            let short_filename2
            if (m.file_path) {
                short_filename2 = file_name_from_path(m.file_path)
                short_filename2 = short_filename2.replace(".js", ".zzz")
            }
            out += `<p>Last executed Maisonette block:<p>
            <p>Block starts with: ${m.text}</p>
            <p>Block starts at line number: ${m.line_nr}</p>
            <p>Block is inside file name: ${short_filename2}</p>`
        }

        if (e.lineno) {
            show_error_in_editor()
        }

        return out
    }

    function show_error_in_editor() {
        
    }

    function file_name_from_path(n) {
        let parts = n.split("/")
        return parts[parts.length - 1]
    }


    //define onload:

    let runtime_environment

    $(window).on("load", () => {
        //console.log("finished loading")
        //at this point, all user story data has been loaded.
        //now the game can start/resume

        if (window === parent) {
            console.log("👍🏽 Running as exported app.")
            runtime_environment = "exported"
        } else {
            console.log("👍🏽 Running inside Maisonette builder.")
            runtime_environment = "maisonette"
        }

        //console.clear() //nice for user, but terrible for us while developing
        world_manager.log_load_info()

        let result = world_manager.set_global_hooks(window,
            {globalize_all_entities: true})

        if (result.error) {
            show_error(result)
            return
        }
        world_manager.test_stuff()

    })



})()


/*
MAISONETTE_LAST_EXEC = {
    file_path: false,
    line_nr: false,
    text: false,
}

*/



