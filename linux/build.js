_fs     = require('fs');
_less   = require('less');
_path   = require('path');

/*

 http://stackoverflow.com/questions/4618257/node-js-express-js-how-to-render-less-css

var _user = require('./user.js'),
	_room = require('./room.js');
*/

// lessc source [destination] [--version] [--compress] [--yui-compress] [--verbose] [--silent] [--no-color] [--include-path=path1:path2]
/* args  [
			 node,
			 /home/paul/Dropbox/dev/NodeBuild/linux/build.js,
			 foo, // arg1
			 bar // arg2
        ]
*/
/*
process.argv.forEach(function (val, index, array) {
	console.log(index + ': ' + val);
	builder.init();
});*/


/* argv[1] : project path
 * argv[2] ; local path
 */
var builder = {

	masterStyle : '__style.less',
	pattern     : /\.\.\//g,
	argPath     : '',
	parserPath  : '',

	init : function() {
		this.timeStart = new Date().getTime();

		if (process.argv.length < 4) {
			console.log('Nothing to crunch.')
			return false;
		}

		this.filePath   = process.argv[2];

		this.argPath    = _path.dirname(process.argv[1]);
		this.localPath  = _path.dirname(process.argv[2]);
		this.parentPath = _path.dirname(this.localPath);

		this.hasMasterStyle(this.filePath)
	},

	// trouve un __style.less dans le dossier
	hasMasterStyle : function(path) {
		this.getStyleFile(this.localPath+'/'+this.masterStyle);
	},

	isLess : function(path) {
		var s = path.split('.');
		var ext = s.pop();
		return (ext == 'less') ? true : false;
	},

	getStyleFile : function(path) {
		var that = this;
		console.log('Searching for '+this.masterStyle+' ...');

		_fs.readFile(path, 'utf8', function (err, data) {
			if (err) {
				console.log('No master style found, building single file.')
				that.parserPath = that.localPath;
				that.getCssFile(that.filePath);
			} else {
				console.log('Found master style ! building folder.')
				that.parserPath = that.localPath;
				that.getCssFile(path);
			}
		});
	},

	fixImport : function(data) {

		console.log('Fixing @import paths...');

		//data = data.replace(this.pattern, this.parentPath+'/');
		this.buildLess(data);
	},

	getCssFile : function(path) {
		var that = this;
		console.log('Reading file...');

		_fs.readFile(path, 'utf8', function (err, data) {
			if (err) {
				return console.log(err);
			}
			that.fixImport(data);
		});
	},

	buildLess : function(file) {
		var that = this;
		console.log('Parsing...');

		this._parser = new(_less.Parser)({
			paths: [that.parserPath], // Specify search paths for @import directives
		});

		this._parser.parse(file, function (err, tree) {
			if (err) {
				console.log('Parse error');
				return console.error(err)
			}

			try {
				that.css = tree.toCSS({ compress: true })
			} catch(err) {
				console.log('Parse error')
				console.log(err)
			}
			that.timeEnd = new Date().getTime();
			var time = that.timeEnd - that.timeStart;
			console.log('All Done.');
			console.log('Built in '+time+'ms.');

		});

	}


}

builder.init();