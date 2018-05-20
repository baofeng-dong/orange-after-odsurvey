//functions for map.js
//add different maps based on the map view box selected
function addMapview () {
        //if point map selected
        if ($('input.checkview')[0].checked) {
            removeLayers(mymap);
            rebuild(sel_args);
            if (sel_args.rte && sel_args.dir) {
                rebuildPath(sel_args);
            }
        } else if ($('input.checkview')[1].checked || $('input.checkview')[2].checked){
            //clear layers
            removeLayers(mymap);
            buildHeatmap(sel_args, addOriginHeatMap, addDestHeatMap);
        } else if ($('input.checkview')[3].checked) {
            requestBoundaryData(sel_args, zipLayer, addBoundaryLayer);
        } else if ($('input.checkview')[4].checked) {
            requestBoundaryData(sel_args, sepLayer, addBoundaryLayer);
        } else {
            requestBoundaryData(sel_args, ctyLayer, addBoundaryLayer);
        }
}

//function to reset sel_args values to empty when switching checkbox

function emptyArgs(sel_args)
{
    len = sel_args.length;
    var props = Object.keys(sel_args);
    for (var i = 0; i < len; i++)
    {
        console.log(sel_args[props[i]]);
        sel_args[props[i]] = null;
    }
}

//function to reset sel_args values
function resetArgs() {
    sel_args = {
        rte : "",
        dir : "",
        day : "",
        tod : "",
        orig : "",
        dest : "",
        boundary: "",
        dest_sep: "",
        dest_zip: "",
        dest_cty: ""
    }
}

function resetZipSep() {
    sel_args.dest_zip = null;
    sel_args.dest_sep = null;
    sel_args.dest_cty = null;
}
//remove layers
function removeLayers(map) { 
    map.eachLayer(function(layer) {
        if (layer instanceof L.TileLayer == false) {
            map.removeLayer(layer);
            //console.log("removed layer!");
            //console.log(layer._leaflet_id);
        }
    })
} 

//clear all points and path layers
function resetLayers() {
    origMarkersLayer.clearLayers();
    destMarkersLayer.clearLayers();
    odPairLayerGroup.clearLayers();
    boundaryLayer.clearLayers();
}

//add origin points heatmap to mymap
function addOriginHeatMap(originList) {
    originHeatGroup.clearLayers();
    var originHeat = L.heatLayer(originList, heatmapOptions);
    //add origin points heatmap to mymap
    originHeat.redraw();
    console.log("redraw heatmap!");
    originHeat.addTo(mymap);
    console.log("add origin heatmap executed!");
}

//add destination points heatmap to mymap
function addDestHeatMap(destinationList) {
    var destHeat = L.heatLayer(destinationList, heatmapOptions);
    //add origin points heatmap to mymap
    destHeat.redraw();
    console.log("redraw dest heatmap!");
    destHeat.addTo(mymap);
    console.log("add dest heatmap executed!");
}

// add route GeoJson to map based on sel_line and sel_dir
function addRouteJson(sel_line, sel_dir) {
    routeLayer.clearLayers();
    console.log(sel_line);
    console.log(sel_dir);

    if (sel_dir === undefined) {
        sel_dir = 0;
    }
    console.log(sel_dir);

    var routeJson = sel_line + '_' + sel_dir + '_routes.geojson';
    console.log(routeJson);
    var path = base + 'static/geojson/rte/';

    $.getJSON(path + routeJson, function(data) {
        var route = L.geoJson(data, {
            style: function (feature) {
                return {
                        color: getBaseColor(feature.properties.rte),
                        weight: 2.5,
                        opacity: 0.80
                };
            }
        }).addTo(routeLayer);

        routeLayer.addTo(mymap);
        routeLayer.bringToFront();
        console.log("added to mymap!");
    })

}

//function to add geojson layer to map
function addBoundaryLayer(geojson) {
    //console.log(geojson);
    var path = base + 'static/geojson/';

    $.getJSON(path + geojson, function(data) {
        console.log(data);
        boundary = L.geoJson(data, {
            style: switchStyle(geojson),
            onEachFeature: switchFeature(geojson)
        }).addTo(boundaryLayer);
        //console.log(boundary);

        boundaryLayer.addTo(mymap);
        boundaryLayer.bringToFront();
        console.log(geojson + " added to mymap!");
    })
}

//function to zoom to a sep area
function zoomToFeature(e) {
    mymap.fitBounds(e.target.getBounds());
}

//function to pick a style based on boundary layer
function switchStyle(geojson) {
    if (geojson == tmLayer) {
        return style
    } else if (geojson == sepLayer){
        return sepStyle
    } else if (geojson == zipLayer) {
        return zipStyle
    } else {
        return ctyStyle
    }
}

