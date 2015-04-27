var Future = Npm.require('fibers/future');


Meteor.publish('overpass', function(query, bbox, options){
  check(bbox, [Number]);

  var self = this;

  Overpass.log('Subscribe to overpass.');

  if ( ! Cache.contains(query, bbox) ){

    Overpass.log('No data in cache. Calling overpass.');

    Cache.save(query, bbox);

    // call overpass in async mode
    Overpass.sendRequest(query, bbox, options, function(err, response){
      Overpass.log('fetched data from overpass');
      if (!err){
        // add features to cache
        response.features.forEach( Overpass.update );
      } else {
        // return error to the client and stop subscription
        // TODO too restrictive? smarter way to handle error
        self.error(err);
      }
    });

  }

  Overpass.log('return cached results');
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
