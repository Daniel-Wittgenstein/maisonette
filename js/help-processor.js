
help_processor = (function() {



    function create_table_of_contents(jq_el) {
        let toc = []
        //get toc contents:
        $(".tab-box-help").first().find("h1, h2, h3, h4, h5, h6").each( function() {
            let el = $(this)
            toc.push({
                text: el.text(),
                id: el.prop("id"),
                level: Number(el[0].nodeName.substr(1)),
                jq_el: el,
            })
        })
        //now create html from them:
        let html = ""
        let levels = [0, 0, 0, 0, 0, 0]
        let current_level = 0
        for (let item of toc) {
            if (item.level < current_level) {
                for (let i = item.level+1; i < 6; i++) {
                    levels[i] = 0
                }
            }
            levels[item.level] += 1
            let ht = ""
            levels.forEach( (n) => {if (n) ht += n+"."} )
            current_level = item.level
            indent = "&nbsp;".repeat(item.level * 4)
            let txt = `${ht}&nbsp;${item.text}`
            html += `<p>${indent}<a href="#${item.id}">${txt}</a></p>`
            item.jq_el.text(txt.replace("&nbsp;", " "))
            item.jq_el.append(`&nbsp;<a href="#docs-main-title">&uparrow;</a>`)
        }
        html = `<h1 id="docs-main-title">Maisonette Documentation</h1>` + html
        return html
    }
    
    


    return {
        do: (jq_el) => {
            let h = $(jq_el).html()

            h = h.replace(/\<code\>[\s\S]*?\<\/code\>/g, (n) => {
                console.log(123, n)
                n = n
                    .replace("<code>", "")
                    .replaceAll("&amp;#x5f;", "_")
                    .replace("</code>", "")
                console.log(456, n)
                return `<div class="code-box">${n}</div>`
            })
            jq_el.html(h)

            let html = create_table_of_contents(jq_el)
            jq_el.prepend(html)


        }    
    }
        
})()





