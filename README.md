# IPAR
IPAR (Imaging, Preserving, analyzing and reporting) is a narrative-based detective-themed adventure game. In the game, the player assumes the role of an investigator: collecting evidence, answering questions, and drawing conclusions as part of a simulated investigation. Players are guided through a series of scripted steps, allowing them to gain practical experience and draw their own conclusions by answering subject related questions.

# IPAR Editor
Developed alongside the game is an editor that can be used to generate new cases. Everything from subject matter to graphical elements to story can be set by the user to create an entertaining educational experience, and an reader that allows instructors to view the reports submitted by students for grading.

See [about](https://forensic-games.csec.rit.edu/about.php) for more information on IPAR.

# Contributing
The IPAR source requires [Node], [Sass], and [Grunt] to be built. [Apache], [SQLite] and [PHP] are required to test and deploy. To contribute to IPAR, you will need to correctly configure your development environment:

First, clone the repository locally:

`git clone git@github.com:IGME-RIT/IPAR-JS`

Navigate to the local repository, and install node dependencies:

`cd IPAR-JS/`

`npm install`

To set up the IPAR database, you'll need to run the setup script:

`php setup/createDatabase.php`

To build the application locally for the first time, run the `build-clean` task:

`grunt build-clean`

The project will be built and deployed into the `build` directory.

Static files (found in the `static` directory) are only copied to the `build` directory when the `build-clean` task is run. Otherwise, the default task will just build and copy source files. 

# Deploying

When deploying to the production site, first make a clean build: 

`grunt build-clean`

Then, copy the contents of the `build` directory to the `public_html` directory on the remote server.

[Node]: https://nodejs.org/en/
[Grunt]: http://gruntjs.com/
[Apache]: https://www.apache.org/
[SQLite]: https://sqlite.org/
[PHP]: https://secure.php.net/
[Sass]: http://sass-lang.com/
