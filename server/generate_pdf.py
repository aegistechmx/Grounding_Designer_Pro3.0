"""
Professional PDF Generator for Grounding Designer Pro
Uses ReportLab to generate engineering-grade PDF reports
"""

import json
from reportlab.platypus import *
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime

# Load real data from JSON
with open("data.json", "r") as f:
    data = json.load(f)

results = data.get("results", {})
recommendations = data.get("recommendations", [])
history = data.get("history", [])
error = data.get("error", 0)
project_info = data.get("projectInfo", {})

# Setup document
doc = SimpleDocTemplate("report.pdf", pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.HexColor('#1e40af'),
    spaceAfter=30,
    alignment=TA_CENTER
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=16,
    textColor=colors.HexColor('#1e3a8a'),
    spaceAfter=12,
    spaceBefore=20
)

elements = []

# ==================== COVER PAGE ====================
# Add corporate logo
try:
    elements.append(Image("../public/LOGO.png", width=3*cm, height=1.5*cm))
except:
    pass  # Logo not available, continue without it

elements.append(Spacer(1, 1*cm))
elements.append(Paragraph("GROUNDING SYSTEM REPORT", title_style))
elements.append(Spacer(1, 0.5*cm))
elements.append(Paragraph("Confidential Engineering Document", ParagraphStyle(
    'Subtitle',
    parent=styles['Normal'],
    fontSize=14,
    textColor=colors.gray,
    alignment=TA_CENTER
)))
elements.append(Spacer(1, 1*cm))

# Project information
if project_info:
    elements.append(Paragraph(f"Client: {project_info.get('clientName', 'N/A')}", styles['Normal']))
    elements.append(Paragraph(f"Project: {project_info.get('projectName', 'N/A')}", styles['Normal']))
    elements.append(Paragraph(f"Engineer: {project_info.get('engineer', 'N/A')}", styles['Normal']))
    elements.append(Paragraph(f"Date: {project_info.get('date', datetime.now().strftime('%Y-%m-%d'))}", styles['Normal']))
    elements.append(Spacer(1, 0.5*cm))

elements.append(Paragraph(f"Standard: IEEE 80-2013", styles['Normal']))
elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
elements.append(PageBreak())

# ==================== EXECUTIVE SUMMARY ====================
elements.append(Paragraph("Executive Summary", heading_style))

summary_data = [
    ["Parameter", "Value"],
    ["Grid Resistance (Rg)", f"{results.get('Rg', 0):.2f} Ω"],
    ["GPR", f"{results.get('GPR', 0):.0f} V"],
    ["Touch Voltage (Em)", f"{results.get('Em', 0):.0f} V"],
    ["Step Voltage (Es)", f"{results.get('Es', 0):.0f} V"],
    ["Status", "SAFE" if results.get("complies") else "UNSAFE"]
]

summary_table = Table(summary_data, colWidths=[6*cm, 4*cm])
summary_table.setStyle(TableStyle([
    ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 10),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
]))

elements.append(summary_table)
elements.append(Spacer(1, 1*cm))
elements.append(PageBreak())

# ==================== HEATMAP ANALYSIS ====================
elements.append(Paragraph("Heatmap Analysis", heading_style))
elements.append(Paragraph("Voltage distribution visualization", styles['Normal']))
elements.append(Spacer(1, 0.5*cm))

# Add heatmap image
try:
    elements.append(Image("heatmap.png", width=16*cm, height=10*cm))
except:
    elements.append(Paragraph("[Heatmap image not available]", styles['Normal']))

elements.append(Spacer(1, 0.5*cm))
elements.append(PageBreak())

# ==================== ENGINEERING ANALYSIS ====================
elements.append(Paragraph("Engineering Analysis", heading_style))

# Touch voltage analysis
touch_safe = results.get('Em', 0) <= results.get('Etouch70', 0)
touch_color = colors.green if touch_safe else colors.red
elements.append(Paragraph(
    f"Touch Voltage: {results.get('Em', 0):.1f} V vs Permissible {results.get('Etouch70', 0):.1f} V",
    ParagraphStyle('Analysis', parent=styles['Normal'], textColor=touch_color, fontSize=11)
))

# Step voltage analysis
step_safe = results.get('Es', 0) <= results.get('Estep70', 0)
step_color = colors.green if step_safe else colors.red
elements.append(Paragraph(
    f"Step Voltage: {results.get('Es', 0):.1f} V vs Permissible {results.get('Estep70', 0):.1f} V",
    ParagraphStyle('Analysis', parent=styles['Normal'], textColor=step_color, fontSize=11)
))

elements.append(Spacer(1, 1*cm))

# Additional parameters
params_data = [
    ["Parameter", "Value"],
    ["Grid Current (Ig)", f"{results.get('Ig', 0):.0f} A"],
    ["Fault Current", f"{results.get('faultCurrent', 0):.0f} A"],
    ["Fault Duration", f"{results.get('faultDuration', 0):.2f} s"],
    ["Soil Resistivity", f"{results.get('soilResistivity', 0):.0f} Ω·m"],
]

params_table = Table(params_data, colWidths=[6*cm, 4*cm])
params_table.setStyle(TableStyle([
    ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6b7280')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
]))

elements.append(params_table)
elements.append(Spacer(1, 1*cm))
elements.append(PageBreak())

# ==================== ENGINEERING RECOMMENDATIONS ====================
elements.append(Paragraph("Engineering Recommendations", heading_style))

