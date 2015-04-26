/**
 * create GeoJSon polygon from bbox in stardard order
 * see http://en.wikipedia.org/wiki/GeoJSON#Example
 */
createPolygon = function(bbox){
  // MongoDB geo always first lon and then lat
  return {
    'type':'Polygon',
    'coordinates':[[
        [ bbox[1], bbox[0] ],
        [ bbox[1], bbox[2] ],
        [ bbox[3], bbox[2] ],
        [ bbox[3], bbox[0] ],
        [ bbox[1], bbox[0] ]
    ]]
  };
};

ensureArray = function(object){
  return [].concat(object);
}
