import React, { useState, useEffect } from 'react';
import './App.css';
import { stationsList } from './stations';

const App = () => {
  const [stations] = useState(stationsList);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const API_KEY = '5ec8e859-5593-4cf0-b9a9-0eecac0647bb';
  const PROXY_URL = 'http://localhost:3001/api/rasp';

  useEffect(() => {
    if (mode === 'single' && searchQuery.length > 1) {
      const filtered = stations.filter(station => 
        station.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStations(filtered);
    } else {
      setFilteredStations([]);
    }
  }, [searchQuery, stations, mode]);

  useEffect(() => {
    if (mode === 'between' && fromSearchQuery.length > 1) {
      const filtered = stations.filter(station => 
        station.title.toLowerCase().includes(fromSearchQuery.toLowerCase())
      );
      setFilteredFromStations(filtered);
    } else {
      setFilteredFromStations([]);
    }
  }, [fromSearchQuery, stations, mode]);

  useEffect(() => {
    if (mode === 'between' && toSearchQuery.length > 1) {
      const filtered = stations.filter(station => 
        station.title.toLowerCase().includes(toSearchQuery.toLowerCase())
      );
      setFilteredToStations(filtered);
    } else {
      setFilteredToStations([]);
    }
  }, [toSearchQuery, stations, mode]);

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
        url = `${PROXY_URL}/schedule/?apikey=${API_KEY}&station=${selectedStation.code}&date=${date}&lang=ru_RU&transport_types=suburban&format=json&limit=100`;
      } else {
        url = `${PROXY_URL}/search/?apikey=${API_KEY}&from=${fromStation.code}&to=${toStation.code}&date=${date}&lang=ru_RU&transport_types=suburban&format=json&limit=100`;
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
          setNoRoutesMessage(`Электрички между станциями ${fromStation.title} и ${toStation.title} не найдены`);
        }
      }

    } catch (error) {
      setApiError('Ошибка соединения с прокси-сервером. Убедитесь что он запущен на порту 3001');
    } finally {
      setLoading(false);
    }
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setSearchQuery('');
    setFilteredStations([]);
    setApiError('');
  };

  const handleFromStationSelect = (station) => {
    setFromStation(station);
    setFromSearchQuery('');
    setFilteredFromStations([]);
    setApiError('');
    setNoRoutesMessage('');
  };

  const handleToStationSelect = (station) => {
    setToStation(station);
    setToSearchQuery('');
    setFilteredToStations([]);
    setApiError('');
    setNoRoutesMessage('');
  };

  const resetSelection = () => {
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

  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetSelection();
  };

  const formatTime = (datetime) => {
    if (!datetime) return '—';
    try {
      const date = new Date(datetime);
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
  };

  const getTrainStatus = (departureTime, arrivalTime) => {
    if (!departureTime && !arrivalTime) return { text: 'нет отправления', type: 'no-departure' };
    
    const now = currentTime;
    const departure = departureTime ? new Date(departureTime) : null;
    const arrival = arrivalTime ? new Date(arrivalTime) : null;
    
    if (!departure) {
      return { text: 'нет отправления', type: 'no-departure' };
    }
    
    let nextEvent = null;
    let eventType = '';
    
    if (departure && departure > now) {
      nextEvent = departure;
      eventType = 'отправление';
    }
    
    if (arrival && arrival > now) {
      if (!nextEvent || arrival < nextEvent) {
        nextEvent = arrival;
        eventType = 'прибытие';
      }
    }
    
    if (!nextEvent) {
      if (departure && departure < now) {
        const diffMs = now - departure;
        const diffMinutes = Math.floor(diffMs / 60000);
        if (diffMinutes < 60) {
          return { text: `Отправилась ${diffMinutes} мин назад`, type: 'departed' };
        } else {
          const hours = Math.floor(diffMinutes / 60);
          const mins = diffMinutes % 60;
          return { text: `Отправилась ${hours} ч ${mins} мин назад`, type: 'departed' };
        }
      }
      return { text: 'нет отправления', type: 'no-departure' };
    }
    
    const diffMs = nextEvent - now;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes === 0) {
      return { text: `${eventType === 'отправление' ? 'Отправляется' : 'Прибывает'} сейчас`, type: 'now' };
    } else if (diffMinutes < 60) {
      return { text: `${eventType === 'отправление' ? 'Отправление' : 'Прибытие'} через ${diffMinutes} мин`, type: 'soon' };
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return { text: `${eventType === 'отправление' ? 'Отправление' : 'Прибытие'} через ${hours} ч ${mins} мин`, type: 'later' };
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Прибывалка63: Электрички</h1>
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
        <div className="search-section">
          {mode === 'single' && (
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
                  <span>Станция: <strong>{selectedStation.title}</strong></span>
                  <button className="reset-btn" onClick={() => setSelectedStation(null)}>✕</button>
                </div>
              )}
            </>
          )}

          {mode === 'between' && (
            <>
              <div className="stations-pair">
                <div className="station-input-group">
                  <label>Откуда:</label>
                  <input
                    type="text"
                    placeholder="Станция отправления..."
                    value={fromStation ? fromStation.title : fromSearchQuery}
                    onChange={(e) => {
                      setFromStation(null);
                      setFromSearchQuery(e.target.value);
                    }}
                  />
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
                  <input
                    type="text"
                    placeholder="Станция назначения..."
                    value={toStation ? toStation.title : toSearchQuery}
                    onChange={(e) => {
                      setToStation(null);
                      setToSearchQuery(e.target.value);
                    }}
                  />
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
            disabled={
              (mode === 'single' && !selectedStation) || 
              (mode === 'between' && (!fromStation || !toStation))
            }
          >
            Найти расписание
          </button>
        </div>

        <div className="schedule-section">
          {loading && <div className="loader">Загрузка расписания...</div>}
          
          {apiError && (
            <div className="error-message">
              <p>❌ {apiError}</p>
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
                const trainStatus = getTrainStatus(item.departure, item.arrival);
                
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