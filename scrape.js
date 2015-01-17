function rec_crawl_url()
{
	// console.log(_url_traite);

	//== Si le tableau est vide on arrete
	if(_url_traite.length === 0) 
	{
		clearInterval(_interval);
	}

	//== On récupère la première url de la liste
	var une_url = _url_traite.shift(),
		url = une_url.url,
		profondeur = une_url.profondeur,
		infos = {};

	console.log(une_url);

	//== Si l'on a traiter l'url on ne fait rien
	// if(_url_traite.indexOf(url) > -1) return false;

	if(profondeur == 1 || ++_compteur == 20)
	{
		clearInterval(_interval);
	}	

	//== Construction de la RegExp
	var reg = new RegExp("^" + _url_base.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + ".*|\/.*");
	

	//== Si l'url n'appartient pas au domaine on ne la traite pas
	//   On l'insert en tant qu'URL externe
	if(reg.exec(url) === null)
	{
		infos.id = md5(url);
		infos.url = url;
		infos.date = new Date();
		infos.typeUrl = 'externe';

		_client.add(infos,function(err,obj){
		   	if(err)
		   	{
		      	console.log(err);
		   	}
		   	else
		   	{
		      	_client.commit();
		   	}
		});

		return false;
	}

	// Set the headers
	var headers = {
	    'User-Agent':       'New Agent/0.0.1'
	}

	// Configure the request
	var options = {
	    url: url,
	    headers: headers,
	    encoding: 'binary'
	}

	//== Sinon on peut accéder à la page
	request(options, function(error, response, html) {

		//== Si aucune erreur n'est retourné
		//   et que la page renvoie un code 200
		if(!error) 
		{
			html = new Buffer(html, 'binary');
			if(response.headers['content-type'].indexOf('UTF-8') == -1)
			{
			    iconv = new Iconv('ISO-8859-1', 'UTF8');
				html = iconv.convert(html).toString();
			}

			//== On charge le html
			var $ = cheerio.load(html);

			//== Récupération du title
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

			_client.add(infos, function(err,obj){
			   	if(err)
			   	{
			      	console.log(err);
			   	}
			   	else
			   	{
			      	_client.commit();
			   	}
			});

			++profondeur;

			//== Pour chaque lien de la page
			$('a').each(function(i, elem) {

				//== On récupère l'URL
				var $a = $(this), aUrl = $a.attr('href');

				if(url == aUrl) return true;

				//== On ajoute l'url avec un profondeur + 1
				_url_traite.push({'url': aUrl, 'profondeur': profondeur});
			});
		}
		else
		{
			//== L'url n'est pas correcte on la passe.
			return false;
		}
	});
	
	return true;
}

var myArgs = process.argv.slice(2);

if(myArgs[0] === undefined)
{
	console.log('Url obligatoire');
	process.exit(0);
}

var request 	= require('request'),
    cheerio 	= require('cheerio'),
    md5 		= require('MD5'),
    solr 	 	= require('solr-client'),
    Iconv       = require('iconv').Iconv,
    Buffer 		= require('buffer').Buffer,

    _client = solr.createClient('127.0.0.1', '8983', 'crawler'),

	_compteur    = 0,
	_limit_crawl = 50,
	_url_base    = myArgs[0],
	_url_traite  = [{'url': _url_base, 'profondeur': 0}],
	_infos  = [];

_client.deleteByQuery('*:*', function(err,obj){
   if(err){
   	console.log(err);
   }else{
   	_client.commit();
   }
});

var _interval = setInterval(rec_crawl_url, 1000);
