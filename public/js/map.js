// Get data from hidden inputs
const mapToken = document.getElementById('mapToken').value;
const coordinatesString = document.getElementById('listingCoordinates').value;
const locationString = document.getElementById('listingLocation').value;

console.log("Map token:", mapToken);
console.log("Listing coordinates string:", coordinatesString);
console.log("Listing location:", locationString);

try {
  // Parse coordinates from string
  const coordsArray = coordinatesString.split(',').map(Number);
  
  // Validate coordinates
  let validCoordinates = [77.2090, 28.6139]; // Default to Delhi
  
  if (coordsArray.length === 2 && !isNaN(coordsArray[0]) && !isNaN(coordsArray[1])) {
    const lng = coordsArray[0];
    const lat = coordsArray[1];
    
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      validCoordinates = [lng, lat];
    }
  }
  
  console.log("Using coordinates:", validCoordinates);
  
  const map = new mapboxgl.Map({
    accessToken: mapToken,
    container: 'map', // container ID
    center: validCoordinates, // listing coordinates [lng, lat]
    zoom: 13 // starting zoom
  });

  // Create popup with location information
  const popup = new mapboxgl.Popup({ 
    offset: 25,
    className: 'map-popup'
  })
    .setHTML(`<h3 style="margin: 0 0 5px 0; font-size: 14px;">Testing coordinates</h3><p style="margin: 0; font-size: 12px;">Exact location provided after booking</p>`);

  // Add marker at listing location with popup
  const marker = new mapboxgl.Marker()
    .setLngLat(validCoordinates)
    .setPopup(popup)
    .addTo(map);
    
  // Open popup by default
  popup.addTo(map);
} catch (error) {
  console.error("Error initializing map:", error);
}