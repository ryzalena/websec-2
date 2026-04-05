import React, { useState, useEffect } from 'react';
import './App.css';
import SearchSection from '../features/SearchSection';
import StationMap from '../features/StationMap';
import { formatTime, formatDuration, getTrainStatus, fetchStationsFromApi } from '../shared/helpers';

const App = () => {
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [stationsError, setStationsError] = useState('');
  const [filteredStations, setFilteredStations] = useState([]);
  const [filteredFromStations, setFilteredFromStations] = useState([]);
  const [filteredToStations, setFilteredToStations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [toSearchQuery, setToSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('single');
  const [fromStation, setFromStation] = useState(null);
  const [toStation, setToStation] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [apiError, setApiError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [noRoutesMessage, setNoRoutesMessage] = useState('');

  const PROXY_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001/api/rasp';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadStations = async () => {
      setLoadingStations(true);
      setStationsError('');
      try {
        const stationsData = await fetchStationsFromApi(PROXY_URL);
        setStations(stationsData);
      } catch (error) {
        setStationsError('Не удалось загрузить список станций. Проверьте прокси-сервер.');
        console.error(error);
      } finally {
        setLoadingStations(false);
      }
    };
    loadStations();
  }, [PROXY_URL]);

  const filterStationsList = (query, stationsList) => {
    if (query.length > 1) {
      return stationsList.filter(station => 
        station.title.toLowerCase().includes(query.toLowerCase())
      );
    }
    return [];
  };

  const updateFilteredStations = (query, setFilteredFunction) => {
    const filtered = filterStationsList(query, stations);
    setFilteredFunction(filtered);
  };

  useEffect(() => {
    if (mode === 'single' && !loadingStations && stations.length > 0) {
      updateFilteredStations(searchQuery, setFilteredStations);
    } else {
      setFilteredStations([]);
    }
  }, [searchQuery, stations, mode, loadingStations]);

  useEffect(() => {
    if (mode === 'between' && !loadingStations && stations.length > 0) {
      updateFilteredStations(fromSearchQuery, setFilteredFromStations);
    } else {
      setFilteredFromStations([]);
    }
  }, [fromSearchQuery, stations, mode, loadingStations]);

  useEffect(() => {
    if (mode === 'between' && !loadingStations && stations.length > 0) {
      updateFilteredStations(toSearchQuery, setFilteredToStations);
    } else {
      setFilteredToStations([]);
    }
  }, [toSearchQuery, stations, mode, loadingStations]);

  const selectStation = (station, target) => {
    if (target === 'single') {
      setSelectedStation(station);
      setSearchQuery('');
      setFilteredStations([]);
    } else if (target === 'from') {
      setFromStation(station);
      setFromSearchQuery('');
      setFilteredFromStations([]);
    } else if (target === 'to') {
      setToStation(station);
      setToSearchQuery('');
      setFilteredToStations([]);
    }
    setApiError('');
    setNoRoutesMessage('');
  };

  const resetAll = () => {
    setSelectedStation(null);
    setFromStation(null);
    setToStation(null);
    setSearchQuery('');
    setFromSearchQuery('');
    setToSearchQuery('');
    setFilteredStations([]);
    setFilteredFromStations([]);
    setFilteredToStations([]);
    setSchedule([]);
    setApiError('');
    setNoRoutesMessage('');
  };

  const fetchSchedule = async () => {
    if (mode === 'single' && !selectedStation) {
      alert('Выберите станцию');
      return;
    }

    if (mode === 'between' && (!fromStation || !toStation)) {
      alert('Выберите станции отправления и назначения');
      return;
    }

    setLoading(true);
    setApiError('');
    setNoRoutesMessage('');
    setSchedule([]);

    try {
      let url;
      if (mode === 'single') {
        url = `${PROXY_URL}/schedule/?station=${selectedStation.code}&date=${date}&lang=ru_RU&transport_types=suburban&format=json&limit=100`;
      } else {
        url = `${PROXY_URL}/search/?from=${fromStation.code}&to=${toStation.code}&date=${date}&lang=ru_RU&transport_types=suburban&format=json&limit=100`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ошибка: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.error) {
        setApiError(data.error.text || data.error || 'Ошибка при загрузке расписания');
      } else if (mode === 'single') {
        if (data.schedule && data.schedule.length > 0) {
          setSchedule(data.schedule);
        } else {
          setApiError('На выбранную дату расписание не найдено');
        }
      } else {
        if (data.segments && data.segments.length > 0) {
          setSchedule(data.segments);
        } else {
          setNoRoutesMessage(`Нет прямого маршрута между станциями ${fromStation.title} и ${toStation.title} на выбранную дату`);
        }
      }

    } catch (error) {
      setApiError('Ошибка соединения с прокси-сервером. Убедитесь что он запущен на порту 3001');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetAll();
  };

  const TimeDisplay = ({ item }) => {
    if (mode === 'single') {
      return (
        <div className="time-info">
          <div className="arrival">
            <span>Прибытие</span>
            <strong>{formatTime(item.arrival)}</strong>
          </div>
          <div className="departure">
            <span>Отправление</span>
            <strong>{formatTime(item.departure)}</strong>
          </div>
        </div>
      );
    } else {
      return (
        <div className="time-info">
          <div className="departure">
            <span>Отправление</span>
            <strong>{formatTime(item.departure)}</strong>
          </div>
          <div className="arrival">
            <span>Прибытие</span>
            <strong>{formatTime(item.arrival)}</strong>
          </div>
        </div>
      );
    }
  };

  if (loadingStations) {
    return (
      <div className="app">
        <header className="header">
          <h1>Прибывалка: Электрички</h1>
        </header>
        <main className="main">
          <div className="loader">Загрузка станций...</div>
        </main>
      </div>
    );
  }

  if (stationsError) {
    return (
      <div className="app">
        <header className="header">
          <h1>Прибывалка: Электрички</h1>
        </header>
        <main className="main">
          <div className="error-message">
            <p>{stationsError}</p>
            <p className="hint">Убедитесь, что прокси-сервер запущен: node server.js</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Прибывалка: Электрички</h1>
        <div className="mode-toggle">
          <button 
            className={mode === 'single' ? 'active' : ''}
            onClick={() => handleModeChange('single')}
          >
            По станции
          </button>
          <button 
            className={mode === 'between' ? 'active' : ''}
            onClick={() => handleModeChange('between')}
          >
            Между станциями
          </button>
        </div>
      </header>

      <main className="main">
        <StationMap 
          onStationSelect={(station, targetField) => {
            if (mode === 'single') {
              selectStation(station, 'single');
            } else {
              if (targetField === 'from' || (!fromStation && !targetField)) {
                selectStation(station, 'from');
              } else if (targetField === 'to' || (!toStation && !targetField)) {
                selectStation(station, 'to');
              }
            }
          }}
          stations={stations}
        />

        <SearchSection
          mode={mode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStation={selectedStation}
          setSelectedStation={(station) => selectStation(station, 'single')}
          filteredStations={filteredStations}
          handleStationSelect={(station) => selectStation(station, 'single')}
          fromSearchQuery={fromSearchQuery}
          setFromSearchQuery={setFromSearchQuery}
          fromStation={fromStation}
          setFromStation={(station) => selectStation(station, 'from')}
          filteredFromStations={filteredFromStations}
          handleFromStationSelect={(station) => selectStation(station, 'from')}
          toSearchQuery={toSearchQuery}
          setToSearchQuery={setToSearchQuery}
          toStation={toStation}
          setToStation={(station) => selectStation(station, 'to')}
          filteredToStations={filteredToStations}
          handleToStationSelect={(station) => selectStation(station, 'to')}
          date={date}
          setDate={setDate}
          fetchSchedule={fetchSchedule}
          isLoading={loading}
          stations={stations}
        />

        <div className="schedule-section">
          {loading && <div className="loader">Загрузка расписания...</div>}
          
          {apiError && (
            <div className="error-message">
              <p>{apiError}</p>
            </div>
          )}

          {noRoutesMessage && (
            <div className="no-routes-message">
              <p>{noRoutesMessage}</p>
              <p className="hint">Попробуйте выбрать другие станции или дату</p>
            </div>
          )}
          
          {!loading && !apiError && !noRoutesMessage && schedule.length > 0 && (
            <div className="schedule-list">
              <h2>
                {mode === 'single' 
                  ? `Расписание: ${selectedStation?.title}`
                  : `${fromStation?.title} → ${toStation?.title}`}
                <span className="schedule-date">{date}</span>
              </h2>
              {schedule.map((item, index) => {
                const thread = item.thread || item;
                const trainStatus = getTrainStatus(item.departure, item.arrival, currentTime);
                
                return (
                  <div key={index} className="schedule-item">
                    <div className="train-info">
                      <span className="train-number">
                        {thread.number || thread.short_title || 'Электричка'}
                      </span>
                      <span className="train-direction">
                        {thread.title || 'пригородный поезд'}
                      </span>
                    </div>
                    
                    <TimeDisplay item={item} />
                    
                    {item.duration > 0 && (
                      <div className="additional-info">
                        <span>В пути: {formatDuration(item.duration)}</span>
                      </div>
                    )}
                    {trainStatus && (
                      <div className={`train-status ${trainStatus.type}`}>
                        {trainStatus.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;