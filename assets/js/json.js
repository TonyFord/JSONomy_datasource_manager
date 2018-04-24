function json_load( url ){
  var json = null;
  $.ajax({
      'async': false,
      'global': false,
      'cache': false,
      'url': url,
      'dataType': "json",
      'success': function (data) {
          json = data;
      }
  });
  return json;
}
