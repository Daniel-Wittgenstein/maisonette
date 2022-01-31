

//type checks:
;['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'].forEach( 
    function(name) { 
        window['is' + name] = function(obj) {
              return toString.call(obj) == '[object ' + name + ']'
    }
});

//random:
function rnd(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor( Math.random() * (max - min + 1) ) + min
}