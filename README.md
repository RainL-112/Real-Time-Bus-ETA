# KMB Bus Services Web Application

![](demo.jpg)

A web application that helps users find nearby KMB bus stops in Hong Kong, view real-time estimated arrival times (ETAs), and visualize locations on an interactive map.

## Features

- **Geolocation-based Bus Stop Finder**: 
  - Finds bus stops within user-selectable distances (100m-500m)
  - Sorts results by proximity to user's current location

- **Real-time Bus Arrival Information**:
  - Displays ETAs for upcoming buses
  - Shows route numbers and destinations
  - Filters to show only the next 3 arrivals per route

- **Interactive Map Visualization**:
  - Shows user location and bus stop locations
  - Dynamic zoom level based on distance
  - Custom markers for user and bus stops

- **Performance Optimizations**:
  - Caching system for bus stop data
  - Responsive design for mobile and desktop

## Technologies Used

- **Frontend**:
  - HTML5, CSS3, JavaScript (ES6+)
  - OpenLayers (for interactive maps)
  - Service Worker API (for caching)

- **APIs**:
  - KMB Open Data API (for bus stops and ETAs)
  - OpenStreetMap Nominatim (for reverse geocoding)
  - Browser Geolocation API

## Installation

For development:
1. Clone this repository
2. Open `index.html` in your browser

## Usage

1. Allow location access when prompted
2. Select your desired search radius (default: 200m)
3. Click on any bus stop to:
   - View upcoming bus arrivals
   - See the stop location on an interactive map

## API Documentation

This application uses the following public APIs:

1. **KMB Open Data API**:
   - Bus stop locations: `https://data.etabus.gov.hk/v1/transport/kmb/stop`
   - Bus arrival times: `https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/{stop_id}`

     [KMB ETA API Specification](https://data.etabus.gov.hk/datagovhk/kmb_eta_api_specification.pdf)

2. **OpenStreetMap APIs**:
   - Map tiles (via OpenLayers)
   - Reverse geocoding: `https://nominatim.openstreetmap.org/reverse`


## License

This project uses open data provided by the HKSAR Transport Department under their [Open Data Terms of Use](https://data.gov.hk/en/terms-and-conditions).

## Acknowledgments

- KMB for providing open data
- OpenStreetMap contributors
- OpenLayers for the mapping library
