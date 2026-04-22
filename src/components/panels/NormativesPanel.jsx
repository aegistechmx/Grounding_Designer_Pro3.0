import React from 'react';
import { BookOpen } from 'lucide-react';
import { ValidatedSection } from '../common/ValidatedSection';
import MexicanNormatives from '../normatives/MexicanNormatives';

export const NormativesPanel = ({ params, calculations, darkMode }) => {
  return (
    <div className="space-y-4">
      <ValidatedSection title="Cumplimiento Normativo Mexicano" icon={BookOpen} status="info" darkMode={darkMode}>
        <MexicanNormatives params={params} calculations={calculations} darkMode={darkMode} />
      </ValidatedSection>
    </div>
  );
};