//style function
function style(feature) {
    console.log(feature);
    return {
        color: "#909090",
        weight: 2.0,
        opacity: 0.8,
        fillOpacity: 0.0
    } 
}

//style for sep
function sepStyle(feature){
    return {
        fillColor: getSepColor(dict[feature.properties.label1]),
        weight: 2.0,
        opacity: 0.8,
        color: 'white',
        fillOpacity: 0.6
    }
}

//style for zipcode
function zipStyle(feature){
    return {
        color: getZipColor(dict[feature.properties.zipcode]),
        weight: 1.0,
        opacity: 0.8,
        fillOpacity: 0.6
    }
}

//style for county
function ctyStyle(feature){
    return {
        color: getCtyColor(dict[feature.properties.county]),
        weight: 1.0,
        opacity: 0.8,
        fillOpacity: 0.6
    }
}

//function to highlight layer when a mouse hovers over
function highlightFeatureSep(e) {
    var layer = e.target;
    console.log(layer.feature.properties.label1);
    var dest_sep = layer.feature.properties.label1;
    sel_args.dest_sep = dest_sep;
    requestBoundaryData(sel_args, sepLayer, addBoundaryLayer);
    layer.openPopup();
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    infoSep.update(layer.feature.properties);
}

//function to highlight zip layer when mouseover
function highlightFeatureZip(e) {
    var layer = e.target;
    var dest_zip = layer.feature.properties.zipcode;
    sel_args.dest_zip = dest_zip;
    requestBoundaryData(sel_args, zipLayer, addBoundaryLayer);
    //layer.openPopup();
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    infoZip.update(layer.feature.properties);
}

//function to highlight county layer when mouseover
function highlightFeatureCty(e) {
    var layer = e.target;
    var dest_cty = layer.feature.properties.county;
    sel_args.dest_cty = dest_cty;
    requestBoundaryData(sel_args, ctyLayer, addBoundaryLayer);
    //layer.openPopup();
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    infoCty.update(layer.feature.properties);
}
//reset style on mouseout
function resetHighlight(e) {
    var layer = e.target;
    boundary.resetStyle(layer);
    //layer.closePopup();
}

//switch on each feature based on boundary layer
function switchFeature(geojson) {
    if (geojson == sepLayer) {
        return onEachFeatureSep
    } else if (geojson == zipLayer){
        return onEachFeatureZip
    } else if (geojson == ctyLayer) {
        return onEachFeatureCty
    } else {
        return
    }
}

