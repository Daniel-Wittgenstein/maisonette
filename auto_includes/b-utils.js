function escape_html(n) {
    return n
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;") //ampersand first!
}