Overpass = {};

Overpass.DEBUG = false;

Overpass.log = function(msg){
  if ( Overpass.DEBUG ){
    console.log(msg);
  }
};

Overpass.error = function(msg){
  if ( Overpass.DEBUG ){
    console.error(msg);
  }
};
