

Tinytest.addAsync('Overpass - find single type with single tag using method', function (test, done) {
  var query = {
    type: 'node',
    filter: {
      amenity:'shelter'
    }
  };
  var bbox = [ 45.922020,11.101685,46.060368,11.246567 ];
  Meteor.call('overpass', query, bbox, function(err, response){
    // response is an object of this form
    // {"type":"FeatureCollection","features":[ ... ]}
    test.isNotNull(err, err);
    test.instanceOf(response, Object);
    test.equal(response.type, "FeatureCollection");
    test.instanceOf(response.features, Array);

    // check if feature are shelters
    response.features.forEach( function(feature){
      test.equal( feature.properties.tags.amenity, "shelter");
    });

    done();
  });
});

Tinytest.addAsync('Overpass - find multiple types using method', function (test, done) {
  var query = [
    { type: 'node',
      filter: {
       amenity:'shelter'
      }
    },
    { type: 'node',
      filter: {
       tourism:'alpine_hut'
      }
    },
    { type: 'way',
      filter: {
       highway:'path',
       sac_scale:'hiking'
      }
    }
  ];
  var bbox = [ 45.922020,11.101685,46.060368,11.246567 ];
  Meteor.call('overpass', query, bbox, function(err, response){
    // response is an object of this form
    // {"type":"FeatureCollection","features":[ ... ]}
    test.isNotNull(err, err);
    test.instanceOf(response, Object);
    test.equal(response.type, "FeatureCollection");
    test.instanceOf(response.features, Array);

    console.log( response );

    done();
  });
});

Tinytest.addAsync('Overpass - show subscribed shelters with delay', function (test, done) {
  var GeoCache = new Mongo.Collection('geo-cache');
  var query = {
    type: 'node',
    filter: {
      amenity:'shelter'
    }
  };
  var bbox = [ 45.922020,11.101685,46.060368,11.246567 ];
  Tracker.autorun( function(computation){
    var results = GeoCache.find().fetch();
    if ( computation.firstRun ){
      test.equal( results.length, 0);
    } else {
      test.notEqual( results.length, 0);
      Tracker.afterFlush(done);
    }
  });
  Meteor.subscribe('overpass', query, bbox);
});
