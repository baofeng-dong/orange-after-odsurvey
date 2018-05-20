    var sel_line = '';
    var sel_dir = '';
    var sel_boundary = '';
    var dest_sep = '';
    var sep_dict = {};
    var zip_dict = {};
    var zipcode_geojson = {};
    var sepLayer = "sep_bounds.geojson";
    var tmLayer = "tm_fill.geojson";
    var zipLayer = "zipcode_tm.geojson";
    var ctyLayer = "co_fill_tm.geojson";
    var boundary;
    var sepLegend = L.control({position: 'topleft'});
    var zipLegend = L.control({position: 'topleft'});
    var pointLegend = L.control({position: 'topright'});
    var ctyLegend = L.control({position: 'topleft'});
    var infoZip = L. control(); //for storing info when mouseover
    var infoSep = L. control();
    var infoCty = L.control();
    var dict = {}; //percentage data dictionary
    var dictCount = {}; //count data dictionary
    var stopsDict = {}; //stores stops info
    //dictionary for storing query params and values
    var sel_args = {
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

    //creates a list to store origin and destination latlng objects
    var originList = [];
    var destinationList = [];
    var dir_lookup = {};
    // creates layers for orig and dest markers
    var origMarkersLayer = new L.LayerGroup();
    var destMarkersLayer = new L.LayerGroup();
    //create layer of orig dest points pair layer
    var odPairLayer = new L.FeatureGroup();
    //create layer to store all orig dest points and path
    var odPairLayerGroup = new L.FeatureGroup();
    //create layer of transit routes layer
    var routeLayer = new L.FeatureGroup();
    //create boundary geojson layergroup
    var boundaryLayer = new L.FeatureGroup();
    //create origin and destination points heat layergroups
    var originHeatGroup = new L.FeatureGroup();
    var destHeatGroup = new L.FeatureGroup();

    var hasLegend = false;
    var highLight = null;
    var selected;
    var pathStyle = {
                color: '#ff6600',
                weight: 3,
                opacity: 0.6,
                smoothFactor: 1,
                dashArray: '10,15',
                clickable: true
    };
    var dmarkerStyle = {
                clickable: true,
                fillColor: "#4BF01B",
                radius: 10,
                weight: 1,
                opacity: 0.2,
                fillOpacity: 0.6
    };
    var omarkerStyle = {
                clickable: true,
                fillColor: "#259CEF",
                radius: 10,
                weight: 1,
                opacity: 0.2,
                fillOpacity: 0.6
    };
    var newStyle = {
                color:'red',
                opacity: 0.9,
                weight:5
    }
    var heatmapOptions = {
                radius: 25,
                maxZoom:16
    }

//initialize map 
$(document).ready(function() {
    mymap = L.map('mapid', {scrollWheelZoom:true}).setView([45.48661, -122.65343], 11);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG11c2VyMTk3IiwiYSI6ImNpc254cHk1YTA1dngydm14bjkyamQ1NmsifQ.8ya7T1hHXtVmYOwMrVIuFw', {
    attribution: '<a href="https://www.mapbox.com/about/maps/" target="_blank">&copy; Mapbox &copy; OpenStreetMap</a>',
    id: 'mapbox.light',
    maxZoom: 18,
    minZoom: 10
    }).addTo(mymap);
    console.log(mymap);

    var sidebar = L.control.sidebar({ container: 'sidebar' })
            .addTo(mymap)
            .open('home');


    //add TriMet service district boundary to map on load
    addBoundaryLayer(tmLayer);

    //add point legend on load
    console.log(pointLegend);
    //pointLegend.addTo(mymap);
    //pointLegend.setPosition('topright');

    //set mapview checkbox for point map true
    $('input.checkview')[0].checked = true;
    //set mapview checkboxes for heatmap false
    $('input.checkview')[1].checked = false;
    $('input.checkview')[2].checked = false;

    $("input[type='checkbox']").change(
        function() {
            $('input[type="checkbox"]').not(this).prop('checked', false);
            if ($('input.checkview')[0].checked) {
                //clear layers
                resetLayers();
                removeLayers(mymap);
                removeLegend();
                addBoundaryLayer(tmLayer);
                //pointLegend.addTo(mymap);
                rebuild(sel_args);
                if (sel_args.rte && sel_args.dir) {
                    rebuildPath(sel_args);
                }
                if (sel_line && sel_dir !== null) {
                    addRouteJson(sel_line,0);
                    console.log("route geojson added!");
                }
            } else if ($('input.checkview')[1].checked) {
                resetLayers();
                removeLayers(mymap);
                removeLegend();
                addBoundaryLayer(tmLayer);
                buildHeatmap(sel_args, addOriginHeatMap, function(){});
                if (sel_line && sel_dir !== null) {
                    addRouteJson(sel_line,0);
                    console.log("route geojson added!");
                }
            } else if ($('input.checkview')[2].checked) {
                //clear and reset layers
                resetLayers();
                removeLayers(mymap);
                removeLegend();
                addBoundaryLayer(tmLayer);
                buildHeatmap(sel_args, function(){}, addDestHeatMap);
                console.log("dest heatmap added!");
                if (sel_line && sel_dir !== null) {
                    addRouteJson(sel_line,0);
                    console.log("route geojson added!");
                }
            } else if ($('input.checkview')[3].checked) {
                //clear and reset layers
                resetArgs();
                resetLayers();
                removeLayers(mymap);
                addBoundaryLayer(tmLayer);
                removeLegend();
                zipLegend.addTo(mymap);
                infoZip.addTo(mymap);
                console.log("zipcode checkbox checked!");
                console.log($(this).attr("value"));
                sel_boundary = $(this).attr("value");
                console.log("boundary selected: " + sel_boundary);
                sel_args.boundary = sel_boundary;
                requestBoundaryData(sel_args, zipLayer, addBoundaryLayer);

            } else if ($('input.checkview')[4].checked) {
                //clear and reset layers
                resetLayers();
                removeLayers(mymap);
                resetArgs();
                console.log(sel_args);
                addBoundaryLayer(tmLayer);
                removeLegend();
                sepLegend.addTo(mymap);
                infoSep.addTo(mymap);
                //addBoundaryLayer("sep_bounds.geojson");
                console.log("sep checkbox checked!");
                console.log($(this).attr("value"));
                sel_boundary = $(this).attr("value");
                console.log("boundary selected: " + sel_boundary);
                sel_args.boundary = sel_boundary;
                requestBoundaryData(sel_args, sepLayer, addBoundaryLayer);
            } else {
                //clear and reset layers
                resetArgs();
                resetLayers();
                removeLayers(mymap);
                addBoundaryLayer(tmLayer);
                removeLegend();
                ctyLegend.addTo(mymap);
                infoCty.addTo(mymap);
                console.log("county checkbox checked!");
                console.log($(this).attr("value"));
                sel_boundary = $(this).attr("value");
                console.log("boundary selected: " + sel_boundary);
                sel_args.boundary = sel_boundary;
                requestBoundaryData(sel_args, ctyLayer, addBoundaryLayer);
            }
        });

    //toggle_tb();

    //load map with markers on initial page load with no filter params
    console.log(sel_args);
    rebuild(sel_args);
    //function for when a bus/MAX/WES route is selected
    $('#filter_line a').on('click', function() {
        sel_line = $(this).attr('rte');
        console.log(sel_line);
        sel_args.rte = sel_line;
        resetZipSep();
        sel_dir = '';
        console.log(sel_dir);
        sel_args.dir = sel_dir;
        console.log(sel_args);
        $("#line_btn").text(this.text+' ').append('<span class="caret"></span>');

        if (this.text == "All") {
            //resert direction
            //show directions even the select is all
            $(".direction_cls").show();
            sel_args.rte = '';
        }
        else {
            //update direction dropdown with correct names
            var dir = dir_lookup[sel_line];
            console.log(this.text);
            //console.log(dir_lookup);
            $("#outbound_link").text(dir[0].dir_desc).attr("dir", dir[0].dir).show();
            //console.log(dir);
            $("#inbound_link").text(dir[1].dir_desc).attr("dir", dir[1].dir).show();
            $(".direction_cls").show();
        }
        
        $("#dir_btn").text('All ').append('<span class="caret"></span>');
        
        if (sel_line == 'All') {
            sel_line = '';
            sel_dir = '';
            sel_args.rte = '';
            sel_args.dir = '';
        }
        resetLayers();
        addBoundaryLayer(tmLayer);
        //add mapview based on which checkbox is selected
        addMapview();
        //requestBoundaryData(sel_args, sepLayer, addBoundaryLayer);
        if (sel_line && sel_dir !== null) {
            addRouteJson(sel_line,0);
            console.log("route geojson added!");
        }
    });
    //function for when direction for a route is selected
    $('#filter_dir a').on('click', function() {
        sel_dir = $(this).attr("dir");
        console.log("sel_dir: " + sel_dir);
        sel_args.dir = sel_dir;
        console.log(sel_args);
        $("#dir_btn").text(this.text+' ').append('<span class="caret"></span>');
        
        if (sel_dir == 'All') {
            sel_dir = '';
            sel_args.dir = '';
        } 
        console.log(sel_dir);
        console.log(sel_args);
        resetLayers();
        addBoundaryLayer(tmLayer);
        //add map based on which mapview box is checked
        addMapview();
        //add route geojson based on rte and dir
        addRouteJson(sel_line,sel_dir);
    });
    //function for when day of week is selected
    $('#filter_day a').on('click', function() {
        var sel_day = this.text
        console.log("day selected: " + sel_day)
        sel_args.day = sel_day;

        $("#day_btn").text(this.text+' ').append('<span class="caret"></span>');
        resetLayers();
        addBoundaryLayer(tmLayer);
        //add maps based on which mapview checkbox is checked
        addMapview();
    });
    //function for when origin type is selected
    $('#filter_origin a').on('click', function() {
        var sel_orig = this.text
        console.log("origin selected: " + sel_orig)
        if (sel_orig == 'All') {
            sel_args.orig = '';
        } else {
            sel_args.orig = sel_orig;
        }
        $("#origin_btn").text(this.text+' ').append('<span class="caret"></span>');

        resetLayers();
        addBoundaryLayer(tmLayer);
        //add maps based on which mapview checkbox is checked
        addMapview();
        if (sel_line && sel_dir !== null) {
            addRouteJson(sel_line,0);
            console.log("route geojson added!");
        }
    });
    //function for when destination type is selected
    $('#filter_dest a').on('click', function() {
        var sel_dest = this.text
        console.log("destination selected: " + sel_dest);
        if (sel_dest == 'All') {
            sel_args.dest = '';
        } else {
            sel_args.dest = sel_dest;
        }

        $("#dest_btn").text(this.text+' ').append('<span class="caret"></span>');

        resetLayers();
        addBoundaryLayer(tmLayer);
        //add maps based on which mapview checkbox is checked
        addMapview();
        if (sel_line && sel_dir !== null) {
            addRouteJson(sel_line,0);
            console.log("route geojson added!");
        }
    });
    //function for when time of day is selected
    $('#filter_tod a').on('click', function() {
        var sel_tod = this.text
        console.log("time of day selected: " + sel_tod);
        if (sel_tod == 'All') {
            sel_args.tod = '';
        }
        else {
            sel_args.tod = sel_tod;
        }

        $("#tod_btn").text(this.text+' ').append('<span class="caret"></span>');

        resetLayers();
        addBoundaryLayer(tmLayer);
        //add maps based on which mapview checkbox is checked
        addMapview();
    });

});

    //set when a route, direction or user is selected from dropdowns
    $(directions).each(function(index, item) {
        //console.log(directions);
        if(!dir_lookup.hasOwnProperty(item.rte)) {
            dir_lookup[item.rte] = [null, null];
        }
        dir_lookup[item.rte][item.dir] = item;

    });

    console.log(dir_lookup);



