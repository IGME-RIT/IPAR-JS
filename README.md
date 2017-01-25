# IPAR Web
IPAR - Web was developed using HTML/CSS, Javascript, and some PHP and is compatible with most modern browsers. This web version of IPAR has all the functionally of the original Windows Program, with some added features, but is now able to run on any operating system by simply using any modern browser to access the website with the program. Since the program is now on the web users no longer have to download/install any software to use it. The browser-based version builds on the orginal with added features like panning, zooming, and scaling to window size. With the use of PHP, images and resources (PDF Files) can be stored on the server so as to reduce the file size of cases for the user.


# Start
Click Demo to start the demo project that is complete.

# Save
At any time you can click the save button in the top left to download a save of the current progress. You can then load the file with the load case button in the main menu. The game also autosaves everytime a window closes which can be loaded using the continue button on the main menu. If you load a case or start the demo you will lose any autosave data.

# Basic Instructions
Click on nodes to open the question. Answer the question then close the windows to make the next question appear. Once all questions are answered go to the next board by click the next board's button on the button bar of buttons.

# Contributing
The IPAR source requires [Node], and [Grunt] to be built. [Apache], [SQLite] and [PHP] are required to test and deploy. To contribute to IPAR, you will need to correctly configure your development environment:

1. Install and configure [Apache], [SQLite], and [PHP]
2. Install [Node] and [npm]
3. Navigate to the project directory and install the IPAR project dependancies:
	
	`npm install`

To build and deploy the application locally with Grunt, run Grunt in the project root directory: `grunt`

The project will be built and deployed into the `ipar` directory.

Grunt tasks can be configured in `Gruntfile.js`

[Node]: https://nodejs.org/en/
[Grunt]: http://gruntjs.com/
[Apache]: https://www.apache.org/
[SQLite]: https://sqlite.org/
[PHP]: https://secure.php.net/