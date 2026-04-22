# scripts/analyze-all-files.ps1
# Análisis DETALLADO de todos los archivos del proyecto

param(
    [string]$Path = "src",
    [switch]$Detailed = $true
)

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔍 ANÁLISIS DETALLADO DE ARCHIVOS - GROUNDING DESIGNER PRO" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. ESTRUCTURA DE CARPETAS
# ============================================
Write-Host "📁 1. ESTRUCTURA DE CARPETAS" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

Get-ChildItem -Path $Path -Directory -Recurse | ForEach-Object {
    $fileCount = (Get-ChildItem $_.FullName -File -Recurse).Count
    $indent = "  " * ($_.FullName.Split('\').Count - ($Path.Split('\').Count))
    Write-Host "$indent📂 $($_.Name) ($fileCount archivos)" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 2. ANÁLISIS POR TIPO DE ARCHIVO
# ============================================
Write-Host "📄 2. ARCHIVOS POR TIPO" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$extensions = Get-ChildItem -Path $Path -Recurse -File | Group-Object Extension | Sort-Object Count -Descending
$extensions | ForEach-Object {
    Write-Host "   $($_.Name) : $($_.Count) archivos" -ForegroundColor Cyan
}
Write-Host ""

# ============================================
# 3. ANÁLISIS DETALLADO POR SUBDIRECTORIO
# ============================================
Write-Host "📂 3. ANÁLISIS POR SUBDIRECTORIO" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$directories = Get-ChildItem -Path $Path -Directory
foreach ($dir in $directories) {
    $files = Get-ChildItem -Path $dir.FullName -Recurse -File
    $jsFiles = $files | Where-Object { $_.Extension -in '.js', '.jsx', '.ts', '.tsx' }
    $cssFiles = $files | Where-Object { $_.Extension -in '.css', '.scss' }
    $jsonFiles = $files | Where-Object { $_.Extension -eq '.json' }
    
    Write-Host ""
    Write-Host "📁 $($dir.Name)/" -ForegroundColor Magenta
    Write-Host "   ├── Total archivos: $($files.Count)" -ForegroundColor Gray
    Write-Host "   ├── JS/TS/JSX: $($jsFiles.Count)" -ForegroundColor Green
    Write-Host "   ├── CSS: $($cssFiles.Count)" -ForegroundColor Blue
    Write-Host "   └── JSON: $($jsonFiles.Count)" -ForegroundColor Yellow
    
    if ($Detailed -and $jsFiles.Count -le 20) {
        Write-Host "   └── Archivos:" -ForegroundColor DarkGray
        foreach ($file in $jsFiles) {
            $sizeKB = [math]::Round($file.Length / 1KB, 2)
            Write-Host "       📄 $($file.Name) ($sizeKB KB)" -ForegroundColor Gray
        }
    }
}
Write-Host ""

# ============================================
# 4. ANÁLISIS DE IMPORTACIONES
# ============================================
Write-Host "🔗 4. ANÁLISIS DE IMPORTACIONES" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$imports = Select-String -Path "$Path\**\*.jsx", "$Path\**\*.js" -Pattern "import.*from" -ErrorAction SilentlyContinue
$uniqueImports = $imports | ForEach-Object { $_ -replace 'import.*from [''"]', '' -replace '[''"].*', '' } | Sort-Object -Unique

Write-Host "   Total de importaciones únicas: $($uniqueImports.Count)" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 5. ARCHIVOS MÁS GRANDES
# ============================================
Write-Host "📏 5. ARCHIVOS MÁS GRANDES (>50KB)" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$largeFiles = Get-ChildItem -Path $Path -Recurse -File | Where-Object { $_.Length -gt 50KB } | Sort-Object Length -Descending
if ($largeFiles) {
    $largeFiles | Select-Object -First 20 | ForEach-Object {
        $sizeKB = [math]::Round($_.Length / 1KB, 2)
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "   📄 $($_.FullName.Replace('$PWD\', '')) - $sizeKB KB ($sizeMB MB)" -ForegroundColor Red
    }
} else {
    Write-Host "   ✅ No hay archivos >50KB" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 6. COMPONENTES POR CATEGORÍA
# ============================================
Write-Host "🧩 6. COMPONENTES POR CATEGORÍA" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$categories = @{
    "Panels" = "panels"
    "Layout" = "layout"
    "Common" = "common"
    "Visualizations" = "visualizations"
    "AI" = "ai"
    "Reports" = "reports"
    "Wizard" = "wizard"
    "Templates" = "templates"
    "Docs" = "docs"
    "Feeders" = "feeders"
    "Optimization" = "optimization"
    "Validation" = "validation"
}

foreach ($cat in $categories.Keys) {
    $componentPath = "$Path\components\$($categories[$cat])"
    if (Test-Path $componentPath) {
        $count = (Get-ChildItem -Path $componentPath -Filter "*.jsx" -ErrorAction SilentlyContinue).Count
        Write-Host "   $cat : $count componentes" -ForegroundColor Green
    }
}
Write-Host ""

# ============================================
# 7. SERVICIOS Y UTILIDADES
# ============================================
Write-Host "⚙️ 7. SERVICIOS Y UTILIDADES" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$services = Get-ChildItem -Path "$Path\services" -Filter "*.js" -ErrorAction SilentlyContinue
$utils = Get-ChildItem -Path "$Path\utils" -Filter "*.js" -ErrorAction SilentlyContinue
$hooks = Get-ChildItem -Path "$Path\hooks" -Filter "*.js" -ErrorAction SilentlyContinue

Write-Host "   📡 Servicios: $($services.Count)" -ForegroundColor Cyan
$services | ForEach-Object { Write-Host "      - $($_.Name)" -ForegroundColor Gray }

Write-Host "   🔧 Utilidades: $($utils.Count)" -ForegroundColor Cyan
$utils | ForEach-Object { Write-Host "      - $($_.Name)" -ForegroundColor Gray }

Write-Host "   🪝 Hooks: $($hooks.Count)" -ForegroundColor Cyan
$hooks | ForEach-Object { Write-Host "      - $($_.Name)" -ForegroundColor Gray }
Write-Host ""

# ============================================
# 8. ARCHIVOS SIN REFERENCIA (POSIBLES HUÉRFANOS)
# ============================================
Write-Host "🗑️ 8. ARCHIVOS SIN POSIBLE REFERENCIA" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$allFiles = Get-ChildItem -Path $Path -Recurse -Include "*.js", "*.jsx" | Where-Object { $_.Name -notlike "index.*" }
$orphans = @()

foreach ($file in $allFiles) {
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $references = Select-String -Path "$Path\**\*.js", "$Path\**\*.jsx" -Pattern "$fileName" -ErrorAction SilentlyContinue
    if ($references.Count -eq 1) {  # Solo la propia definición
        $orphans += $file.FullName.Replace("$PWD\", "")
    }
}

if ($orphans) {
    $orphans | ForEach-Object { Write-Host "   ⚠️ $_" -ForegroundColor Yellow }
} else {
    Write-Host "   ✅ No se detectaron archivos huérfanos" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 9. RESUMEN FINAL
# ============================================
Write-Host "📊 RESUMEN FINAL" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan

$totalFiles = (Get-ChildItem -Path $Path -Recurse -File).Count
$totalJS = (Get-ChildItem -Path $Path -Recurse -Include "*.js", "*.jsx").Count
$totalCSS = (Get-ChildItem -Path $Path -Recurse -Include "*.css", "*.scss").Count
$totalSize = [math]::Round((Get-ChildItem -Path $Path -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host ""
Write-Host "   📊 Total archivos: $totalFiles" -ForegroundColor Green
Write-Host "   📄 Archivos JS/JSX: $totalJS" -ForegroundColor Green
Write-Host "   🎨 Archivos CSS: $totalCSS" -ForegroundColor Green
Write-Host "   💾 Tamaño total: $totalSize MB" -ForegroundColor Green
Write-Host ""

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ ANÁLISIS COMPLETADO" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan