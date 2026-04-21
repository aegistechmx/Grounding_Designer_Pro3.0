import React from 'react';
import FeederCalculator from '../feeder/FeederCalculator';

export const FeedersPanel = ({ params, darkMode }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">🔌 Calculador de Alimentadores Principales</h3>
      <FeederCalculator params={params} darkMode={darkMode} />
    </div>
  );
};