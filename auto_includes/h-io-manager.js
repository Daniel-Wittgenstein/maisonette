
/*

The IO-manager handles inout/output and sets global vars.
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

    let suggestions = {}

    function on_stream_receives_new_content(stream, item) {
        /* form of passed items:
        {
            type: "link", //or "html" etc.,
            content:
            {
                text: text,
                thing_id: id, //if link
                error: false, //maybe passed, does not matter
            }
        }
        */
        console.log("STREAM RECEIVED NEW CONTENT", stream.id, stream, item)
        let el = get_dom_element_from_stream(stream)
        if (!el) return //error already thrown
        let thing_id = item.content.thing_id
        let html = false

        if (thing_id) {
            //refresh options for linked thing:
            suggestions[thing_id] = world_manager.get_suggestions_by_thing(thing_id)
            if (!suggestions[thing_id].length) {
                //thing link, but there are currently no options:
                //just display as normal text:
                html = preprocess_output_text(item.content.text)
            }
        }
        
        if (!html) html = get_html_from_stream_item(item)

        el.append(html)
    }
    
    let iom_settings = {
        accessible_links: true,
    }

    function get_html_from_stream_item(item) {
        let html = ""
        if (item.type === "html") {
            //no html escaping here, it's perfectly fine to print html:
            let text = item.content.text
            if (!text) return ""
            text = preprocess_output_text(text)
            return text
        } else if (item.type === "link") {
            let text = item.content.text
            let id = item.content.thing_id
            if (!text) return ""
            text = preprocess_output_text(text)
            if (iom_settings.accessible_links) {
                html = `<a href="#" class="msn-link msn-link-for-thing
                    msn-link-as-link" data-thing-id="${id}">${text}</a>`
            } else {
                html = `<span class="msn-link msn-link-for-thing
                    msn-link-as-span" data-thing-id="${id}">${text}</span>`
            }
            return html
        }
    }
    

    function preprocess_output_text(html) {
        /* This could do a final touch-up for the text that
        is printed, like fixing quote characters etc. Note
        however that this is HTML, so this should NEVER break
        HTML tags. When in doubt, it's better not to touch this. */
        return html
    }

    function on_stream_flushed(stream) {
        let el = get_dom_element_from_stream(stream)
        if (!el) return //error already thrown
        console.log("Flushed div " + stream.dom_selector)
        el.html("")
    }

    function get_dom_element_from_stream(stream) {
        let el = $(stream.dom_selector)
        if (el.length === 0) {
            throw `There is no HTML element with id '${stream.dom_selector.replace("#", "")}'`
            return false
        }
        return el
    }

    function init_event_handlers() {
        $("body").on("click", ".msn-link-for-thing", function() {
            let data = $(this).data()
            let thing_id = data.thingId //thing-id is converted to thingId, apparently
            let su = suggestions[thing_id]
            console.log(21, su)
        })
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
    
        init_event_handlers()

        world_manager.set_callbacks({
            on_stream_receives_new_content: on_stream_receives_new_content,
            on_stream_flushed: on_stream_flushed,
        })


        //create a global object that contains
        //some additional convenience functions
        //for the user (namespaced to an object,
        //because they won't be used all the time):

        let wm = world_manager
        window.mais = {
            set_wm_option: wm.set_settings_option,
            create_stream: wm.create_stream,
            set_stream: wm.set_stream,
        }


        //test:
        world_manager.take_turn("eat sandwich")


    })








    
})()


/*
MAISONETTE_LAST_EXEC = {
    file_path: false,
    line_nr: false,
    text: false,
}

*/



