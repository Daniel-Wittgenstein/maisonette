

// handles game flow.
// loads before the io manager, so the io manager can use this

/* to do todo:
    - bug: relation names are not set to global???
        -> that's a feature, actually. we did not want that.


*/


world_manager = (function() {

    let DEFAULT_PHASE_NAME = "stop"

    let meta_data = {
        author: false,
        title: false,
    }
    
    let asset_data = {
        img: {}, //key is user-given id, value is id of dom-element
        aud: {},
        vid: {},
    }

    let relation_types = {}

    let things = {}

    let functions = {}

    let options = []

    let entities = {}

    let vars = {} //this just tracks all the names of all the global
        //variables. it does not track their values! This is used
        //for saving the game state and to check for duplicate
        //variable names. It's not used for variable assignment,
        //that is left to pure JS. There is also no proxy getter / setter
        //mechanism for variables, because that wouldn't work wih
        //global vars. (In JS you cannot make window a proxy object.)
        //If you want to react to variable changes,
        //the best bet is to either use functions or just lazily
        //create a setInterval that checks for variable changes.

    let option_id_count = 0

    function load_block(type, file_name, line_nr, org_text, args) {
        function attach_debug_info(obj, file_name, line_nr, org_text) {
            obj.file_name = file_name
            obj.line_nr = line_nr
            obj.org_text = org_text
        }

        //must return true for success or object of this
        //type: {error: true, msg: `Error message`} for error
        if (type === "meta_author") {
            if (meta_data.author) {
                return {
                    error: true,
                    msg: `The story author was set twice. I expect only 
                    one '#author' line per project.`
                }
            }
            meta_data.author = args[0]

        } else if (type === "meta_title") {
            if (meta_data.title) {
                return {
                    error: true,
                    msg: `The story title was set twice. I expect only 
                    one '#title' line per project.`
                }
            }
            meta_data.title = args[0]
                
        } else if (type === "meta_meta" ) {
            //not a lot to do, really.
            //if (log_this.data_loading) console.log(`setting additional meta data: `+ args[0]) 


        } else if (type === "img" || type === "aud" || type === "vid") {
            //transpiler checks for amount of words on line already, so there is actually no
            //need to do that
            let parts = args[0].split(" ").map(n => n.trim()).filter(n => n)
            let name = parts[0]
            asset_data[type][name] = `msn-asset-${type}-${name}`


        } else if (type === "t") {
            let id = args[0]
            let thing = args[1]
            if (things[id]) {
                return {
                    error: true,
                    msg: `ids must be unique. I found two things with the id: '${id}'`
                }
            }
            things[id] = thing
            thing.is_thing = true
            thing.id = id
            attach_debug_info(thing, file_name, line_nr, org_text)
            //things: id is auto-set from args[0]

        } else if (type === "r") {
            let rule = args[0]
            rule = preprocess_rule(rule)
            if (rule.error) return rule
            let res = validate_rule(rule)
            if (res.error) {
                return {
                    error: true,
                    msg: res.msg,
                }
            }
            register_rule(rule)
            attach_debug_info(rule, file_name, line_nr, org_text)
            //rules: id can be auto-set by creator via props block -> id:
            //or it can be just left falsy

        } else if (type === "v") {
            let parts = args[0].split("=")
            if (parts.length <= 1) {
                return {
                    error: true,
                    msg: `I expected an equals symbol. Example #var gold = 100`
                }
            }
            //if parts is greater than 2, we don't care, because it could be an equals symbol
            //inside a string, which is legal, of course.
            let word = parts[0].trim()

            if (vars[word]) {
                return {
                    error: true,
                    msg: `The global variable '${word}' was defined twice!`
                }
            }
            let v_obj = {
                id: word,
                is_var: true,
            }
            vars[word] = v_obj
            //variables: id is always name of variable itself
            attach_debug_info(v_obj, file_name, line_nr, org_text)

        } else if (type === "rel") {
            if (args[0].trim() !== "") {
                return {
                    error: true,
                    msg: `After '#relation' there may be no additional text on the same line.`
                }
            }
            let rel = args[1]
            if (!rel.name) {
                return {
                    error: true,
                    msg: `This relation type block is missing a name.`
                }     
            }
            if (relation_types[rel.name]) {
                return {
                    error: true,
                    msg: `A relation type with name '${rel.name}' exists already.`
                }                
            }
            relation_types[rel.name] = rel
            rel.id = rel.name 
            attach_debug_info(rel, file_name, line_nr, org_text)
           
            //for relations name and id are identical
            
        } else if (type === "o") {
            options.push(args[1])
            //no user.defined option id for now, not that important
            //instead we give an anonymous id
            option_id_count++
            let option_id = "$_option_" + option_id_count
            args[1].id = option_id
            attach_debug_info(args[1], file_name, line_nr, org_text)

        } else if( type === "f") {
            let name = args[0]
            if (functions[name]) {
                return {
                    error: true,
                    msg: `I found two functions with name '${name}'.`
                }
            }
            functions[name] = args[1]
            //functions: no id assignment

        } else if (type === "cm") {
            //ignore
        } else {
            return {
                error: true,
                msg: `${type}: I don't know this command. Unregistered command.`,
            }
        }

        return true
    }

/*
    let r = preprocess_rule({
        head: `#rule take bot (dick) # 222 #tag #multi #444`
    })
    console.log(r)
    console.log("--------------------------")
*/

    function preprocess_rule(rule) {
        //input: # rule take bottle (stop) #multi #mine
        //parses head string and saves components into object
        //if error, returns {error: true, msg: "error message"} object

        //now test this via ar.zzz

        //sanitize rule head:
        let head = rule.head
            .replace("#", "")
            .replace("rule ", "")
            .trim()
        
        //set phase name from (bracketed) word and strip (bracketed word):

        let count = 0
        let first = ""
        let return_err = false

        head = head.replace(/\(.*?\)/g, (n) => {
            if (return_err) return ""
            count ++
            if (count > 1) {
                return_err = {
                    error: true,
                    msg: `I expected only one (bracketed) word inside the rule head, but inside
                    '${escape_html(rule.head)}' I found
                    '${escape_html(first)}' and
                    '${escape_html(n)}'.`
                }
                return ""
            }
            first = n
            return ""
        })

        if (return_err) return return_err

        let phase = first.replace("(", "").replace(")", "").trim()
        let res = is_valid_phase_name(phase)
        if (!res) {
            return {
                error: true,
                msg: `'${escape_html(rule.head)}':
                '${escape_html(first)}' is not a valid phase name.`,
            }
        }

        if (!phase) phase = DEFAULT_PHASE_NAME

        rule.phase_name = phase

//        console.log("phase", phase)

        //process hash tags and remove them:
        let tags = []
        head = head + " "
        head = head.replace(/\#\S*\s/g, (n) => {
            tags.push(n)
            return " "
        })

//        console.log("tags", tags)

        //split the remaining string into words and store them: 
        let parts = head
            .trim()
            .split(" ")
            .map(n => n.trim())
            .filter(n => n)

        if (parts.length != 2) {
            return {
                error: true,
                msg: `I was expecting two words in the rule head, for example: 'take bottle',
                but instead I found: '${rule.head}'. This error may also be caused by a space
                after a hashtag. Write hashtags like #this, not like # this.`,
            }
        }

//        console.log("parts", parts)

        rule.required_verb = parts[0]
        rule.required_thing = parts[1]

        if (!rule.props) rule.props = {}

        for (let tag of tags) {
            rule.props[tag] = true
        }

        return rule
    }

    function is_valid_phase_name(n) {
        return true
    }


    function validate_rule(rule) {
        //returns {error: true, msg: "error message"} object
        //or {error: false}
        //preprocess_rule already does preprocessing and standard checks
        //this is for additional checks
        return {error: false}
    }

    let rules = {} //key: phase_name / value: array of rules (order is priority)
    let rule_specific_match_table = {
        by_verb: {},
        by_thing: {},
    } //key: "take" or "bottle" / value: [array of all specific rules
    // with head 'take bottle' ] This is important, because we want to check
    //whether specific rules for an action exist and whether they currently apply -> that
    //information is used for locking/unlocking options (among other information,
    //there are more criteria, including manual, user-defined ones)

    function register_rule(rule) {
        //add rule to the pool of all rules (by its phase):
        //console.log("register", rule)
        if (!rules[rule.phase_name]) {
            rules[rule.phase_name] = []
        }
        rules[rule.phase_name].push(rule)

        //set rule specificity:
        rule.specificity = "specific"

        if (rule.verb === "*") {
            rule.specificity = "generic"
        }

        if (rule.thing === "*") {
            if (rule.specificity === "generic") {
                rule.specificity = "ultra-generic"
            } else {
                rule.specificity = "generic"
            }
        }

        //if it's a specific rule, also add it to the
        //pool of specific rules (by its verb / noun signature):
        //broken. fix.
        if (rule.specificity === "specificity") {
            for ( let prop of ["verb", "noun"] ) {
                let acc = rule[prop]
                if (!rule_specific_match_table["by_" + prop][acc]) {
                    rule_specific_match_table["by_" + prop][acc] = []
                }
                rule_specific_match_table["by_" + prop][acc].push(rule)
            }
        }

        console.log(rule_specific_match_table)
    }


    function get_verbs_for_thing(thing) {
        //pass a thing. returns all verbs that can currently be used with the thing.
        //first we have to check specific rules where the thing appears:

    }
 

    let glob

    function set_global_hooks(global_main,
        props, options) {
        /* 1. parameter: global_main: the world_manager will
        auto-populate this object with handy
        variables like "noun" etc. and keep
        their values up to date. It will
        also attach function names, thing names
        etc. to this object. If you pass the global main object <window>
        to this function (which is recommended),
        the story creator can just type bottle to refer to the bottle etc.
        If you don't pass window but some other object,
        you can keep stuff non-global, but the story creator will
        have to type "story.bottle" or whatever. We like
        globals so we pass window from the io_manager. The non-global usage
        of this function is currently untested and may break. 
        2.: object with key: value where
        key is a valid global property the world_manager knows
        and value is how you want that property to be named in a global
        context. (so instead of noun = current_thing, we do
                GLOBAL[props.noun] = current_thing)
                where props.noun may be "noun" or "thing" or whatever
        3. additional options
        */
        glob = global_main
        glob_lookup = props
        let result = true
        if (options) {
            if (options.globalize_all_entities) {
                result = globalize_all_entities(glob, glob_lookup)
            }
        }

        return result
    }

    
    function globalize_all_entities(glob, glob_lookup) {
        //makes all thing, relation etc. ids global.
        //note for testing: if you type a thing's name
        //in the dev console that is opened via F12, it will still show up as undefined,
        //because globals were only set for the iframe window,
        //not for the nw.js app! (as it should be)
        //BUT if you open the dev tools via the dedicated
        //button in Maisonette, then you open the dev tools inside
        //the iframe context (because we told new.js to do so) and suddenly
        //you can type: bottle and it will show your bottle thing.
        //this is potentially useful for story creators, because
        //they can use the dev tools to view object properties at runtime.
        //not bad!
        //and it eve shows you in which line and which file the thing
        //was defined. yikes, that's nice!
        let lst

        lst = [].concat(
            Object.values(things),
            Object.values(vars),
            Object.values(relation_types),
            Object.values(options),
        ) //assets is not added. we don't make them global


        for (let sub of Object.values(rules)) {
            lst = lst.concat(
                Object.values(sub)
            )
        }

        for (let item of lst) {
            if (item.id) {
                if (glob[item.id]) {
                    let old =  glob[item.id]
                    let nu = item
                    return {
                        error: true,
                        msg: get_conflicting_ids_message(old, nu),
                        lineno: nu.line_nr,
                        filename: nu.file_name,
                    }
                }
                glob[item.id] = item
                entities[item.id] = item
            } //there are id-less rules, so lack of an id is not to be treated as an error
        }

        //and finally functions:

        for (let key of Object.keys(functions)) {
            let value = functions[key]
            if (glob[key]) {
                return {
                    error: true,
                    msg: `You have a function with id '${key}', but there is another
                        entity by the same id. (The text '#function ${key}' seems to be a problem.)`,
                }
            }
            glob[key] = value
            entities[key] = value

        }

        return true
    }

    function get_conflicting_ids_message(old, nu) {
        //console.log("conflict", old, nu)
        return `I found two entities with id '${nu.id}'. For example, you cannot name
            a thing 'castle' and name a global variable also 'castle'.`
    }
                        

    function log_load_info() {
        //window.onload fired, all game data has finished loading


        console.log(`%c M %c A %c I %c S %c O %c N %c E %c T %c T %c E %c WORLD MANAGER: `
            + `game data was successfully loaded. `
            + `Title: ${meta_data.title}`
            + `, Author: ${meta_data.author}`
        , `background-color: red; color: blue;`
        , `background-color: orange; color: black;`
        , `background-color: yellow; color: purple;`
        , `background-color: green; color: red;`
        , `background-color: blue; color: orange;`
        , `background-color: purple; color: yellow;`
        , `background-color: #F0F; color: white;`
        , `background-color: red; color: blue;`
        , `background-color: orange; color: purple;`
        , `background-color: yellow; color: black;`
        , `background-color: black; color: white;`
        )
        let rules_len = 0
        for (let key of Object.keys(rules)) {
            for (let item of rules[key]) rules_len++
        }
        let things_len = Object.keys(things).length
        console.log(
            "%c Loaded %c " + things_len + " things  %c " +
            rules_len + " rules"+
            " %c "+Object.keys(vars).length+" global variables "
            + `%c ${Object.keys(relation_types).length} relation types `
            + `%c ${Object.keys(functions).length} functions `
            + `%c ${Object.keys(options).length} options blocks `
            , "",
            
            "background: #88F; color: black",
            "background: #F88; color:black;",
            "background: #FF8; color:black;",
            "background: #292; color:white;",
            "background: #00B; color: white",
            "background: #B00; color: white",

        )
        console.log(
            "🔦 things:", things,
            "📄 rules:", rules,
            "➗ global variables:", vars,
            "💜 relation types:", relation_types,
            "🔵 functions:", functions,
            "🖱️ option blocks:", options,
            "🎨 assets:", asset_data
        )


    }


// allow_rule fehlt noch (außer das ist einfach rule mit (allow), aber auch dann
//brauchen wir extra checks, z.B. dass eigtl. nur if-condition gesetzt werden darf)
//erst überlegen



/*
            let target
            if (type === "r") target = "rules"
            if (type === "a") target = "allow_rules" //how does this work?
            if (type === "t") target = "things"
            if (type === "v") target = "vars"
            //if (type === "f") target = "things" func is broken still, needs to be transpiled
            //not as quad but as simplex or even... as new kind of (raw) block???
        things: {},
        rules: {},
        allow_rules: {},
        vars: {},
        else if(type === "js") {
                //what is this even ???
        } 
        
        if (rule.verb === "*" && rule.thing === "*") {
            return {
                error: true,
                msg: `A rule with two asterisks`,
            }


        } */
   
        return {
            load_block,
            log_load_info,
            set_global_hooks,
        }

})()
