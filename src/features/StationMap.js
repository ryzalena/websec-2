import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const StationMap = ({ onStationSelect, stations, targetField, isOpen, onClose }) => {
  const [mapVisible, setMapVisible] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const getInstructionText = () => {
    if (targetField === 'from') {
      return 'Выберите станцию отправления (откуда) на карте';
    } else if (targetField === 'to') {
      return 'Выберите станцию назначения (куда) на карте';
    } else {
      return 'Выберите станцию на карте';
    }
  };

  const getPopupButtonText = (stationTitle) => {
    if (targetField === 'from') {
      return `Выбрать "${stationTitle}" как отправление`;
    } else if (targetField === 'to') {
      return `Выбрать "${stationTitle}" как назначение`;
    } else {
      return `Выбрать станцию "${stationTitle}"`;
    }
  };

  const getAlertText = (stationTitle) => {
    if (targetField === 'from') {
      return `Станция "${stationTitle}" выбрана как отправление`;
    } else if (targetField === 'to') {
      return `Станция "${stationTitle}" выбрана как назначение`;
    } else {
      return `Выбрана станция: ${stationTitle}`;
    }
  };

  useEffect(() => {
    setMapVisible(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (!mapVisible) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    if (mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView([53.2000, 50.1500], 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    const stationsWithCoords = stations.filter(station => station.lat && station.lon);

    if (stationsWithCoords.length === 0) {
      L.popup()
        .setLatLng([53.2000, 50.1500])
        .setContent(`
          <div style="text-align:center;padding:10px;">
            <strong>Нет станций с координатами</strong><br/>
            Добавьте lat и lon в файл stations.js
          </div>
        `)
        .openOn(mapInstanceRef.current);
      return;
    }

    stationsWithCoords.forEach(station => {
      const marker = L.marker([station.lat, station.lon]).addTo(mapInstanceRef.current);
      
      marker.bindTooltip(station.title, { permanent: false, direction: 'top' });
      
      marker.bindPopup(`
        <div style="padding: 8px; min-width: 180px;">
          <strong>${station.title}</strong><br/>
          <button 
            style="
              margin-top: 10px; 
              padding: 6px 12px; 
              background-color: #b8aa98; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer;
              width: 100%;
              font-size: 13px;
            "
            onclick="window.selectStationFromMap('${station.code}', '${station.title}')"
          >
            ${getPopupButtonText(station.title)}
          </button>
        </div>
      `);
      
      marker.on('click', () => {
        onStationSelect(station, targetField);
        alert(getAlertText(station.title));
        onClose();
      });
    });

    window.selectStationFromMap = (code, title) => {
      const station = stations.find(s => s.code === code);
      if (station) {
        onStationSelect(station, targetField);
        alert(getAlertText(title));
        onClose();
      }
    };

  }, [mapVisible, stations, onStationSelect, targetField, onClose]);

  if (!mapVisible) return null;

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <h3>Выбор станции на карте</h3>
          <button className="map-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="map-modal-instruction">
          <p>{getInstructionText()}</p>
        </div>
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '400px', 
            border: '1px solid #d0c2b2', 
            borderRadius: '8px'
          }} 
        />
        <div className="map-modal-footer">
          <button className="map-modal-cancel" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
};

export default StationMap;