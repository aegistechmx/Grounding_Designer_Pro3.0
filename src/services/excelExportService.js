import * as XLSX from 'xlsx';

/**
 * Export calculation results to Excel
 * @param {object} params - Input parameters
 * @param {object} results - Calculation results
 * @param {object} recommendations - Engineering recommendations
 * @returns {void} - Downloads Excel file
 */
export const exportToExcel = (params, results, recommendations = []) => {
  try {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Input Parameters
    const paramsData = [
      ['PARAMETER', 'VALUE', 'UNIT'],
      ['Project Name', params.projectName || 'N/A', '-'],
      ['Client Name', params.clientName || 'N/A', '-'],
      ['Location', params.projectLocation || 'N/A', '-'],
      [''],
      ['SOIL PARAMETERS', '', ''],
      ['Resistivity', params.soilResistivity || 'N/A', 'Ω·m'],
      ['Surface Layer', params.surfaceLayer || 'N/A', 'Ω·m'],
      ['Surface Depth', params.surfaceDepth || 'N/A', 'm'],
      [''],
      ['GRID GEOMETRY', '', ''],
      ['Length', params.gridLength || 'N/A', 'm'],
      ['Width', params.gridWidth || 'N/A', 'm'],
      ['Depth', params.gridDepth || 'N/A', 'm'],
      ['Conductors X', params.numParallel || 'N/A', '-'],
      ['Conductors Y', params.numParallelY || 'N/A', '-'],
      ['Number of Rods', params.numRods || 'N/A', '-'],
      ['Rod Length', params.rodLength || 'N/A', 'm'],
      [''],
      ['TRANSFORMER', '', ''],
      ['kVA', params.transformerKVA || 'N/A', 'kVA'],
      ['Primary Voltage', params.primaryVoltage || 'N/A', 'V'],
      ['Secondary Voltage', params.secondaryVoltage || 'N/A', 'V'],
      ['Impedance', params.transformerImpedance || 'N/A', '%'],
      [''],
      ['FAULT PARAMETERS', '', ''],
      ['Fault Current', params.faultCurrent || 'N/A', 'A'],
      ['Fault Duration', params.faultDuration || 'N/A', 's'],
      ['Current Division Factor', params.currentDivisionFactor || 'N/A', '-']
    ];

    const paramsSheet = XLSX.utils.aoa_to_sheet(paramsData);
    XLSX.utils.book_append_sheet(wb, paramsSheet, 'Input Parameters');

    // Sheet 2: Calculation Results
    const resultsData = [
      ['PARAMETER', 'VALUE', 'UNIT', 'STATUS'],
      ['Grid Resistance (Rg)', results?.Rg?.toFixed(3) || 'N/A', 'Ω', '-'],
      ['GPR', results?.GPR?.toFixed(2) || 'N/A', 'V', '-'],
      ['Grid Current (Ig)', results?.Ig?.toFixed(2) || 'N/A', 'A', '-'],
      [''],
      ['Mesh Voltage (Em)', results?.Em?.toFixed(2) || 'N/A', 'V', results?.touchSafe ? 'SAFE' : 'UNSAFE'],
      ['Touch Limit (70kg)', results?.Etouch70?.toFixed(2) || 'N/A', 'V', '-'],
      ['Touch Margin', ((results?.Etouch70 - results?.Em) / results?.Etouch70 * 100)?.toFixed(1) || 'N/A', '%', '-'],
      [''],
      ['Step Voltage (Es)', results?.Es?.toFixed(2) || 'N/A', 'V', results?.stepSafe ? 'SAFE' : 'UNSAFE'],
      ['Step Limit (70kg)', results?.Estep70?.toFixed(2) || 'N/A', 'V', '-'],
      ['Step Margin', ((results?.Estep70 - results?.Es) / results?.Estep70 * 100)?.toFixed(1) || 'N/A', '%', '-'],
      [''],
      ['Overall Compliance', results?.complies ? 'YES' : 'NO', '-', results?.complies ? 'SAFE' : 'UNSAFE']
    ];

    const resultsSheet = XLSX.utils.aoa_to_sheet(resultsData);
    XLSX.utils.book_append_sheet(wb, resultsSheet, 'Results');

    // Sheet 3: Recommendations
    const recData = [
      ['#', 'RECOMMENDATION', 'PRIORITY'],
      ...recommendations.map((rec, i) => [i + 1, rec, 'HIGH'])
    ];

    if (recommendations.length === 0) {
      recData.push([1, 'Design complies with IEEE 80 requirements', 'LOW']);
      recData.push([2, 'Verify in-situ measurements', 'LOW']);
    }

    const recSheet = XLSX.utils.aoa_to_sheet(recData);
    XLSX.utils.book_append_sheet(wb, recSheet, 'Recommendations');

    // Sheet 4: Summary
    const summaryData = [
      ['GROUNDING SYSTEM SUMMARY'],
      [''],
      ['Project:', params.projectName || 'N/A'],
      ['Date:', new Date().toLocaleDateString()],
      [''],
      ['IEEE 80-2013 Compliance:', results?.complies ? 'YES' : 'NO'],
      ['Risk Level:', results?.complies ? 'LOW' : 'HIGH'],
      [''],
      ['Key Metrics'],
      ['Rg:', results?.Rg?.toFixed(3) || 'N/A', 'Ω'],
      ['GPR:', results?.GPR?.toFixed(2) || 'N/A', 'V'],
      ['Em:', results?.Em?.toFixed(2) || 'N/A', 'V'],
      ['Es:', results?.Es?.toFixed(2) || 'N/A', 'V']
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Generate filename
    const filename = `grounding_report_${params.projectName || 'project'}_${Date.now()}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);
    console.log('Excel file exported:', filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

/**
 * Export multiple projects to Excel (batch)
 * @param {Array} projects - Array of project objects
 * @returns {void} - Downloads Excel file with all projects
 */
export const exportBatchToExcel = (projects) => {
  try {
    const wb = XLSX.utils.book_new();

    projects.forEach((project, index) => {
      const { params, results, recommendations } = project;
      const projectName = params?.projectName || `Project ${index + 1}`;

      const projectData = [
        [`PROJECT: ${projectName}`],
        [''],
        ['PARAMETER', 'VALUE', 'UNIT'],
        ['Rg', results?.Rg?.toFixed(3) || 'N/A', 'Ω'],
        ['GPR', results?.GPR?.toFixed(2) || 'N/A', 'V'],
        ['Em', results?.Em?.toFixed(2) || 'N/A', 'V'],
        ['Es', results?.Es?.toFixed(2) || 'N/A', 'V'],
        ['Complies', results?.complies ? 'YES' : 'NO', '-'],
        [''],
        ['RECOMMENDATIONS'],
        ...recommendations.map(rec => [rec])
      ];

      const sheet = XLSX.utils.aoa_to_sheet(projectData);
      XLSX.utils.book_append_sheet(wb, sheet, projectName.substring(0, 31)); // Excel sheet name max 31 chars
    });

    const filename = `grounding_batch_report_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, filename);
    console.log('Batch Excel file exported:', filename);
  } catch (error) {
    console.error('Error exporting batch to Excel:', error);
    throw error;
  }
};
