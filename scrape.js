/**
 * Gestion des dépendances
 */
 var request 	= require('request'),
     cheerio 	= require('cheerio'),
     md5 		= require('MD5'),
     solr 	 	= require('solr-client'),
     Iconv       = require('iconv').Iconv,
     Buffer 		= require('buffer').Buffer

/**
 * Variables SOLR
 */
var HOST_SOLR = '127.0.0.1',
    PORT_SOLR = '8983',
    COL_SOLR = 'crawler';

/**
 * Object pour le crawl des URLs
 * @param  args Les arguments (URL de départ)
 */
function Scrape(args)
{
	//== Création du client pour la connexion a Solr
	this.clientSolr = solr.createClient(HOST_SOLR, PORT_SOLR, COL_SOLR);

	//== Compte le nombre d'url traitée
	this.compteur = 0;
	//== Compte le nombre d'url à traiter
	this.compteurRestant = 0;
	//== Limite d'url à traiter
	this.limitCrawl = 50;
	//== Limite de profondeur d'url
	this.limitProfondeur
	//== Récupération de l'url de départ dans les arguments
	this.urlBase = args[0],
	//== Regexp pour tester les urls du domaine en fonction de l'url de départ
	this.regUrl = new RegExp("^" + this.urlBase.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + ".*|\/.*");
	//== Tableau qui contiendra les urls à traiter
	this.urlTraite  = [{'url': this.urlBase, 'profondeur': 0}];
	//== L'interval pour traiter les urls tous les timeInterval temps
	this.interval;
	//== L'interval de temps
	this.timeInterval = 1000;
	
	//== Header du crawler envoyé
	this.header = {
	    'User-Agent': 'New Agent/0.0.1'
	};
	//== Options pour le request
	this.option = {
	    headers: this.header,
	    encoding: 'binary'
	};

	//== On lance
	this.init();
}

/**
 * Initialisation du crawler
 */
Scrape.prototype.init = function()
{
	//== On vide la collection
	this.clientSolr.deleteByQuery('*:*');

	var that = this;

	//== On démarre le crawl, 1 url toutes les secondes
	this.interval = setInterval(function() { that.crawl.call(that); }, this.timeInterval);
};

/**
 * Crawl une url
 */
Scrape.prototype.crawl = function()
{
	//== Si le tableau est vide on arrete
	if(this.urlTraite.length === 0) 
	{
		this.stop();
	}

	//== On récupère la première url de la liste
	var une_url = this.urlTraite.shift(),
		url = une_url.url,
		profondeur = une_url.profondeur,
		infos = {};

	console.log(une_url);

	//== Si l'on a atteint l'une des deux limites
	if(profondeur == this.limitProfondeur || ++this.compteur == this.limitCrawl)
	{
		this.stop();
	}	

	//== Si l'url n'appartient pas au domaine on ne la traite pas
	//   On l'insert en tant qu'URL externe
	if(this.regUrl.exec(url) === null)
	{
		infos.id = md5(url);
		infos.url = url;
		infos.date = new Date();
		infos.typeUrl = 'externe';

		//== Enregistrement de l'url
		this.addUrl(infos);

		return false;
	}

	//== Rajoute l'url dans les options du resquest
	this.option.url = url;

	var that = this;

	//== On accéde à la page
	request(this.option, function(error, response, html) {

		//== Si aucune erreur n'est retourné
		if(!error) 
		{
			//== Transforme le retour du request en Buffer
			html = new Buffer(html, 'binary');
			//== Si la page n'est pas en UTF-8 on la convertie
			if(response.headers['content-type'].indexOf('UTF-8') == -1)
			{
			    iconv = new Iconv('ISO-8859-1', 'UTF8');
				html = iconv.convert(html).toString();
			}

			//== On charge le html
			var $ = cheerio.load(html);

			//== Récupération des infos de la page
			infos.id = md5(url);
			infos.url = url;
			infos.date = new Date();
			infos.tempsDeChargement = 0;
			infos.httpCode = response.statusCode;
			infos.profondeur = profondeur;
			infos.noindex = ($('meta[name="robots"]').attr('content') == 'noindex');
			infos.title = $('title').text();
			infos.description = $('meta[name="description"]').attr('content');
			infos.h1 = [];
			$('h1').each(function() { infos.h1.push($(this).text().trim()); });
			infos.h2 = [];
			$('h2').each(function() { infos.h2.push($(this).text().trim()); });
			infos.h3 = [];
			$('h3').each(function() { infos.h3.push($(this).text().trim()); });
			infos.h4 = [];
			$('h4').each(function() { infos.h4.push($(this).text().trim()); });
			infos.h5 = [];
			$('h5').each(function() { infos.h6.push($(this).text().trim()); });
			infos.h6 = [];
			$('h6').each(function() { infos.h6.push($(this).text().trim()); });
			infos.nbUrl = $('a').length;

			//== On enregistre l'url
			that.addUrl(infos);

			//== On atteind une profondeur +1
			++profondeur;

			//== Pour chaque lien de la page
			$('a').each(function(i, elem) {

				//== On récupère l'URL
				var $a = $(this), aUrl = $a.attr('href');

				//== Si c'est la même url qu'en cours on ne l'ajoute pas
				//   Ou quelle est en noIndex
				//   Ou code de retour différent de 200 (OK), 301 (redirection)
				if(url == aUrl || infos.noindex || infos.httpCode != 200 || infos.httpCode != 301) return true;

				//== On ajoute l'url avec un profondeur + 1
				that.urlTraite.push({'url': aUrl, 'profondeur': profondeur});
			});
		}
		else
		{
			//== L'url n'est pas correcte on la passe.
			return false;
		}
	});
};

/**
 * Fonction qui ajoute une url
 * @param infos Tableau contenant les informations à ajouter
 */
Scrape.prototype.addUrl = function(infos)
{
	this.clientSolr.add(infos, function(err, obj) {
	   	if(err)
	   	{
	      	console.log(err);
	      	this.stop();
	   	}
	});
};

/**
 * Stop le process
 */
Scrape.prototype.stop = function()
{
	clearInterval(this.interval);
	this.clientSolr.commit();
};

//== Récupération des arguments
var myArgs = process.argv.slice(2);

//== Si l'on a pas passé d'arguments on renvoie une erreur
if(myArgs[0] === undefined)
{
	console.log('Url obligatoire');
	process.exit(0);
}

//== On créer notre crawler
new Scrape(myArgs);
