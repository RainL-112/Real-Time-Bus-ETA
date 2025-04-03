window.addEventListener('load', fetchData);
window.addEventListener('unload', delCache);

function getLocation() {
    return new Promise((success, error) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {success([position.coords.latitude, position.coords.longitude]);},
            () => {error("Unable to retrieve your location");}
        );
      } else {
        error("Geolocation is not supported by your browser");
      }
    });
  }

async function fetchData() {
    let cacheData = await caches.open('my-cache');
    let request = new Request("https://data.etabus.gov.hk/v1/transport/kmb/stop");

    let cachedResponse = await cacheData.match(request);
    if (!cachedResponse) {
        console.log("no data in cache");
        let response = await fetch(request);
        let data = await response.json();
        console.log(data);
        sessionStorage.setItem("data", JSON.stringify(data.data));
        cacheData.put(request, new Response(JSON.stringify(data)));
        display();
    } else {
        console.log("data restored from cache");
        let cachedData = await cachedResponse.json();
        console.log(cachedData);
        sessionStorage.setItem("data", JSON.stringify(cachedData.data));
        display();
    }
}

async function delCache() {
    sessionStorage.removeItem("data");
    const cacheData = await caches.open('my-cache');

    if (cacheData) {
        const request = new Request("https://data.etabus.gov.hk/v1/transport/kmb/stop");
        await cacheData.delete(request);
    }
}

function display() {
    return getLocation().then(([lat, long]) => {
        let output = '';
        const limit = document.querySelector("#distance").value;
        const x = document.getElementById("busStops");

        const busStops = JSON.parse(sessionStorage.getItem("data"));

        if (busStops.length !== 0) {
            var sorted = [];
            busStops.forEach(stop => {
            let distance = haversine(lat, long, stop.lat, stop.long);
                if (distance <= limit) {
                    sorted.push({distance: Math.round(distance), 
                                name: stop.name_en, 
                                id: stop.stop, 
                                lat: stop.lat,
                                long: stop.long});
                }
            });
            if (sorted.length === 0) {
                output += '<div class="no_record"> Cannot locate nearby bus stops </div>';
            } else {
                sorted.sort((a, b) => a.distance - b.distance);
                sorted.forEach(sorted => {
                    output += '<div class="all"> <div class="record"> <div class="control"> <span class="name"> <span class="bold">D</span>ISTANCE: </span>' + 
                                '<span class="data">' + sorted.distance + 'm</span>' +
                                '<span class="name"> <span class="bold">S</span>TOP: </span> </div>' +
                                `<span class="stopName" data-stop-id="${sorted.id}">` + sorted.name + '</span><br></div>' +
                                `<div class="addition"> <div class="etaInfo" id="etaInfo-${sorted.id}"></div>` + 
                                `<div class="mapInfo" id="map-${sorted.id}"></div> </div></div>`;
                });
            }
        } else {
            output += '<div class="no_record"> Cannot locate nearby bus stops </div>';
        }
        
        x.innerHTML = output;

        const stopNames = document.querySelectorAll(".stopName");
        stopNames.forEach(stopName => {
            stopName.addEventListener("click", function(event) {
                clear();

                const record = event.target.closest(".record");
                const all = event.target.closest(".all");
                const control = record.querySelector(".control");
                const addition = all.querySelector(".addition");
                
                control.classList.toggle("highlight");
                event.currentTarget.classList.toggle("highlight");
                addition.classList.toggle("show");

                record.scrollIntoView();

                let stop_id = event.currentTarget.dataset.stopId;
                sorted.forEach(item => {
                    if (item.id === stop_id) {
                        showMap([lat, long], [item.lat, item.long], stop_id);
                    }
                });
                displayETA(stop_id);
            });
        });
    });
}

function displayETA(stop_id) {
    fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stop_id}`)
        .then(response =>  response.json())
        .then(data => {
            const y = document.getElementById(`etaInfo-${stop_id}`);
            let etaOutput = "";

            const routes = new Map();
            
            data.data.forEach(route => {
                if (route.eta && route.eta_seq <= 3 && route.service_type === 1) {
                    const key = `${route.route}-${route.dir}`;
                    
                    if (!routes.has(key)) {
                        routes.set(key, {
                            routeNo: route.route,
                            dir: route.dir,
                            destination: route.dest_en,
                            etas: []
                        });
                    }
                    
                    const etaTime = new Date(route.eta);
                    const formatted = etaTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });

                    routes.get(key).etas.push({
                        time: formatted,
                        seq: route.eta_seq
                    });                        
                }
            });

            console.log(routes);

            if (routes.size == 0) {
                etaOutput += '<div class="no_record"> No bus route information </div>';
            } else {
                routes.forEach(route => {
                    route.etas.sort((a, b) => a.seq - b.seq);
                    etaOutput += '<div class="eta_record"> <div class="title"> <span class="eta_route">' + route.routeNo + 
                                '</span> <span class="dest">' + route.destination + '</span> </div>' +
                                '<div class="eta_time"> <span class="eta_label"> ETA: </span>' 
                
                    route.etas.forEach(eta => {
                        etaOutput += '<span class="time">' + eta.time + '</span>';
                    });

                    etaOutput += '</div></div>';
                });            
            }
            y.innerHTML = etaOutput;
        });
}

var gmap;
function showMap([lat, long], [stopLat, stopLong], stop_id) {
    const clear = document.getElementById(`map-${stop_id}`);
    clear.innerHTML = "";

    gmap = new ol.Map({
        target: `map-${stop_id}`,
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        view: new ol.View({
          center: ol.proj.fromLonLat([114.2, 22.28]),
          zoom: 11
        })
    });

    var zoomX;
    let distance = haversine(lat, long, stopLat, stopLong);
    if (distance <= 50) {
        zoomX = 20;
    } else if (distance <= 100) {
        zoomX = 18;
    } else if (distance <= 300) {
        zoomX = 17;
    } else if (distance <= 400) {
        zoomX = 16;
    } else {
        zoomX = 16;
    }
    gmap.setView(new ol.View({
      center: ol.extent.getCenter(ol.extent.boundingExtent([
        ol.proj.fromLonLat([long, lat]),
        ol.proj.fromLonLat([stopLong, stopLat])
        ])),
      zoom: zoomX
    }));

    let myfeature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([long, lat]))
    });
    let myicon = new ol.style.Style ({
      image: new ol.style.Icon({
        anchor: [0.5, 0.9],
        src: 'map-marker.ico'
      })
    });
    myfeature.setStyle(myicon);

    let myfeature2 = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([stopLong, stopLat]))
      });
      let myicon2 = new ol.style.Style ({
        image: new ol.style.Icon({
          anchor: [0.5, 0.9],
          src: 'bus-icon.ico'
        })
      });
      myfeature2.setStyle(myicon2);

    let layer = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [myfeature, myfeature2]
      })
    });
    gmap.addLayer(layer);

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}&zoom=18&addressdetails=1`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
    })
    .catch(err => {
      console.log(err);
    })

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${stopLat}&lon=${stopLong}&zoom=18&addressdetails=1`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
    })
    .catch(err => {
      console.log(err);
    })
}

function clear() {
    document.querySelectorAll('.mapInfo').forEach(el => {
        el.innerHTML = "";
    });
    document.querySelectorAll('.etaInfo').forEach(el => {
        el.innerHTML = "";
    });
    document.querySelectorAll('.highlight').forEach(el => {
        el.classList.remove('highlight');
    });
    document.querySelectorAll('.show').forEach(el => {
        el.classList.remove('show');
    });
}

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // earth's radius in meters
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; // in meters

    return distance;
}
