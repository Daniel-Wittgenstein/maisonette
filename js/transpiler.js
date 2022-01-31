

/* 
todo to do:


- cache entries must expire
by timestamp, otherwise cache
gets gigantic. (currently cache is disabled, anyway, though,
pends further testing) aidditonally we even return object now
from transpile_block. FIX OR REMOVE CACHE FUNCTIONALITY.
test speed first with massive stories, whether we even need cache.


Maisonette Transpiler.

Converts a simple block-markup-language into JavaScript.

The generated JavaScript is syntactically valid JS, but
is useless by itself. It has to be used
by a dedicated engine.

-----------

BLOCK TYPES:
Keywords have a block type. These are the block types:

- quad blocks: may consist of up to 4 sub-blocks (hence the name)
    and an additional non-optional head block:
    - single head line (non-optional): the line that starts with #keyword
        and everything that follows on the same line
    - single line if condition
    - text block
    - run block (maisonette code = sugar-coated JS)
    - props block
    The sub-blocks are optional (for the transpiler,
        later the engine may still complain if blocks are missing
        or if there are blocks that do not make sense in the context
        of this command.) The sub-blocks have to appear in this exact
        order, otherwise the transpiler will complain.
    
- props blocks: consists of a single block where each of the lines
        takes the form: 'property: value'
        (multi-lines are not allowed)
        and of an additional head line (the line starting with #)

- simplex block: consists of a header line starting with # and all of its content
    and the entire block content as a multi-line string
    + only block that can return meta-data
    + valid options for this block type:
        - multi_line_allowed: true/false (if false, then only
            one line is allowed (only header line, the rest
            must be empty lines))

- function block: treats its entire content (except for the head line)
        as a Maisonette code block (JS with sugarified syntax), wraps
        that code block in a function and creates name and parameters from
        the head line:
        example:
            #command name param1 param2
                do_it()
        would become:
            m$.c("command", function(param1, param2) {
                do_it()
            })
        
        + valid options for this block type:
            - nameless_allowed: true/false

These are all the valid block types.

*/


