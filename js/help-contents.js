
//this should contain
//a string containing markdown!!
//everything else (HTml conversion, CSS) is taken
//care of by Maisonette. You can just
//change the markdown here to change the
//documenta


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







`