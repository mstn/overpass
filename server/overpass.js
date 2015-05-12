var osmtogeojson = Npm.require('osmtogeojson');

// store OSM data as GeoJSon objects
var GeoCache = new Mongo.Collection('geo-cache');
// ensure index for OSM id
GeoCache._ensureIndex({ id:1 });
// ensure spherical index on GeoJSon object
GeoCache._ensureIndex({ geometry : "2dsphere" });

Overpass = Overpass || {};


var buildMongoDbQuery = function(query, bbox){
  var select = {};
  select.geometry = {
     '$geoIntersects':{
       '$geometry': createPolygon( bbox )
     }
  };
  select.$or = [];
  query.forEach( function(stm){
    var term = {};
    term[ 'properties.type' ] = stm.type;
    _.each( stm.filter, function(value, key){
      term[ 'properties.tags.' + key ] = value;
    });
    select.$or.push( term );
  });
  Overpass.log('mongo query');
  Overpass.log( select );
  return select;
};

var buildOverpassQuery = function(query){
  var request = "[out:json];";
  request += '(';
  query.forEach( function(stm){
    request += stm.query.type + '(';
    request += stm.bbox.join(',');
    request +=")";
    _.each( stm.query.filter, function(value, key){
      request += '[' + key + '=' + value + ']';
    });
    request += ";";
  });
  request += ');';
  // TODO necessary to get nodes in ways, however can we optimize it?
  request += '(._;>;);';
  request += "out;";
  Overpass.log('overpass query');
  Overpass.log( request );
  return request;
};

// based on https://github.com/perliedman/query-overpass
var processResponse = function(callback){
  return Meteor.bindEnvironment(
    function(error, response){
      var geojson;

      if (!error && response.statusCode === 200) {
        geojson = osmtogeojson(JSON.parse(response.content));
        callback(undefined, geojson);
      } else if (error) {
        callback(error);
      } else if (response) {
        callback('Request failed: HTTP ' + response.statusCode);
      } else {
        callback('Unknown error');
      }
    });
};

Overpass.sendRequest = function(query, options, callback){
  options = options || {};
  var url = options.overpassUrl || 'http://overpass-api.de/api/interpreter';
  options.content = buildOverpassQuery(query);
  HTTP.post(url, options, processResponse(callback) );
};

Overpass.find = function(query, bbox){
  return GeoCache.find( buildMongoDbQuery(query, bbox) );
};

Overpass.findById = function(osmId){
  return GeoCache.find({
    id:osmId
  });
};

Overpass.update = function(feature){
  feature.updatedAt = new Date;
  GeoCache.upsert({id:feature.id}, feature);
};
