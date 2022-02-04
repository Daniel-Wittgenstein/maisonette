




function q() {
    let out = ""
    let nr = 10000
    for (let i = 0; i < nr; i++) {
        let id = "thing_"+ i + "_" + rnd(1, 100_000_000) + "_" + rnd(1, 100_000_000) 
        let name = "name " + id
        out +=`\n\n\n#thing id_${id}\n
        name: "${name}",\n
        `
        for (let k = 0; k < 10; k++) {
            let comma = one_of([",", "", " ", "  "])
            let prop = one_of(["age", "height", "width", "size", "range", "strength"]) + k
            let value = one_of([ rnd(1, 1000), "string" , "some text", 'some other text'  ])
            value += rnd(1, 100_000) + one_of(["*", "-", "#"]) + rnd(1, 100_000)

            out += `${prop}: "${value}"${comma}\n`
        }
    
    }
    nr = 10000
    for (let i = 0; i < nr; i++) {
        let tag = one_of(["a_tag", "another_tag", "like_me", "add_me_on_insta", "yetanothertag"])
        let phase = one_of(["stop", "stop", "before", "after"])
        let verb = one_of(["eat", "drink", "take", "use"])
        let thing = one_of(["dog", "cat", "crocodile", "whale"])
        let text = i + "------" + rnd(0, 100_000) + "..." + rnd(0, 100_000)
        out += `\n\n#rule ${verb} ${thing} (${phase}) #${tag}
        \n ${text}
        \nrun:
        \nlet x = ${rnd(1, 100_000)}
        \nconsole.log("Yes!" + x)
        `
    }  

    out += `
    
        #thing dog
        #thing cat
        #thing crocodile
        #thing whale

        #thing eat
            is_verb: yes
        #thing drink
            is_verb: yes
        #thing take
            is_verb: yes
        #thing use
            is_verb: yes
    
    
    `

    //set_clipboard(out)
}

q()