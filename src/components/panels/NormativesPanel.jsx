import React from 'react';
import MexicanNormatives from '../normatives/MexicanNormatives';

export const NormativesPanel = ({ params, calculations, darkMode }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">📜 Cumplimiento Normativo Mexicano</h3>
      <MexicanNormatives params={params} calculations={calculations} darkMode={darkMode} />
    </div>
  );
};