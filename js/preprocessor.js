

/* 

    MAISONETTESCRIPT CODE BLOCK PREPROCESSOR

*/


/*
Example:

code = `  xbc = "heidiho" `

code = preprocess_strings_and_comments(code)
console.log(code)

code = restore_strings(code)
console.log(code)
*/

function restore_strings(code) {
    return code.replace(/\§\(.*?\)/g, (n) => {
        n = n.replace("§(", "")
            .replace(")", "")
        n = String.fromCharCode(Number(n))
        if (!n) throw `restore_string failed`
        return n
    })
}



function preprocess_strings_and_comments(code) {
    /*
        takes code as string and returns code as string!

        - does not support multiline comments
        - does not support regexes
    */
    let out = ""
    let state = "standard"
    let string_type = ""
    let char_prev = false
    for (let char of code) {
        //manage states:
        if (char === "`"
            || char === "'"
            || char === '"') {
            if (state === "standard") {
                state = "inside_string"
                string_type = char
            } else if (
                    state === "inside_string"
                    && string_type === char
                    && char_prev !== "\\"
                    ) {
                state = "standard"
            }
        } else if (char === "\\") {
            backslash_prev = true
        } else if (char === "/"
                && char_prev === "/"
            ) {
            state = "inside_comment"
            out = out.substr(0, out.length - 1) //remove last char
        } else if (char === "\n"
                && state === "inside_comment") {
            state = "standard"
        }
        char_prev = char

        let is_new_line = false
        if (char === "\n") is_new_line = true

        //output:
        if (state === "standard") {
            //leave normal code as it is:
            out += char
        } else if (state === "inside_comment") {
            //strip out comments
            //nothing to do here
        } else if (state === "inside_string") {
            //convert strings, but leave line break as it is:
            if (is_new_line) {
                out += char
            } else {
                let char_code = char.charCodeAt(0)
                out += "§(" + char_code + ")"
            }
        }

    }

    if (state === "inside_string") {
        return {
            error: true,
            msg: `I found an unclosed string!`
        }
    }

    return out
}



