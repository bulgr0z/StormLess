#!/usr/local/bin/node

"use strict";

var _fs     = require('fs');
var _less   = require('less');
var _path   = require('path');

var builder = {

	// Dossier contenant la cfg, sera transformé en chemin absolu par findCfg()
	// De cette facon, on peut définir un dossier général commun à tous les projets phpStorm
	cfgPath     : '/tool/stormless/stormless.json',

	masterStyle : '__style.less', // Nom du fichier principal important les .less (ex: bootstrap.less)
	outputCss   : '__style.css', // Nom du fichier de sortie si Master trouvé
	argPath     : '',

	init : function() {
		this.timeStart = new Date().getTime();

		if (process.argv.length < 3) {
			console.log('Nothing to crunch.')
			return false;
		}

		this.filePath   = process.argv[2];

		this.currentFile = process.argv[2];
		this.fileName    = _path.basename(process.argv[2]);
		this.argPath     = _path.dirname(process.argv[1]);
		this.localPath   = _path.dirname(process.argv[2]);
		this.projectPath = _path.dirname(process.argv[3]);

		this.getStyleFile(this.localPath+'/'+this.masterStyle);
	},

	isLess : function(path) {
		var s = path.split('.');
		var ext = s.pop();
		return (ext == 'less') ? true : false;
	},

	/* Détermine le mode de compilation: Master > config > solo
	 *
	 * @param   path    str, chemin du dossier courant (contenant le fichier less)
	 */
	getStyleFile : function(path) {
		var that = this;
		console.log('Searching for '+this.masterStyle+' ...');

		_fs.readFile(path, 'utf8', function (err, data) {
			if (err) {
				console.log('No master style found, looking for '+that.cfgPath);

				that.findCfg(function(found) {

					if (found) {

						var config = JSON.parse(_fs.readFileSync(that.cfgPath, "UTF-8"));

						// Si notre fichier est mentionné dans la config
						if (config.hasOwnProperty(that.currentFile)) {

							var toBuild = config[that.currentFile];
							toBuild.forEach(function(file) {
								var output = that.replaceExt(file);
								_fs.readFile(file, 'utf8', function (err, data) {
									if (err) { return console.log(err); }
									that.buildLess(data, output, _path.dirname(file));
								});
							});
						// sinon jettison config, classic build
						} else {
							console.log("Not found in config, classic build.");
							found = false;
						}

					}

					if (!found) {
						// Changer output pour le nom du fichier courant, en changeant l'extention
						var output = that.replaceExt(that.filePath);

						_fs.readFile(that.filePath, 'utf8', function (err, data) {
							if (err) { return console.log(err); }
							that.buildLess(data, output, _path.dirname(that.filePath));
						});
					}
				});

			} else {
				console.log('Found master style ! building folder.');
				_fs.readFile(path, 'utf8', function (err, data) {
					if (err) { return console.log(err); }
					that.buildLess(data, that.localPath+'/'+that.outputCss, _path.dirname(path));
				});
			}
		});
	},


	/* Change l'extention d'un fichier a peu près safement
	 *
	 * @param   path    str, chemin du fichier less a transformer
	 */
	replaceExt : function(path) {
		var output = path.split('.');
			output[output.length-1] = 'css';
			output = output.join('.');

		return output;
	},


	/* Lance la compilation du less, et écriture du css
	 *
	 * @param   file        str, contenu du fichier less
	 * @param   output      str, chemin du fichier de sortie
	 * @param   parserPath  str, dossier du ficher less. Les imports du parser partent de là.
	 *
	 */
	buildLess : function(file, output, parserPath) {
		var that = this;
		console.log('Parsing...');
		this._parser = new(_less.Parser)({
			paths: [parserPath] // Specify search paths for @import directives
		});

		this._parser.parse(file, function (err, tree) {
			if (err) {
				console.log('Parse error');
				return console.error(err)
			}

			try {
				that.css = tree.toCSS({ compress: true, yuicompress:true })
			} catch(err) {
				console.log('Parse error');
				console.log(err);
			}
			that.timeEnd = new Date().getTime();
			var time = that.timeEnd - that.timeStart;
			console.log(output+' built in '+time+'ms.');

			_fs.writeFile(output, that.css, function (err) {
				if (err) throw err;
				_fs.chmod(output, '755', function(err) { // pas d'octal en strict mode
					if (err) throw console.log('Chmod error, do you own the file ?');
				})
			});

		});

	},


	/* Lance la recherche de la config en la limitant à la racine du projet
	 *
	 * @param   callback    func, callback de fin de recherche
	 *
	 */
	findCfg : function(callback) {

		// Dossier racine du projet phpStorm, on s'arretera là pour ne pas aller
		// chercher un config.json dans /dev/null ;)
		var endDir = this.projectPath.split(_path.sep)[0];
		this.folderMoonwalk(this.localPath, endDir, callback);

	},


	/* Scan récursif arrière de tous les dossiers pour config.json
	 *
	 * @param   dir     str, root du scan
	 * @param   done    func, callback
	 *
	 */
	folderMoonwalk : function(start, stop, done) {
		var that = this;

		_fs.exists(start+that.cfgPath, function(exists) {

			//console.log("scanning -- "+start+that.cfgPath);

			if (exists) {
				that.cfgPath = start+that.cfgPath;
				return done(true);
			} else
			// Si on a terminé de scanner le dernier dossier
			if (_path.basename(start) == stop || _path.basename(start) == "/" ) {
				return done(false);
			} else {
			// Sinon on continue
				that.folderMoonwalk(_path.dirname(start), stop, done);
			}

		});

	}


}

builder.init();