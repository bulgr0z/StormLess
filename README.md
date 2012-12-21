# StormLess

### Overview

StormLess helps you build your .less css files localy before pushing them with PhpStorm. This way you can avoid using the slow less.js compiler on your browser.

### Install

1. Get your nodejs running localy
2. Clone the repository where you like. Lessc 1.3.1 is bundled with it.
3. Open Phpstorm's Preferences > External Tools
4. Add a new tool, name it as you like
5. Set the program path to /StormLess/*your_os*/build.js
6. Set `$FilePath$ $FilePathRelativeToProjectRoot$` as parameters
7. Profit.

### Usage

Setup some shortcuts to execute the script, if you work with a remote webserver it should sync after each build.
