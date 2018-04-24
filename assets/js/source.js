/* global arrays and objects */

var SOURCES=[];   // collection of all managed sources
var SOURCE=[];    // setup JSON of decentralized source
var JSN=[];       // JSON datacollection
var REQ=[];       // existing requested changes of selected item
var REQS=[];       // existing requested changes of all items

var setT;         // setTimeout handler
var sel_entry=getQueryVariable("id");   // item preselect by URL (GET) param id


/* page onload function */
$( document ).ready(function() {

  // load list of connected JSONomy datasources ( sources.json )
  SOURCES = json_load("sources.json");

  // get info of all connected sources
  SOURCES.forEach(
    function(v,i){
      var S = json_load(v.source + "/source.json");
      $(".selectsource ul").append("<li id='source_" + i + "' class='source'>" + S.id + " - " + S.title + "</li>");
    }
  );

  // show number of connected sources
  $("#selectsource").text("select source (" + SOURCES.length + ")")

  // add click event to menu tabs
  $(".row.tabs li").click(function(){
    select_tab(this, ".tabs");
  });

  // add click function to sources list
  $(".selectsource li").click(function(){
    select_tab(this, ".selectsource");
  });

  // select first tab ( tab selectsource )
  select_tab($(".row.tabs li:first"),".tabs");

  // if autoselect is set in sources.json then preselect this source
  SOURCES.forEach(
    function (v,i){
      if( v.autoselect != undefined && v.autoselect == true ){
        select_tab($("#source_" + i), ".selectsource");
      }
    }
  );

});

// get URL (GET) param
function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       if( variable == "coin" ){ return "btc"; } else { return(false); }
}

// click event handling
function select_tab(obj, clas ){

  // reset all active selections
  $(clas + " li").toggleClass("active",false);

  // set active selection
  $(obj).toggleClass("active",true);

  // tab clicked
  if( clas == ".tabs" ){

    // hide all sections
    $("section").toggleClass("d-none",true);

    // show section of clicked tab
    $("." + $(obj)[0].id ).toggleClass("d-none",false);

    // if tab openrequests clicked then get requests
    if( $(obj)[0].id == "openrequests" ){
      get_requests(false);
    }

  }

  // list item ( sources list ) of selectsource clicked
  if( clas == ".selectsource" ) {

    // get source info
    SOURCE = json_load(SOURCES[parseInt( $(obj)[0].id.slice(7) )].source + "/source.json");

    // insert title in items overview
    $(".items h3").text( SOURCE.id + " - " + SOURCE.title );

    // unhide tabs items, openrequests, history, API, map ( if available )
    $("#items").toggleClass("d-none",false);
    $("#openrequests").toggleClass("d-none",false);
    $("#history").toggleClass("d-none",false);
    $("#API").toggleClass("d-none",false);
    $("#map").toggleClass("d-none",(( SOURCE.umap != undefined && SOURCE.umap != "" ) ? false: true));

    // get data of JSONomy datasource
    init_data();

    // get changes request of selected datasource
    get_requests(false);

    // get history of all approved and canceled change requests
    get_history();

    // create API info section
    get_API_info();

    // hide section "items"
    $("section.items").toggleClass("section-out");

    // if umap is available in datasource then show umap after source selection else show the items
    select_tab($(".row.tabs li:nth-child(" + (( SOURCE.umap != undefined && SOURCE.umap != "" ) ? 2: 3) + ")"),".tabs");
    setTimeout(
      function(){
        // unhide section "items"
        $("section.items").toggleClass("section-out");

        // check users language and open umap
        getLangMap();
      },500
    );



  }

}

