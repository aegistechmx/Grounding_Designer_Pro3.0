import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

const KPICard = ({ title, value, unit, status, trend, onClick }) => {
  const getStatusColor = () => {
    if (status === 'good') return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    if (status === 'warning') return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    if (status === 'critical') return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
  };

  const getStatusIcon = () => {
    if (status === 'good') return <CheckCircle className="text-green-500" size={20} />;
    if (status === 'warning') return <AlertCircle className="text-yellow-500" size={20} />;
    if (status === 'critical') return <AlertCircle className="text-red-500" size={20} />;
    return null;
  };

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-lg border-2 ${getStatusColor()} cursor-pointer transition-all hover:scale-105`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold">
            {typeof value === 'number' ? value.toFixed(1) : value}
            <span className="text-sm font-normal ml-1">{unit}</span>
          </p>
        </div>
        {getStatusIcon()}
      </div>
      
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          {trend.up ? (
            <TrendingUp className="text-green-500" size={14} />
          ) : (
            <TrendingDown className="text-red-500" size={14} />
          )}
          <span className={trend.up ? 'text-green-500' : 'text-red-500'}>
            {trend.value}% vs objetivo
          </span>
        </div>
      )}
    </div>
  );
};

export default KPICard;