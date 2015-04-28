> Work in progress! Not ready yet.

Meteor package that fetches OpenStreetMap data using Overpass API and caches results in a MongoDB collection.

Main features

* Caching based on bounding box and searched tags. We use MongoDB spatial capabilities and [Turf](http://turfjs.org/) to build Overpass queries over the "minimum" bounding box.
* Returned data are in GeoJson ready to be used in Leaflet or similar client libraries. Based on [osmtogeojson](https://www.npmjs.com/package/osmtogeojson) package.
* Overpass subscription returns available cached geo data immediately without any delay. When it gets a response from Overpass API, then it updates the result set also on the client.
* It is not possible to ask arbitrary Overpass queries. First, all queries are within a bounding box. Second, every query should be mappable to MongoDB select (our cache).

At the moment we are able to perform unions of simple queries where tags match their filter exactly. For example, the following query returns shelters (node) OR alpine huts (node) OR hiking trails (way).

```javascript
[
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
]
```

## Test package

     meteor test-packages ./

## Roadmap

* Strategies to limit the size of data returned to client (cached or not). For example: clustering, zoom limits, simplified geometries based on zoom level.
* Stale information in geo cache
* More powerful query language closer to Overpass QL.


## Useful resources

* http://geojsonlint.com/
* http://en.wikipedia.org/wiki/GeoJSON#Example
* http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
* http://wiki.openstreetmap.org/wiki/Overpass_API#Limitations
* http://docs.mongodb.org/manual/applications/geospatial-indexes/
* http://wiki.openstreetmap.org/wiki/Hiking
* http://turfjs.org/
