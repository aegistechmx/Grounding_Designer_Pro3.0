import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, useMapEvents, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Configuración del icono del marcador (evita problemas con Webpack)
const markerIcon = new L.Icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Calcula el área de un rectángulo definido por dos puntos geográficos
 * @param {Object} southWest - Esquina suroeste { lat, lng }
 * @param {Object} northEast - Esquina noreste { lat, lng }
 * @returns {number} Área en metros cuadrados
 */
const calculateRectangleArea = (southWest, northEast) => {
  const R = 6371000; // Radio de la Tierra en metros
  
  const lat1 = southWest.lat * Math.PI / 180;
  const lat2 = northEast.lat * Math.PI / 180;
  const lon1 = southWest.lng * Math.PI / 180;
  const lon2 = northEast.lng * Math.PI / 180;
  
  // Calcular ancho (distancia horizontal)
  const dLon = lon2 - lon1;
  const width = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon)
  ) * R;
  
  // Calcular alto (distancia vertical)
  const dLat = lat2 - lat1;
  const height = dLat * R;
  
  // Área del rectángulo
  const area = Math.abs(width * height);
  
  return area;
};

/**
 * Calcula la distancia entre dos puntos geográficos (en metros)
 */
const calculateDistance = (point1, point2) => {
  const R = 6371000;
  const lat1 = point1.lat * Math.PI / 180;
  const lat2 = point2.lat * Math.PI / 180;
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

const MapClickHandler = ({ corners, setCorners, setBounds, setArea, onAreaSelect }) => {
  useMapEvents({
    click(e) {
      const newCorner = { lat: e.latlng.lat, lng: e.latlng.lng };
      const newCorners = [...corners, newCorner];
      
      if (newCorners.length === 2) {
        // Calcular rectángulo delimitador
        const southWest = {
          lat: Math.min(newCorners[0].lat, newCorners[1].lat),
          lng: Math.min(newCorners[0].lng, newCorners[1].lng)
        };
        const northEast = {
          lat: Math.max(newCorners[0].lat, newCorners[1].lat),
          lng: Math.max(newCorners[0].lng, newCorners[1].lng)
        };
        
        setBounds([southWest, northEast]);
        
        // Calcular dimensiones reales
        const length = calculateDistance(
          { lat: southWest.lat, lng: (southWest.lng + northEast.lng) / 2 },
          { lat: northEast.lat, lng: (southWest.lng + northEast.lng) / 2 }
        );
        const width = calculateDistance(
          { lat: (southWest.lat + northEast.lat) / 2, lng: southWest.lng },
          { lat: (southWest.lat + northEast.lat) / 2, lng: northEast.lng }
        );
        const calculatedArea = length * width;
        
        setArea(calculatedArea);
        onAreaSelect({ length, width, area: calculatedArea });
        setCorners([]);
      } else {
        setCorners(newCorners);
      }
    }
  });
  return null;
};

const MapAreaSelector = ({ onAreaSelect, darkMode, initialBounds }) => {
  const [bounds, setBounds] = useState(initialBounds || null);
  const [area, setArea] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [corners, setCorners] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.659698, -103.349609]); // Puerto Vallarta
  const [mapZoom, setMapZoom] = useState(13);
  const [isSelecting, setIsSelecting] = useState(false);

  // Buscar ubicación actual del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(15);
        },
        (error) => {
          console.warn('No se pudo obtener la ubicación:', error.message);
        }
      );
    }
  }, []);

  const handleReset = () => {
    setBounds(null);
    setArea(null);
    setDimensions(null);
    setCorners([]);
    setIsSelecting(false);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(16);
        },
        (error) => {
          alert('No se pudo obtener la ubicación: ' + error.message);
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización');
    }
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold flex items-center gap-2">
          <span>🗺️</span> Seleccionar Área de Malla en Mapa
        </h4>
        <div className="flex gap-2">
          <button
            onClick={handleUseCurrentLocation}
            className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="Usar mi ubicación actual"
          >
            📍 Mi ubicación
          </button>
          <button
            onClick={handleReset}
            className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="Limpiar selección"
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>
      
      <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mb-2`}>
        💡 Haz clic en <strong>dos puntos opuestos</strong> del mapa para definir el área rectangular de la malla
      </p>
      
      <MapContainer
        key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '400px', width: '100%', borderRadius: '8px' }}
        className="z-0"
      >
        <TileLayer
          url={darkMode 
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapClickHandler 
          corners={corners}
          setCorners={setCorners}
          setBounds={setBounds}
          setArea={setArea}
          onAreaSelect={onAreaSelect}
        />
        
        {bounds && (
          <Rectangle
            bounds={bounds}
            pathOptions={{ color: '#3b82f6', weight: 2, fillOpacity: 0.3 }}
          />
        )}
        
        {corners.map((corner, idx) => (
          <Marker key={idx} position={[corner.lat, corner.lng]} icon={markerIcon}>
            <Popup>
              <strong>Punto {idx + 1}</strong><br />
              Lat: {isFinite(corner.lat) ? corner.lat.toFixed(6) : 'N/A'}°<br />
              Lon: {isFinite(corner.lng) ? corner.lng.toFixed(6) : 'N/A'}°
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {area && (
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-sm font-semibold">📐 Área seleccionada</p>
          <p className="text-2xl font-bold text-blue-600">{isFinite(area) ? area.toFixed(0) : 'N/A'} m²</p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div>
              <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Largo:</span>
              <span className="ml-1 font-semibold">{isFinite(dimensions?.length) ? dimensions.length.toFixed(1) : (isFinite(Math.sqrt(area)) ? Math.sqrt(area).toFixed(1) : 'N/A')} m</span>
            </div>
            <div>
              <span className={darkMode ? 'text-gray-100' : 'text-gray-600'}>Ancho:</span>
              <span className="ml-1 font-semibold">{isFinite(dimensions?.width) ? dimensions.width.toFixed(1) : (isFinite(Math.sqrt(area)) ? Math.sqrt(area).toFixed(1) : 'N/A')} m</span>
            </div>
          </div>
          <button
            onClick={() => {
              const length = dimensions?.length || Math.sqrt(area);
              const width = dimensions?.width || Math.sqrt(area);
              onAreaSelect({ length, width, area });
            }}
            className="mt-2 w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
          >
            ✅ Aplicar estas dimensiones
          </button>
        </div>
      )}
      
      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
        <p className="font-semibold">📌 Instrucciones:</p>
        <ol className="list-decimal list-inside space-y-1 mt-1">
          <li>Haz clic en la <strong>esquina superior izquierda</strong> del área deseada</li>
          <li>Luego haz clic en la <strong>esquina inferior derecha</strong></li>
          <li>El área se calculará automáticamente</li>
          <li>Presiona "Aplicar" para usar estas dimensiones</li>
        </ol>
      </div>
      
      <div className={`mt-2 text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'}`}>
        💡 Sugerencia: Usa el botón "Mi ubicación" para centrar el mapa en tu posición actual
      </div>
    </div>
  );
};

export default MapAreaSelector;