
function make_html_safe(n) {
    return n
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&#039;")
        .replace(/"/g, "&quot;")
}


function create_html_page(transpiled_js_files, collector, html_template_content,
    auto_includes_path, user_path, asset_path, transpiled_files_path) {

    // returns error object or string containing entire html page
    
    let repl = [
        {
            seq: "§§title§§",
            do: () => {return make_html_safe(title)},
        },
    
        {
            seq: "§§author§§",
            do: () => {return make_html_safe(author)},
        },
    
        {
            seq: "§§meta§§",
            do: () => {
                let txt = ""
                for (let entry of meta) {
                    let legal = true
                    if ( !entry.content.startsWith("<") ) {
                        legal = false
                    } else if ( !check_html(entry.content) ) {
                        legal = false
                    }
                    if (!legal) {
                        return {
                            error: true,
                            file_path: entry.file_path,
                            line_nr: entry.line_nr,
                            msg: `meta information <b>#meta ${escape_html(entry.content)}</b>: I was expecting a valid HTML meta tag.`,
                        }
                    }
                    txt += entry.content + "\n"
                }
                return txt
            },
        },
    
        {
            seq: "§§assets§§",
            do: () => {
                let txt = ""
                for (let asset of assets) {
                    let src
                    let id 
                    let line = asset.content
                    let html
                    let parts = line.split(" ").map(n => n.trim()).filter(n => n) 
                    let ext
                    let type = asset.type
                    if (type === "image") ext = "jpg"
                    if (type === "audio") ext = "mp3"
                    if (type === "video") ext = "mp4"
                    let info_long = "Not enough words."
                    if (parts.length >= 2) info_long = "Too many words."
                    if (parts.length !== 2) {
                        console.log(22222222, asset.file_path)
                        return {
                            error: true,
                            file_path: asset.file_path,
                            line_nr: asset.line_nr,
                            msg: `'${asset.content}': ${info_long}: I was expecting a line with this structure: #${type} castle castle.${ext}`,
                        }
                    }
                    id = parts[0]
                    src = parts[1]
                    if (type === "image") {
                        html = `<img id="msn-asset-img-${id}" class="maisonette-asset" src="${asset_path}/${src}">`
                    } else if(type === "audio") {
                        html = `<audio id="msn-asset-aud-${id}" class="maisonette-asset" src="${asset_path}/${src}">`            
                    } else if(type === "video") {
                        html = `<video id="msn-asset-vid-${id}" class="maisonette-asset" src="${asset_path}/${src}">`
                    }
                    txt += html
                }
                return txt
            },
        },  

        {
            seq: "§§js_scripts§§",
            do: () => {
                let txt = ""
                for (let item of collector.js) {
                    let out = ""
                    if (item.includes("./app/auto_includes/")) {
                        out = item.replace("./app/auto_includes/", auto_includes_path + "/")
                    } else {
                        let parts = item.split("/")
                        out = parts[parts.length - 1]
                        out = user_path + "/" + out
                    }
                    out = `<script src="${out}"></script>\n`
                    txt += out
                }
                return txt
            },
        },
    
        {
            seq: "§§css_scripts§§",
            do: () => {
                let txt = ""
                for (let item of collector.css) {
                    let out = ""
                    if (item.includes("./app/auto_includes/")) {
                        out = item.replace("./app/auto_includes/", auto_includes_path + "/")
                    } else {
                        let parts = item.split("/")
                        out = parts[parts.length - 1]
                        out = user_path + "/" + out
                    }
                    out = `<link href="${out}" rel="stylesheet">\n`
                    txt += out
                }
                return txt
            },
        },

        {
            seq: "§§transpiled_scripts§§",
            do: () => {
                let txt = ""
                for (let key of Object.keys(transpiled_js_files)) {
                    let parts = key.split("/")
                    let out = parts[parts.length - 1]
                    out = out.replace(".zzz", "")
                    out = `<script src="${transpiled_files_path}/${out}.js"></script>\n`
                    txt += out
                }    
                return txt
            
            },
        },
    ]    

    let meta = []
    let author = ""
    let title = ""
    let assets = []
    for (let key of Object.keys(transpiled_js_files)) {
        let value = transpiled_js_files[key]

        for (let item of value.data) {
            let entry = item.meta_data_entry
            let comm = entry.name_of_command
            let org = entry.original_line
            let line_nr = entry.line_nr
            if (comm === "author") {
                author = org
            } else if (comm === "title") {
                title = org
            } else if (comm === "meta") {
                meta.push({
                    type: comm,
                    content: org,
                    file_path: key,
                    line_nr: line_nr,
                })
            } else if (comm === "image") {
                assets.push({
                    type: comm,
                    content: org,
                    file_path: key,
                    line_nr: line_nr,
                })
            } else if (comm === "audio") {
                assets.push({
                    type: comm,
                    content: org,
                    file_path: key,
                    line_nr: line_nr,
                })
            } else if (comm === "video") {
                assets.push({
                    type: comm,
                    content: org,
                    file_path: key,
                    line_nr: line_nr,
                })
            }
        }   
    }

    let html = html_template_content
    let error = false
    for (let item of repl) {
        html = html.replace(item.seq, (n => {
            if (error) return ""
            let result = item.do(n)
            if (!result && result!=="") throw `Fatal error. ${item.seq} returned no result`
            if (result.error) {
                error = result
                return ""
            }
            return result
        }))
    }
    if (error) {
        return error
    }
    return html
}



function check_html(html) {
    let x = document.createElement("div") //Shouldn't leak memory.
        //node is created, not attached (hopefully)
    x.innerHTML = html
    let result = (x.innerHTML === html )
    return result
}