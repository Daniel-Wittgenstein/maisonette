
//this should contain
//a string containing markdown!!
//everything else (HTML conversion, CSS) is taken
//care of by Maisonette. You can just
//change the markdown here to change the
//document



window.msn_help_contents = `


# First things first

## About this Documentation

This is the official Maisonette Documentation.

## License

Maisonette is open-source under an MIT license.

Visit the Maisonette project on GitHub for more details.

## An Introductory Warning

Maisonette is currently experimental technology and
there is no telling if it will ever be finished.

I added this disclaimer because I really don't feel like setting people's
expectations too high and disappointing them.

## Additional Disclaimer

English is not my mother tongue. I hope this documentation
is still understandable.

## Maisonette - what is it?

Generally speaking, there are two main types of
Interactive Fiction:
parser-based (where you type stuff) and
choice-based (where you click on links).

Maisonette chooses a third approach: it lets
you create games that are kind of a hybrid
between the two. The games are played by clicking
like choice games, but they
feature a world model like parser games.

The most similar tool to Maisonette right now
is GrueScript by Robin Johnson.

While GrueScript is totally effing awesome,
I still felt the urge to create Maisonette,
because I wanted a design system that met a couple
of criteria GrueScript didn't meet.

So here it goes:

1.) The Maisonette Creator does not run in the browser.
Instead it runs on your desktop computer. This has
several advantages:

- Handling of images and audio becomes
way easier.

- Customizing your game's look down
to the last detail becomes easier (you can just load
any amount of CSS files into your project).

- JavaScript interoperability becomes also way easier
(just load any amount of JS files).

- You can create Maisonette games with any editor
you want. (But Maisonette Creator has a built-in simple
editor to get you started.)

2.) Maisonette's language is very different from GrueScript.
It allows you to define rules in a simple way, but
it also keeps almost all of the power of JavaScript.
(You don't have to know any JavaScript to use Maisonette, though.)

And that's the end of the ad. The rest of the document
will explain how to use Maisonette to create your own game / piece
of Interactive Fiction.

# Installing and Launching Maisonette Creator

## Download and unzip

- Download the Maisonette Creator for your operating system. 

- Unzip the .zip file into a folder of your choice.

If you are reading this documentation, you might have
already completed these steps. Congratulations!

## Windows

(todo)

- Go to the sub-folder "app"

- Double-click "nw.exe"

- If Windows tells you that this app is not signed,
click trust or similar.

## Linux

(todo)
- Set permissions

- Run nw. On the terminal: "./nw"

## Mac

(todo)

# Getting started with Maisonette Creator

## Ways to use Maisonette

There are two ways to create Maisonette games.

The simple way is to just start typing inside
Maisonette Creator's built-in editor.

The second (more advanced) way is to use a
text editor of your choice.

## Method 1: Using Maisonette's built-in editor
When you start Maisonette Creator, you should
see an editor in the left part of the window.
You can write your story code here.
(The story is written in 
a language I call MaisonetteScript.)
Whenever you save, Maisonette Creator
builds a working game from your story code
and lets you test the game in the right-hand pane.

When you choose this method, you are limited
to one MaisonetteScript file per game. (But that's
not a big issue. If your game grows really big,
you can still switch to Method 2 later.)

## Method 2: Using an external editor
You can use a text editor that is suited
for writing code. (Word processors like Microsoft Word or
LibreOffice aren't text editors, but word processors. They are not suited
for this task.) Visual Studio Code and SublimeText are good editors,
but there are many more.

Inside the Maisonette Creator, create a new project.
Maisonette will create the project inside the folder:
"app/projects/your-project-name".

If you navigate to this folder, you will see
that a "story.zzz" file has already been created for you.

(MaisonetteScript files should always have the extension ".zzz"
The "story.zzz" file always counts as the main MaisonetteScript file,
and it must be present in each project.)

Leave Maisonette Creator open
and edit "story.zzz" in your favourite editor.

Save the file. Once you save, Maisonette Creator automatically
builds your game and shows it in the right-hand panel.

You can create more ".zzz" files in the same folder,
as well as JavaScript files (extension ".js") and css files
(extension ".css").

Then in your "story.zzz" file, you can do:

    #title My Story
    #author Sarah Brown
    #add chapter1.zzz
    #add chapter2.zzz
    #add a-javascript-file.js
    #add another-maisonette-script-file.zzz
    #add style.css
    #add my-fancy-boxes.css
    #add another-css-file.css

etc.

The files will be loaded in the
order you specify them
("story.zzz" will always be loaded as the first file).

An important note: The files cannot be inside nested sub-folders of
your Maisonette project folder, or Maisonette Creator won't
recognize them. DO NOT DO THIS:

    #add some-sub-folder/chapter1.zzz

# MaisonetteScript

## Introduction

MaisonetteScript is the language used to create Maisonette games.

This documentation will guide you through MaisonetteScript's features.


## Output and Visuals


### Output boxes

You can show text in different areas of the HTML page.

Maisonette calls these areas "boxes".

Use the command 'box' to define what output box should
currently be used. These are the allowed commands:

- box("main") ----- Outputs text to the main box (the center bottom box).

- box("main-top") ----- Outputs text to the center top box (above the main box).

- box("top") ----- Outputs text to the top box.

- box("bottom") ----- Outputs text to the bottom box.

- box("left") ----- Outputs text to the left box.

- box("right") ----- Outputs text to the right box.

Example:

    #function start
    box("left")
    say(\`I am on the left-hand side.\`)
    box("right")
    say(\`I am on the right-hand side.\`)
    say(\`So am I!\`)
    box("main")
    say(\`I'm in the middle.\`)

### Custom output areas (experimental)

This is an experimental feature. It can be changed or removed
at any time.

You can output text to custom HTML divs (or even to other elements.)

Example:

    box("left")
    say ("I am left.")

    world_manager.create_stream("my-stream", "my-custom-div")
	stream_manager.set_stream("my-stream")
	say ("I am inside a custom HTML element!")

Note that for custom areas you have
to use 'stream_manager.set_stream' instead of box.

### Page Styler

The simplest way to style your game is to
use Maisonette's "styler" module. 
The styler offers some simple options to customize the looks
of your game. If you need more advanced options, you can always drop
custom CSS or JS into your game;
but for starting out, you can just use the styler functions,
they should be fine for the most basic styling needs.

styler commands are called like so: styler.a_command( ... parameters ...)

What follows is a list of all styler commands.

#### styler.set
name: styler.set

what it does: sets a color or other style property

example: styler.set("main background color", "black")

parameters:
1. parameter: A valid option string (see below).

2. parameter: A valid color code string for colors, otherwise
a value like "4px" or similar. Colors can be HTML color names, or they
can be written in rgb, rgba or hex notation (just like CSS).
Note the American spelling (writing "colour" is not allowed).

These are all valid option strings:

- "main background color": Sets the main background color.

- "main foreground color": Sets the main foreground color.

- "panels border color": sets the color of the borders separating the text panels
from each other. If the text panels have a white background, a light grey tone is recommended for "panels border color", but you can use whatever you want.

- "top bar background color": The small bar on top: background color.

- "top bar foreground color": The small bar on top: foreground color.

- "bottom bar background color": Same for the bottom bar.

- "bottom bar foreground color": Same for the bottom bar.

- "image panel border color": Redundant. Use styler.set_image_panel, instead.

- "thing button background color": Thing button refers to what you may call a
link. This sets the background color.

- "thing button foreground color": And the foreground color.

- "thing button background color hover": This sets the hover (mouse-over) background color.

- "thing button foreground color hover": And the foreground color.

- "verb selector background color": Background color for the dropdown box from which you
select verbs.

- "verb selector foreground color": And foreground color.

- "verb selector hover background color": Same for hover/mouse-over.

- "verb selector hover foreground color": See above.

- "verb selector border color": Dropdown box border color.

- "verb selector border radius": Use a value like "4px" to make the edges
round, "0px" to make them normal (rectangular).

Note: Changing colors during the game should be okay, but hasn't been thoroughly
tested, yet.

***

#### styler.hide_image_panel

name: styler.hide_image_panel

example:  styler.hide_image_panel()

parameters: no

what it does: hides the image panel

Note: It should be okay to hide and (re)show the panel during the game.

***

#### styler.show_image_panel

name: styler.show_image_panel

example:  styler.show_image_panel()

parameters: no

what it does: shows the image panel

***

#### styler.set_image_panel

name: styler.set_image_panel

example: styler.set_image_panel("50%", "8px", "blue")

what it does: sets the style of the image panel

parameters:
1. radius: This sets rounded edges for the image. The unit should
be "px" or "rem" or "%":

    - "0px": no rounded edges

    - "8px": slightly rounded edges.

    - "50%": completely round: circle

2. border-size: string defining the width of the border around the image. The unit
should be "px" or "rem", for example: "4px". Use "0px" for no border at all.

3. border-color: string with HTML color, defines the color of the border
around the image.

***

#### styler.set_page_max_width

name: styler.set_page_max_width

example: styler.set_page_max_width(1600)

what it does: sets maximum width of the page

parameters:
1. A number.

Normally, your game fills the entire width of the HTML page.
On a big screen this might not look good, though; the columns
may be just too wide. This command sets a maximum width for the page
in pixels. If the player's screen is bigger than this maximum
value, the game won't fill the entire screen width, instead
you will see an empty space on the left and right side of the screen
(the empty space has the normal background color and shouldn't
be visually irritating.)

Note: Pass a number to this function, not a string.

DO: styler.set_page_max_width(1600)

DON'T: styler.set_page_max_width("1600px")

Note: The default page max width is 1280. You probably don't need to change it.

***

#### styler.set_columns

name: styler.set_columns

example: set_columns("26%", "48%", "26%")

what it does: This sets the width of the three columns from left to right.

parameters:
1. Left column width in percent
2. Center column width in percent
3. Right column width in percent

If you want to hide a column entirely, use "0%". The middle column is considered
the main column and cannot be hidden.

Note: The values must add up to exactly 100%.

Note: Do not use "px" or "rem" values. Only percent values are allowed here.


#### styler.set_center_rows
name: styler.set_center_rows

example: set_center_rows("40%", "60%", "1.8rem")

what it does: The center column has two panels, one at the top, one at the bottom.
This sets the size of these panels.

parameters:

1. Top center panel height in percent

2. Bottom center panel height in percent

3. Space between top and center panel in "rem": has to be between "0.0rem" and "2.0rem"

Note: Set the top center panel height to "0%" to hide it entirely. The bottom center panel
is considered the main center panel and cannot be hidden.

Note: The first two values have to add up to 100%.

Note: The space between the two panels is subtracted from the top panel,
so if you do: 'set_center_rows("50%", "50%", "1.5rem")', the two panels
won't be exactly equal in height, instead the top one will be a tiny bit smaller
to account for the space in between. (Its height will be: 50% of the center column height minus 1.5 rem, where "1rem" is the standard font size.)


#### styler.set_scrollbar_style

name: styler.set_scrollbar_style

example: styler.set_scrollbar_style("modern", "#ddd", "#888")

what it does: This tries to set the scrollbar style for your game.

Parameters:

1. Style name. Must be one of the following strings: "modern", "minimal"
or "minimal-rounded"

2. Trackbar color (background): HTML color

3. Track thumb color (foreground): HTML color

Important: this does not work 100%, because
the browser support for setting scrollbar style is simply
insufficient. The trackbar color and track thumb color
setting should work on Webkit browsers
(like Chrome and others) and also on Firefox. The style setting will only
work on Webkit browsers. Other browsers may ignore this setting completely.
If you want your game to just use the normal native scrollbars (different
on each OS), simply do not call this function.

Styles:

- "modern": a glossy-looking scrollbar

- "minimal": a minimalistic, rectangle-shaped scrollbar, might be good for a retro look

- "minimal-rounded": same as minimalistic, but with rounded corners


#### styler.set_root_font_size

name: styler.set_root_font_size

example: styler.set_root_font_size("0.5rem")

what it does: scales all text on the page up or down

parameters:
1. new size of the root font. Use "rem" units.

Note: The default root font size set by styler is "0.875rem", which should translate
to "14px" on most browsers. If, for example, if you
call 'styler.set_root_font_size("1.0rem")' the font size will go up to 16 pixels.

Note: This should only be called once at the beginning of the game
(in your 'start' function). Don't call this
during the game or it will interfere with accessibility settings.

Note: This is different than a browser's zoom feature, because it just scales
the text, not the entire page layout.

***







`

