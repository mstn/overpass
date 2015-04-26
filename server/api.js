var Future = Npm.require('fibers/future');

var osmtogeojson = Npm.require('osmtogeojson');
var inside = Npm.require('point-in-polygon');

// store geo queries indexed by bbox
var GeoQueries = new Mongo.Collection('geo-queries');
// ensure spherical index on bbox
GeoQueries._ensureIndex({ bbox : "2dsphere" });

// store OSM data as GeoJSon objects
var GeoCache = new Mongo.Collection('geo-cache');
// ensure index for OSM id
GeoCache._ensureIndex({ id:1 });
// ensure spherical index on GeoJSon object
GeoCache._ensureIndex({ geometry : "2dsphere" });

// based on https://github.com/perliedman/query-overpass
var processResponse = function(future){
  return Meteor.bindEnvironment(
    function(error, response){
      var geojson;

      if (!error && response.statusCode === 200) {
        geojson = osmtogeojson(JSON.parse(response.content));
        future.return(geojson);
      } else if (error) {
        future.throw(error);
      } else if (response) {
        future.throw('Request failed: HTTP ' + response.statusCode);
      } else {
        future.throw('Unknown error');
      }
    });
};


var saveInCache = function(tags, bbox){
  GeoQueries.insert({
    createdAt: new Date,
    bbox: createPolygon( bbox ),
    tags: tags
  });
}

var isInCache = function(query, bbox){
  var select = buildCacheQuery(query, bbox);
  var inner = createPolygon(bbox);
  // TODO stale information
  var overlaps = GeoQueries.find( select ).fetch();
  return _.some( overlaps, function(overlap){
    var outer = overlap.bbox.coordinates[0];
    // bbox is a convex polygon
    // hence is contained if its vertices are within the candiate outer polygon
    return _.every( inner.coordinates[0], function(point){
      inside(point, outer);
    });
  });
}

Meteor.publish('overpass', function(query, bbox, options){
  check(bbox, [Number]);

  var self = this;

  if ( ! isInCache(query, bbox) ){

    saveInCache(query, bbox);

    // call overpass method in async mode
    Meteor.call('overpass', query, bbox, options, function(err, response){
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
    options = options || {};

    var future = new Future();
    var url = options.overpassUrl || 'http://overpass-api.de/api/interpreter';
    var response;

    options.content = buildOverpassQuery(query, bbox);

    HTTP.post(url, options, processResponse(future) );

    return future.wait();
  }
});
