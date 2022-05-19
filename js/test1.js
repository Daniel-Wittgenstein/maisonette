
//test with: window.my_test1.do()

const { map } = require("async")

window.my_test1 = (() => {

  function perform_test(input, expected, index) {
    let failed = false

    let res = maisonette_transpiler.transpile_msn_to_js(input)
    if (!res || expected !== res.js) failed = true
    console.log("###########################################")
    console.log("%c ❤❤❤ TEST #" + index + " ❤❤❤", "background: #A0A;")
    console.log("input:")
    console.log("<<<" + input + ">>>")
    console.log("expected output:")
    console.log("<<<" + expected + ">>>")
    console.log("actual output:")
    console.log("<<<" + res.js + ">>>")

    if (failed) {
      console.log("%c FAIL", "background: red; color: white; font-size: 48px;")
      show_diff(expected, res.js)
      throw `TEST FAILED`
    }
    if (!failed) console.log("%c match. test succeeded", "background: green; color: white;")
  }

  return {
    do: () => {
      //basically read a bunch of text files and test against them


      let inputs = []

      let outputs = []

      let dir = "./app/js/transpiler-tests"


      for (let i = 1; i < 1000; i ++) {
        try {
          res = fs.readFileSync(
              dir + "/input" + i + ".txt",
              'utf-8'
          )

          res2 = fs.readFileSync(
            dir + "/output" + i + ".txt",
            'utf-8'
          )
        } catch(e) {
          break
        }
        inputs.push(res)
        outputs.push(res2)
      }

      console.log(87, inputs, outputs)

      for (let i = 0; i < inputs.length; i++) {
        let input = inputs[i]
        let output = outputs[i]
        perform_test(input, output, i + 1)
      }
    }
  }


  function show_diff(expected, actual) {
    let linese = expected.split("\n")
    let linesa = actual.split("\n")
    let i = -1
    for (let linee of linese) {
      i++
      let linea = linesa[i]
      let j = -1
      let st1 = `background: #0A0; color: white;`
      let st2 = st1
      if (linee !== linea) {
        st2 = `background: #D00; color: white;`
      }
      console.log("%c" + linee, st1)
      console.log("%c" + linea, st2)
    }
  }


})()


