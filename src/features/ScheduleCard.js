import React from 'react';
import { formatTime, formatDuration, getTrainStatus } from '../shared/helpers';

const ScheduleCard = ({ item, currentTime }) => {
  const thread = item.thread || item;
  const trainStatus = getTrainStatus(item.departure, item.arrival, currentTime);
  
  return (
    <div className="schedule-item">
      <div className="train-info">
        <span className="train-number">
          {thread.number || thread.short_title || 'Электричка'}
        </span>
        <span className="train-direction">
          {thread.title || 'пригородный поезд'}
        </span>
      </div>
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
};

export default ScheduleCard;