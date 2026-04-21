/**
 * Generador automático de lista de materiales
 * Basado en catálogo TOTAL GROUND
 * PRECIOS EN PESOS MEXICANOS (MXN)
 */

// Catálogo de productos TOTAL GROUND con precios en MXN
const CATALOG = {
  // Kits Master (Precios en MXN)
  kits: {
    KITMASTER_100K: { code: 'KITMASTER-100K', name: 'Kit Master Electrodo Magnetoactivo', capacity: 100, price: 8500, description: 'Para transformadores hasta 250 kVA' },
    KITMASTER_400K: { code: 'KITMASTER-400K', name: 'Kit Master Electrodo Magnetoactivo', capacity: 400, price: 16500, description: 'Para transformadores hasta 400 kVA' },
    KITMASTER_SOHO: { code: 'KIT MASTER SOHO', name: 'Kit Master Residencial', capacity: 15, price: 2200, description: 'Para hogares y oficinas pequeñas' },
    KITMASTER_TGCOM: { code: 'KIT MASTER TGCOM', name: 'Kit Master Conmutadores', capacity: 45, price: 4800, description: 'Para conmutadores y oficinas' }
  },

  // Varillas (Precios en MXN)
  rods: {
    VAR_5_8X3M_CP: { code: 'VAR5/8X3MCP', name: 'Varilla de cobre', diameter: '5/8"', length: 3, material: 'Cobre puro', price: 480 },
    VAR_5_8X3M_SP: { code: 'VAR5/8X3MSP', name: 'Varilla de acero recubierto', diameter: '5/8"', length: 3, material: 'Acero recubierto cobre', price: 340 },
    VAR_3_4X3M_SP: { code: 'VAR3/4X3MSP', name: 'Varilla de acero recubierto', diameter: '3/4"', length: 3, material: 'Acero recubierto cobre', price: 420 }
  },

  // Conductores (Precios en MXN por metro)
  conductors: {
    AWG_2_0: { code: 'CABLE-2/0', name: 'Cable de cobre desnudo', gauge: '2/0 AWG', area: 67.4, pricePerMeter: 65 },
    AWG_1_0: { code: 'CABLE-1/0', name: 'Cable de cobre desnudo', gauge: '1/0 AWG', area: 53.5, pricePerMeter: 52 },
    AWG_4: { code: 'CABLE-4', name: 'Cable de cobre desnudo', gauge: '4 AWG', area: 21.2, pricePerMeter: 28 }
  },

  // Conectores (Precios en MXN)
  connectors: {
    TGAB_21: { code: 'TGAB-21', name: 'Conector varilla-cable', type: 'Varilla a cable', cableRange: '3/0 AWG - 350 KCM', rodSize: '3/4"', price: 150 },
    TGAB_18: { code: 'TGAB-18', name: 'Conector varilla-cable', type: 'Varilla a cable', cableRange: '4 AWG - 2/0 AWG', rodSize: '5/8"', price: 110 },
    TGCR_14: { code: 'TGCR-14', name: 'Conector borne-cable', type: 'Borne a cable', cableRange: '1/0 AWG - 250 KCM', price: 95 },
    TGCR_11: { code: 'TGCR-11', name: 'Conector borne-cable', type: 'Borne a cable', cableRange: '4 AWG - 1/0 AWG', price: 75 },
    TGACP: { code: 'TGACP', name: 'Abrazadera de cobre', type: 'Fijacion', price: 65 }
  },

  // Registros (Precios en MXN)
  registers: {
    S610: { code: 'S610', name: 'Registro con tapa', dimensions: '16 cm tapa, 23.5 cm profundidad', capacity: '1,360 kg', price: 280 },
    S1010: { code: 'S1010', name: 'Registro con tapa grande', dimensions: '24 cm tapa, 27 cm profundidad', capacity: '1,360 kg', price: 450 }
  },

  // Compuestos (Precios en MXN)
  compounds: {
    H2OHM: { code: 'H2OHM', name: 'Compuesto mejorador de tierra', presentation: 'Saco 11 kg', price: 850 },
    GAT: { code: 'GAT', name: 'Compuesto acondicionador de tierra', presentation: 'Saco 20 kg', price: 750 },
    ANTIOX: { code: 'ANTIOX', name: 'Aerosol antioxidante', presentation: '370 g', price: 220 }
  },

  // Barras de union (Precios en MXN)
  busbars: {
    TG_BPS240: { code: 'TG-BPS240', name: 'Barra de union', dimensions: '40x14x8.58 cm', holes: 16, material: 'Cobre pulido', price: 1500 },
    TGBUERACK: { code: 'TGBUERACK', name: 'Barra rack', dimensions: '49.52x2.54x0.64 cm', mounting: 'Rack 19"', price: 1100 }
  },

  // Supresores (Precios en MXN)
  suppressors: {
    SUPR_B_60: { code: 'SUP-R-60-2-FASO', name: 'Supresor Categoria B', capacity: '60 kA', voltage: '127/220 V', price: 1500 },
    SUPT_UTPAC: { code: 'SUPT-UTPAC', name: 'Supresor para contacto', type: 'Contacto inteligente', price: 650 }
  },

  // Electrodos quimicos (Precios en MXN)
  chemical_rods: {
    CHEMGROUND_3M: { code: 'CHEMGROUND3-2D', name: 'Electrodo quimico', length: 3, diameter: '2"', capacity: '70-120 A', price: 3400 }
  }
};