// get data of JSONomy datasource
function init_data(){

  // get datacollection of JSONomy datasource
  JSN = json_load( $().source_path() + "/" + SOURCE.id + ".json");

  // reset items list
  $(".items .row:nth-child(2)").html("");

  // add "add new item" item
  $(".items > .row:nth-child(2)").append("<div id='item_new' class='col-md-2 col-sm-3 col-4' data-toggle='modal' data-target='#Modal'><div><font>+</font></div><div>ADD NEW ITEM</div></div>");

  // add items as icon in section "items"
  JSN.forEach(
    function(v,i){
      var img=( v.icon != "" ) ? "<img src='" + v.icon + "'>" : "";
      var colr=( v.color != "" ) ? " style='background:" + v.color + ";'" : "";
      $(".items > .row:nth-child(2)").append("<div id='item_" + i + "' class='col-md-2 col-sm-3 col-4' data-toggle='modal' data-target='#Modal'><div" + colr + ">" + img + "</div><div>" + v.name + "</div></div>");
    }
  );

  // show count of items in tab "items"
  $("#items").text("items (" + JSN.length + ")");

  // item click show details as editable table
  $(".items .row:nth-child(2) > div").click(
    function(){

      // hide request changes button
      $("#request_changes").toggleClass("d-none",true);

      // reset table output
      $(".modal-body").html("");

      // show table header
      if( $(this)[0].id.slice(5) == "new" ){
        var item_index = $(this)[0].id.slice(5);
        REQ=[];
        $(".modal-header").html("<div class='row' id='item__new'><div class='col'><h2>Add new " + SOURCE.item_title + " <b>...</b><h2></div></div><button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>");

      } else {
        var item_index = parseInt( $(this)[0].id.slice(5) );
        // get existing requested changes
        REQ=json_load( $().source_path() + "/get_open_request.php?id=" + JSN[item_index].id );
        $(".modal-header").html("<div class='row' id='item__" + item_index + "'><div class='col'><h2>" + (( JSN[item_index].icon != "" ) ? "<img width='100' height='100' src='" + JSN[item_index].icon + "'>" : "" ) + " " + SOURCE.item_title + " <b>" + JSN[item_index].name + "</b><h2></div></div><button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>");

      }

      // append all item properties in table body
      append_item(SOURCE.properties,1,item_index);

      // append legend info after last item property
      $(".modal-body").append("<div class='row'><div class='col-1'></div><div class='col-md-2 col-4 legend'>* mandatory<br>** readonly</div></div>");

      // initialize request changes function
      $("#request_changes").click(

        function(){

          // ignore further clicks
          if( $("#request_changes").hasClass("d-none") ) return;

          // hide request button
          $("#request_changes").toggleClass("d-none",true);
          $("#Modal").modal('hide');

          // init PROPERTY object for users changes
          var PROPERTY={};

          // get index of item
          var item_index;
          item_index = $(".modal-header .row")[0].id.slice(6);

          // if item is "add new item" then set all properties as changed ( class "unapproved" )
          if( item_index == "new" ) $(".itemdata").toggleClass("unapproved",true);

          // check changes, if != to old entry then set it as changed ( class "unapproved" )
          $.each( $(".itemdata.unapproved"),
            function(i,v){

              // get property id
              var field_id =$(v)[0].id.slice(2);

              // get new entry
              var new_entry=$($(v)[0]).text();

              // get index of item
              item_index=parseInt( item_index );

              // get old entry
              var orig_entry=eval("JSN[" + item_index + "]." + field_id );
              if( orig_entry == undefined ) orig_entry = "undefined";

              // if entry is not numeric ( string ) then trim it
              if( ! $.isNumeric(orig_entry) ) orig_entry=orig_entry.trim();

              if( ! $.isNumeric(new_entry) ){
                new_entry=new_entry.trim();
              } else {
                // convert numeric ( string ) to numeric format
                new_entry=new_entry*1;
              }

              // set class "unapproved" if new and old entry are different
              if( orig_entry != new_entry || item_index == "new" ){
                $($(v)[0]).toggleClass("unapproved",false).toggleClass("undefined",false).toggleClass("waitapproval",true);
                // store new entry in PROPERTY object to request changes in later step
                PROPERTY[field_id]=new_entry;
              }
            }
          );

          // create CHG object and append item id ( as string ) and all changed properties ( as object )
          var CHG={"id":(( item_index == "new" ) ? $("#f_id").text() : JSN[item_index].id ),"properties":PROPERTY};

          // POST "CHG" object to JSONomy datasource
          $.post( $().source_path() + "/request_changes.php",
            {
                CHG: JSON.stringify(CHG)
            },
            function(data, status){
              if( status != "success") alert("Data: " + data + "\nStatus: " + status);
            }
          );

          // reload list of all requests
          get_requests(false);

        }
      );

      // if item is "add new item" then check every property entry initially
      if( item_index == "new" ){
        $.each($("[contenteditable]"),
          function(i,v){
            item_keyup(v);
          }
        );
      }

      // check new entry after keyup event, wait 1 second and skip check if further keyup follows until the 1 second
      setTimeout(function(){
        $("[contenteditable]").keyup(
          function(){
            item_keyup($(this));
          }
        );
      },1000);
    }
  );

}

