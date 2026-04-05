import React, { useState } from 'react';
import StationMap from './StationMap';

const SearchSection = ({
  mode,
  searchQuery,
  setSearchQuery,
  selectedStation,
  setSelectedStation,
  filteredStations,
  handleStationSelect,
  fromSearchQuery,
  setFromSearchQuery,
  fromStation,
  setFromStation,
  filteredFromStations,
  handleFromStationSelect,
  toSearchQuery,
  setToSearchQuery,
  toStation,
  setToStation,
  filteredToStations,
  handleToStationSelect,
  date,
  setDate,
  fetchSchedule,
  isLoading,
  stations
}) => {
  const isSingleMode = mode === 'single';
  const isBetweenMode = mode === 'between';
  
  const [mapOpen, setMapOpen] = useState(false);
  const [mapTargetField, setMapTargetField] = useState(null);
  
  const isSearchDisabled = isSingleMode 
    ? !selectedStation 
    : (!fromStation || !toStation);

  const handleMapStationSelect = (station, targetField) => {
    if (isSingleMode) {
      handleStationSelect(station);
    } else if (isBetweenMode) {
      if (targetField === 'from') {
        handleFromStationSelect(station);
      } else if (targetField === 'to') {
        handleToStationSelect(station);
      }
    }
  };

  const openMapForField = (field) => {
    setMapTargetField(field);
    setMapOpen(true);
  };

  return (
    <div className="search-section">
      {isSingleMode && (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Введите название станции..."
              value={selectedStation ? selectedStation.title : searchQuery}
              onChange={(e) => {
                setSelectedStation(null);
                setSearchQuery(e.target.value);
              }}
            />
            <button 
              className="map-select-btn"
              onClick={() => openMapForField('single')}
              type="button"
            >
              Выбрать на карте
            </button>
          </div>

          {filteredStations.length > 0 && !selectedStation && (
            <div className="search-results">
              {filteredStations.map((station, index) => (
                <div
                  key={index}
                  className="station-item"
                  onClick={() => handleStationSelect(station)}
                >
                  <span className="station-name">{station.title}</span>
                </div>
              ))}
            </div>
          )}

          {selectedStation && (
            <div className="selected-info">
              <span><strong>{selectedStation.title}</strong></span>
              <button className="reset-btn" onClick={() => setSelectedStation(null)}>✕</button>
            </div>
          )}
        </>
      )}

      {isBetweenMode && (
        <>
          <div className="stations-pair">
            <div className="station-input-group">
              <label>Откуда:</label>
              <div className="input-with-map-btn">
                <input
                  type="text"
                  placeholder="Станция отправления..."
                  value={fromStation ? fromStation.title : fromSearchQuery}
                  onChange={(e) => {
                    setFromStation(null);
                    setFromSearchQuery(e.target.value);
                  }}
                />
                <button 
                  className="map-select-btn-small"
                  onClick={() => openMapForField('from')}
                  type="button"
                  title="Выбрать на карте"
                >
                  Выбрать на карте
                </button>
              </div>
              {filteredFromStations.length > 0 && !fromStation && (
                <div className="search-results">
                  {filteredFromStations.map((station, index) => (
                    <div
                      key={index}
                      className="station-item"
                      onClick={() => handleFromStationSelect(station)}
                    >
                      <span className="station-name">{station.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="station-input-group">
              <label>Куда:</label>
              <div className="input-with-map-btn">
                <input
                  type="text"
                  placeholder="Станция назначения..."
                  value={toStation ? toStation.title : toSearchQuery}
                  onChange={(e) => {
                    setToStation(null);
                    setToSearchQuery(e.target.value);
                  }}
                />
                <button 
                  className="map-select-btn-small"
                  onClick={() => openMapForField('to')}
                  type="button"
                  title="Выбрать на карте"
                >
                  Выбрать на карте
                </button>
              </div>
              {filteredToStations.length > 0 && !toStation && (
                <div className="search-results">
                  {filteredToStations.map((station, index) => (
                    <div
                      key={index}
                      className="station-item"
                      onClick={() => handleToStationSelect(station)}
                    >
                      <span className="station-name">{station.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {fromStation && toStation && (
            <div className="route-info">
              Маршрут: <strong>{fromStation.title}</strong> → <strong>{toStation.title}</strong>
            </div>
          )}
        </>
      )}

      <div className="date-selector">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <button 
        className="search-button"
        onClick={fetchSchedule}
        disabled={isSearchDisabled || isLoading}
      >
        Найти расписание
      </button>

      <StationMap
        stations={stations}
        onStationSelect={handleMapStationSelect}
        targetField={mapTargetField}
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
      />
    </div>
  );
};

export default SearchSection;