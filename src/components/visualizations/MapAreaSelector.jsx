import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Rectangle, useMapEvents, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Maximize2, Minimize2, Download, RefreshCw, MapPin, 
  Ruler, Trash2, CheckCircle, AlertCircle, X, ZoomIn, ZoomOut,
  Navigation, Layers, Sun, Moon, Save
} from 'lucide-react';

// Configuración del icono del marcador
const markerIcon = new L.Icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono para ubicación actual
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para centrar el mapa
const MapCenterControl = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

// Componente para manejar clics y selección
const MapClickHandler = ({ corners, setCorners, setBounds, setArea, setDimensions, onAreaSelect, isSelecting }) => {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      if (!isSelecting) return;
      
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
        setDimensions({ length, width });
        onAreaSelect({ length, width, area: calculatedArea });
        setCorners([]);
        
        // Ajustar zoom para mostrar el área seleccionada
        const bounds = L.latLngBounds([southWest, northEast]);
        map.fitBounds(bounds);
      } else {
        setCorners(newCorners);
      }
    }
  });
  
  return null;
};

// Componente para controles personalizados
const MapControls = ({ onZoomIn, onZoomOut, onReset, onFullscreen, isFullscreen }) => {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Acercar"
      >
        <ZoomIn size={18} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Alejar"
      >
        <ZoomOut size={18} />
      </button>
      <button
        onClick={() => onReset()}
        className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Restablecer vista"
      >
        <RefreshCw size={18} />
      </button>
      <button
        onClick={onFullscreen}
        className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={isFullscreen ? "Salir pantalla completa" : "Pantalla completa"}
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  );
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

/**
 * Calcula el área de un rectángulo (en m²)
 */
const calculateRectangleArea = (southWest, northEast) => {
  const length = calculateDistance(
    { lat: southWest.lat, lng: (southWest.lng + northEast.lng) / 2 },
    { lat: northEast.lat, lng: (southWest.lng + northEast.lng) / 2 }
  );
  const width = calculateDistance(
    { lat: (southWest.lat + northEast.lat) / 2, lng: southWest.lng },
    { lat: (southWest.lat + northEast.lat) / 2, lng: northEast.lng }
  );
  return length * width;
};

