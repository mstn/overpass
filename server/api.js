var Future = Npm.require('fibers/future');

var osmtogeojson = Npm.require('osmtogeojson');

// store OSM data as GeoJSon objects
var GeoCache = new Mongo.Collection('geo-cache');
// ensure index for OSM id
GeoCache._ensureIndex({ id:1 });
// ensure spherical index on GeoJSon object
GeoCache._ensureIndex({ geometry : "2dsphere" });

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

var sendRequest = function(query, bbox, options, callback){
  options = options || {};
  var url = options.overpassUrl || 'http://overpass-api.de/api/interpreter';
  options.content = buildOverpassQuery(query, bbox);
  HTTP.post(url, options, processResponse(callback) );
}


Meteor.publish('overpass', function(query, bbox, options){
  check(bbox, [Number]);

  var self = this;

  Overpass.log('Subscribe to overpass.');

  if ( ! Cache.contains(query, bbox) ){

    Overpass.log('No data in cache. Calling overpass.');

    Cache.save(query, bbox);

    // call overpass in async mode
    sendRequest(query, bbox, options, function(err, response){
      Overpass.log('fetched data from overpass');
      if (!err){
        // add features to cache
        response.features.forEach( function(feature){
          feature.updatedAt = new Date;
          GeoCache.upsert({id:feature.id}, feature);
        });
      } else {
        // return error to the client and stop subscription
        // TODO too restrictive? smarter way to handle error
        self.error(err);
      }
    });

  }

  Overpass.log('return cached results');
  // returns now
  return GeoCache.find( buildMongoDbQuery(query, bbox) );
});

/**
 *
 *@param query
 *@param bbox bounding box in standard order (southern lat, western lon, northern lat, eastern lon)
 *@param options
 *
 */
Meteor.methods({
  'overpass': function(query, bbox, options){
    check(bbox, [Number]);

    query = query || {};

    var future = new Future();

    sendRequest(query, bbox, options, function(err, response){
      if (err){
        future.throw(err)
      } else {
        future.return(response);
      }
    });

    return future.wait();
  }
});
