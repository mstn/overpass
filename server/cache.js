
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


var buildCacheQuery = function(query, bboxPolygon){
  var select = {};
  select.bbox = {
     '$geoIntersects':{
       '$geometry': bboxPolygon
     }
  };
  _.each( query.filter, function(value, key){
    select[ 'tags.' + key ] = value;
  });
  return select;
};

Cache.save = function(query){
  query.forEach( function(stm){
    bbox = swapLatLng( stm.bbox );
    GeoQueries.insert({
      createdAt: new Date,
      type: stm.query.type,
      bbox: Turf.bboxPolygon( bbox ).geometry,
      tags: stm.query.filter
    });
  });
}

Cache.getUncovered = function(query, bbox){

  var results = [];

  bbox = swapLatLng( bbox );

  query.forEach( function( stm ){
    var inner = Turf.bboxPolygon(bbox);
    var select = buildCacheQuery(stm, inner.geometry);
    var overlaps = GeoQueries.find( select ).fetch();
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
    if ( inner ){
      // return a bbox containing the uncovered polygon
      // overpass seems more efficient with bbox instead of more irregular polygons
      results.push( {
        query: stm,
        bbox: polygon2bbox(inner)
      });
    }
  });


  return results;
}
