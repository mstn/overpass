
var ensureArray = function(object){
  return [].concat(object);
}

buildMongoDbQuery = function(query, bbox){
  var select = {};
  select.geometry = {
     '$geoIntersects':{
       '$geometry': createPolygon( bbox )
     }
  };
  select.$or = [];
  query = ensureArray(query);
  query.forEach( function(stm){
    var term = {};
    term[ 'properties.type' ] = stm.type;
    _.each( stm.filter, function(value, key){
      term[ 'properties.tags.' + key ] = value;
    });
    select.$or.push( term );
  });
  Overpass.log( request );
  return select;
};

buildOverpassQuery = function(query, bbox){
  var request = "[out:json];";
  query = ensureArray(query);
  request += '(';
  query.forEach( function(stm){
    request += stm.type + '(';
    request += bbox.join(',');
    request +=")";
    _.each( stm.filter, function(value, key){
      request += '[' + key + '=' + value + ']';
    });
    request += ";";
  });
  request += ');';
  // TODO necessary to get nodes in ways, however can we optimize it?
  request += '(._;>;);';
  request += "out;";
  Overpass.log( request );
  return request;
};

buildCacheQuery = function(query, bbox){
  var select = {};
  select.bbox = {
     '$geoIntersects':{
       '$geometry': createPolygon( bbox )
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
  Overpass.log( request );
  return select;
};
