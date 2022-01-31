
Manual Build Instructions:

* Download the **development** version of nw.js for your target OS from https://nwjs.io

* Download "maisonette-master" from GitHub and unzip

* Rename the "maisonette-master" directory to "app"

* Copy the directory "app" into the folder "nwjs-sdk-v0.59.1-linux-x64" (or whatever it's called in your case) so that the location of "index.html" is "nwjs-sdk-v0.59.1-linux-x64/app/index.html"

* In the directory "nwjs-sdk-v0.59.1-linux-x64" create a file named "package.json" with contents:

{
    "main": "app/index.html",
    "name": "Maisonette",
    "window": {
        "position": "center",
        "icon": "app/icons/favicon.png",
        "width": 500,
        "height": 400,
        "min_width": 250,
        "min_height": 150
      }
}

* Run the executable "nw" or "nw.exe" file

* Done!

(Windows -> should work, but untested )

(Mac -> probably won't work, yet, because of directory structure. MacOS may have different ideas about which folder you have to put stuff in -> untested)