// check if new entry is unique
function unique_check( obj, field_id ){
  var exists=false;
  var u = JSN.forEach(
    function(v,i){
      if( v[field_id].toString() == $(obj).text() && $(obj).text() != "" ){
        console.log( field_id, "unique" );
        exists=true;
      }
    }
  );

  return exists;
}

// check new entry ( on keyup event )
function item_keyup(obj){

  // get property id
  var field_id  =$(obj)[0].id.slice(2);

  // get index of item
  var item_index = $(".modal-header .row")[0].id.slice(6);

  // get old entry
  if( item_index == "new" ){
    var orig_entry="";
  } else {
    var item_index=parseInt( $(".modal-header .row")[0].id.slice(6) );
    var orig_entry=eval("JSN[" + item_index + "]." + field_id );
    if( orig_entry == undefined ) orig_entry = "{undefined}";
  }

  // if it is not numeric trim it
  if( ! $.isNumeric(orig_entry) ) orig_entry = orig_entry.trim();
  var new_entry = $($(obj)[0]).text().trim();

  // get property setup from JSONomy datasource source.json of selected datasource
  var minl =      getfieldparam(field_id,"minlength");
  var maxl =      getfieldparam(field_id,"maxlength");
  var mandatory = getfieldparam(field_id,"mandatory");
  var numeric =   getfieldparam(field_id,"numeric");
  var regex_match=getfieldparam(field_id,"regex_match");
  var def =       getfieldparam(field_id,"default");
  var unique =    getfieldparam(field_id,"unique");

  // get string length of new entry
  var l = $(obj).text().trim().length;

  // reset warning info text
  $($(obj).parent().children()[3]).text("");

  // reset class "undefined"
  $(obj).toggleClass("undefined",false);

  // set class "badformat" if new entry doesn't match with the conditions
  $(obj).toggleClass("badformat",
    ( ! numeric && ( l > maxl || l < minl ) )
    || ( numeric && ( (($.isNumeric(new_entry)) ? parseFloat(new_entry) : 0 ) > maxl ) )
    || ( numeric && ( (($.isNumeric(new_entry)) ? parseFloat(new_entry) : 0 ) < minl ) )
    || ( l == 0 && mandatory == true )
    || (! $.isNumeric(new_entry) == true && numeric == true  )
    || ( new_entry.match( eval ( regex_match ) ) == null )
    || ( unique == true && unique_check(obj, field_id) == true ) );

  // set warning info if a condition doesn't match
  if( ( ! numeric && ( l > maxl || l < minl ) ) || ( l == 0 && mandatory == true ) ) {
    $($(obj).parent().children()[3]).append( (( mandatory ) ? "mandatory<br>" : "") + "size range = " + minl + " - " + maxl + "!<br>");
  }

  if( (! $.isNumeric(new_entry) == true && numeric == true  ) ){
    $($(obj).parent().children()[3]).append("numeric format expected!<br>");
  }

  if( ( unique == true && unique_check(obj, field_id ) == true ) ){
    $($(obj).parent().children()[3]).append("value must be unique!<br>");
  }

  if( ( numeric && ( (($.isNumeric(new_entry)) ? parseFloat(new_entry) : 0 ) > maxl ) )
  || ( numeric && ( (($.isNumeric(new_entry)) ? parseFloat(new_entry) : 0 ) < minl ) ) ){
    $($(obj).parent().children()[3]).append("numeric range " + minl + " - " + maxl + "!");
  }

  if( new_entry.match( eval ( regex_match ) ) == null ){
    $($(obj).parent().children()[3]).append("format does not match!<br>" + def);
  }

  // show default value if new entry is empty
  if( l == 0 ){
    if( def != "" ) $(obj).text(def);
  }

  // set class "unapproved" if all conditions matches and new entry is different to old entry
  $(obj).toggleClass("unapproved", ! $(obj).hasClass("badformat") && ( orig_entry != new_entry || item_index == "new" ) );

  // if all properties entries matches with the conditions and new entries are done then show the "request changes" button
  $("#request_changes").toggleClass("d-none", !( $(".badformat").length == 0 && $(".unapproved").length>0 ));

}

