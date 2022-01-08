// tile layers for map backgrounds
var defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// grayscale layer
var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

// watercolor layer
var watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
});

// topography layer
var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// basemaps object
let basemaps = {
    Default: defaultMap,
    Grayscale: grayscale,
    "Water Color": watercolor,
    Topography: topo
}

// map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 5,
    layers: [defaultMap, grayscale, watercolor, topo]
});

// add default map
defaultMap.addTo(myMap);

// get tectonic plate data and display on map
// create variable to hold tectonic plates layer
let tectonicPlates = new L.layerGroup();

// call the api to get info for tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    // console log to confirm data loads
    // console.log(plateData);

    // load data using geoJson and add to tectonic plates layer group
    L.geoJson(plateData,{
        // add styling to make lines visible
        color: "yellow",
        weight: 1
    }).addTo(tectonicPlates);
});

// add tectonic plates to map
tectonicPlates.addTo(myMap);

// get earthquake data and display on map
// create variable to hold earthquake layer
let earthquakes = new L.layerGroup();

// call the api to get info for earthquakes
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
    function(earthquakeData){
        // console log to confirm data loads
        // console.log(earthquakeData);
        // plot circles where radius is magnitude and color is depth
        // make function that chooses color of data point
        function dataColor(depth){
            if (depth > 90)
                return "red";
            else if(depth > 70)
                return "#fc4903";
            else if(depth > 50)
                return "#fc8403";
            else if(depth > 30)
                return "#fcad03";
            else if(depth > 10)
                return "#cafc03";
            else
                return "green";
        }

        // make function to determine radius size
        function radiusSize(mag){
            if (mag == 0)
                return 1; // makes sure 0 mag earthquake displays
            else
                return mag * 5; // makes sure circle is pronounced on map
        }

        // add on to the style for each data point
        function dataStyle(feature)
        {
            return {
                opacity: .5,
                fillOpacity: .5,
                fillColor: dataColor(feature.geometry.coordinates[2]), // index 2 for depth
                color: "000000", // black outline
                radius: radiusSize(feature.properties.mag), // grabs the magnitude
                weight: 0.5,
                stroke: true
            }
        }

        // load data using geoJson and add to earthquake layer group
        L.geoJson(earthquakeData,{
            // make each feature into a circle marker visible on map
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            // set style for each marker
            style: dataStyle, // calls the data style function and passes in earthquake data
            // add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]} km</b><br>
                                Location: <b>${feature.properties.place}</b>`);
            }
        }).addTo(earthquakes);
});

// add earthquakes to map
earthquakes.addTo(myMap);


// add overlays for tectonic plates and earthquakes
let overlays = {
    "Tectonic Plates": tectonicPlates,
    "Earthquakes": earthquakes
};

// add Layer control
L.control
    .layers(basemaps, overlays)
    .addTo(myMap);

// add legend to map
var legend = L.control({
    position: "bottomright"
});

// add properties for legend
legend.onAdd = function() {
    // div for the legend to appear on page
    var div = L.DomUtil.create("div", "info legend");

    // set up intervals
    intervals = [-10, 10, 30, 50, 70, 90];

    // set colors for intervals
    var colors = [
        "green",
        "#cafc03",
        "#fcad03",
        "#fc8403",
        "#fc4903",
        "red"
    ];

    // loop through intervals and colors, generate label with colored square for each interval
    for (var i = 0; i < intervals.length; i++)
    {
        // inner html to set square for each interval and label
        div.innerHTML += "<i style='background: "
            + colors[i]
            + "'></i> "
            + intervals[i]
            + (intervals[i + 1] ? "km - " + intervals[i + 1] + "km<br>" : "+");
    }
    return div;
};

// add legend to map
legend.addTo(myMap);