maisonette_transpiler = (function() {

    let NAMESPACE = "m$"

    const word_to_keyword = {
        "rule": "rule",
        "r": "rule",
        "var": "var",
        "option": "option",
        "thing": "thing",
        "t": "thing",
        "script": "js",
        "function": "function",
        "video": "video",
        "image": "image",
        "audio": "audio",
        "author": "author",
        "title": "title",
        "meta": "meta",
        "relation": "relation",
        "comment": "comment",
    }

    const block_definitions = {

        "function": {
            block_type: "function",
            name: "function",
            transpiled_key: "f",
            nameless_allowed: false,
        },


        "option": {
            block_type: "function",
            name: "option",
            transpiled_key: "o",
            nameless_allowed: true,
        },

        //#######################

        "relation": {
            block_type: "props",
            name: "relation",
            transpiled_key: "rel",
        },

        "thing": {
            block_type: "props",
            name: "thing",
            transpiled_key: "t",
        },

        //#######################

        "rule": {
            block_type: "quad",
            name: "rule",
            transpiled_key: "r",
        },

        //#######################

        "var": {
            block_type: "simplex",
            name: "var",
            transpiled_key: "v",
            custom_transpilation: (text) => {
                //we do not auto-create globals anymore.
                //instead the world_manager creates them
                //once it is instructed by the io-manager
                //to do so.
                return ""
            }
        },

        "image": {
            block_type: "simplex",
            name: "image",
            transpiled_key: "img",
            add_to_meta_data: true,
        },

        "audio": {
            block_type: "simplex",
            name: "audio",
            transpiled_key: "aud",
            add_to_meta_data: true,
        },

        "video": {
            block_type: "simplex",
            name: "video",
            transpiled_key: "vid",
            add_to_meta_data: true,
        },

        "title": {
            block_type: "simplex",
            name: "title",
            transpiled_key: "meta_title",
            add_to_meta_data: true,
        },

        "author": {
            block_type: "simplex",
            name: "author",
            transpiled_key: "meta_author",
            add_to_meta_data: true,
        },

        "meta": {
            block_type: "simplex",
            name: "meta",
            transpiled_key: "meta_meta",
            add_to_meta_data: true,
        },

        "comment": {
            block_type: "simplex",
            name: "comment",
            transpiled_key: "cm",
            multi_line_allowed: true,
            censor: true, //remove comment text from final output.
        },

    }


    function create_comparison_hash_from_block(block) {
        //takes block (list of line objects) and
        //generates a (hopefully) unique hash string based
        //on that. this is used to see whether a
        //block has already been transpiled. if yes,
        //the transpiled block is fetched from the cache,
        //instead of re-transpiling it.
        //currently cache is not used
        let sep = "§"
        return block.map(n => n.line+"§"+n.line_nr).join("§§")
    }


    let debugging = true

    let block_command = {}

    let cache = {}
    let cache_enabled = false

    function log_cache() {
        console.log(cache)
    }
    
    function enable_cache() {
        cache_enabled = true
    }

    function disable_cache() {
        cache_enabled = false
    }
    
    function flush_cache() {
        cache = {}
    }

    let cache_ops

    function transpile_msn_to_js( content, xinfo = {file_name: "unknown"} ) {
        /* function that should be called from the outside.
        
        takes maisonetteScript code as a string.
        if error, returns error object,
        if success, returns string containing the transpiled js.
        and additional info

        (may also take a xinfo object with additional meta-info)
        */
        cache_ops = {
            from_cache: [],
            retranspiled: [],
        }

        if (content.includes("§")) {
            return {
                error: true,
                msg: `Your script may not contain the § character.`
            }
        }

        content = content.replace( /[^\S\r\n]/g, " ") //replace
            //all whitespace except for linebreaks with spaces
    
        content = content  //normalize line breaks (hopefully)
            .replace( /\r\n/g, "\n")
            .replace( /\r/g, "\n")

        let block_list = split_into_blocks(content, "#")
        let out = ""
        //console.log("block list", block_list)
        let index = -1
        let collected_data = []
        for (let block of block_list) {
            index++
            let very_first = false
            if (index === 0) very_first = true
            let result
            let block_acc = create_comparison_hash_from_block(block)
            if (block.length === 0) {
                result = { 
                    text: "",
                    data: false, //return falsy for: no meta-data
                }
            } else {
                if (very_first) {
                    result = transpile_block(xinfo, block, very_first)
                } else {
                    if (cache_enabled && cache[block_acc]) {
                        result = cache[block_acc].former_result

                        cache_ops.from_cache.push(block[0])
                    } else {
                        result = transpile_block(xinfo, block, very_first)

                        cache_ops.retranspiled.push(block[0])
                    }
                }
            }
            
            if (!result.error && cache_enabled) { //do not cache
                //errors, because who says that
                //the line number did not change
                cache[block_acc] = {
                    time_stamp: + new Date(),
                    former_result: result,
                }
            }
            
            if (result.error) {
                return result
            }

            if (isString(result)) {
                console.log(block, result)
                throw `Block returned string instead of object.`
            }
            
            if (!result) {
                throw `Block returned illegal code representation.`
            }

            if (result.data) {
                //gather additional meta-data, but only if some was actually
                //returned
                collected_data.push(result.data)
            }

            out += result.text
        }
        out = out.replaceAll("§", "")
        /* note: the info object is for returning debugging/testing
        stuff. The data object is for returning critical
        data in non-code-string form, for example data
        about assets etc.*/
        return {
            js: out,
            data: collected_data,
            info: {
                cache_ops: cache_ops,
            },
        }
    }


    function split_into_blocks(str, special_char = "#") {
        /* splits string into blocks */
        let lines = str.split("\n")
        let blocks = []
        blocks.push([])
        let block_counter = 0
        let index = -1
        for (let line of lines) {
            index ++
            if (line.trim().startsWith(special_char)) {
                block_counter++
                blocks[block_counter] = []
            }
            blocks[block_counter].push({
                line: line,
                line_nr: index + 1,
            })
        }
        return blocks
    }

    function clone(c) {
        //flat clone, not deep clone (obviously)
        return JSON.parse(JSON.stringify(c))
    }



    function transpile_block(xinfo, content, very_first = false) {

        if (very_first) {
            // very first block = content before first
            // block starts with an #
            // this content is just entirely ignored.
            // you can use it to comment your source,
            // but it's not included in the final
            // transpiled output, it will just consist
            // of empty lines
            let out = ""
            for (let line of content) {
                out += "\n"
            }
            return {
                text: out,
                data: false, //return falsy for: no meta-data
            }
        }

        let org_content = clone(content)
        let first_line = content[0].line.replace("#", "").trimLeft() + " "
        let res = split_into_first_word_and_rest(first_line)
        let first_word = res[0]
        let rest = res[1]

        let command_name = word_to_keyword[first_word]
        let actual_command = block_definitions[command_name]

        if (!actual_command) {
            return {
                error: true,
                msg: `'#${first_word}': I don't know this block command.`,
                line_nr: content[0].line_nr,
                offending_line: content[0],
            }
        }

        if (!actual_command.block_type) {
            throw `Wrong block type. Expected 'quad' or 'simplex' or 'props'.`
        }

        let func = block_command[actual_command.block_type]
        if (!func) {
            throw `block_type seems to be not properly linked to block_command.`
        }

        let first_line_whole = content[0].line

        let result = func(xinfo, content, rest, first_word,
            actual_command.transpiled_key, actual_command.name, first_line_whole)

        if (result.error) {
            //attach line object to error, so we can display info later:
            let offending_line = result.line_nr
            for (let line of content) {
                if (line.line_nr === offending_line) {
                    result.offending_line = line
                }
            }
            //attach more info to error object:
            result.offending_block_header = first_line
            result.offending_block = org_content
        }

    /*
        //just a debugging check
        if (content.length !== result.split("\n").length - 1) {
            console.log("threw", content.length, "!==", result.split("\n").length + 1)
            throw `Transpiled block: unequal line result`
        }
    */ 
        return result
    }



    //###############################
    //###############################
    /* parsing the quad blocks: */
    //###############################
    //###############################


    function split_quad_into_blocks(lines, rest) {
        /* Each quad block consists of
        sub-blocks: an if-block (single-line, optional),
        a run-block, a props-block (both multi-line, optional)
        and a text-block (multi-line, everything that does not belong
        to any of the other blocks).
        This function just splits into sub-blocks,
        but doesn't do any processing on the sub-blocks.
        It doesn't even check whether the
        run: and props: and if: lines are malformed,
        it just splits and passes the result on.
        It can return an error object, though. */
        //rest is: # rule eat salmon
        let i = -1
        let if_possible = true
        let text_possible = true
        let props_set = false
        let run_set = false
        let run_set_at = 0
        //first find out where sub-blocks start:
        for (let line of lines) {
            i++
            let clean_line = line.line.trim().replace(/\s/, " ")
            if (i === 0) {
                line.tmp_type = "head"
                continue
            }
            if (if_possible && clean_line.startsWith("if ")) {
                if_possible = false
                line.tmp_type = "if"
                continue
            }        
            if (clean_line.startsWith("run:")) {
                if (props_set) {
                    return {
                        error: true,
                        msg: `'run:' block should appear before 'props:' block.`,
                        line_nr: line.line_nr,
                    }
                }
                if_possible = false
                text_possible = false
                line.tmp_type = "run"
                run_set = true
                run_set_at = i
                continue
            }
            if (clean_line.startsWith("props:")) {
                props_set = true
                if_possible = false
                text_possible = false
                line.tmp_type = "props"
                continue
            }
            if (text_possible && line.line.trim() !== "") {
                if_possible = false
                text_possible = false
                line.tmp_type = "text"
            }
        }
        //check for empty run block and throw error,
        //if you find it: (would cause transpilation bug further down the line)
        if (run_set) {
            let line_next = lines[run_set_at + 1]
            if (line_next && line_next.tmp_type === "props") {
                return {
                    error: true,
                    msg: `Empty 'run:' block (immediately followed by 'props:')`,
                    line_nr: lines[run_set_at].line_nr,
                    offending_line: lines[run_set_at],
                }
            }
            if (!line_next) {
                return {
                    error: true,
                    msg: `Empty 'run:' block (last element in block)`,
                    line_nr: lines[run_set_at].line_nr,
                    offending_line: lines[run_set_at],
                }

            }
        }


        //now assign all lines to a block:
        let last
        for (let line of lines) {
            let t = line.tmp_type
            if (t === "text" || t === "run" || t === "props"
                || t === "if") {
                last = t
            }
            if (last) {
                line.tmp_type = last
            }
        }
        //now split lines into an object:
        let gather = {}
        for (let line of lines) {
            let t = line.tmp_type
            if (!t) t = "empty_lines_at_start"
            if (!gather[t]) gather[t] = []
            gather[t].push(line)

        }
        return gather

    
    }

    block_command.function = (xinfo, lines, rest, first_word, transpiled_key, name_of_command,
            first_line_whole) => {

        let first_line = lines.shift()

        let res = transpile_code_block(lines)

        if (res.error) return res

        let out = ""
        for (let line of res) {
            out += line + "\n"
        }


        let f = first_line.line
            .replace("#", "")
            .replace("function", "") //sic. not: "function "
            .trim()

        let p = f.split(" ").map( n => n.trim()).filter(n => n)



        if (!p.length && !block_definitions[name_of_command].nameless_allowed) {
            return {
                error: true,
                msg: `I found a function with no name.`,
                line_nr: first_line.line_nr,
                offending_line: first_line,
            }
        }

        let the_name = p[0]
        let arg_list = ""
        for (let i = 1; i < p.length; i++) {
            arg_list += p[i]
            if (i !== p.length-1) arg_list += ", "
        }

        if ( the_name && the_name.includes('"') ) {
            return {
                error: true,
                msg: `${name_of_comand} name should consist only of letters, numbers and underscores.`,
                line_nr: first_line.line_nr,
                offending_line: first_line,
            }
        }

        let le_line_nr = lines[0].line_nr
        let le_org_txt = first_line_whole.replaceAll("'", "") //is for error showing
            //only, so we can remove
            //the apostrophe's entirely

        out = `; ${NAMESPACE}.${transpiled_key}('${xinfo.file_path}', ${le_line_nr}, '${le_org_txt}',  "${the_name}", function (${arg_list}) {\n` + out + `});`

        let final_result = {
            text: out,
        }
        return final_result
    }




    block_command.simplex = (xinfo, lines, rest, first_word, transpiled_key,
        name_of_command, first_line_whole) => {
        //currently only the simplex block supports returning additional meta-data
        //in addition to the transpiled code that will be returned.
        //this is used for story meta-data and asset management, where we need
        //to know data BEFORE the JS is run (to inject it into the html file)
        let org = rest

        let act_command = block_definitions[name_of_command]

        let supplemental_data = false
        let custom_transpiled_text = ""

        if (act_command.add_to_meta_data) {
            supplemental_data = {}
            supplemental_data.meta_data_entry = {
                name_of_command: name_of_command,
                original_line: org,
                line_nr: lines[0].line_nr,
                file_path: xinfo.file_path,
            }
        }

        if (act_command.custom_transpilation) {
            custom_transpiled_text = act_command.custom_transpilation(rest)
            if (custom_transpiled_text.error) {
                return custom_transpiled_text
            }
        }
        let le_line_nr = lines[0].line_nr
        let le_org_txt = first_line_whole.replaceAll("'", "") //is for error
            //showing only, so we can remove
            //the apostrophes entirely
        
        rest = convert_backticks_to_html(rest)

        if (act_command.censor) {
            le_org_txt = censor(le_org_txt)
            rest = censor(rest)
        }

        //leave this on one line:!
        let out = `${NAMESPACE}.${transpiled_key}( '${xinfo.file_path}', ${le_line_nr}, '${le_org_txt}',  \`${rest}\`, \``
        let index = -1
        let out2 = ""
        lines.shift()
        for (let line of lines) {
            index ++
            out2 += "\n"
            out2 += line.line
        }
        out2 = convert_backticks_to_html(out2)

        if (lines.length > 0 && out2 &&
                out2.trim() !== "" && !act_command.multi_line_allowed) {
            let off = lines[0]
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].line.trim() !== "") {
                    off = lines[i]
                    break
                }
            }
            let an = capitalize( get_a_an(first_word) )
            return {
                error: true,
                msg: `${an} '#${first_word}' block can only have text on the starting line.
                Text on consecutive lines is not allowed.`,
                line_nr: off.line_nr,
                offending_line: off,
            }
        }

        if (act_command.censor) {
            out2 = censor(out2)
        }

        out += out2
        out += "`);\n"
        out = custom_transpiled_text + out

        let final_result = {
            text: out,
        }
        if (supplemental_data) final_result.data = supplemental_data
        return final_result
    }

    function capitalize(n) {
        return n.substr(0, 1).toUpperCase() + n.substr(1)
    }

    function get_a_an(s) {
        s = s.substr(0, 1).toLowerCase()
        if (s === "a" || s === "e" || s === "i" || s === "o" ||
            s === "u" || s === "y") return "an"
        return "a"
    }


    function censor(txt) {
        /* should return string with exact same amount of line breaks
        for keeping line equality. all other text can be removed.
        This can be used to purge comments from final output.*/
        let occ = ( txt.match(/\n/g) || [] ).length
        if (!occ) return ""
        return "\n".repeat(occ)
    }

    function process_props_block(block) {
        //multi-line strings are simply not allowed in prop blocks
        let first_line = block[0]
        block.shift() //remove first line ("props:")
        for (let line of block) {
            if (line.line.trim() === "") continue
            let parts = line.line.split(":")
            if (parts.length === 1) {
                return {
                    error: true,
                    msg: `A line without colon (:) is not allowed here.`,
                    line_nr: line.line_nr,
                    text: line.line, //just for extra debugging. probably not needed.
                        // we fetch line text anyway.
                }
            }
            if (parts[1].trim() === "") {
                let ms = `I found a line without a value. The line should be like this: 'key: value'`
                if (line.line.trim() === "props:") {
                    ms = `Is this a duplicate 'props:' block?`
                }
                return {
                    error: true,
                    msg: ms,
                    line_nr: line.line_nr,
                    text: line.line, //just for extra debugging. probably not needed.
                    // we fetch line text anyway.
                }
            }
            if ( !(line.line.trim().endsWith(",")) ){
                line.line = line.line + ","
            }
        }
        block.unshift(first_line) //reattach first line
        return block
    }




    block_command.props = (xinfo, lines, rest, first_word, transpiled_key, name_of_command,
        first_line_whole) => {
        // note: we pass the lines including
        // the very first line
        // (the "#thing" line or #props or whatever it is in a specific
        // instance) to
        // process_props_block,
        // because that is how the function process_props_block
        // expects it (it treats 
        // the first line as dummy value that is not
        // converted to a prop line):
        // also note that the optional props: sub-block
        // inside a quad block is NOT passed to this function,
        // but is passed to process_props_block directly.
        lines = process_props_block(lines)
        if (lines.error) {
            let err = lines
            return err
        }

        rest = convert_backticks_to_html(rest)
        let le_line_nr = lines[0].line_nr
        let le_org_txt = first_line_whole.replaceAll("'", "") //is for error
            //showing only, so we can remove
            //the apostrophes entirely

        let out = `${NAMESPACE}.${transpiled_key}( '${xinfo.file_path}', ${le_line_nr} , '${le_org_txt}',  \`${rest}\`, {\n`
        let index = -1
        //only now remove the first line (#thing):
        lines.shift()
        for (let line of lines) {
            index ++
            out += line.line
            if (index !== lines.length - 1) {
                out += "\n"
            }
        }
        out += "});\n"
        return {
            text: out,
            data: false, //currently, this block type has no support for returning metadata.
        }
    }

    block_command.quad = (xinfo, lines, rest, first_word, transpiled_key, name_of_command,
        first_line_whole) => {
        //split into sub-blocks:
        let gather = split_quad_into_blocks(lines, rest)

        if (gather.error) return gather

        let tot_items = 0
        for (let key of Object.keys(gather)) {
            let val = gather[key]
            tot_items += val.length
        }

        if (tot_items !== lines.length) {
            console.log(tot_items, lines.length, gather, lines)
            throw ` split_quad_into_blocks error. returned wrong amount of lines`
        }

        if (gather.error) return gather

        //process sub-blocks:

        if (gather.run && gather.run.length) {
            let lines2 = gather.run
            let first_line = lines2[0]
            lines2.shift() //remove first line (run:)
            lines2 = transpile_code_block(lines2)
            if (lines2.error) return lines2
            lines2.unshift(first_line) //reattach first line at beginning
            gather.run = lines2
            gather.run[0].line = "" //set 'run:' to empty text
        }

        if (gather.if && gather.if.length) {
            let if_line = gather.if[0]
            if (if_line.line.includes(":")) {
                return {
                    error: true,
                    msg: `The starting 'if'-line of a block should not contain a colon (:)`,
                    line_obj: gather.if_line, //is this line_obj prop even relevant?
                    offending_line: if_line,
                }
            }
            let cond = if_line.line
            cond = cond.trim().replace("if ", "")
            cond = process_if_condition(cond)
            gather.if[0].line = cond
        }
        
        if (gather.props && gather.props.length) {
            let lines = process_props_block(gather.props)
            if (lines.error) {
                let err = lines
                return err
            }
            gather.props = lines
            gather.props[0].line = "" //set 'props:' to empty text
        }

        if (gather.text) {
            for (let line of gather.text) {
                let txt = convert_backticks_to_html(line.line)
                txt = txt.trim() + " "
                line.line = txt
            }
        }

        //merge everything into an array again, just for checking length (debug only):
    /*
        let total = []
        console.log(gather)
        let props = ["head", "empty_lines_at_start",  "if",
            "text", "run", "props"]
        for (let prop of props) {
            if (!gather[prop]) continue
            for (let line of gather[prop]) {
                total.push(line)
            }
        }

        //and check array length:
        if (lines.length !== total.length) {
            console.log("threw lines:", lines, total)
            throw `quad block was parsed incorrectly (no line equality)`
        }
    */

        //now from gather convert into string:

        let le_line_nr = lines[0].line_nr

        let le_org_txt = first_line_whole.replaceAll("'", "") //is for error showing
            //only, so we can remove
            //the apostrophes entirely

        let instr = {
            //leave strings single-line:
            "head": {start: `${NAMESPACE}.${transpiled_key}( '${xinfo.file_path}', ${le_line_nr}, '${le_org_txt}', { head: \``, end: "`"},
            "empty_lines_at_start": {start: "", end: ""},
            "if": {start: "if: () => {return (", end: ")}"},
            "text": {start: "text: `", end: "`"},
            "run": {start: "run: () => {", end: "}"},
            "props": {start: "props: {", end: "}"},
        }

        let out = ""
        let section_names = ["head", "empty_lines_at_start",  "if",
            "text", "run", "props"]

        let sections = []
        for (let key of section_names) {
            let val = gather[key]
            if (val && val.length) sections.push(key)
        }

        let is = -1
        let last_section = false


        if (!gather.text && sections.length <=2) {
            return {
                error: true,
                msg: `Is this block empty?`,
                line_nr: gather.head[0].line_nr,
            }
        }

        for (let section_name of sections) {
            is++
            let section = gather[section_name]
            if (!section) continue
            out += instr[section_name].start
            if (is === sections.length - 1) last_section = true
            for (let line of section) {
                let content = line.line
                if (!line.line && line.line !== "") content = line
                //let debug_info = `line nr: ${line.line_nr}, type:  '${line.tmp_type}', `

                out += content
                //out += " // " + debug_info //only for testing. breaks transpiled code
                out += "\n"
            }
            out += instr[section_name].end
            if (!last_section && section_name!=="empty_lines_at_start") out += ", "
        }
        out += "});"

        return {
            text: out,
            data: false, //currently, this block type has no support for returning metadata.
        }
    } //block_command.quad



    function convert_backticks_to_html(n) {
            return n.replaceAll("`", "&#96;")
    }


    function process_if_condition(n) {
        return n
            .replaceAll("===", "=")
            .replaceAll("==", "=")
            .replace("=", "===")
            .replaceAll("!===", "!==")
            .replaceAll(">===", ">=")
            .replaceAll(" and ", " && ")
            .replaceAll(" or ", " || ")
    }

    function transpile_code_block(lines) {
        /*
        MaisonetteScript is just sugar-coated JavaScript.
            MaisonetteScript offers three standard control constructs
            (if, each and loop) that are easier on the eye than
            JS's control constructs (i.e. they use no braces.)
            Other than that it's pretty much exactly JS.
            This makes the code a bit more beginner-friendly,
            but keeps almost all the power of JS.
        - special keywords: if, else, end, each, loop
        - special keywors are only recognized at the beginning of a line
        */
        let sub_block_parent_offset = lines[0].line_nr
        let sub_block_parent_end = lines[lines.length-1].line_nr

        let convert = {
            if: (n) => {

                let parts = n.split(":")

                if (parts.length > 2) {
                    return {
                        error: true,
                        msg: `Too many colons (:)`,
                    }
                }

                let cond = parts[0]
                let conseq = parts[1]
                cond = process_if_condition(cond)
                    
                if (parts.length === 1) {
                    return `if (${cond}) {`
                } else {
                    if (conseq.trim() === "") {
                        return {
                            error: true,
                            msg: `The colon (:) made me think that this `
                                + `is a single-line if condition, but `
                                + `I found no content after the colon.`
                        }
                    }
                    return `if (${cond}) { ${conseq} }`
                }

            },
            loops: (n, keyword) => {
                let words = n.split(/\s/).map(n => n.trim()).filter(n => n)
                if (    words.length !== 3 ||
                        (words[1] !== "in" && words[1] !== "of")
                    ) {
                    return {
                        error: true,
                        msg: `${keyword} statement has to have this form: `
                            + `'${keyword} item in list'`,
                    }
                }
                let container = words[2]
                container = container.replace(":", "")
                let iter = words[0]
                if (keyword === "each") {
                    return `for (let ${iter} of ${container}) {`
                }
                return `for ( let ${iter} of Object.keys(${container}) ) {`
            },
            else: (n) => {
                return "} else {"
            },
            end: (n) => {
                return "}"
            },
        }

        let code = lines.map(n => n.line).join("\n")
        code = preprocess_strings_and_comments(code)
        if (code.error) return code
        lines = code.split("\n")

        let stack = []
        let line_nr = 0
        let error = false

        let nu_lines = []

        lines.some(
            line => {
                line_nr ++
                let [first, rest] = split_into_first_word_and_rest(line)
                if ( (first === "end" || first === "else") &&
                        rest !== "") {
                    error = `${first} ${rest}: I wasn't expecting text
                    after the ${first}. (An ${first} statement must be alone 
                    on its line.)`
                    return true
                } else if (first === "if" || first === "each" || first === "loop") {
                    //single-line if does not open new block:
                    if ( !( first === "if" && rest.includes(":") ) ) {
                        stack.push({line_nr: line_nr, if: true})
                    }
                } else if (first === "else") {
                    if (!stack[stack.length-1].if) {
                        error = `I found an 'else' statement, but there `
                            + `was no open 'if' block.`
                        return true
                    }
                } else if (first === "end") {
                    let removed = stack.shift()
                    if (!removed) {
                        error = `I found an 'end' statement, but `+
                            `there was no block to close.`
                        return true
                    }
                } else {
                    //line stays as it is
                    nu_lines.push(line)
                    return false
                }
                let instruction = first
                if (first === "each" || first === "loop") {
                    instruction = "loops"
                }

                let func = convert[instruction]
                let result = func(rest, first)
                if (result.error) {
                    error = result.msg
                    return true
                }
                nu_lines.push(result)
                return false
            }
        )
        if (stack.length) {
            error = `There seems to be an unclosed block. `
                + `Maybe you forgot an 'end' statement.`
            line_nr = "unknown"
        }

        if (nu_lines.length !== lines.length) {
            throw `developer bug: transpile_code_block. unequal line length`
        }

        if (error) {
            return {
                error: true,
                msg: error,
                line_nr: line_nr,
            }
        }

        let code2 = nu_lines.join("\n")
        code2 = restore_strings(code2)
        if (code2.error) return code2

        let res2 = check_for_syntax_errors(code2, sub_block_parent_offset,
            sub_block_parent_end)

        if (res2.error) {
            return {
                error_obj: res2.error_obj,
                js_syntax_error: true,
                wrong_syntax_code: res2.wrong_syntax_code,
                sub_block_parent_offset: res2.sub_block_parent_offset,
                sub_block_parent_end: res2.sub_block_parent_end,
                error: true,
                msg: `This block seems to contain wrong code: ${res2.error_obj}`,
                original_error_obj: res2.error_obj,
            }
        }

        lines = code2.split("\n")

        return lines
    }

    function check_for_syntax_errors(code_as_string,
            sub_block_parent_offset, sub_block_parent_end) {
        //this does not catch reference errors
        //like undeclared variables etc.,
        //only syntax errors
        try {
            new Function(code_as_string)
            return {
                error: false,
            }
        } catch(syntax_error) {
            return {
                sub_block_parent_end: sub_block_parent_end,
                sub_block_parent_offset: sub_block_parent_offset,
                error: true,
                wrong_syntax_code: code_as_string,
                error_obj: syntax_error, //this is not really useful,
                    //it's just a meh string, not a real error object.
                    //but later "run.js" performs some magic
                    //to actually fetch the line number of a
                    //syntax error (see there)
                js_syntax_error: true,
            }
        }
    }

    function split_into_first_word_and_rest(str) {
        //both parts will be trimmed
        let parts = str.trim().split(/\s/)
        let first_word = parts[0]
        parts.shift()
        let rest = parts.join(" ").trim()
        return [first_word, rest]
    }

    return {
        transpile_msn_to_js: transpile_msn_to_js,
        enable_cache: enable_cache,
        disable_cache: disable_cache,
        flush_cache: flush_cache,
        log_cache: log_cache,
    }

})()