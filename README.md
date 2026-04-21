# ⚡ Grounding Designer Pro

Sistema profesional para el diseño y cálculo de mallas de puesta a tierra según normas IEEE 80-2013 y CFE 01J00-01.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Instalación](#instalación)
- [Uso Básico](#uso-básico)
- [Guía de Cálculos](#guía-de-cálculos)
- [Exportación de Reportes](#exportación-de-reportes)
- [Soporte](#soporte)

## ✨ Características

### Cálculos IEEE 80
- **Cálculo de corriente de falla** (Ig)
- **Resistencia de malla** (Rg)
- **Elevación de potencial** (GPR)
- **Tensiones de contacto y paso** (Em, Es)
- **Verificación de seguridad** para personas de 50kg y 70kg
- **Cumplimiento con normas** IEEE 80, CFE 01J00-01, NOM-001-SEDE

### Herramientas de Diseño
- 🎨 **Visualización 3D** de la malla de tierra
- 🗺️ **Medición con Google Maps** para dimensiones
- 🤖 **IA Predictiva** para análisis inteligente
- 📊 **Dashboard** con métricas en tiempo real
- 📋 **Plantillas predefinidas** (Residencial, Comercial, Industrial, Subestación)

### Exportación
- 📄 **PDF** con reporte técnico completo
- 📊 **Excel** con datos de cálculos
- 📐 **AutoCAD (DXF)** con plano de malla
- 💾 **JSON** para guardar/cargar configuraciones

### Optimización
- 🎯 **Reducción de GPR** a valores objetivo
- ⚡ **Propuesta de malla optimizada**
- 🔧 **Cálculo automático** de malla
- 🔥 **Verificación térmica** de conductores
- 🌱 **Análisis de tratamiento** de suelo

## 🚀 Instalación

### Requisitos Previos
- Node.js 16+ 
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/usuario/grounding-calculator.git
cd grounding-calculator
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar la aplicación**
```bash
npm start
```

4. **Abrir en el navegador**
```
http://localhost:3000
```

## 📖 Uso Básico

### 1. Configuración del Sistema Eléctrico

Ingrese los parámetros del transformador:

- **Transformador (kVA):** Capacidad del transformador
- **Voltaje Primario (V):** Voltaje del lado de alta tensión
- **Voltaje Secundario (V):** Voltaje del lado de baja tensión
- **Impedancia (%Z):** Impedancia del transformador (típicamente 5-6%)

La corriente de falla se calcula automáticamente.

### 2. Duración de Falla y Factor Sf

- **Duración de falla (s):** Tiempo de despeje de la protección
  - 0.25s para protecciones rápidas
  - 0.5s para protecciones estándar
  - 1.0s para protecciones lentas

- **Factor de división Sf:** Fracción de corriente que entra a la malla
  - 0.15-0.25 para poste aéreo
  - 0.30-0.50 para subestación pad-mounted
  - 0.50-0.70 para subestación interior

### 3. Características del Suelo

- **Resistividad del suelo (Ω·m):** Medir con método Wenner de 4 puntas
  - Suelo húmedo: 50-100 Ω·m
  - Suelo seco: 100-500 Ω·m
  - Suelo rocoso: 500-2000 Ω·m

- **Capa superficial:** Material sobre la malla
  - Grava: 3000 Ω·m
  - Asfalto: 2000-5000 Ω·m
  - Concreto: 100-300 Ω·m

### 4. Configuración de Malla

- **Dimensiones:** Largo y ancho del área disponible
- **Profundidad:** Típicamente 0.5-1.0 m
- **Conductores paralelos:** Mínimo 2, máximo 20
- **Varillas:** Número y longitud (2.4-4.2 m típico)

## 🧮 Guía de Cálculos

### Fórmulas Principales

#### Resistencia de Malla (Rg)
```
Rg = ρ / (4π) + ρ / L
```
Donde:
- ρ = Resistividad del suelo
- L = Longitud total de conductor

#### Corriente de Malla (Ig)
```
Ig = If × Sf
```
Donde:
- If = Corriente de falla
- Sf = Factor de división

#### Tensión de Contacto (Em)
```
Em = ρ × Ks × Ki × Ig / L
```
Donde:
- Ks = Factor de geometría
- Ki = Factor de irregularidad

#### GPR (Ground Potential Rise)
```
GPR = Ig × Rg
```

### Límites de Seguridad

| Peso | Tensión Contacto | Tensión Paso |
|------|-----------------|--------------|
| 50kg | 116 V (0.25s) | 116 V (0.25s) |
| 70kg | 157 V (0.25s) | 157 V (0.25s) |

## 📤 Exportación de Reportes

### PDF
1. Click en "Exportar PDF"
2. Se genera reporte técnico con:
   - Datos del proyecto
   - Parámetros de entrada
   - Resultados de cálculos
   - Verificación de cumplimiento
   - Firma del ingeniero

### Excel
- Exporta datos en formato CSV
- Compatible con Excel, Google Sheets, etc.

### AutoCAD (DXF)
- Genera plano de malla con:
  - Conductores
  - Varillas
  - Dimensiones
  - Capas organizadas

### JSON
- Guarda configuración completa
- Permite compartir entre usuarios
- Facilita respaldos

## ⌨️ Atajos de Teclado

| Combinación | Acción |
|-------------|--------|
| Ctrl+S | Guardar perfil |
| Ctrl+E | Exportar PDF |
| Ctrl+Z | Deshacer |
| Ctrl+Shift+Z | Rehacer |
| Ctrl+D | Cambiar tema claro/oscuro |
| Ctrl+G | Reducir GPR |

## 🏢 Proyectos Integrales

**Contacto:**
- 📍 Calle Prolongación Bolivia No. 1782-2, Col. Lázaro Cárdenas
- 📍 Puerto Vallarta, Jalisco, México, C.P. 48330
- 📞 Cel.: (322) 245 63 22
- 📧 e-mail: proyectosintegralespv@gmail.com

## 📚 Normas Aplicadas

- **IEEE Std 80-2013** - Guide for Safety in AC Substation Grounding
- **CFE 01J00-01** - Comisión Federal de Electricidad
- **NOM-001-SEDE-2012** - Instalaciones Eléctricas

## ⚠️ Notas Importantes

- Estos cálculos son referenciales y deben ser validados por un ingeniero especializado
- La resistividad del suelo debe medirse in-situ
- Valores de corriente de falla deben obtenerse de estudio de cortocircuito
- Cumplir con códigos locales y regulaciones aplicables
- Se recomienda verificación in-situ del sistema instalado

## 🛠️ Troubleshooting

### Problema: Los campos de entrada pierden el foco
**Solución:** El componente InputField ha sido optimizado con React.memo para evitar re-renderizados innecesarios.

### Problema: Resultados de cálculo son NaN
**Solución:** Verifique que todos los campos requeridos tengan valores válidos, especialmente:
- Resistividad del suelo (> 0)
- Dimensiones de malla (> 0)
- Número de conductores (≥ 2)

### Problema: El diseño no cumple con IEEE 80
**Soluciones:**
- Aumentar número de conductores paralelos
- Agregar más varillas
- Reducir factor Sf
- Mejorar capa superficial (grava de alta resistividad)
- Aumentar profundidad de la malla

## 📝 Licencia

Este software es propiedad de Proyectos Integrales.

## 🔄 Versiones

- **v2.0** - IA Predictiva, Google Maps, Exportación DXF
- **v1.0** - Versión inicial con cálculos IEEE 80 básicos

---

**Desarrollado por:** Proyectos Integrales
**Versión:** 2.0
**Última actualización:** 2026

