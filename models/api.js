var aerospike = require('aerospike'),
	status = aerospike.status;

/**
 * Construteur de la classe API
 * @param client Le client Aerospike déjà initié
 */
function API()
{
	this.client = aerospike.client({
	    hosts: [ { addr: 'localhost', port: 3000 } ]
	});
	this.ns = "test";
	this.set = "bench";

	this.connect();
}

/**
 * GETTER // SETTER
 */

API.prototype.getNs = function() {
	return this.ns;
}

API.prototype.setNS = function(ns) {
	this.ns = ns;
}

API.prototype.getSet = function() {
	return this.ns;
}

API.prototype.setSet = function(set) {
	this.set = set;
}

/**
 * FIN GETTER // SETTER
 */

/**
 * Fonction de connection
 */
API.prototype.connect = function() {
	this.client.connect(function(err, client) {
	    if (err.code == status.AEROSPIKE_OK) 
	    {
	        console.log("Aerospike Connection Success");
	    }
	    else
	    {
	    	console.log("error: ", err);
	    }
	});
}

/**
 * Fonction qui récupère un enregistrement particulier
 * @param  pk La clé primaire de l'enregistrement que l'on veut récupérer
 * @return    Tableau JSON contenant les informations de l'enregistrement
 */
API.prototype.get = function(pk) {

}

/**
 * Fonction de récupérations de l'ensemble des enregistrements
 * @return  Tableau JSON contenant l'ensemblre des enregistrements
 */
API.prototype.getAll = function() {

}

/**
 * Fonction qui ajoute un enregistrement
 * @param  params L'enregistrement que l'on veut ajouter
 * @return     		True si l'update c'est bien déroulé
 *                  L'erreur sinon
 */
API.prototype.add = function(params) {

	var key = aerospike.key(this.ns, this.set, params.uid);

	return this.client.put(key, params, function(err) {
	    // Check for err.code in the callback function.
	    // AEROSPIKE_OK signifies the success of Put operation.
	    if ( err.code != status.AEROSPIKE_OK ) {
	        console.log("error: %s", err.message);
	        return false;
	    }

	    return true;
	});
}

/**
 * Fonction de mise à jour d'un enregistrement
 * @param   pk 		La clé primaire de l'enregistrement à mettre à jour
 * @param   params 	Les données mis à jour
 * @return     		True si l'update c'est bien déroulé
 *                  L'erreur sinon
 */
API.prototype.update = function(pk, params) {

}

/**
 * Fonction de suppression d'un enregistrement
 * @param   pk La clé primaire de l'enregistrement à supprimer
 * @return     		True si l'update c'est bien déroulé
 *                  L'erreur sinon     
 */
API.prototype.delete = function(pk) {

}


module.exports = API;