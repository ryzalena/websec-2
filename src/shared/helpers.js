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