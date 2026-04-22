# scripts/analyze-repo.ps1
# Script para detectar archivos duplicados, obsoletos y no utilizados

Write-Host "ANALIZANDO REPOSITORIO - GROUNDING DESIGNER PRO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. DETECTAR ARCHIVOS DUPLICADOS POR NOMBRE
# ============================================
Write-Host "1. ARCHIVOS DUPLICADOS (mismo nombre)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$duplicates = Get-ChildItem -Path src -Recurse -File | Group-Object Name | Where-Object { $_.Count -gt 1 }
if ($duplicates) {
    $duplicates | ForEach-Object {
        Write-Host "$($_.Name) ($($_.Count) copias)" -ForegroundColor Red
        $_.Group | ForEach-Object { Write-Host "     $($_.FullName)" -ForegroundColor Gray }
    }
} else {
    Write-Host "No se encontraron archivos duplicados por nombre" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 2. DETECTAR ARCHIVOS CON CONTENIDO DUPLICADO
# ============================================
Write-Host "2. ARCHIVOS CON CONTENIDO DUPLICADO" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$files = Get-ChildItem -Path src -Recurse -Include *.js, *.jsx, *.ts, *.tsx, *.css
$hashTable = @{}
$duplicateContent = @()

foreach ($file in $files) {
    $hash = Get-FileHash $file.FullName -Algorithm MD5
    if ($hashTable.ContainsKey($hash.Hash)) {
        $duplicateContent += @{
            File1 = $hashTable[$hash.Hash]
            File2 = $file.FullName
            Hash = $hash.Hash
        }
    } else {
        $hashTable[$hash.Hash] = $file.FullName
    }
}

if ($duplicateContent) {
    $duplicateContent | ForEach-Object {
        Write-Host "Contenido duplicado:" -ForegroundColor Red
        Write-Host "     $($_.File1)" -ForegroundColor Gray
        Write-Host "     $($_.File2)" -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "No se encontraron archivos con contenido duplicado" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 3. DETECTAR ARCHIVOS OBSOLETOS (con _old, _backup, .bak)
# ============================================
Write-Host "3. ARCHIVOS OBSOLETOS (backups, temporales)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$obsolete = Get-ChildItem -Path src -Recurse | Where-Object { 
    $_.Name -match "_old|_backup|_bak|\.bak|\.tmp|\.swp|deprecated|legacy" 
}
if ($obsolete) {
    $obsolete | ForEach-Object {
        Write-Host "$($_.FullName)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Recomendacion: Eliminar estos archivos obsoletos" -ForegroundColor Yellow
} else {
    Write-Host "No se encontraron archivos obsoletos" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 4. DETECTAR ARCHIVOS NO IMPORTADOS
# ============================================
Write-Host "4. ARCHIVOS QUE PODRIAN NO ESTAR SIENDO USADOS" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$allFiles = Get-ChildItem -Path src -Recurse -Include *.js, *.jsx, *.ts, *.tsx | Where-Object { $_.Name -notlike "index.*" }
$unusedFiles = @()

foreach ($file in $allFiles) {
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $searchPattern = "['\""].*$fileName.*['\""]|from\s+['\""].*$fileName.*['\""]|import\s+.*$fileName"
    
    $references = Select-String -Path "src\**\*.js" -Pattern $searchPattern -ErrorAction SilentlyContinue
    $referencesJsx = Select-String -Path "src\**\*.jsx" -Pattern $searchPattern -ErrorAction SilentlyContinue
    
    if ($references.Count -eq 0 -and $referencesJsx.Count -eq 0) {
        $unusedFiles += $file.FullName
    }
}

if ($unusedFiles) {
    $unusedFiles | ForEach-Object {
        Write-Host "Posible no usado: $_" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Revisar manualmente estos archivos antes de eliminar" -ForegroundColor Yellow
} else {
    Write-Host "Todos los archivos parecen estar referenciados" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 5. DETECTAR ARCHIVOS VACIOS O MUY PEQUENOS
# ============================================
Write-Host "5. ARCHIVOS VACIOS O MUY PEQUENOS (<100 bytes)" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$emptyFiles = Get-ChildItem -Path src -Recurse -File | Where-Object { $_.Length -lt 100 }
if ($emptyFiles) {
    $emptyFiles | ForEach-Object {
        Write-Host "$($_.FullName) ($($_.Length) bytes)" -ForegroundColor Red
    }
} else {
    Write-Host "No se encontraron archivos vacios" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 6. DETECTAR CARPETAS VACIAS
# ============================================
Write-Host "6. CARPETAS VACIAS" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$emptyFolders = Get-ChildItem -Path src -Recurse -Directory | Where-Object { (Get-ChildItem $_.FullName).Count -eq 0 }
if ($emptyFolders) {
    $emptyFolders | ForEach-Object {
        Write-Host "Carpeta vacia: $($_.FullName)" -ForegroundColor Yellow
    }
} else {
    Write-Host "No se encontraron carpetas vacias" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 7. DETECTAR IMPORTACIONES ROTAS
# ============================================
Write-Host "7. POSIBLES IMPORTACIONES ROTAS" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$imports = Select-String -Path "src\**\*.js" -Pattern "from\s+['\"]\.\./.*['\"]" -ErrorAction SilentlyContinue
$brokenImports = @()

foreach ($import in $imports) {
    $pathPattern = $import.Line -replace ".*from\s+['\"]\.\./(.*)['\"]", '$1'
    $fullPath = Join-Path (Split-Path $import.Path) $pathPattern
    if (-not (Test-Path $fullPath)) {
        $brokenImports += @{
            File = $import.Path
            Line = $import.LineNumber
            Import = $import.Line.Trim()
        }
    }
}

if ($brokenImports) {
    $brokenImports | ForEach-Object {
        Write-Host "$($_.File):$($_.Line)" -ForegroundColor Red
        Write-Host "     $($_.Import)" -ForegroundColor Gray
    }
} else {
    Write-Host "No se detectaron importaciones rotas" -ForegroundColor Green
}
Write-Host ""

# ============================================
# 8. DETECTAR ARCHIVOS DUPLICADOS EN ENGINE
# ============================================
Write-Host "8. ARCHIVOS DUPLICADOS EN ENGINE" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray

$engineDuplicates = @(
    @{ Pattern = "*heatmap*"; Description = "Multiples archivos de heatmap" },
    @{ Pattern = "*groundingMath*"; Description = "Multiples archivos de groundingMath" },
    @{ Pattern = "*optimizer*"; Description = "Multiples optimizadores" },
    @{ Pattern = "*safety*"; Description = "Multiples validaciones de seguridad" }
)

foreach ($dup in $engineDuplicates) {
    $files = Get-ChildItem -Path src -Recurse -Name -Include $dup.Pattern
    if ($files.Count -gt 1) {
        Write-Host "$($dup.Description):" -ForegroundColor Red
        $files | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }
    }
}
Write-Host ""

# ============================================
# 9. RESUMEN FINAL
# ============================================
Write-Host "RESUMEN FINAL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Archivos analizados: $($allFiles.Count)" -ForegroundColor Green
Write-Host "Posibles archivos no usados: $($unusedFiles.Count)" -ForegroundColor Yellow
Write-Host "Archivos obsoletos: $($obsolete.Count)" -ForegroundColor Red
Write-Host "Carpetas vacias: $($emptyFolders.Count)" -ForegroundColor Yellow
Write-Host "Importaciones rotas: $($brokenImports.Count)" -ForegroundColor Red

Write-Host ""
Write-Host "RECOMENDACIONES:" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host '1. Eliminar archivos obsoletos (*_old, *_backup, *.bak)'
Write-Host "2. Revisar archivos duplicados y consolidar"
Write-Host "3. Verificar importaciones rotas"
Write-Host "4. Eliminar carpetas vacias"
Write-Host "5. Consolidar archivos de engine duplicados"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
