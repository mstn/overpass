
// store geo queries indexed by bbox
var GeoQueries = new Mongo.Collection('geo-queries');
// ensure spherical index on bbox
GeoQueries._ensureIndex({ bbox : "2dsphere" });

Cache = {};

var swapLatLng = function( bbox ){
  return [ bbox[1], bbox[0], bbox[3], bbox[2] ];
};

var polygon2bbox = function( feature ){
  var extent = Turf.extent(feature);
  return swapLatLng( extent );
};

// TODO dont fetch stale information
var buildCacheQuery = function(query, bbox){
  var select = {};
  var polygon = Turf.bboxPolygon(bbox);
  select.bbox = {
     '$geoIntersects':{
       '$geometry': polygon.geometry
     }
  };
  select.$or = [];
  query = ensureArray(query);
  query.forEach( function(stm){
    var term = {};
    _.each( stm.filter, function(value, key){
      term[ 'tags.' + key ] = value;
    });
    select.$or.push( term );
  });
  Overpass.log('cache query');
  Overpass.log( JSON.stringify(select) );
  return select;
};

Cache.save = function(query, bbox){

  bbox = swapLatLng( bbox );

  query = ensureArray(query);
  query.forEach( function(stm){
    GeoQueries.insert({
      createdAt: new Date,
      type: stm.type,
      bbox: Turf.bboxPolygon( bbox ).geometry,
      tags: stm.filter
    });
  });
}

Cache.getUncovered = function(query, bbox){

  bbox = swapLatLng( bbox );

  // TODO for each $or make different query
  var select = buildCacheQuery(query, bbox);
  var inner = Turf.bboxPolygon(bbox);
  var overlaps;

  Tracker.nonreactive(function(){
    overlaps = GeoQueries.find( select ).fetch();
  });

  if ( overlaps.length > 0){

    overlaps.forEach( function(overlap){
      if ( inner ){
        inner = Turf.erase(inner, {
          type:'Feature',
          geometry:overlap.bbox
        });
      }
    });
  }

  // return a bbox containing the uncovered polygon
  // overpass seems more efficient with bbox instead of more irregular polygons
  return inner && polygon2bbox(inner);
}
