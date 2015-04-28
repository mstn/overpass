var Future = Npm.require('fibers/future');


Meteor.publish('overpass', function(query, bbox, options){
  check(bbox, [Number]);

  var self = this;
  var uncovered;

  Overpass.log('Peep up to cache to see if previous results can be used.');

  uncovered = Cache.getUncovered(query, bbox);

  if ( uncovered ){

    Overpass.log('No full data in cache. Calling overpass.');

    // TODO also query could be uncovered
    // call overpass in async mode
    Overpass.sendRequest(query, uncovered, options, function(err, response){
      if (err){
        Overpass.error(err);
        // return error to the client and stop subscription
        // TODO too restrictive? smarter way to handle error
        self.error(err);
      } else {
        Overpass.log('Overpass response: ' + response.features.length + ' items');
        Cache.save(query, uncovered);
        // add features to cache
        response.features.forEach( Overpass.update );
      }
    });

  }

  Overpass.log('Return cached results.');
  // returns now
  return Overpass.find(query, bbox);
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

    Overpass.sendRequest(query, bbox, options, function(err, response){
      if (err){
        future.throw(err)
      } else {
        future.return(response);
      }
    });

    return future.wait();
  }
});
