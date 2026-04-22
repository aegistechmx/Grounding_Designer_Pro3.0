import { jsPDF } from "jspdf";

export const generateFullReport = async ({
  results,
  params,
  recommendations,
  heatmapImage,
  history = [],
  aiDecisions = []
}) => {
  const doc = new jsPDF();
  const totalPages = 12; // Total estimated pages
  let currentPage = 1;

  // Helper function to add header to all pages
  const addHeader = () => {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("GROUNDING DESIGNER PRO", 105, 15, { align: "center" });
    doc.text("IEEE 80-2013 Compliant", 105, 20, { align: "center" });
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 25, 190, 25);
    doc.setTextColor(0, 0, 0);
  };

  // Helper function to add footer to all pages
  const addFooter = () => {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${currentPage} of ${totalPages}`, 105, 285, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 285);
    doc.text("Confidential - Engineering Document", 190, 285, { align: "right" });
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 278, 190, 278);
    doc.setTextColor(0, 0, 0);
    currentPage++;
  };

  // ===== PORTADA =====
  addHeader();
  doc.setFontSize(24);
  doc.setTextColor(0, 51, 102);
  doc.text("GROUNDING SYSTEM REPORT", 105, 60, { align: "center" });
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(14);
  doc.text(`Project: ${params.projectName || "N/A"}`, 20, 90);
  doc.text(`Client: ${params.clientName || "N/A"}`, 20, 100);
  doc.text(`Location: ${params.projectLocation || "N/A"}`, 20, 110);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 120);
  doc.text("Standard: IEEE 80-2013", 20, 130);
  doc.text(`Report No: ${params.reportNumber || "R-" + Date.now()}`, 20, 140);

  // Status box
  doc.setDrawColor(0, 51, 102);
  doc.setFillColor(240, 248, 255);
  doc.rect(20, 160, 170, 30, 'FD');
  doc.setFontSize(16);
  const coverStatus = results?.complies ? "✅ SAFE" : "❌ UNSAFE";
  doc.setTextColor(results?.complies ? 0 : 200, results?.complies ? 100 : 0, 0);
  doc.text(`STATUS: ${coverStatus}`, 105, 180, { align: "center" });
  doc.setTextColor(0, 0, 0);

  addFooter();
  doc.addPage();

  // ===== RESUMEN EJECUTIVO =====
  addHeader();
  doc.setFontSize(16);
  doc.text("EXECUTIVE SUMMARY", 20, 40);

  doc.setFontSize(12);
  const summaryStatus = results?.complies ? "✅ SAFE" : "❌ UNSAFE";
  doc.setTextColor(results?.complies ? 0 : 200, results?.complies ? 100 : 0, 0);
  doc.text(`Status: ${summaryStatus}`, 20, 60);
  doc.setTextColor(0, 0, 0);

  doc.text(`Rg: ${results?.Rg?.toFixed(2) || 'N/A'} Ω`, 20, 70);
  doc.text(`GPR: ${results?.GPR?.toFixed(2) || 'N/A'} V`, 20, 80);
  doc.text(`Em (Mesh): ${results?.Em?.toFixed(2) || 'N/A'} V`, 20, 90);
  doc.text(`Etouch70: ${results?.Etouch70?.toFixed(2) || 'N/A'} V`, 20, 100);
  doc.text(`Risk Level: ${results?.complies ? 'Low' : 'High'}`, 20, 110);

  addFooter();
  doc.addPage();

  // ===== DATOS DE ENTRADA =====
  addHeader();
  doc.setFontSize(16);
  doc.text("INPUT PARAMETERS", 20, 40);

  doc.setFontSize(11);
  let y = 50;
  
  // Professional table styling
  doc.setDrawColor(180, 180, 180);
  doc.setFillColor(245, 245, 245);
  
  doc.text("SOIL PARAMETERS", 20, y); y += 15;
  doc.text(`Resistivity: ${params?.soilResistivity || 'N/A'} Ω·m`, 25, y); y += 10;
  doc.text(`Surface Layer: ${params?.surfaceLayer || 'N/A'} Ω·m`, 25, y); y += 10;
  doc.text(`Surface Depth: ${params?.surfaceDepth || 'N/A'} m`, 25, y); y += 15;

  doc.text("GRID GEOMETRY", 20, y); y += 15;
  doc.text(`Length: ${params?.gridLength || 'N/A'} m`, 25, y); y += 10;
  doc.text(`Width: ${params?.gridWidth || 'N/A'} m`, 25, y); y += 10;
  doc.text(`Depth: ${params?.gridDepth || 'N/A'} m`, 25, y); y += 10;
  doc.text(`Conductors: ${params?.numParallel || 'N/A'}`, 25, y); y += 10;
  doc.text(`Rods: ${params?.numRods || 'N/A'}`, 25, y); y += 10;
  doc.text(`Rod Length: ${params?.rodLength || 'N/A'} m`, 25, y); y += 15;

  doc.text("TRANSFORMER", 20, y); y += 15;
  doc.text(`kVA: ${params?.transformerKVA || 'N/A'}`, 25, y); y += 10;
  doc.text(`Fault Current: ${params?.faultCurrent || 'N/A'} A`, 25, y); y += 10;
  doc.text(`Duration: ${params?.faultDuration || 'N/A'} s`, 25, y);

  addFooter();
  doc.addPage();

  // ===== RESULTADOS DE CÁLCULO =====
  addHeader();
  doc.setFontSize(16);
  doc.text("CALCULATION RESULTS", 20, 40);

  doc.setFontSize(11);
  y = 50;
  
  // Professional table with borders
  const table = [
    ["Parameter", "Value", "Unit", "Status"],
    ["Grid Resistance (Rg)", results?.Rg?.toFixed(3) || 'N/A', "Ω", "-"],
    ["GPR", results?.GPR?.toFixed(2) || 'N/A', "V", "-"],
    ["Grid Current (Ig)", results?.Ig?.toFixed(2) || 'N/A', "A", "-"],
    ["", "", "", ""],
    ["Mesh Voltage (Em)", results?.Em?.toFixed(2) || 'N/A', "V", results?.touchSafe ? "SAFE" : "UNSAFE"],
    ["Touch Limit (70kg)", results?.Etouch70?.toFixed(2) || 'N/A', "V", "-"],
    ["Touch Margin", ((results?.Etouch70 - results?.Em) / results?.Etouch70 * 100)?.toFixed(1) || 'N/A', "%", "-"],
    ["", "", "", ""],
    ["Step Voltage (Es)", results?.Es?.toFixed(2) || 'N/A', "V", results?.stepSafe ? "SAFE" : "UNSAFE"],
    ["Step Limit (70kg)", results?.Estep70?.toFixed(2) || 'N/A', "V", "-"],
    ["Step Margin", ((results?.Estep70 - results?.Es) / results?.Estep70 * 100)?.toFixed(1) || 'N/A', "%", "-"],
    ["", "", "", ""],
    ["Overall Compliance", results?.complies ? "YES" : "NO", "-", results?.complies ? "SAFE" : "UNSAFE"]
  ];

  // Draw table with professional styling
  const cellWidth = [60, 40, 25, 35];
  const cellHeight = 10;
  const startX = 20;
  const startY = y;

  table.forEach((row, rowIndex) => {
    row.forEach((cell, cellIndex) => {
      const x = startX + cellWidth.slice(0, cellIndex).reduce((a, b) => a + b, 0);
      const yPos = startY + rowIndex * cellHeight;
      
      // Draw cell border
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(rowIndex === 0 ? 230 : 255, rowIndex === 0 ? 230 : 255, rowIndex === 0 ? 250 : 255);
      doc.rect(x, yPos, cellWidth[cellIndex], cellHeight, 'FD');
      
      // Draw cell text
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(cell, x + 2, yPos + 7);
      
      // Color code status
      if (cell === "SAFE") {
        doc.setTextColor(0, 150, 0);
        doc.text(cell, x + 2, yPos + 7);
      } else if (cell === "UNSAFE") {
        doc.setTextColor(200, 0, 0);
        doc.text(cell, x + 2, yPos + 7);
      }
    });
  });

  addFooter();
  doc.addPage();

  // ===== VERIFICACIÓN IEEE =====
  addHeader();
  doc.setFontSize(16);
  doc.text("IEEE 80 VERIFICATION", 20, 40);

  doc.setFontSize(11);
  y = 50;
  
  doc.text("Touch Voltage Safety", 20, y); y += 10;
  doc.text(`Em: ${results?.Em?.toFixed(2) || 'N/A'} V`, 25, y); y += 8;
  doc.text(`Etouch70: ${results?.Etouch70?.toFixed(2) || 'N/A'} V`, 25, y); y += 8;
  doc.text(`Status: ${results?.touchSafe ? "✅ SAFE" : "❌ UNSAFE"}`, 25, y); y += 15;

  doc.text("Step Voltage Safety", 20, y); y += 10;
  doc.text(`Es: ${results?.Es?.toFixed(2) || 'N/A'} V`, 25, y); y += 8;
  doc.text(`Estep70: ${results?.Estep70?.toFixed(2) || 'N/A'} V`, 25, y); y += 8;
  doc.text(`Status: ${results?.stepSafe ? "✅ SAFE" : "❌ UNSAFE"}`, 25, y); y += 15;

  doc.text("Overall Compliance", 20, y); y += 10;
  doc.text(`Result: ${results?.complies ? "✅ COMPLIES" : "❌ DOES NOT COMPLY"}`, 25, y);

  addFooter();
  doc.addPage();

  // ===== HEATMAP =====
  addHeader();
  doc.setFontSize(16);
  doc.text("GROUND POTENTIAL DISTRIBUTION", 20, 40);

  doc.setFontSize(10);
  doc.text("Heatmap showing potential distribution across the grounding grid", 20, 50);

  if (heatmapImage) {
    doc.addImage(heatmapImage, "PNG", 10, 60, 190, 140);
  } else {
    doc.text("Heatmap not available", 20, 70);
  }

  addFooter();
  doc.addPage();

  // ===== ANÁLISIS DE RIESGO =====
  addHeader();
  doc.setFontSize(16);
  doc.text("RISK ANALYSIS", 20, 40);

  doc.setFontSize(11);
  y = 50;
  
  doc.text("Risk Level Assessment", 20, y); y += 15;
  const riskLevel = results?.complies ? "LOW" : "HIGH";
  doc.text(`Overall Risk: ${riskLevel}`, 25, y); y += 10;
  doc.text(`Touch Voltage Risk: ${results?.touchSafe ? "LOW" : "HIGH"}`, 25, y); y += 10;
  doc.text(`Step Voltage Risk: ${results?.stepSafe ? "LOW" : "HIGH"}`, 25, y); y += 15;

  doc.text("Safety Margins", 20, y); y += 15;
  const touchMargin = ((results?.Etouch70 - results?.Em) / results?.Etouch70 * 100)?.toFixed(1) || 0;
  const stepMargin = ((results?.Estep70 - results?.Es) / results?.Estep70 * 100)?.toFixed(1) || 0;
  doc.text(`Touch Voltage Margin: ${touchMargin}%`, 25, y); y += 10;
  doc.text(`Step Voltage Margin: ${stepMargin}%`, 25, y);

  addFooter();
  doc.addPage();

  // ===== RECOMENDACIONES =====
  addHeader();
  doc.setFontSize(16);
  doc.text("ENGINEERING RECOMMENDATIONS", 20, 40);

  doc.setFontSize(11);
  y = 50;

  if (recommendations && recommendations.length > 0) {
    recommendations.forEach((rec, i) => {
      doc.text(`${i + 1}. ${rec}`, 25, y);
      y += 12;
    });
  } else {
    doc.text("• Design complies with IEEE 80 requirements", 25, y); y += 12;
    doc.text("• Verify in-situ measurements", 25, y); y += 12;
    doc.text("• Perform regular maintenance inspections", 25, y);
  }

  addFooter();
  doc.addPage();

  // ===== CONCLUSIÓN TÉCNICA =====
  addHeader();
  doc.setFontSize(16);
  doc.text("TECHNICAL CONCLUSION", 20, 40);

  doc.setFontSize(11);
  y = 50;
  
  const conclusion = results?.complies 
    ? "The grounding system design COMPLIES with IEEE 80-2013 requirements. All touch and step voltages are within safe limits. The system is ready for installation."
    : "The grounding system design DOES NOT COMPLY with IEEE 80-2013 requirements. Improvements are required to reduce touch and step voltages to safe levels.";
  
  const lines = doc.splitTextToSize(conclusion, 170);
  lines.forEach((line, i) => {
    doc.text(line, 20, y + i * 8);
  });

  addFooter();
  doc.addPage();

  // ===== ANEXO =====
  addHeader();
  doc.setFontSize(16);
  doc.text("APPENDIX - IEEE 80 PARAMETERS", 20, 40);

  doc.setFontSize(10);
  y = 50;
  
  doc.text("Formulas Used:", 20, y); y += 10;
  doc.text("- Touch Voltage: Em = (Km * Ki * Ks * ρ * Ig) / L", 25, y); y += 8;
  doc.text("- Step Voltage: Es = (Ks * ρ * Ig) / L", 25, y); y += 8;
  doc.text("- Grid Resistance: Rg = (ρ / L) * (ln(2L²/ρ) + ...)", 25, y); y += 15;

  doc.text("Parameters:", 20, y); y += 10;
  doc.text(`Km (mesh factor): Calculated from grid geometry`, 25, y); y += 8;
  doc.text(`Ki (irregularity factor): Based on conductor spacing`, 25, y); y += 8;
  doc.text(`Ks (step factor): Based on grid depth and spacing`, 25, y); y += 8;
  doc.text(`ρ (resistivity): ${params?.soilResistivity || 'N/A'} Ω·m`, 25, y); y += 8;
  doc.text(`Ig (grid current): ${results?.Ig?.toFixed(2) || 'N/A'} A`, 25, y); y += 8;
  doc.text(`L (total conductor length): Calculated from geometry`, 25, y);

  addFooter();
  doc.addPage();

  // ===== HISTORIAL / TIMELINE =====
  addHeader();
  doc.setFontSize(16);
  doc.text("DESIGN HISTORY / TIMELINE", 20, 40);

  doc.setFontSize(10);
  y = 50;

  if (history && history.length > 0) {
    history.slice(0, 10).forEach((version, i) => {
      const date = new Date(version.timestamp).toLocaleString();
      doc.text(`Version ${i + 1}: ${date}`, 20, y); y += 8;
      doc.text(`  Rg: ${version.results?.Rg?.toFixed(2) || 'N/A'} Ω`, 25, y); y += 6;
      doc.text(`  Em: ${version.results?.Em?.toFixed(2) || 'N/A'} V`, 25, y); y += 6;
      doc.text(`  Status: ${version.results?.complies ? 'SAFE' : 'UNSAFE'}`, 25, y); y += 10;
    });
  } else {
    doc.text("No history available", 20, y);
  }

  addFooter();
  doc.addPage();

  // ===== AI DECISIONS (Professional Table) =====
  addHeader();
  doc.setFontSize(16);
  doc.text("AI-POWERED ENGINEERING DECISIONS", 20, 40);

  doc.setFontSize(10);
  y = 50;

  if (aiDecisions && aiDecisions.length > 0) {
    // Professional table for AI decisions
    const decisionTable = [
      ["#", "Action", "Priority", "Expected Impact"],
      ...aiDecisions.map((d, i) => [
        i + 1,
        d.decision?.action || 'N/A',
        d.priority.toUpperCase(),
        Object.entries(d.decision?.expectedImprovement || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ') || 'N/A'
      ])
    ];

    const cellWidth = [15, 50, 30, 75];
    const cellHeight = 12;
    const startX = 20;
    const startY = y;

    decisionTable.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        const x = startX + cellWidth.slice(0, cellIndex).reduce((a, b) => a + b, 0);
        const yPos = startY + rowIndex * cellHeight;
        
        // Draw cell border
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(rowIndex === 0 ? 230 : 255, rowIndex === 0 ? 230 : 255, rowIndex === 0 ? 250 : 255);
        doc.rect(x, yPos, cellWidth[cellIndex], cellHeight, 'FD');
        
        // Draw cell text
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        const text = doc.splitTextToSize(cell, cellWidth[cellIndex] - 4);
        text.forEach((line, lineIndex) => {
          doc.text(line, x + 2, yPos + 5 + lineIndex * 4);
        });
        
        // Color code priority
        if (cell === "CRITICAL") {
          doc.setTextColor(200, 0, 0);
          doc.text(cell, x + 2, yPos + 5);
        } else if (cell === "HIGH") {
          doc.setTextColor(200, 100, 0);
          doc.text(cell, x + 2, yPos + 5);
        } else if (cell === "MEDIUM") {
          doc.setTextColor(200, 150, 0);
          doc.text(cell, x + 2, yPos + 5);
        } else if (cell === "LOW") {
          doc.setTextColor(0, 150, 0);
          doc.text(cell, x + 2, yPos + 5);
        }
      });
    });
  } else {
    doc.text("No AI decisions available", 20, y);
  }

  addFooter();

  // 💾 GUARDAR
  doc.save("engineering_report.pdf");
};

// Keep the old function for backward compatibility
export const generateEngineeringPDF = generateFullReport;