// get changes requests
function get_requests(noreload){

  // get all open requests
  setTimeout(
    function(){

      // get open requests from datasource
      if( noreload == false ) REQS = json_load( $().source_path() + "/get_open_requests.php");

      // show number of open changes requests
      $("#openrequests").text("pending changes (" + REQS.length + ")");

      // reset section "openrequests"
      $(".openrequests .row:last-child ul").html("");
      var t="";

      // show requests in a box
      REQS.forEach(
        function(v,i){

          // get index by item id
          var item_index=$().getindexbyid(v.id);

          // show changes ( old and new entry )
          t+="<div class='col-md-4 col-sm-6 col-12'><div id='id_" + v.id + "'></div><li>" + v.id + " [" + (( item_index != undefined ) ? eval("JSN[" + $().getindexbyid(v.id) + "].name") + "] <i>changes</i>" : "] <i>new item</i>" ) + "<ul>";
          $.each( v.properties,
            function ( j,w ){
              t += "<li><b>." + j + "</b><ul><li>" + (( item_index != undefined ) ? eval("JSN[" + $().getindexbyid(v.id) + "]." + j) : "" ) + "</li><li>" + w + "</li></ul></li>";

            }
          );

          t+="</li></ul></div>";

        }

      );

      // append requests to section "openrequests"
      $(".openrequests .row:last-child").html(t);

      // append approve and cancel button as hover event
      $(".openrequests .row:last-child > div").hover(
        function(){
          if( $( $(".authcode")[0]).val().length == 6 ){
            $( $(this).children()[0] ).html("<button type='button' class='btn btn-lg btn-success' onclick='request_approve(this)'>approve</button>&nbsp;</button><button type='button' class='btn btn-lg btn-danger' onclick='request_cancel(this)'>cancel</button>");
          }
        },
        function(){
          $( $(this).children()[0] ).html("");
        }
      );
    },500
  );

}

// get history of all approved and canceled changes requests
function get_history(){

  // get history of changes from datasource
  var J=json_load( $().source_path() + "/get_history.php");
  J.forEach(
    function(v,i){
      $(".history .row ul").append( "<li><a href='" + v + "'>" + v + "</a></li>")
    }
  );
  // show number of all approved and canceled requests
  $("#history").text("history of changes (" + J.length + ")");
}

