# Auditoría de Cuentas cPanel y Estrategia de Optimización (Right-Sizing)
*Instance Shape Cloud Hosting - Informe Técnico y Operativo*  
*Fecha de Auditoría: Octubre 2026*  
*Versión:* 2.1.0

---

## 1. Inventario y Auditoría Real de Recursos (WHM vs Panel)

A continuación se detalla el estado auditado directamente desde la API de cPanel/WHM y la base de datos de producción:

| Usuario cPanel | Dominio Principal | Cliente Asignado | Plan Asignado | Cuota Actual | Disco Usado | % Uso | Cuentas Correo | Dominios Addon | Diagnóstico |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`frutyexpres`** | `frutyexpres.com` | Jhonathan Perea | **Bronze** | 500 MB | 1 MB | 0.2% | 0 | 0 | ✅ Óptimo / Plan Base |
| **`mundialdesillas`**| `mundialdesillas.com` | Dickson Herrera | **Bronze** | 500 MB | 11 MB | 2.2% | 0 | 0 | ✅ Optimizado a Bronze |
| **`mrchorro`** | `mrchorro.app` | Kevin Andrey H. | **Bronze** | 500 MB | 28 MB | 5.6% | 2 | 0 | ✅ Optimizado a Bronze |
| **`mejorseguridad`** | `tumejorseguridad.com` | Dickson Herrera | **Bronze** | 500 MB | 91 MB | 18.2% | 1 | 0 | ✅ Optimizado a Bronze |
| **`theagadvantagegr`**| `theagadvantagegroup.com`| Edwin | **Silver** | 1.000 MB | 291 MB | 29.1% | 1 | 0 | ✅ Dominio Principal Activo |
| **`garixcom`** | `garix.com.co` | Juan Carlos | **Silver** | 1.000 MB | 335 MB | 33.5% | 0 | 0 | ✅ Optimizado a Silver |
| **`dualbs`** | `dualbs.com` | Dickson Herrera | **Gold** | 2.000 MB | 1.840 MB | 92.0% | 0 | 0 | ⚠️ **Reducido a Shape Gold** |
| **`nmpsicologia`** | `nmpsicologiaenevolucion.com` | Kevin Andrey H. | **Gold** | 2.000 MB | 770 MB | 38.5% | 3 | 0 | ✅ Congruente en Gold |
| **`highsolutions`** | `highsolutionssas.com` | César Sánchez | **Gold** | 2.000 MB | 801 MB | 40.1% | 1 | 0 | ✅ Congruente en Gold |
| **`tamales`** | `tamalestolimenseseduard.com`| Dickson Herrera | **Gold** | 2.000 MB | 808 MB | 40.4% | 2 | 0 | ✅ Congruente en Gold |
| **`ansftranslations`**| `ansftranslations.com` | Roberto Forero | **Gold** | 2.000 MB | 963 MB | 48.1% | 1 | 0 | ✅ Congruente en Gold |
| **`shape`** | `instanceshape.com` | Kevin Andrey H. | **Platinum** | 5.000 MB | 1.866 MB | 37.3% | 2 | 0 | ✅ Dominio $0 (Incluido en Hosting) |

---

## 2. Ajustes Especiales y Resoluciones de Negocio

### 2.1. Downgrade Formal de `dualbs` a Paquete Gold (`shape_gold`)
- **Instrucción de Dirección:** Se solicitó expresamente la reducción del paquete de `dualbs` desde *Platinum* hacia *Gold*.
- **Plan Asignado:** `shape_gold` (2.000 MB de disco, 200 GB de ancho de banda, 1 dominio adicional permitido, casillas de correo ilimitadas).
- **Impacto Operativo:**
  - Consumo actual: **1.840 MB**.
  - Ocupación bajo Gold: **92.0%**.
  - Margen de maniobra disponible: **160 MB libres**.
- **Acciones Realizadas:**
  - Actualización directa en la tabla `hostings`: `package_id = 'shape_gold'`.
  - Vinculación explícita en `hosting_domains` con el dominio `dualbs.com` (id `cmlmoq18c000hcfi0bnh90loo`).
  - Registro de alerta para monitorear periódicamente que el consumo no exceda los 2.000 MB para prevenir rebote de correos.

### 2.2. Regla de Inclusión de Dominio en Hosting (`instanceshape.com` a $0 COP)
- **Instrucción de Dirección:** En el caso de `instanceshape.com`, dominio y hosting van en el mismo paquete; por lo tanto, el dominio tiene un valor de **$0 COP** porque el hosting incluye el dominio.
- **Acciones Realizadas:**
  - Actualización en base de datos: `UPDATE domains SET sale_price = 0.00, with_hosting = 1 WHERE fqdn = 'instanceshape.com'`.
  - Vinculación en `hosting_domains` entre el servicio de hosting `instanceshape` y el dominio `instanceshape.com`.
  - En los informes ejecutivos y paneles de renovación, el costo del dominio se liquida a $0 COP.

### 2.3. Consolidación de Dominio: `theagadvantagegroup.com`
- **Instrucción de Dirección:** `agadvantagegroup.com` ahora es `theagadvantagegroup.com`. Todas las fechas de renovación y estados priman sobre el nuevo dominio.
- **Acciones Realizadas:**
  - `theagadvantagegroup.com` confirmado como **Dominio Principal Activo** con registrador **Spaceship, Inc.** y vencimiento oficial **02/10/2027**.
  - El hosting `theagadvantagegr` fue actualizado con `next_billing_date = '2027-10-02 22:03:47'`.
  - El dominio antiguo `agadvantagegroup.com` fue marcado como `REJECTED` / `CANCELLED` en la base de datos para prevenir duplicidad de cobros o conflictos de recordatorios.

---

## 3. Matriz Consolidada de Paquetes Instance Shape

| Identificador WHM | Nombre Comercial | Disco (MB) | Ancho de Banda (GB) | Cuentas Correo | Dominios Addon | Antispam (emails/h) | Tarifa Anual (COP) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `shape_bronze` | **Shape Bronze** | 500 MB | 50 GB | 5 | 0 | 20 | **$39.900** |
| `shape_silver` | **Shape Silver** | 1.000 MB | 100 GB | 5 | 0 | 20 | **$79.900** |
| `shape_gold` | **Shape Gold** | 2.000 MB | 200 GB | Ilimitadas | 1 | 60 | **$119.900** |
| `shape_platinum` | **Shape Platinum** | 5.000 MB | 500 GB | Ilimitadas | 2 | 60 | **$159.900** |
| `shape_diamond` | **Shape Diamond** | 10.000 MB | 1.000 GB | Ilimitadas | Ilimitados | 300 | **$299.900** |
| `shape_ssh` | **Shape SSH (Transitorio)** | Ilimitado | Ilimitado | Ilimitadas | Ilimitados | 300 | Exclusivo Interno |

---
*Instance Shape SAS • Auditoría y Optimización de Infraestructura*
