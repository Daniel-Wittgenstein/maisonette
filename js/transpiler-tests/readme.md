

This test functionality is implemented inside test1.js.

This only tests the transpiler.

run tests with (from the console):
  window.my_test1.do()

You can add as many files as you want inside this folder.
They have to be names input1.txt / output1.txt etc.

The input file is always matched against the corresponding output file.
They have to match exactly for the test to pass.

You can put entire pages of code inside a text file
or just a few simple lines.

The input is the MaisonetteCode, the output the JavaScript code, of course.

The third test fails. That is a limitation of Esprima,plain and simple.