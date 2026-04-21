/**
 * GeoSpatial Engine - UTM Coordinate System
 * Real-world coordinate conversions for professional engineering
 */

// ============================================
// 1. UTM COORDINATE SYSTEM CONSTANTS
// ============================================

const UTM_SCALE_FACTOR = 0.9996;
const UTM_FALSE_EASTING = 500000;
const UTM_FALSE_NORTHING = 0; // Southern hemisphere: 10000000

// WGS84 Ellipsoid parameters
const WGS84 = {
  a: 6378137, // Semi-major axis (meters)
  f: 1 / 298.257223563 // Flattening
};

// ============================================
// 2. LAT/LON TO UTM CONVERSION
// ============================================

/**
 * Convert latitude/longitude to UTM coordinates
 * @param {number} lat - Latitude in degrees (-90 to 90)
 * @param {number} lon - Longitude in degrees (-180 to 180)
 * @returns {Object} UTM coordinates { zone, easting, northing, hemisphere }
 */
export function latLonToUTM(lat, lon) {
  // Validate inputs
  if (typeof lat !== 'number' || typeof lon !== 'number' || 
      lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Invalid coordinates: lat must be -90 to 90, lon must be -180 to 180');
  }
  
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  
  // Determine UTM zone
  const zone = Math.floor((lon + 180) / 6) + 1;
  
  // Central meridian for the zone
  const centralMeridian = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
  
  // Ellipsoid parameters
  const e2 = 2 * WGS84.f - WGS84.f * WGS84.f;
  const ePrime2 = e2 / (1 - e2);
  const N = WGS84.a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
  const T = Math.tan(latRad) ** 2;
  const C = ePrime2 * Math.cos(latRad) ** 2;
  const A = Math.cos(latRad) * (lonRad - centralMeridian);
  const M = WGS84.a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * latRad -
    (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * latRad) +
    (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * latRad) -
    (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * latRad));
  
  // Calculate UTM coordinates
  const easting = UTM_SCALE_FACTOR * N * (A +
    (1 - T + C) * A * A * A / 6 +
    (5 - 18 * T + T * T + 72 * C - 58 * ePrime2) * A * A * A * A * A / 120) + UTM_FALSE_EASTING;
  
  let northing = UTM_SCALE_FACTOR * (M +
    N * Math.tan(latRad) * (A * A / 2 +
    (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24 +
    (61 - 58 * T + T * T + 600 * C - 330 * ePrime2) * A * A * A * A * A * A / 720));
  
  // Adjust for southern hemisphere
  const hemisphere = lat >= 0 ? 'N' : 'S';
  if (hemisphere === 'S') {
    northing += UTM_FALSE_NORTHING;
  }
  
  return {
    zone,
    easting,
    northing,
    hemisphere,
    centralMeridian: ((zone - 1) * 6 - 180 + 3)
  };
}

// ============================================
// 3. UTM TO LAT/LON CONVERSION
// ============================================

/**
 * Convert UTM coordinates to latitude/longitude
 * @param {number} zone - UTM zone (1-60)
 * @param {number} easting - Easting in meters (100000 to 999999)
 * @param {number} northing - Northing in meters
 * @param {string} hemisphere - 'N' or 'S'
 * @returns {Object} { lat, lon } in degrees
 */
