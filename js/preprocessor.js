

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
  let x = code.replace(special_regex, (n) => {
      n = n.replace(special_combination, "")
          .replace(special_combination_end, "")
      let lst = n.split("X")
      let out = ""
      for (let item of lst) {
        if (item.trim() === "") {
          out += item
          continue
        }
        out += String.fromCharCode(Number(item))
      }
      if (!n) throw `restore_string failed`
      return out
  })
  return x
}


const special_regex = /\(\@\§[\s\S]*?\@\§\)/g

const special_combination = `(@§`

const special_combination_end = `@§)`



function preprocess_code(code) {
  /* Takes code as string. returns error or sanitized code version
  as string, where comments have been removed and multiline strings have been
  mangled so that they cannot clash with keywords.
  For example, if you have a multiline string where a line starts with "if",
  the string mangling will prevent the Maisonette transpiler from thinking
  that this is an if command. Uses esprima under the hood.
  */

      window.replace_part = replace_part //testing only

  let tokens

  if (code.includes(special_combination)) {
    return {
      error: true,
      msg: `Code cannot include the special character combination: '${special_combination}'.`
    }
  }

  if (code.includes(special_combination_end)) {
    return {
      error: true,
      msg: `Code cannot include the special character combination: '${special_combination_end}'.`
    }
  }

  try {
    tokens = esprima.tokenize(code, {range: true, comment: true})
  } catch(e) {
    let range = 25
    let start = e.index - range
    let len = range
    if (start < 0) {
      len = e.index
      start = 0
    }
    let snip = code.substr(start, len) +
      "<span style='color: red'>" + code.substr(e.index, 1) + "</span>" +
      code.substr(e.index + 1, range)
    return {
      error: true,
      line_nr: e.lineNumber,
      msg: `I found an invalid character or an invalid combination of characters
      inside a code block. This could be an illegal character like an '@'.
      It could also be legal characters like '+' or '-' but
      combined in a way that does not make sense to me, for example: '++++--'.
      \n
      The problem probably
      happened at the highlighted character or near it:\n ${snip}`,
      column: e.column,
    }
  }

  let func = (n) => special_combination + mangled(n) + special_combination_end

  let mapping = {
    RegularExpression: func,
    Template: func,
    String: func,
    LineComment: (n) => func("//" + n),
    BlockComment: (n) => func("/*" + n + "*/"),
  }

  //we have to iterate and replace backwards, so that string replacement
  //does not mess up string index:
  for (let i = tokens.length - 1; i > 0; i--) {
    let token = tokens[i]
    let action = mapping[token.type]
    if (!action) continue
    let res = action(token.value)
    let text = res
    code = replace_part(code, token.range[0], token.range[1], text)
  }

  //console.log(code)

  return code

  //#############

  function mangled(n) {
    return n.split("").map(char => {
      if (char === "") throw 33
      if (char.trim() === "") return "X" + char
      return "X" + char.charCodeAt(0)
    }).join("")
    
  }
  

  function replace_part(str, start, end, repl) {
    let a = str.substr(0, start)
    let b = str.substr(end)
    return a + repl + b
  }

}


/*
___legacy_preproc = function() {

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
      //
        //  takes code as string and returns code as string!

//          - does not support multiline comments
  //        - does not support regexes
      
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
              //strip out comments,
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


}
*/