// show datasource info and infos of usage of API
function get_API_info(){
  $(".API").html("");
  $(".API").append("<div class='row'><div class='col-1'></div><div class='col-4 col-md-2'>Admin contact</div><div class='col'>" + SOURCE.admin + "</div></div>");
  $(".API").append("<div class='row'><div class='col-1'></div><div class='col-4 col-md-2'>Source id</div><div class='col'>" + SOURCE.id + "</div></div>");
  $(".API").append("<div class='row'><div class='col-1'></div><div class='col-4 col-md-2'>Source title</div><div class='col'>" + SOURCE.title + "</div></div>");
  $(".API").append("<div class='row'><div class='col-1'></div><div class='col-4 col-md-2'>Source description</div><div class='col'>" + SOURCE.description + "</div></div>");
  $(".API").append("<div class='row'><div class='col-1'></div><div class='col-4 col-md-2'>Source item title</div><div class='col'>" + SOURCE.item_title + "</div></div>");

  var api_json=$().source_path() + "/" + SOURCE.id + ".json";
  $(".API").append("<div class='row'><div class='col-1'></div><div class='col-4 col-md-2'>API JSON URL</div><div class='col'><a href='" + api_json + "'>" + api_json + "</div></div>");

  var api_geo_json=$().source_path() + "/" + SOURCE.id + ".geo.json";
  $(".API").append("<div class='row'><div class='col-1'></div><div class='col-4 col-md-2'>API geoJSON URL</div><div class='col'><a href='" + api_geo_json + "'>" + api_geo_json + "</a> <a href='https://jsoneditoronline.org/?url=" + encodeURI(api_geo_json) + "'><button type='button' class='btn btn-sm btn-outline-info'>open in jsononlineeditor</button></a></div></div>");

  $(".API").append("<div class='row'><div class='col-1'></div><div class='col-4 col-md-2'>umapJSON</div><div class='col'> <button type='button' class='btn btn-outline-primary btn-block' onclick='create_umap_from_template(json_load(\"template.umap.json\"))'>create umapJSON from JSONomy template</button> <button type='button' class='btn btn-outline-primary btn-block' onclick='create_umap_from_template(JSON.parse( $(\".umap\").val()))'>create umapJSON from umapJSON import</button> </div></div>");
  $(".API").append("<div class='row'><div class='col-1'></div><div class='col-4 col-md-2'>umapJSON result</div><div class='col'><textarea class='form-control umap' rows='10' cols='40'></textarea></div></div>");

}


// create umapJSON from template.umap.json
function create_umap_from_template(UMAP){

  UMAP.properties.name = SOURCE.title;
  UMAP.properties.description = SOURCE.description;
  UMAP.layers[0]._storage.name = SOURCE.title;
  UMAP.layers[0]._storage.description = SOURCE.description;
  UMAP.layers[0]._storage.popupContentTemplate = "{{{icon}|100}}\n\n" + SOURCE.item_title + "\n# {name} ( {id} )\n";

  $.each( SOURCE.properties,
    function( i,v ){
      UMAP.layers[0]._storage.popupContentTemplate+="\n\n**" + i + ":**\n{" + i + "}";
    }
  );

  UMAP.layers[0]._storage.remoteData.url = $().source_path() + "/" + SOURCE.id + ".geo.json";

  $(".umap").val( JSON.stringify(UMAP) );

}

// check users language and open umap
function getLangMap(){
  var userLang = navigator.language || navigator.userLanguage;
  var ln="en";

  switch(userLang){
    case "de":
      ln="de";
      break;
    case "en":
      ln="en";
      break;
    case "es":
      ln="es";
      break;
    case "it":
      ln="it";
      break;
    case "pt":
      ln="pt";
      break;
  }

  if( SOURCE.umap != undefined ){
    document.getElementById("umap").src=SOURCE.umap.replace(/\{ln\}/,ln);
  }

}


