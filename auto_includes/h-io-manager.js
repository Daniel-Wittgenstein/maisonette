
/*

The IO-manager handles input/output and sets global vars.
This is the app entry point.

*/


//SET GLOBALS: (if you wanted to do: "window.yes", you would
//have to remove the const, but you probably don't want to do that.)

const yes = true
const no = false

const carry_on = "carry_on"
const stop = "stop"



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
        /* We could send the error to the editor
        for displaying, but we actually want
        to also show the error in a browser enviroment.
        So we display the error directly in the browser window/iframe
        AND send a signal to the parent editor for further
        processing (for example so the editor can highlight
        the relevant wrong line). But error display is only
        handled here, not in the editor. */
        let err_text = get_error_text(err)
        $("body").prepend("<div class='msn-error-box'>"+err_text+"</div>")
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


    let iom_settings = {
        accessible_links: true,
    }


    function preprocess_output_text(html) {
        /* This could do a final touch-up for the text that
        is printed, like fixing quote characters etc. Note
        however that this is HTML, so this should NEVER break
        HTML tags. When in doubt, it's better not to touch this. */
        return html
    }

/*

    function init_event_handlers() {
        $("body").on("click", ".msn-button-for-thing", function() {
            let data = $(this).data()
            let thing_id = data.thingId //thing-id is converted to thingId, apparently


        })
    }
*/

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

        stream_manager.create_stream("main", ".center-bottom")
        //stream_manager.create_stream("top", ".box-top")
        stream_manager.create_stream("bottom", ".box-bottom")
        stream_manager.create_stream("left", ".box-left")
        stream_manager.create_stream("main-top", ".center-top")
        stream_manager.create_stream("right", ".box-right-text-box")

        stream_manager.set_stream("main")

        let result = world_manager.set_global_hooks(window,
            {globalize_all_entities: true})

        //also global:
        window.box = box

        if (result.error) {
            show_error(result)
            return
        }
    
        //create a global object that contains
        //some additional convenience functions
        //for the user (namespaced to an object,
        //because they won't be used all the time):
        let wm = world_manager
        window.mais = {
            set_wm_option: wm.set_settings_option,
            create_stream: stream_manager.create_stream,
            set_stream: stream_manager.set_stream,
        }

        stream_manager.app_ready_to_play()

        world_manager.app_ready_to_play()

        //todo to do: load story if saved to localStorage etc. 

        //if no saved game, just tell the world manager
        //to start the story from scratch,
        //but pass true, because there is no need
        //to reset the story state (the story state
        //already IS at the beginning state):
        //This is the only instance where true should be passed
        world_manager.restart_story(true)

        //test:
        //world_manager.take_turn("eat sandwich")


    })


    
    function box(stream_name) {
        /* Friendly function for your common stream settings
        needs. Only works with standard streams (custom streams
        are an experimental feature right now). */
        let keys = ["main", "top", "bottom",
            "left", "main-top", "right"]
        if (!keys.includes(stream_name)) {
            throw `command 'box("${stream_name}")':
                stream with name '${stream_name}' does not exist.`
        }
        stream_manager.set_stream(stream_name)
    }






    
})()


/*
MAISONETTE_LAST_EXEC = {
    file_path: false,
    line_nr: false,
    text: false,
}

*/