//use onEachFeature option to add listeners on sep layers
function onEachFeatureSep(feature, layer) {
    //var popupContent = "<b>SEP:</b> " + feature.properties.label1 + '<br />' + 
                //"<b>Percentage:</b>" + " " + dict[feature.properties.label1];
    //layer.bindPopup(popupContent);
    console.log(feature.properties.label1);
    /*var label = L.marker(layer.getBounds().getCenter(), {
      icon: L.divIcon({
        className: 'label',
        html: feature.properties.label1,
        iconSize: [100, 40],
        color: 'black'
      })
    }).addTo(mymap);*/

    layer.on({
        mouseover: highlightFeatureSep,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

function onEachFeatureZip(feature, layer) {
    //var popupContent = "<b>Zipcode:</b> " + feature.properties.zipcode;
    //layer.bindPopup(popupContent);
    /*var label = L.marker(layer.getBounds().getCenter(), {
      icon: L.divIcon({
        className: 'label',
        html: feature.properties.zipcode,
        iconSize: [100, 40],
        color: 'black'
      })
    }).addTo(mymap);*/

    layer.on({
        mouseover: highlightFeatureZip,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

function onEachFeatureCty(feature, layer) {

    layer.on({
        mouseover: highlightFeatureCty,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

infoZip.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'infohover');
        this.update();
        return this._div;
    };

infoSep.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'infohover');
        this.update();
        return this._div;
    };

infoCty.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'infohover');
        this.update();
        return this._div;
    };

infoZip.update = function (props) {
this._div.innerHTML = '<h4>Zipcode As Destination</h4>' +  (props ?
'<b>' + props.zipcode + '</b><br />' + '<b>Origin Trips Percentage :</b> ' + dict[props.zipcode] + '<br>' +
'<b>Origin Trips Number :</b> ' + dictCount[props.zipcode]+ '</b><br />'
: 'Hover over a zipcode');
} 

infoSep.update = function (props) {
this._div.innerHTML = '<h4>SEP As Destination</h4>' +  (props ?
'<b>' + props.label1 + '</b><br />' + '<b>Origin Trips Percentage :</b> ' + dict[props.label1] + '<br>' +
'<b>Origin Trips Number :</b> ' + dictCount[props.label1]+ '</b><br />'
: 'Hover over a SEP area');
}

infoCty.update = function (props) {
this._div.innerHTML = '<h4>County As Destination</h4>' +  (props ?
'<b>' + props.county + '</b><br />' + '<b>Origin Trips Percentage :</b> ' + dict[props.county] + '<br>' +
'<b>Origin Trips Number :</b> ' + dictCount[props.county]+  '</b><br />'
: 'Hover over a county area');
}

//function to send query to map/_query to args and build the points map
function rebuild(args) {
    //clear previous orig and dest markers
    resetLayers();

    console.log(args);

    $.getJSON('map/_query', args, function(data) {
        //retrive origin and destination lat and lng
        console.log(data);

        $(data.data).each(function(index, item) {
            // get origin lat and long from data.data json
            var o_lat = item.o_lat;
            var o_lng = item.o_lng;
            // get destination lat and long
            var d_lat = item.d_lat;
            var d_lng = item.d_lng;

            // defines popup content for orig markers
            var orig_popup = L.popup().setLatLng([o_lat,o_lng]).setContent(
                "<b>Route:</b>" + " " + item.rte_desc + '<br />' + 
                "<b>Direction:</b>" + " " + item.dir_desc + '<br />' +
                "<b>Origin:</b>" + " " + item.o_type);

            // defines popup content for destination markers
            var dest_popup = L.popup().setLatLng([d_lat,d_lng]).setContent(
                "<b>Route:</b>" + " " + item.rte_desc + '<br />' + 
                "<b>Direction:</b>" + " " + item.dir_desc + '<br />' +
                "<b>Destination:</b>" + " " + item.d_type);
            // lat and lng for orig and dest markers
            var olatlng = L.latLng(o_lat,o_lng);
            var dlatlng = L.latLng(d_lat,d_lng);

            //defines orig marker
            var orig_marker = L.circleMarker(olatlng, omarkerStyle).bindPopup(orig_popup, {showOnMouseOver:true});
            //defines dest marker
            var dest_marker = L.circleMarker(dlatlng, dmarkerStyle).bindPopup(dest_popup, {showOnMouseOver:true});
            //add orig and dest markers to odPairLayerGroup
            odPairLayerGroup.addLayer(orig_marker);
            odPairLayerGroup.addLayer(dest_marker);
            // add odPairLayerGroup to mymap
            odPairLayerGroup.addTo(mymap);
        });
    });
    //addLabel();
}

//function to send query to map/_data to return boundary summary data
function requestBoundaryData(args, geojson, callback) {

    console.log(args);
    console.log(args.boundary);

    $.getJSON('map/_data', args, function(data) {

        console.log(data);
        data = data.data;
        console.log(data);
        buildDict(data, args.boundary);
        console.log(dict);
        buildCountDict(data, args.boundary);
        console.log(dictCount);

        if(callback) {
            callback(geojson);
        }

    });
    //addMapLabel(args.boundary);
}

//function to loop through an array and build a dictionary
function buildDict(array,args) {
    len = array.length;
    //clear dict
    dict = {};
    for (var i = 0; i < len; i++) {
        if (args == 'sep') {
            key = array[i]["sep"];
            value = array[i]["percentage"];
            console.log(key, ' ', value);
            dict[key] = value;
        } else if (args == 'zipcode')
        {
            key = array[i]["zipcode"];
            value = array[i]["percentage"];
            console.log(key, ': ', value);
            dict[key] = value;
        } else
        {
            key = array[i]["COUNTY"];
            value = array[i]["percentage"];
            console.log(key, ': ', value);
            dict[key] = value;
        }
    }
    return dict;
}

//function to loop through an array and build a count dictionary
function buildCountDict(array,args) {
    len = array.length;
    //clear dict
    dictCount = {};
    for (var i = 0; i < len; i++) {
        if (args == 'sep') {
            key = array[i]["sep"];
            value = array[i]["count"];
            console.log(key, ' ', value);
            dictCount[key] = value;
        } else if (args == 'zipcode')
        {
            key = array[i]["zipcode"];
            value = array[i]["count"];
            console.log(key, ': ', value);
            dictCount[key] = value;
        } else
        {
            key = array[i]["COUNTY"];
            value = array[i]["count"];
            console.log(key, ': ', value);
            dictCount[key] = value;
        }
    }
    return dictCount;
}

//to build the origin and destination points arrays
function buildHeatmap(args, callback1, callback2) {
    
    odPairLayerGroup.clearLayers();
    console.log(args);

    $.getJSON('map/_query', args, function(data) {
        //clear the origin and destination points arrays
        originList.length = 0;
        console.log("origin list array cleared!");
        destinationList.length = 0;
        console.log("destinationList cleared!");

        console.log(data);

        $(data.data).each(function(index, item) {
            // get origin lat and long from data.data json
            var o_lat = item.o_lat;
            var o_lng = item.o_lng;
            // get destination lat and long
            var d_lat = item.d_lat;
            var d_lng = item.d_lng;

            //adds origin and dest objects to their corresponding lists
            originList.push([o_lat, o_lng]);
            destinationList.push([d_lat, d_lng]);

        });
        console.log(originList.length);
        console.log(destinationList.length);
        if($('input.checkview')[1].checked && callback1) {
            callback1(originList);
        }
        if ($('input.checkview')[2].checked && callback2) {
            callback2(destinationList);
        }
    });
}

//to add path between origin and destination points
function rebuildPath(args) {
    //clear layers
    odPairLayerGroup.clearLayers();

    console.log(args);

    $.getJSON('map/_query', args, function(data) {

        console.log(data);

        $(data.stops).each(function(index, item) {
            var stop_id = item.stop_id;
            var stop_name = item.stop_name;
            console.log(stop_id);
            var stop_geom = item.geom;
            var geom_json = JSON.parse(stop_geom);
            var s_lat = geom_json.coordinates[1];
            var s_lng = geom_json.coordinates[0];
            console.log(s_lat, s_lng);
            var slatlng = L.latLng([s_lat, s_lng]);
            
            if(!stopsDict.hasOwnProperty(stop_id))
            {
                stopsDict[stop_id] = {};
                stopsDict[stop_id]["latLng"] = slatlng;
                stopsDict[stop_id]["stop_name"] = stop_name;
            }

            //console.log(stop_geom);
            //console.log(geom_json.coordinates);
            //console.log(geom_json.coordinates[0]);
        })
        console.log(stopsDict);

        $(data.data).each(function(index, item) {
            // get origin lat and long from data.data json
            var o_lat = item.o_lat;
            var o_lng = item.o_lng;
            // get destination lat and long
            var d_lat = item.d_lat;
            var d_lng = item.d_lng;

            var on_stop_id = item.board;
            var off_stop_id = item.alight;

            // lat and lng for orig and dest and on/off markers
            var olatlng = L.latLng([o_lat,o_lng]);
            var dlatlng = L.latLng([d_lat,d_lng]);
            var onlatlng = stopsDict[on_stop_id]["latLng"];

            var offlatlng = stopsDict[off_stop_id]["latLng"];
            //console.log(offlatlng);
            //defines points pair list for the path
            var odPair = [olatlng, onlatlng, offlatlng, dlatlng];
            //defines the path that links boarding, alighting, orig and dest markers
            var pairPath = new L.Polyline(odPair, pathStyle);
            var transparentPath = new L.Polyline(odPair, {
                'weight': 10,
                'opacity':0
            })

            var popup = L. popup().setContent(
                "<b>Route:</b>" + " " + item.rte_desc + '<br />' + 
                "<b>Direction:</b>" + " " + item.dir_desc + '<br />' + 
                "<b>Origin:</b>" + " " + item.o_type + '<br />' + 
                "<b>Destination:</b>" + " " + item.d_type + '<br />' + 
                "<b>On Stop:</b>" + " " + stopsDict[on_stop_id]["stop_name"] + '<br />' + 
                "<b>Off Stop:</b>" + " " + stopsDict[off_stop_id]["stop_name"] + '<br />' + 
                "<b>Date:</b>" + " " + item.date+ '<br />' +
                "<b>Time of Day:</b>" + " " + item.time_of_day + '<br />' +
                "<b>Age:</b>" + " " + item.age + '<br />' +
                "<b>Gender:</b>" + " " + item.gender + '<br />' +
                "<b>Income:</b>" + " " + item.income
                );

            transparentPath.bindPopup(popup);
            
            transparentPath.on('mouseover', function(e) {

                //var path = e.target;
                pairPath.bringToFront();
                transparentPath.bringToFront();
                pairPath.setStyle({
                    color:'purple',
                    opacity: 0.9,
                    weight:5,
                    dashArray: '10,10'
                });
                /*if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    transparentPath.bringToFront();
                    console.log("brought to front!");
                }*/
            });
            transparentPath.on('mouseout', function(e) {
                //var path = e.target;
                //pairPath.bringToBack();
                //transparentPath.bringToBack();
                pairPath.setStyle(pathStyle);
                console.log("reset style!");
                //console.log(pathStyle);
            });
            //defines orig marker
            var orig_marker = L.circleMarker(olatlng, omarkerStyle);
            //defines dest marker
            var dest_marker = L.circleMarker(dlatlng, dmarkerStyle);
            //adds the path to odPairLayerGroup
            odPairLayerGroup.addLayer(pairPath);
            odPairLayerGroup.addLayer(transparentPath);
            odPairLayerGroup.addLayer(orig_marker);
            odPairLayerGroup.addLayer(dest_marker);
            //adds odPairLayerGroup to mymap
            odPairLayerGroup.addTo(mymap);
        });
    });
}

function removeHighlight() {
    //check for highlight
    if (highLight !== null) {
        //set default style
        highLight.setStyle(getDefaultStyle());
        //reset highLight
        highLight = null;
    }
}

function generateOriginHeatmap() {
    $('#origin-button').on('click', '#toggle', function(){
    console.log(this.value);

    resetLayers();
    console.log("reset points layers!")
    addOriginHeatMap(originList);
    console.log("added origin points heatmap!")
    });
}

//function for expanding/collapsing div content
function toggle_tb(){
    var div = $("#control-section");
    $('#toggle').unbind("click").click(function(){
         //div.slideToggle('fast');
         
         if ($(this).attr('value') == 'Hide') {
            console.log(this + 'hide selected')
            div.animate({
                height: '0%'
                }).hide()
            $(this).attr('value','Show')
            
        } else {
            console.log(this + 'show selected')
            div.animate({
                height: '100%'
                }).show()
            $(this).attr('value','Hide')
        
            }
       });
}

pointLegend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend');
    categories = ['ORIGIN','DESTINATION'];

    for (var i = 0; i < categories.length; i++) {
        div.innerHTML +=
            '<i class="circle" style="background:' + getColor(categories[i]) + '"></i> ' +
             (categories[i] ? categories[i] + '<br>' : '+');

    }

    return div;
};

sepLegend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
    grades = [0, 5, 10, 20, 30, 40, 50, 60],
    labels = [];

    for (var i = 0; i < grades.length; i++) {

            div.innerHTML +=
            '<i style="background:' + getSepColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
};

zipLegend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
    grades = [0, 1, 2, 5, 10, 15, 20, 30],
    labels = [];

    for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
            '<i style="background:' + getZipColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
};

ctyLegend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
    grades = [0, 5, 10, 20, 30, 40, 50, 60],
    labels = [];

    for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
            '<i style="background:' + getCtyColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }
    return div;
};