/**
 * Determina el kit Master necesario segun la potencia del transformador
 */
const selectKit = (transformerKVA, Ig) => {
  if (transformerKVA <= 75 || Ig <= 300) return CATALOG.kits.KITMASTER_100K;
  if (transformerKVA <= 250 || Ig <= 800) return CATALOG.kits.KITMASTER_400K;
  return CATALOG.kits.KITMASTER_400K;
};

/**
 * Determina el tipo de varilla segun la resistividad del suelo
 */
const selectRod = (soilResistivity) => {
  if (soilResistivity > 500) return CATALOG.rods.VAR_5_8X3M_CP; // Cobre puro para alta resistividad
  return CATALOG.rods.VAR_5_8X3M_SP; // Acero recubierto para suelos normales
};

/**
 * Determina el conductor segun la corriente de falla
 */
const selectConductor = (Ig, faultDuration) => {
  const requiredArea = Ig * 0.143 * Math.sqrt(faultDuration);
  if (requiredArea <= 33.6) return CATALOG.conductors.AWG_4;
  if (requiredArea <= 53.5) return CATALOG.conductors.AWG_1_0;
  return CATALOG.conductors.AWG_2_0;
};

/**
 * Calcula cantidad de conectores segun geometria de la malla
 */
const calculateConnectors = (nx, ny, numRods) => {
  const safeNx = nx || 4;
  const safeNy = ny || 4;
  const safeNumRods = numRods || 6;
  
  const nodeConnectors = safeNx * safeNy; // Conectores en nodos
  const rodConnectors = safeNumRods * 2; // Conectores para varillas
  const perimeterConnectors = (safeNx + safeNy) * 2; // Conectores perimetrales
  
  return {
    total: nodeConnectors + rodConnectors + perimeterConnectors,
    nodeConnectors,
    rodConnectors,
    perimeterConnectors
  };
};

/**
 * Calcula cantidad de compuestos segun area y resistividad
 */
const calculateCompounds = (area, soilResistivity) => {
  const safeArea = area || 480; // Valor por defecto 30x16 = 480 m2
  const safeSoilResistivity = soilResistivity || 100;
  
  let h2ohmBags = Math.ceil(safeArea / 40); // 1 saco cada 40 m2
  let gatBags = Math.ceil(safeArea / 50); // 1 saco cada 50 m2
  
  if (safeSoilResistivity > 300) {
    h2ohmBags = Math.ceil(safeArea / 30); // Mas compuesto para alta resistividad
    gatBags = Math.ceil(safeArea / 40);
  }
  
  return { h2ohmBags, gatBags, antioxCans: Math.ceil(safeArea / 100) + 2 };
};

