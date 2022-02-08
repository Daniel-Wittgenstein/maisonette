



Duplex is Maisonette's standard HTML template.

If you want to change output containers, for example
if you want to output the room description into another panel,
you should do this via Maisonette. Maisonette handles
output to the HTML page.

Duplex just allows you to control the look of your website.
Duplex offers some simple options to customize the looks
of your game. If you need more options, you can always drop
custom CSS or JS into your game.

But for starting out, you can just use the Duplex functions;
they should be fine for the most basic styling needs.

Duplex commands are called like so:

duplex.a_command(<parameters>)

Here's a list of all duplex commands:

name: duplex.set_color
what it does: sets a color
example: duplex.set_color("main background color", "black")

parameters:
1. parameter: A valid color option string.
2. parameter: A valic color code string. Colors can be HTML color names,
or they can be written in rgb or hex notation.

These are all valid color option strings:
    "main background color": Sets the main background color.
    "main foreground color": Sets the main foreground color.
    "panels border color": sets the color of the borders separating the text panels
        from each other. If the text panels have a white background, a light grey tone is recommended for "panels border color", but you can use whatever you want.
    "top bar background color": The small bar on top: background color.
    "top bar foreground color": The small bar on top: foreground color.
    "bottom bar background color": Same for the bottom bar.
    "bottom bar foreground color": Same for the bottom bar.
    "image panel border color": Redundant. Use duplex.set_image_panel, instead.

notes: It's okay to change colors during the game.

***

name: duplex.hide_image_panel
example:  duplex.hide_image_panel()
parameters: no
what it does: hides the image panel
notes: It's okay to hide and (re)show the panel during the game.

***


name: duplex.show_image_panel
example:  duplex.show_image_panel()
parameters: no
what it does: shows the image panel

***

name: duplex.set_image_panel
example: duplex.set_image_panel("50%", "8px", "blue")
what it does: sets the style of the image panel
parameters:
1. radius: This sets rounded edges for the image.
    The unit should be "px" or "rem" or "%".
    "0px": no rounded edges
    "8px": slightly rounded edges.
    "50%": completely round: circle
2. border-size: string defining the width of the border around the image:
    The unit should be "px" or "rem", for example: "4px".
    Use "0px" for no border at all.
3. border-color: string with HTML color, defines the color of the border
    wround the image.

***

name: duplex.set_page_max_width
example: duplex.set_page_max_width(1600)
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
DO: duplex.set_page_max_width(1600)
DON'T: duplex.set_page_max_width("1600px")

Note: The default page max width is 1280. You probably don't need to change it.

***

name: duplex.set_columns
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

***

name: duplex.set_center_rows
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

***

name: duplex.set_scrollbar_style
example: duplex.set_scrollbar_style("modern", "#ddd", "#888")
what it does: This tries to set the scrollbar style for your game.

Parameters:
1. Style name. Must be one of the following strings:
    "modern", "minimal" or "minimal-rounded"
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
"modern": a glossy-looking scrollbar
"minimal": a minimalistic, rectangle-shaped scrollbar, might be good for a retro look
"minimal-rounded": same as minimalistic, but with rounded corners

***

