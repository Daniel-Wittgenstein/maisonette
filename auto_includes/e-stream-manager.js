


stream_manager = (function() {

    let streams = {}
    let current_stream = false

    class Stream {
        constructor(id, dom_selector) {
            if (streams[id]) {
                throw `A stream with id ${id} exists already!`
                return
            }

            if ($(dom_selector).length === 0) {
                throw `error: I tried to create a new stream named '${id}'
                    with DOM selector '${dom_selector}', but
                    '${dom_selector}' is not a valid DOM selector.
                    Or maybe it is, but there is no such HTML
                    element at the moment.
                    For example to select an element with id = 'my-id',
                    you need a DOM selector like this: '#my-id'.
                    Correct usage:
                    stream_manager.create_stream("my_stream_name", "#id-of-an-html-element")`
                return
            }
            
            streams[id] = this
            this.dom_selector = dom_selector
            this.id = id
            this.content = []
        }
        set_as_current() {
            current_stream = this
        }
        flush() {
            this.content = []
        }
        add_content(item) {
            this.content.push(item)
            if (!item.is_stream_item) {
                throw `Developer error: not a valid stream item.`
            }
            //console.log("Stream ", this, ": stream item has been added: ", item)
            on_stream_received_new_item(this, item)
        }
    }
    
    function add_content(item) {
        if(!current_stream) throw `No stream set.`
        current_stream.add_content(item)
    }



    function turn_finished() {
        //this gets called by the world_manager
        //every time a turn is finished.
        //now the stream manager can (for example)
        //change dom, to make things interactive
        //that weren't interactive before
        on_turn_finished()
    }




    function on_turn_finished() {
        //only now enable button links:
        $(".msn-button-for-thing").each( function() {
            $(this).prop("disabled", false)
        })
    }

    function on_stream_received_new_item(stream, item) {
        let dom_el = $(stream.dom_selector)
        let end_space = "&nbsp;" //might cause suboptimal word-wrapping
            //but it's the only way to force spaces apparently
        if (item.glue_at_the_end) end_space = ""
        let trimmed_text = item.text.trim()
        if (!trimmed_text) return //ignore empty text blocks
        if (item.type === "html") {
            let nu_el = $(`<div class='msn-text'></div>`)
            nu_el.html(`${trimmed_text}${end_space}`)
            dom_el.append(nu_el)
            //nu_el.hide()
            //nu_el.fadeIn(500)
        } else if (item.type === "link") {
            let html = `
            <button class="msn-button-for-thing"
                data-thing = "${item.thing_id}" disabled>${item.text}</button>${end_space}
            `
            let nu_el = $(html)
            dom_el.append(nu_el)
            //nu_el.hide()
            //nu_el.fadeIn(500)
        }
    }

    function app_ready_to_play() {
        //this gets called by the io-manager once the app is ready to be played
        //(generic event handlers should be attached here)
        init_event_handlers()
    }

    function init_event_handlers() {
        $("body").on ("click", ".msn-button-for-thing", function(e) {
            let data = $(this).data()
            if (!data.thing) return //non-thing links not supported yet
            //fetch suggestions for the thind id string stored in data.thing
            //from world_manager -> display them
            //console.log(178, $(this), data)
        })
    }

    function create_stream(id, dom_selector) {
        let stream = new Stream(id, dom_selector)
        return stream
    }

    function set_stream(id) {
        let stream = streams[id]
        if (!stream) throw `No stream with id: '${id}' exists.`
        stream.set_as_current()
    }

    let renderer = {}

/*

    function get_link_html (stream_item) {

        let s = stream_item

        if (!stream_item.suggestions.length) {
            //no suggestions: just print normal text
            //instead of link:
            html = `${s.text}`
        } else {
            if (options.accessible_dropdowns) {
                let inner = ""
                for (let sugg of s.suggestions) {
                    inner += `<option value="verb: ${sugg.verb}">${sugg.custom_text}</option>`
                }
                html = `
                <select name="cars" id="cars" class="msn-select-for-thing">
                    <option value="-">${s.text}</option>
                    ${inner}
                </select>
                ` //todo
            } else {
                let more_data = ``
                for (let sugg of s.suggestions) {
                    more_data += `"verb: ${sugg.verb}">${sugg.custom_text}</option>`
                }
                html = `
                    <button class="msn-button-for-thing"
                        data-thing = "${s.thing_id}" ${more_data}>${s.text}</button>
                `
            }
        }
        return html
    }
*/

    let options = {
        //render_thing_links_as_selects: false, //planned for the future:
        //may be set
        //for accessibility or mobile
    }

    function set_option(toption, value) {
        options[toption] = value
    }

    // ################

    return {
        create_stream,
        set_stream,
        add_content,
        set_option,
        turn_finished,
        app_ready_to_play,
    }



})()