/**
 * Calcula cantidad de registros segun el numero de varillas
 */
const calculateRegisters = (numRods) => {
  return Math.max(1, Math.ceil(numRods / 2));
};

/**
 * Calcula cantidad de supresores segun el tipo de instalacion
 */
const calculateSuppressors = (transformerKVA) => {
  if (transformerKVA <= 75) return { main: 1, secondary: 0 };
  if (transformerKVA <= 225) return { main: 1, secondary: 1 };
  return { main: 1, secondary: 2 };
};

/**
 * Genera lista completa de materiales
 */
export const generateMaterialList = (params, calculations) => {
  const {
    transformerKVA = 75,
    soilResistivity = 100,
    faultDuration = 0.35,
    gridLength = 30,
    gridWidth = 16,
    numParallel = 15,
    numRods = 45,
    rodLength = 3,
    projectName = 'Proyecto de Puesta a Tierra'
  } = params || {};
  
  const {
    Ig = 300,
    nx = 4,
    ny = 4,
    gridArea = 480,
    totalConductor = 480,
    complies = false
  } = calculations || {};
  
  // Seleccionar componentes
  const kit = selectKit(transformerKVA, Ig);
  const rod = selectRod(soilResistivity);
  const conductor = selectConductor(Ig, faultDuration);
  const connectors = calculateConnectors(nx, ny, numRods);
  const compounds = calculateCompounds(gridArea, soilResistivity);
  const registers = calculateRegisters(numRods);
  const suppressors = calculateSuppressors(transformerKVA);
  
  // Calcular costos (en MXN)
  const kitCost = kit.price;
  const rodsCost = numRods * rod.price;
  const conductorCost = totalConductor * conductor.pricePerMeter;
  const connectorsCost = (connectors.nodeConnectors * CATALOG.connectors.TGCR_14.price) + (connectors.rodConnectors * CATALOG.connectors.TGAB_21.price) + (connectors.perimeterConnectors * CATALOG.connectors.TGACP.price);
  const registersCost = registers * CATALOG.registers.S610.price;
  const compoundsCost = (compounds.h2ohmBags * CATALOG.compounds.H2OHM.price) + (compounds.gatBags * CATALOG.compounds.GAT.price) + (compounds.antioxCans * CATALOG.compounds.ANTIOX.price);
  const busbarCost = CATALOG.busbars.TG_BPS240.price;
  const suppressorsCost = (suppressors.main * CATALOG.suppressors.SUPR_B_60.price) + (suppressors.secondary * CATALOG.suppressors.SUPT_UTPAC.price);
  const chemicalRodCost = soilResistivity > 500 ? CATALOG.chemical_rods.CHEMGROUND_3M.price : 0;
  
  const totalCost = kitCost + rodsCost + conductorCost + connectorsCost + registersCost + 
                    compoundsCost + busbarCost + suppressorsCost + chemicalRodCost;
  
  // Generar lista de materiales
  const materials = [
    {
      category: 'Kits Principales',
      items: [{
        code: kit.code,
        name: kit.name,
        description: kit.description,
        quantity: 1,
        unit: 'pza',
        unitPrice: kit.price,
        totalPrice: kitCost
      }]
    },
    {
      category: 'Electrodos y Varillas',
      items: [{
        code: rod.code,
        name: rod.name,
        description: `${rod.diameter} x ${rod.length}m, ${rod.material}`,
        quantity: numRods,
        unit: 'pza',
        unitPrice: rod.price,
        totalPrice: rodsCost
      }]
    },
    {
      category: 'Conductores',
      items: [{
        code: conductor.code,
        name: conductor.name,
        description: `${conductor.gauge}, ${conductor.area} mm2`,
        quantity: totalConductor,
        unit: 'm',
        unitPrice: conductor.pricePerMeter,
        totalPrice: conductorCost
      }]
    },
    {
      category: 'Conectores',
      items: [
        {
          code: 'TGAB-21',
          name: 'Conector varilla-cable',
          description: 'Para cable 3/0 AWG - 350 KCM, varilla 3/4"',
          quantity: connectors.rodConnectors,
          unit: 'pza',
          unitPrice: CATALOG.connectors.TGAB_21.price,
          totalPrice: connectors.rodConnectors * CATALOG.connectors.TGAB_21.price
        },
        {
          code: 'TGCR-14',
          name: 'Conector borne-cable',
          description: 'Para cable 1/0 AWG - 250 KCM',
          quantity: connectors.nodeConnectors,
          unit: 'pza',
          unitPrice: CATALOG.connectors.TGCR_14.price,
          totalPrice: connectors.nodeConnectors * CATALOG.connectors.TGCR_14.price
        },
        {
          code: 'TGACP',
          name: 'Abrazadera de cobre',
          description: 'Fijacion de cable a muro',
          quantity: connectors.perimeterConnectors,
          unit: 'pza',
          unitPrice: CATALOG.connectors.TGACP.price,
          totalPrice: connectors.perimeterConnectors * CATALOG.connectors.TGACP.price
        }
      ]
    },
    {
      category: 'Registros',
      items: [{
        code: 'S610',
        name: 'Registro con tapa',
        description: '16 cm tapa, 23.5 cm profundidad',
        quantity: registers,
        unit: 'pza',
        unitPrice: CATALOG.registers.S610.price,
        totalPrice: registersCost
      }]
    },
    {
      category: 'Compuestos Mejoradores',
      items: [
        {
          code: 'H2OHM',
          name: 'Compuesto mejorador de tierra',
          description: 'Saco 11 kg',
          quantity: compounds.h2ohmBags,
          unit: 'saco',
          unitPrice: CATALOG.compounds.H2OHM.price,
          totalPrice: compounds.h2ohmBags * CATALOG.compounds.H2OHM.price
        },
        {
          code: 'GAT',
          name: 'Compuesto acondicionador',
          description: 'Saco 20 kg',
          quantity: compounds.gatBags,
          unit: 'saco',
          unitPrice: CATALOG.compounds.GAT.price,
          totalPrice: compounds.gatBags * CATALOG.compounds.GAT.price
        },
        {
          code: 'ANTIOX',
          name: 'Aerosol antioxidante',
          description: '370 g',
          quantity: compounds.antioxCans,
          unit: 'pza',
          unitPrice: CATALOG.compounds.ANTIOX.price,
          totalPrice: compounds.antioxCans * CATALOG.compounds.ANTIOX.price
        }
      ]
    },
    {
      category: 'Barras de Union',
      items: [{
        code: 'TG-BPS240',
        name: 'Barra de union',
        description: '40x14x8.58 cm, 16 perforaciones',
        quantity: 1,
        unit: 'pza',
        unitPrice: CATALOG.busbars.TG_BPS240.price,
        totalPrice: busbarCost
      }]
    },
    {
      category: 'Supresores',
      items: [
        {
          code: 'SUP-R-60-2-FASO',
          name: 'Supresor Categoria B',
          description: '60 kA, 127/220 V',
          quantity: suppressors.main,
          unit: 'pza',
          unitPrice: CATALOG.suppressors.SUPR_B_60.price,
          totalPrice: suppressors.main * CATALOG.suppressors.SUPR_B_60.price
        }
      ]
    }
  ];
  
  // Agregar supresores secundarios si aplica
  if (suppressors.secondary > 0) {
    materials.find(m => m.category === 'Supresores').items.push({
      code: 'SUPT-UTPAC',
      name: 'Supresor para contacto',
      description: 'Contacto inteligente',
      quantity: suppressors.secondary,
      unit: 'pza',
      unitPrice: CATALOG.suppressors.SUPT_UTPAC.price,
      totalPrice: suppressors.secondary * CATALOG.suppressors.SUPT_UTPAC.price
    });
  }
  
  // Agregar electrodo quimico si resistividad es alta
  if (soilResistivity > 500) {
    materials.unshift({
      category: 'Electrodos Quimicos (Suelo de alta resistividad)',
      items: [{
        code: 'CHEMGROUND3-2D',
        name: 'Electrodo quimico',
        description: '3 m, 2", para suelos de alta resistividad',
        quantity: 1,
        unit: 'pza',
        unitPrice: CATALOG.chemical_rods.CHEMGROUND_3M.price,
        totalPrice: chemicalRodCost
      }]
    });
  }
  
  return {
    projectName,
    date: new Date().toLocaleDateString(),
    complies,
    gridArea,
    totalConductor,
    numRods,
    rodLength,
    totalCost: totalCost.toFixed(2),
    materials,
    summary: {
      totalItems: materials.reduce((acc, cat) => acc + cat.items.length, 0),
      categories: materials.length,
      estimatedWeight: (totalConductor * 0.5 + numRods * 5 + compounds.h2ohmBags * 11 + compounds.gatBags * 20).toFixed(0)
    }
  };
};

