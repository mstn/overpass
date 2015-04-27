var inside = Npm.require('point-in-polygon');

// store geo queries indexed by bbox
var GeoQueries = new Mongo.Collection('geo-queries');
// ensure spherical index on bbox
GeoQueries._ensureIndex({ bbox : "2dsphere" });

Cache = {};

Cache.save = function(query, bbox){
  query = ensureArray(query);
  query.forEach( function(stm){
    GeoQueries.insert({
      createdAt: new Date,
      type: stm.type,
      bbox: createPolygon( bbox ),
      tags: stm.filter
    });
  });
}

Cache.contains = function(query, bbox){
  var select = buildCacheQuery(query, bbox);
  var inner = createPolygon(bbox);
  // TODO stale information
  var overlaps;
  Tracker.nonreactive(function(){
    overlaps = GeoQueries.find( select ).fetch();
  });
  return _.some( overlaps, function(overlap){
    var outer = overlap.bbox.coordinates[0];
    // bbox is a convex polygon
    // hence is contained if its vertices are within the candiate outer polygon
    return _.every( inner.coordinates[0], function(point){
      return inside(point, outer);
    });
  });
}
