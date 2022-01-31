/* Example definition of a simple mode that understands a subset of
 * JavaScript:
 */

CodeMirror.defineSimpleMode("simplemode", {
    // The start state contains the rules that are initially used
    start: [
    
        {regex: /\#(thing|rule|var|option|function|relation)/, token: "block_command"},

        {regex: /\#(comment)/, token: "block_comment"},

        {regex: /\#(video|image|audio)/, token: "asset"},

        {regex: /\#(title|author|meta)/, token: "meta"},

        {regex: /\#.*/, token: "illegal"},

        {regex: /run:/, token: "sub_block_command"},

        {regex: /props:/, token: "sub_block_command"},
 
    ]
  });
  