if recommendations:
    rec_data = [["Priority", "Action", "Value", "Impact"]]
    
    for rec in recommendations:
        priority = rec.get("priority", "")
        action = rec.get("action", "")
        value = str(rec.get("value", ""))
        impact = rec.get("impact", "")
        
        # Color code priority
        priority_color = colors.green
        if priority == "CRITICAL":
            priority_color = colors.red
        elif priority == "HIGH":
            priority_color = colors.orange
        
        rec_data.append([priority, action, value, impact])
    
    rec_table = Table(rec_data, colWidths=[2*cm, 4*cm, 2*cm, 3*cm])
    rec_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
    ]))
    
    elements.append(rec_table)
else:
    elements.append(Paragraph("No specific recommendations for this design.", styles['Normal']))

elements.append(Spacer(1, 1*cm))
elements.append(PageBreak())

# ==================== DESIGN EVOLUTION ====================
if history:
    elements.append(Paragraph("Design Evolution", heading_style))
    
    history_data = [["Version", "Rg (Ω)", "Em (V)", "Status"]]
    
    for i, h in enumerate(history[:5]):  # Last 5 versions
        r = h.get("results", {})
        history_data.append([
            f"v{i+1}",
            f"{r.get('Rg', 0):.2f}",
            f"{r.get('Em', 0):.0f}",
            "SAFE" if r.get("complies") else "UNSAFE"
        ])
    
    history_table = Table(history_data, colWidths=[2*cm, 3*cm, 3*cm, 3*cm])
    history_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
    ]))
    
    elements.append(history_table)
    elements.append(Spacer(1, 1*cm))
    elements.append(PageBreak())

# ==================== MODEL ACCURACY ANALYSIS ====================
elements.append(Paragraph("Model Accuracy Analysis", heading_style))

elements.append(Paragraph(
    f"Average error between analytical and discrete model: {error:.2f} V",
    ParagraphStyle('ErrorAnalysis', parent=styles['Normal'], fontSize=11)
))

if error < 50:
    status = "High accuracy model"
    status_color = colors.green
elif error < 150:
    status = "Acceptable accuracy"
    status_color = colors.orange
else:
    status = "Model deviation significant"
    status_color = colors.red

elements.append(Paragraph(
    f"Assessment: {status}",
    ParagraphStyle('Status', parent=styles['Normal'], textColor=status_color, fontSize=11, fontName='Helvetica-Bold')
))

elements.append(Spacer(1, 1*cm))
elements.append(PageBreak())

# ==================== COMPLIANCE ASSESSMENT ====================
elements.append(Paragraph("Compliance Assessment (IEEE Std 80-2013)", heading_style))

def check_compliance(label, condition):
    return "PASS" if condition else "FAIL"

compliance_data = [
    ["Criterion", "Result"],
    ["Touch Voltage Limit", check_compliance("touch", results.get("Em", 0) <= results.get("Etouch70", 0))],
    ["Step Voltage Limit", check_compliance("step", results.get("Es", 0) <= results.get("Estep70", 0))],
    ["Ground Resistance < 5Ω", check_compliance("Rg", results.get("Rg", 0) < 5)],
    ["Thermal Conductor Capacity", check_compliance("thermal", results.get("thermalCheck", {}).get("complies", False))]
]

compliance_table = Table(compliance_data, colWidths=[8*cm, 3*cm])
compliance_table.setStyle(TableStyle([
    ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ('BACKGROUND', (0, 0), (-1, 0), colors.black),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))

elements.append(compliance_table)
elements.append(Spacer(1, 1*cm))

# Final verdict
if results.get("complies"):
    verdict = "SYSTEM COMPLIES WITH IEEE 80 SAFETY REQUIREMENTS"
    verdict_color = colors.green
else:
    verdict = "SYSTEM DOES NOT COMPLY - MITIGATION REQUIRED"
    verdict_color = colors.red

elements.append(Paragraph(verdict, ParagraphStyle(
    'Verdict',
    parent=styles['Heading2'],
    textColor=verdict_color,
    alignment=TA_CENTER
)))

elements.append(Spacer(1, 1*cm))
elements.append(PageBreak())

# ==================== COMPLIANCE CERTIFICATE ====================
elements.append(Paragraph("Compliance Certificate", heading_style))

compliance_text = f"""
This grounding system design has been analyzed according to IEEE Std 80-2013.
The design {'COMPLIES' if results.get('complies') else 'DOES NOT COMPLY'} with the safety requirements 
for personnel protection against step and touch voltages.
"""

elements.append(Paragraph(compliance_text, ParagraphStyle(
    'Compliance',
    parent=styles['Normal'],
    fontSize=11,
    leading=16,
    alignment=TA_LEFT
)))

elements.append(Spacer(1, 2*cm))

# Signature block
elements.append(Paragraph("___________________________", styles['Normal']))
elements.append(Paragraph("Engineer Signature", styles['Normal']))
elements.append(Spacer(1, 0.5*cm))
elements.append(Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d')}", styles['Normal']))

# Footer
elements.append(Spacer(1, 2*cm))
footer_text = "Grounding Designer Pro • Professional Engineering Analysis • IEEE 80-2013"
elements.append(Paragraph(footer_text, ParagraphStyle(
    'Footer',
    parent=styles['Normal'],
    fontSize=8,
    textColor=colors.gray,
    alignment=TA_CENTER
)))

# Build PDF
doc.build(elements)

print("PDF generated successfully: report.pdf")