function getColor(d) {
    return  d == 'ORIGIN' ? "#259CEF" :
            d == 'DESTINATION' ? "#4BF01B" :
                                 'red' ;
}

function getBaseColor(rte) {
    return rte == 90  ? '#d02c0f' :
           rte == 100 ? '#0069AA' :
           rte == 190 ? '#FFC425' :
           rte == 200 ? '#008752' :
           rte == 203 ? '#c044ec' :
           rte == 290 ? '#D15F27' :
                        '#1c4ca5' ;
}

function getSepColor(pct) {
    return  pct > 60 ? '#d73027' :
            pct > 50 ? '#f46d43' :
            pct > 40 ? '#fdae61' :
            pct > 30 ? '#fee08b' :
            pct > 20 ? '#d9ef8b' :
            pct > 10 ? '#a6d96a' :
            pct > 5  ? '#66bd63' :
                       '#1a9850';
}

function getZipColor(pct) {
    return  pct > 30 ? '#f46d43' :
            pct > 30 ? '#f46d43' :
            pct > 20 ? '#fdae61' :
            pct > 15 ? '#fee08b' :
            pct > 10 ? '#ffffbf' :
            pct > 5  ? '#e6f598' :
            pct > 2  ? '#abdda4' :
            pct > 1  ? '#66c2a5' :
                       '#3288bd';
}

function getCtyColor(pct) {
    return  pct > 60 ? '#d73027' :
            pct > 50 ? '#f46d43' :
            pct > 40 ? '#fdae61' :
            pct > 30 ? '#fee090' :
            pct > 20 ? '#e0f3f8' :
            pct > 10 ? '#abd9e9' :
            pct > 5  ? '#74add1' :
                       '#4575b4';
}

//function to remove legends
function removeLegend()
{
    mymap.removeControl(pointLegend);
    mymap.removeControl(sepLegend);
    mymap.removeControl(zipLegend);
    mymap.removeControl(ctyLegend);
    mymap.removeControl(infoZip);
    mymap.removeControl(infoSep);
    mymap.removeControl(infoCty);
}