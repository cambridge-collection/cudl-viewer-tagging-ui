
import GoogleMapsLoader from 'google-maps';


export var gmapImpl = {

 	originLatLng : [52.2051, 0.10834], // location of CUDL

    google: {},
    map : {},
    infowindow : {},
    geocoder : {},
    marker : {},
    markers : [],

    initGMLoader : function() {
        GoogleMapsLoader.KEY      = 'AIzaSyBzPB8FfB31q742f0HcsPx6aycNlWKWAgE'; // cudl api key
        GoogleMapsLoader.SENSOR   = false;
        GoogleMapsLoader.LANGUAGE = 'en';
    },

    init : function(options) {

    	this.el    = options.el;
    	this.input = options.input;

		this.initGMLoader();
        
		GoogleMapsLoader.load(google => {
            this.google = google;

			this.geocoder   = new google.maps.Geocoder();
			this.infowindow = new google.maps.InfoWindow();

			var mapOptions = {
				center : {
					lat: this.originLatLng[0],
					lng: this.originLatLng[1]
				},
				zoom: 1,
				zoomControl: false,
				disableDefaultUI: true,
				streetViewControl: false
			};

            this.map = new google.maps.Map(this.el, mapOptions);

			// add event hadnler
			google.maps.event.addListener(this.map, 'click', e => {

				//
				// automatically geocode the location where user clicks to city or country
                // based on current zoom level
				//

				this.geocoder.geocode({'latLng': e.latLng}, (results, status) => {
					if (status == google.maps.GeocoderStatus.OK) {
						if (results[1]) {
							
                            var zoom = this.map.getZoom();

							// clear markers
							this.clearMarkers();

							// create new marker
							this.map.setZoom(8);
							this.map.setCenter(e.latLng);
							this.marker = new google.maps.Marker({
								position: e.latLng,
								map: this.map
							});
							this.marker.setMap(this.map);
							this.markers.push(this.marker);

							// set place
							var city = this.getPlace( results[0].address_components, zoom);
							$(this.input).val( city );

						} else {
							alert('Geocoder failed due to: ' + status);
						}
					}
				});
			});

		});

    },
    
    getPlace : function(address_components, zoom) {
    	var city, country, place;
    	$.each(address_components, function(i, addr_comp) {
    		if (addr_comp.types[0] == 'locality') {
    			city = addr_comp.long_name;
    		} else if (addr_comp.types[0] == 'country') {
    			country = addr_comp.long_name;
    		}
    	});
    	
    	if (zoom <= 4) { // get country
    		place = country;
    	} else { // get country and city
    		place = city + (country.length > 0 ? ', ' + country : country);
    	}
    	
    	return place;
    },

    clearMarkers : function() {
    	for (var i=0; i < this.markers.length; i++) {
    		this.markers[i].setMap(null);
    	}
    	this.markers.length = 0;
    },

    refresh : function() {
        this.google.maps.event.trigger(this.map, 'resize');
        this.map.setCenter(new this.google.maps.LatLng(this.originLatLng[0], this.originLatLng[1]));
        this.map.setZoom(0);
        this.clearMarkers();
    }

 }