export const formatTime = (datetime) => {
  if (!datetime) return '—';
  try {
    const date = new Date(datetime);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
};

export const formatDuration = (seconds) => {
  if (!seconds) return null;
  
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
};

export const getTrainStatus = (departureTime, arrivalTime, currentTime) => {
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

export const fetchStationsFromApi = async (proxyUrl) => {
  try {
    const response = await fetch(`${proxyUrl}/stations_list/?lang=ru_RU&format=json`);
    const data = await response.json();
    
    const stations = [];
    
    if (data.countries) {
      for (const country of data.countries) {
        if (country.regions) {
          for (const region of country.regions) {
            if (region.settlements) {
              for (const settlement of region.settlements) {
                if (settlement.stations) {
                  for (const station of settlement.stations) {
                    if (station.transport_type === 'train') {
                      stations.push({
                        title: station.title,
                        code: station.codes?.yandex_code,
                        type: station.station_type,
                        lat: station.latitude,
                        lon: station.longitude
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    const validStations = stations.filter(s => s.code);
    console.log('Найдено станций с кодами:', validStations.length);
    
    return validStations;
  } catch (error) {
    console.error('Ошибка загрузки станций:', error);
    throw error;
  }
};