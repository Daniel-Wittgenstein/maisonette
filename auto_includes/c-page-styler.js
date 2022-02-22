
/*
This provides some basic user-friendly JS-functions
that can be used to style your HTML page.

For more advanced stuff, of course, you can
always add your own CSS or your own JS-functions. 

This only tries to define some useful, lowest-common-denominator
style settings.

todo to do:
- mobile
- navbar -> settings window: override color and font size settings
*/


let styler = (() => {

    /*
    //testing only:
    $(window).on("load", start)

    function start() {
        let a, b, c

        let dolor = `Lorem Ipsum Dolor sic amet ... menentur `
        a = dolor.repeat(1)
        b = dolor.repeat(50)

        $(".box-top").html(a)
        $(".box-bottom").html(a)
        

        $(".center-top").html(b)
        $(".center-bottom").html(b)

        $(".box-left").html(b)
        $(".box-right-text-box").html(b)

    }
    */

    function set_root_font_size(v) {
        let root = document.querySelector(":root")
        root.style.fontSize = v
    }

    function set_css_var(v, prop) {
        v = v.replace("--", "")
        document.documentElement.style.setProperty('--' + v, prop);
    }


    function normalize_percent_string(a) {
        if (typeof a === 'string') {
            return Number(a.replace("%", "").trim())
        }
        return a
    }

    let scroll_bar_style_set = false

    let funcs = {
        set: (prop, c) => {
            let lookup = {
                //colors:
                "main background color": "main-bg",
                "main foreground color": "main-fg",
                "panels border color": "border-color",
                "image panel border color": "image-border-color",
                "top bar background color": "box-top-bg",
                "top bar foreground color": "box-top-fg",
                "bottom bar background color": "box-bottom-bg",
                "bottom bar foreground color": "box-bottom-fg",
                "thing button background color": "button-thing-bg",
                "thing button foreground color": "button-thing-fg",
                "thing button background color hover": "button-thing-bg-hover",
                "thing button foreground color hover": "button-thing-fg-hover",
                "verb selector background color": "verb-selector-bg",
                "verb selector foreground color": "verb-selector-fg",
                "verb selector hover background color": "verb-selector-hover-bg",
                "verb selector hover foreground color": "verb-selector-hover-fg",
                "verb selector border color": "verb-selector-border-col",

                //non-colors:
                "verb selector border radius": "verb-selector-border-radius",
        
            }
            if (!lookup[prop]) return {
                error: true,
                msg: `style: I don't know this option: '${prop}'`,
            }
            set_css_var(lookup[prop], c)
            return true
        },

        link_box(padding, radius) {
            //both values should be in rem or px
            set_css_var("button-thing-padding", padding)
            set_css_var("button-thing-radius", radius)             
        },




        show_image_panel: () => {
            set_css_var("image-panel-display", "flex")
        },

        hide_image_panel: () => {
            set_css_var("image-panel-display", "none")        
        },

        set_image_panel: (radius, border_size, border_color) => {
            set_css_var("image-border-size", border_size)
            set_css_var("image-radius", radius)
            funcs.set_color("image panel border color", border_color)
        },

        page_max_width: (px) => {
            set_css_var("page-max-width", px + "px")
        },

        columns: (l, m, r) => {
            l = normalize_percent_string(l)
            m = normalize_percent_string(m)
            r = normalize_percent_string(r)
            if (l + m + r !== 100) {
                return {
                    error: true,
                    msg: `set_columns: left + middle + right column must add up to 100%`,
                }
            }

            if (m == 0) {
                return {
                    error: true,
                    msg: `The center column must have a size bigger than 0.`,
                }
            }

            set_css_var("left-col-width", l + "fr")
            set_css_var("center-col-width", m + "fr")
            set_css_var("right-col-width", r + "fr")

            set_css_var("left-col-display", l ? "block" : "none")
            set_css_var("right-col-display", r ? "block" : "none")

        },

        center_rows: (t, b, gap = 1.0) => {
            //setting gap bigger than 2(rem) is not recommended
            if (gap < 0 || gap > 2.0) {
                return {
                    error: true,
                    msg: `set_center_rows: gap height should be between 0.0 and 2.0`,
                }
            }
            t = normalize_percent_string(t)
            b = normalize_percent_string(b)
            if (t + b !== 100) {
                return {
                    error: true,
                    msg: `set_center_rows: top + bottom row must add up to 100%`,
                }
            }

            if (b == 0) {
                return {
                    error: true,
                    msg: `The center bottom row must have a size bigger than 0.`,
                }
            }

            set_css_var("center-top-height", t + "%")
            set_css_var("center-bottom-height", b + "%")
            set_css_var("display-center-top", t ? "block" : "none")

            set_css_var("center-gap-height", gap + "rem")
        },


        scrollbar_style: (mode, scrollbar, thumb) => {
            if (!scrollbar || !thumb) {
                return {
                    error: true,
                    msg: "set_scrollbar_style: I need two colors."
                }
            }
            if (mode !== "modern" && mode !=="minimal"
                && mode !=="minimal-rounded") return {
                error: true,
                msg: `set_scrollbar_style: '${mode}' is not an allowed mode.`,
            }
            if (scroll_bar_style_set) {
                return {
                    error: true,
                    msg: `set_scrollbar_style: This can only be set once per game.`
                }
            }
            scroll_bar_style_set = true
            set_css_var("scroll-bar-fg", thumb)
            set_css_var("scroll-bar-bg", scrollbar)
            $('head').append('<link rel="stylesheet" type="text/css" href="css/scrollbars-' + mode + '.css">');
            

            //script loading hack, so we can a) have native
            //scrollbars by default and b) customize them
            //on demand
            $('head').append('<link rel="stylesheet" type="text/css" href="css/scrollbars.css">');

        },

        set_root_font_size: set_root_font_size,
    }

    return funcs

})()