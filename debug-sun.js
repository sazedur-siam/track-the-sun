
const SunCalc = require('suncalc');

// Test Case 1: Noon in London (Should be sunny)
const londonLat = 51.5074;
const londonLng = -0.1278;
const dateNoon = new Date('2023-06-21T12:00:00Z'); // Summer Solstice Noon UTC

const pos1 = SunCalc.getPosition(dateNoon, londonLat, londonLng);
const alt1 = (pos1.altitude * 180) / Math.PI;
console.log(`London Summer Noon Altitude: ${alt1.toFixed(2)}° (Should be > 0)`);

// Test Case 2: Midnight in London (Should be dark)
const dateMidnight = new Date('2023-06-21T00:00:00Z');
const pos2 = SunCalc.getPosition(dateMidnight, londonLat, londonLng);
const alt2 = (pos2.altitude * 180) / Math.PI;
console.log(`London Summer Midnight Altitude: ${alt2.toFixed(2)}° (Should be < 0)`);

// Test Case 3: Decode Polyline Check (Google Example)
// Encoded: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
// Coordinates: (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
function decodePolyline(encoded) {
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

const encoded = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
const decoded = decodePolyline(encoded);
console.log('Decoded Polyline Result:');
console.log(decoded);
// Expected Matches:
// [ [ 38.5, -120.2 ], [ 40.7, -120.95 ], [ 43.252, -126.453 ] ]
