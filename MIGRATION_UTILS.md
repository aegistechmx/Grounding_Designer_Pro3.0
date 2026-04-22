# MIGRATION MAP - IMPORTS DE /utils

## 📋 CÓMO ACTUALIZAR IMPORTS

### ANTES → DESPUÉS

**PDFs:**
`import { generateFullPDF } from '../utils/pdfFullPro';`
→ `import { generateFullPDF } from '../utils/export/pdfFullPro';`

**CAD/DXF:**
`import { dxfExport } from '../utils/exportDXF';`
→ `import { dxfExport } from '../utils/export/exportDXF';`

**Validación:**
`import { validateCode } from '../utils/codeValidator';`
→ `import { validateCode } from '../utils/validation/codeValidator';`

**Física:**
`import { calculateRg } from '../utils/groundingMath_clean';`
→ `import { calculateRg } from '../utils/physics/groundingMath_clean';`

**IA:**
`import { predictOptimization } from '../utils/aiRecommender';`
→ `import { predictOptimization } from '../utils/ai/aiRecommender';`

**Helpers:**
`import { logger } from '../utils/loggerUtils';`
→ `import { logger } from '../utils/helpers/loggerUtils';`

## 🔄 MANTENIMIENTO DE COMPATIBILIDAD

El archivo `src/utils/index.js` re-exporta todo, por lo que:
✅ Los imports antiguos SEGUIRÁN FUNCIONANDO temporalmente
⚠️ Se recomienda actualizar gradualmente

## 📊 ESTADÍSTICAS DE MIGRACIÓN

Total archivos movidos: ~54 archivos

- physics: 10 archivos
- export: 21 archivos
- validation: 5 archivos
- ai: 2 archivos
- helpers: 10 archivos

## 📁 NUEVA ESTRUCTURA DE /utils

```text
src/utils/
├── physics/           # Cálculos puros
│   ├── groundingMath_clean.js
│   ├── groundingMath_simple.js
│   ├── correctedResistivity.js
│   ├── multiLayerSoil.js
│   ├── conductorThermalCheck.js
│   ├── temperatureCorrection.js
│   ├── seasonalVariation.js
│   ├── soilTreatment.js
│   ├── transferredVoltage.js
│   ├── equipotentialCheck.js
│   └── index.js
├── export/            # Exportaciones
│   ├── pdfFullPro.js
│   ├── pdfWithCharts.js
│   ├── pdfPowerBI.js
│   ├── pdfExecutive.js
│   ├── pdfCFE.js
│   ├── pdfTechnicalMemory.js
│   ├── pdfExportWithLogo.js
│   ├── pdfGenerator.js
│   ├── pdfProfessionalCFE.js
│   ├── exportDXF.js
│   ├── exportCAD.js
│   ├── dxfContourExport.js
│   ├── dxfImporter.js
│   ├── excelExport.js
│   ├── wordExport.js
│   ├── exportSimulation.js
│   ├── chartGeneratorPro.js
│   ├── chartJSGenerator.js
│   ├── chartPowerBI.js
│   ├── reportGenerator.js
│   ├── materialList.js
│   └── index.js
├── validation/        # Validación de normas
│   ├── codeValidator.js
│   ├── validationUtils.js
│   ├── trafficLight.js
│   ├── errorHandlingUtils.js
│   ├── errorTestUtils.js
│   └── index.js
├── ai/                # IA y ML
│   ├── aiRecommender.js
│   ├── groundGridOptimizer.js
│   └── index.js
├── helpers/           # Utilidades generales
│   ├── loggerUtils.js
│   ├── debugUtils.js
│   ├── auditLogger.js
│   ├── storageUtils.js
│   ├── performanceUtils.js
│   ├── i18n.js
│   ├── theme.js
│   ├── signature.js
│   ├── digitalSignature.js
│   ├── kpiCards.js
│   └── index.js
└── index.js           # Punto de entrada principal
```