// append property of item to items form
function append_item(obj,layer,item_index){

  $.each(obj, function(w,j){

      var ww=w;
      var clas="";
      var field_id = w;

      if( item_index == "new" ){
        j=getfieldparam(field_id,"default");
        if( j != "" ) clas+=" badformat";
      } else {
        j=eval( "JSN[item_index]." + field_id );
      }



      switch( w ){
        case "color":
          if( j != undefined ){
            if( j != "" ){
              j = "<font color='" + j + "'>" + j + "</font>";
            }
          }
        break;
      }
      if( j == undefined ) clas+=" undefined";

      if( REQ.properties != undefined ){

        $.each( REQ.properties,
          function(i,v){

            if( i== w ){
              j=v;
              clas+=" waitapproval";
            }
          }
        );

      }

      $(".modal-body").append("<div class='row" + (( getfieldparam(field_id,"hidden") ) ? " d-none" : "") + "'><div class='col-" + layer + "'></div><div class='col-4 col-md-2 label'>" + ww +
      (( getfieldparam(field_id,"readonly") ) ? "**" : ( getfieldparam(field_id,"mandatory") ) ? "*" : "") +
      "</div><div id=\"f_" + field_id + "\" class='col itemdata" + clas + "'" + (( getfieldparam(field_id,"readonly") && item_index != "new" ) ? "" : " contenteditable") + ">" + j + "</div><div class='col-md-2 col-4'></div>");

    }
  );

}

// get property of item property
function getfieldparam(field_id,param){
  return eval("SOURCE.properties." + field_id + "." + param );
}

// approve request
function request_approve(obj){

  var id = $(obj).parent()[0].id.slice(3).trim();
  var code = $($(".openrequests .authcode")[0]).val();

  // check auth code
  if( code.length != 6 ){
    alert( "Authentification code bad format!" );
    return;
  }

  // send post request to external source
  $.post( $().source_path() + "/request_approve.php",
    {
        id: id,
        code: code
    },
    function(data, status){
      if( status != "success") alert("Data: " + data + "\nStatus: " + status);
      console.log("approve",data);

      if( data == "1" ){
        $(obj).parent().parent().toggleClass("d-none",true);
        REQS.forEach(
          function(v,i){
            if( v.id == id ){
              REQS.splice(i,1);
            }
          }
        );

        get_requests(true);

        clearTimeout(setT);

        setT = setTimeout(
          function(){
            init_data();
            get_requests(false);
          },1000
        );

      } else if ( data == "00" ){
        alert( "Data conflict! Filename does not fit with the id! Please contact the datasource admin => " + SOURCE.admin + " !" );
      } else {
        alert( "Authentification code invalid!" );
      }

    }
  );

}

// cancel request
function request_cancel(obj){

  var id = $(obj).parent()[0].id.slice(3).trim();
  var code = $($(".openrequests .authcode")[0]).val();

  // check auth code
  if( code.length != 6 ){
    alert( "Authentification code bad format!" );
    return;
  }

  // post cancel request to external source
  $.post( $().source_path() + "/request_cancel.php",
    {
        id: id,
        code: code
    },
    function(data, status){
      if( status != "success") alert("Data: " + data + "\nStatus: " + status);
      console.log("cancel",data);

      if( data == "1" ){
        $(obj).parent().toggleClass("d-none",true);

        REQS.forEach(
          function(v,i){
            if( v.id == id ){
              REQS.splice(i,1);
            }
          }
        );

        get_requests(true);

      } else {
        alert( "Authentification code invalid!" );
      }

    }
  );

}


// jQuery prototype functions
(function($){

  // get source id of selected source
  $.fn.source_id = function() {

    if( $(".source.active").length > 0 ){
      return parseInt( $(".source.active")[0].id.slice(7));
    } else {
      return undefined;
    }

  }

  // get source url of selected source
  $.fn.source_path = function() {

    if( $().source_id() == undefined ){
      return undefined;
    } else {
      return SOURCES[ $().source_id() ].source;
    }

  }

  // get JSON object array index by object id
  $.fn.getindexbyid = function(id) {

    var index=undefined;

    JSN.forEach(
      function(v,i){
        if( v.id == id ){
          index=i;
        }
      }
    );

    return index;

  }

  // get item id of selected item
  $.fn.item_id = function(id) {

    var index=undefined;

    return parseInt( $(".modal-header .row:first-child")[0].id.slice(6) );

  }



})(jQuery);