/**
 * Exporta lista de materiales a CSV con UTF-8 BOM (sin caracteres extraños)
 */
export const exportMaterialListToCSV = (materialList) => {
  const headers = ['Categoria', 'Codigo', 'Producto', 'Descripcion', 'Cantidad', 'Unidad', 'Precio Unitario (MXN)', 'Total (MXN)'];
  const rows = [];

  for (const category of materialList.materials) {
    for (const item of category.items) {
      // Limpiar descripciones para evitar problemas en CSV
      let description = item.description;
      description = description.replace(/,/g, ';'); // Reemplazar comas por punto y coma
      description = description.replace(/"/g, "'"); // Reemplazar comillas dobles

      rows.push([
        category.category,
        item.code,
        item.name,
        description,
        item.quantity,
        item.unit,
        item.unitPrice.toFixed(2),
        item.totalPrice.toFixed(2)
      ]);
    }
  }

  // Agregar fila de total
  rows.push(['', '', '', '', '', '', 'TOTAL (MXN)', materialList.totalCost]);

  // Crear contenido CSV
  let csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

  // Agregar BOM (Byte Order Mark) para UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Materiales_${(materialList.projectName || 'Proyecto').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Exporta lista de materiales a formato tabla HTML
 */
export const exportMaterialListToHTML = (materialList) => {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lista de Materiales - Grounding Designer Pro</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
        h2 { color: #166534; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        .total { font-weight: bold; background-color: #e5e7eb; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <h1>GROUNDING DESIGNER PRO</h1>
      <h2>Lista de Materiales para Puesta a Tierra</h2>
      <p><strong>Proyecto:</strong> ${materialList.projectName || 'Proyecto de Puesta a Tierra'}</p>
      <p><strong>Fecha:</strong> ${materialList.date}</p>
      
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Codigo</th>
            <th>Producto</th>
            <th>Descripcion</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Precio Unit. (MXN)</th>
            <th>Total (MXN)</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  for (const category of materialList.materials) {
    for (const item of category.items) {
      html += `
        <tr>
          <td>${category.category}</td>
          <td>${item.code}</td>
          <td>${item.name}</td>
          <td>${item.description}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:center">${item.unit}</td>
          <td style="text-align:right">$${item.unitPrice.toFixed(2)}</td>
          <td style="text-align:right">$${item.totalPrice.toFixed(2)}</td>
        </tr>
      `;
    }
  }
  
  html += `
        <tr class="total">
          <td colspan="7" style="text-align:right"><strong>TOTAL</strong></td>
          <td style="text-align:right"><strong>$${materialList.totalCost}</strong></td>
        </tr>
        </tbody>
      </table>
      
      <div class="footer">
        <p>Grounding Designer Pro - Diseño de Mallas de Tierra segun IEEE 80</p>
        <p>Proyectos Integrales - Puerto Vallarta, Jalisco, Mexico</p>
        <p>Documento generado automaticamente</p>
      </div>
    </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Materiales_${(materialList.projectName || 'Proyecto').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default { 
  generateMaterialList, 
  exportMaterialListToCSV,
  exportMaterialListToHTML
};