export function utmToLatLon(zone, easting, northing, hemisphere) {
  // Validate inputs
  if (typeof zone !== 'number' || zone < 1 || zone > 60) {
    throw new Error('Invalid UTM zone: must be 1-60');
  }
  if (typeof easting !== 'number' || easting < 100000 || easting > 999999) {
    throw new Error('Invalid easting: must be 100000 to 999999');
  }
  if (typeof northing !== 'number' || northing < 0) {
    throw new Error('Invalid northing: must be non-negative');
  }
  if (hemisphere !== 'N' && hemisphere !== 'S') {
    throw new Error('Invalid hemisphere: must be N or S');
  }
  
  // Adjust for southern hemisphere
  const northingAdjusted = hemisphere === 'S' ? northing - UTM_FALSE_NORTHING : northing;
  const eastingAdjusted = easting - UTM_FALSE_EASTING;
  
  const centralMeridian = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
  
  const e2 = 2 * WGS84.f - WGS84.f * WGS84.f;
  const ePrime2 = e2 / (1 - e2);
  const M = northingAdjusted / UTM_SCALE_FACTOR;
  const mu = M / (WGS84.a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
  
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  
  // Calculate latitude using series
  const lat1 = mu +
    (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu) +
    (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu) +
    (151 * e1 * e1 * e1 / 96) * Math.sin(6 * mu);
  
  const N1 = WGS84.a / Math.sqrt(1 - e2 * Math.sin(lat1) ** 2);
  const T1 = Math.tan(lat1) ** 2;
  const C1 = ePrime2 * Math.cos(lat1) ** 2;
  const R1 = WGS84.a * (1 - e2) / Math.pow(1 - e2 * Math.sin(lat1) ** 2, 1.5);
  const D = eastingAdjusted / (N1 * UTM_SCALE_FACTOR);
  
  // Calculate final latitude
  const lat = lat1 -
    (N1 * Math.tan(lat1) / R1) *
    (D * D / 2 -
    (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ePrime2) * D * D * D * D / 24 +
    (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ePrime2 - 3 * C1 * C1) * D * D * D * D * D * D / 720);
  
  // Calculate longitude
  const lon = centralMeridian +
    (D -
    (1 + 2 * T1 + C1) * D * D * D / 6 +
    (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ePrime2 + 24 * T1 * T1) * D * D * D * D * D / 120) / Math.cos(lat1);
  
  return {
    lat: (lat * 180) / Math.PI,
    lon: (lon * 180) / Math.PI
  };
}

// ============================================
// 4. LOCAL COORDINATE TO UTM
// ============================================

/**
 * Convert local grid coordinates to UTM
 * @param {number} x - Local X coordinate (meters)
 * @param {number} y - Local Y coordinate (meters)
 * @param {Object} origin - Origin in UTM { zone, easting, northing, hemisphere }
 * @param {number} rotation - Grid rotation in degrees (default: 0)
 * @returns {Object} UTM coordinates { zone, easting, northing, hemisphere }
 */
export function localToUTM(x, y, origin, rotation = 0) {
  const rotationRad = (rotation * Math.PI) / 180;
  
  // Apply rotation
  const rotatedX = x * Math.cos(rotationRad) - y * Math.sin(rotationRad);
  const rotatedY = x * Math.sin(rotationRad) + y * Math.cos(rotationRad);
  
  return {
    zone: origin.zone,
    easting: origin.easting + rotatedX,
    northing: origin.northing + rotatedY,
    hemisphere: origin.hemisphere
  };
}

// ============================================
// 5. UTM TO LOCAL COORDINATE
// ============================================

/**
 * Convert UTM coordinates to local grid coordinates
 * @param {number} easting - UTM easting
 * @param {number} northing - UTM northing
 * @param {Object} origin - Origin in UTM { zone, easting, northing, hemisphere }
 * @param {number} rotation - Grid rotation in degrees (default: 0)
 * @returns {Object} Local coordinates { x, y }
 */
export function utmToLocal(easting, northing, origin, rotation = 0) {
  const rotationRad = (rotation * Math.PI) / 180;
  
  // Calculate offset from origin
  const dx = easting - origin.easting;
  const dy = northing - origin.northing;
  
  // Apply inverse rotation
  const x = dx * Math.cos(rotationRad) + dy * Math.sin(rotationRad);
  const y = -dx * Math.sin(rotationRad) + dy * Math.cos(rotationRad);
  
  return { x, y };
}

// ============================================
// 6. DISTANCE CALCULATIONS
// ============================================

/**
 * Calculate distance between two UTM points
 * @param {Object} p1 - First point { easting, northing }
 * @param {Object} p2 - Second point { easting, northing }
 * @returns {number} Distance in meters
 */
export function utmDistance(p1, p2) {
  const dx = p2.easting - p1.easting;
  const dy = p2.northing - p1.northing;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate bearing between two UTM points
 * @param {Object} p1 - First point { easting, northing }
 * @param {Object} p2 - Second point { easting, northing }
 * @returns {number} Bearing in degrees (0-360)
 */
export function utmBearing(p1, p2) {
  const dx = p2.easting - p1.easting;
  const dy = p2.northing - p1.northing;
  const bearing = (Math.atan2(dx, dy) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

// ============================================
// 7. GRID BOUNDS TO UTM
// ============================================

/**
 * Convert grid bounds to UTM bounding box
 * @param {Object} bounds - Local bounds { minX, maxX, minY, maxY }
 * @param {Object} origin - Origin in UTM
 * @param {number} rotation - Grid rotation
 * @returns {Object} UTM bounds { minEasting, maxEasting, minNorthing, maxNorthing }
 */
export function gridBoundsToUTM(bounds, origin, rotation = 0) {
  const corners = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.minX, y: bounds.maxY },
    { x: bounds.maxX, y: bounds.maxY }
  ];
  
  const utmCorners = corners.map(c => localToUTM(c.x, c.y, origin, rotation));
  
  return {
    minEasting: Math.min(...utmCorners.map(c => c.easting)),
    maxEasting: Math.max(...utmCorners.map(c => c.easting)),
    minNorthing: Math.min(...utmCorners.map(c => c.northing)),
    maxNorthing: Math.max(...utmCorners.map(c => c.northing))
  };
}

// ============================================
// 8. MEXICO CITY COORDINATES (DEFAULT)
// ============================================

export const MEXICO_CITY_UTM = {
  lat: 19.4326,
  lon: -99.1332,
  utm: latLonToUTM(19.4326, -99.1332)
};

export const PUERTO_VALLARTA_UTM = {
  lat: 20.6534,
  lon: -105.2253,
  utm: latLonToUTM(20.6534, -105.2253)
};

export default {
  latLonToUTM,
  utmToLatLon,
  localToUTM,
  utmToLocal,
  utmDistance,
  utmBearing,
  gridBoundsToUTM,
  MEXICO_CITY_UTM,
  PUERTO_VALLARTA_UTM
};