// Componente principal
const MapAreaSelector = ({ onAreaSelect, darkMode, initialBounds, onClose }) => {
  const [bounds, setBounds] = useState(initialBounds || null);
  const [area, setArea] = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [corners, setCorners] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.659698, -103.349609]); // Puerto Vallarta
  const [mapZoom, setMapZoom] = useState(13);
  const [isSelecting, setIsSelecting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState('street');
  const [locationStatus, setLocationStatus] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [measurementHistory, setMeasurementHistory] = useState([]);
  
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  // Buscar ubicación actual del usuario
  const getCurrentLocation = useCallback(() => {
    setLocationStatus('loading');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation([lat, lng]);
          setMapCenter([lat, lng]);
          setMapZoom(17);
          setLocationStatus('success');
          
          // Agregar marcador temporal
          setTimeout(() => setLocationStatus(null), 3000);
        },
        (error) => {
          console.warn('Error de geolocalización:', error.message);
          setLocationStatus('error');
          setTimeout(() => setLocationStatus(null), 3000);
        }
      );
    } else {
      setLocationStatus('unsupported');
      setTimeout(() => setLocationStatus(null), 3000);
    }
  }, []);

  // Restablecer selección
  const handleReset = () => {
    setBounds(null);
    setArea(null);
    setDimensions(null);
    setCorners([]);
    setIsSelecting(true);
    if (mapRef.current) {
      mapRef.current.setView(mapCenter, 13);
    }
  };

  // Alternar pantalla completa
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Cambiar tipo de mapa
  const getTileUrl = () => {
    if (mapType === 'satellite') {
      return 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
    }
    if (mapType === 'dark') {
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
    return darkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  };

  const getTileAttribution = () => {
    if (mapType === 'satellite') {
      return '&copy; <a href="https://www.google.com/maps">Google Maps</a>';
    }
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  };

  // Guardar medición en historial
  const saveMeasurement = () => {
    if (area && dimensions) {
      const newMeasurement = {
        id: Date.now(),
        area,
        length: dimensions.length,
        width: dimensions.width,
        date: new Date().toLocaleString(),
        bounds
      };
      setMeasurementHistory(prev => [newMeasurement, ...prev].slice(0, 10));
      alert(`✅ Medición guardada: ${isFinite(area) ? area.toFixed(0) : 'N/A'} m²`);
    }
  };

  // Cargar medición del historial
  const loadMeasurement = (measurement) => {
    setBounds(measurement.bounds);
    setArea(measurement.area);
    setDimensions({ length: measurement.length, width: measurement.width });
    onAreaSelect({ length: measurement.length, width: measurement.width, area: measurement.area });
    if (mapRef.current && measurement.bounds) {
      mapRef.current.fitBounds(measurement.bounds);
    }
  };

  return (
    <div ref={containerRef} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-4xl mx-auto`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin size={20} className="text-blue-500" />
          Seleccionar Área de Malla en Mapa
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <X size={20} />
        </button>
      </div>
      
      {/* Barra de herramientas */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={getCurrentLocation}
          className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${
            locationStatus === 'loading' 
              ? 'bg-gray-400 cursor-wait' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          disabled={locationStatus === 'loading'}
        >
          <Navigation size={14} />
          {locationStatus === 'loading' ? 'Obteniendo ubicación...' : 'Mi ubicación'}
        </button>
        
        <button
          onClick={handleReset}
          className="px-3 py-1.5 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 flex items-center gap-2 transition-all"
        >
          <Trash2 size={14} /> Limpiar selección
        </button>
        
        <button
          onClick={saveMeasurement}
          disabled={!area}
          className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${
            area ? 'bg-green-600 hover:bg-green-700 text-white' : `bg-gray-400 cursor-not-allowed ${darkMode ? 'text-gray-100' : 'text-gray-600'}`
          }`}
        >
          <Save size={14} /> Guardar medición
        </button>
        
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setMapType('street')}
            className={`px-3 py-1.5 rounded-md text-sm transition-all ${
              mapType === 'street' 
                ? 'bg-blue-600 text-white' 
                : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <Layers size={14} className="inline mr-1" /> Calle
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1.5 rounded-md text-sm transition-all ${
              mapType === 'satellite' 
                ? 'bg-blue-600 text-white' 
                : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            🛰️ Satélite
          </button>
        </div>
      </div>
      
      {/* Estado de selección */}
      <div className={`mb-3 p-2 rounded-lg text-sm flex items-center justify-between ${
        isSelecting ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700'
      }`}>
        <div className="flex items-center gap-2">
          <Ruler size={16} />
          <span>
            {corners.length === 0 && isSelecting && '📍 Haz clic en la esquina superior izquierda del área'}
            {corners.length === 1 && isSelecting && '📍 Haz clic en la esquina inferior derecha para completar'}
            {!isSelecting && '✅ Selección completada'}
          </span>
        </div>
        {corners.length === 1 && (
          <button
            onClick={() => setCorners([])}
            className="text-red-500 hover:text-red-600 text-xs"
          >
            Cancelar selección
          </button>
        )}
      </div>
      
      {/* Mapa */}
      <div className="relative rounded-lg overflow-hidden border" style={{ height: '450px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          ref={mapRef}
        >
          <TileLayer
            url={getTileUrl()}
            attribution={getTileAttribution()}
            subdomains={mapType === 'satellite' ? 'mt' : undefined}
          />
          
          <MapClickHandler 
            corners={corners}
            setCorners={setCorners}
            setBounds={setBounds}
            setArea={setArea}
            setDimensions={setDimensions}
            onAreaSelect={onAreaSelect}
            isSelecting={isSelecting}
          />
          
          {bounds && (
            <Rectangle
              bounds={bounds}
              pathOptions={{ color: '#3b82f6', weight: 2, fillOpacity: 0.2 }}
            />
          )}
          
          {corners.map((corner, idx) => (
            <Marker key={idx} position={[corner.lat, corner.lng]} icon={markerIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Punto {idx + 1}</strong><br />
                  Lat: {isFinite(corner.lat) ? corner.lat.toFixed(6) : 'N/A'}°<br />
                  Lon: {isFinite(corner.lng) ? corner.lng.toFixed(6) : 'N/A'}°
                </div>
              </Popup>
            </Marker>
          ))}
          
          {currentLocation && (
            <Marker position={currentLocation} icon={currentLocationIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>📍 Tu ubicación</strong><br />
                  Lat: {isFinite(currentLocation[0]) ? currentLocation[0].toFixed(6) : 'N/A'}°<br />
                  Lon: {isFinite(currentLocation[1]) ? currentLocation[1].toFixed(6) : 'N/A'}°
                </div>
              </Popup>
            </Marker>
          )}
          
          <MapCenterControl center={mapCenter} zoom={mapZoom} />
          <MapControls 
            onReset={handleReset}
            onFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
          />
        </MapContainer>
        
        {/* Indicador de ubicación */}
        {locationStatus === 'loading' && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg z-10 text-sm">
            <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Obteniendo ubicación...
          </div>
        )}
      </div>
      
      {/* Resultados de la selección */}
      {area && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                <CheckCircle size={16} /> Área seleccionada
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{isFinite(area) ? area.toFixed(0) : 'N/A'} m²</p>
              <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
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
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Aplicar dimensiones
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Historial de mediciones */}
      {measurementHistory.length > 0 && (
        <div className="mt-3">
          <p className={`text-xs ${darkMode ? 'text-gray-100' : 'text-gray-600'} mb-2`}>📋 Mediciones recientes:</p>
          <div className="flex flex-wrap gap-2">
            {measurementHistory.map(m => (
              <button
                key={m.id}
                onClick={() => loadMeasurement(m)}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isFinite(m.area) ? m.area.toFixed(0) : 'N/A'} m² ({new Date(m.date).toLocaleTimeString()})
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Instrucciones */}
      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-xs">
        <p className="font-semibold mb-1">📌 Instrucciones:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Haz clic en <strong>esquina superior izquierda</strong> del área deseada</li>
          <li>Luego haz clic en la <strong>esquina inferior derecha</strong></li>
          <li>El área se calculará automáticamente</li>
          <li>Usa <strong>"Mi ubicación"</strong> para centrar el mapa en tu posición</li>
          <li>Guarda mediciones para usarlas después</li>
        </ol>
      </div>
    </div>
  );
};

export default MapAreaSelector;
