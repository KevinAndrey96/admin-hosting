# Auditoría de Cuentas cPanel y Estrategia de Optimización (Right-Sizing)
*Instance Shape Cloud Hosting - Informe Técnico y Operativo*  
*Fecha de Auditoría: Octubre 2026*

---

## 1. Inventario y Auditoría Real de Recursos (WHM vs Panel)

A continuación se detalla el estado auditado directamente desde la API de cPanel/WHM y la base de datos de producción:

| Usuario cPanel | Dominio Principal | Cliente Asignado | Plan Asignado | Cuota Actual | Disco Usado | % Uso | Cuentas Correo | Dominios Addon | Diagnóstico |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`frutyexpres`** | `frutyexpres.com` | Jhonathan Perea | **Bronze** | 500 MB | 1 MB | 0.2% | 0 | 0 | ✅ Óptimo / Plan Base |
| **`mundialdesillas`**| `mundialdesillas.com` | Dickson Herrera | **Gold** | 2.000 MB | 11 MB | 0.5% | 0 | 0 | 🔽 **Sobredimensionado** |
| **`mrchorro`** | `mrchorro.app` | Kevin Andrey H. | **Gold** | 2.000 MB | 28 MB | 1.4% | 2 | 0 | 🔽 **Sobredimensionado** |
| **`mejorseguridad`** | `tumejorseguridad.com` | Dickson Herrera | **Silver** | 1.000 MB | 91 MB | 9.1% | 1 | 0 | 🔽 **Sobredimensionado** |
| **`theagadvantagegr`**| `theagadvantagegroup.com`| Edwin | **Gold** | 2.000 MB | 291 MB | 14.5% | 1 | 0 | 🔽 **Sobredimensionado** |
| **`garixcom`** | `garix.com.co` | Juan Carlos | **Gold** | 2.000 MB | 335 MB | 16.8% | 0 | 0 | 🔽 **Sobredimensionado** |
| **`nmpsicologia`** | `nmpsicologiaenevolucion.com` | Kevin Andrey H. | **Gold** | 2.000 MB | 770 MB | 38.5% | 3 | 0 | ✅ Congruente |
| **`highsolutions`** | `highsolutionssas.com` | César Sánchez | **Gold** | 2.000 MB | 801 MB | 40.1% | 1 | 0 | ✅ Congruente |
| **`tamales`** | `tamalestolimenseseduard.com`| Dickson Herrera | **Gold** | 2.000 MB | 808 MB | 40.4% | 2 | 0 | ✅ Congruente |
| **`ansftranslations`**| `ansftranslations.com` | Roberto Forero | **Gold** | 2.000 MB | 963 MB | 48.1% | 1 | 0 | ✅ Congruente / Vigilar |
| **`dualbs`** | `dualbs.com` | Dickson Herrera | **Platinum** | 5.000 MB | 1.840 MB | 36.8% | 0 | 0 | ✅ Congruente |
| **`shape`** | `instanceshape.com` | Kevin Andrey H. | **Platinum** | 5.000 MB | 1.866 MB | 37.3% | 2 | 0 | ✅ Congruente |

---

## 2. Análisis de Congruencia Operativa

1. **Ausencia de Sobregiros:** Ninguna cuenta supera su cuota asignada. El promedio de uso general de la plataforma se mantiene en un saludable **24.5%**.
2. **Límites de Correo:** Ninguna cuenta activa supera los 3 buzones de correo creados. Los planes **Bronze** y **Silver** (que permiten hasta 5 cuentas de correo) cubren con holgura las necesidades de la mayoría de clientes.
3. **Dominios Addon:** Ninguna cuenta actual tiene configurados dominios adicionales en cPanel (`addonCount = 0`).

---

## 3. Matriz de Reducción de Planes (Right-Sizing)

Se identificaron **5 cuentas** que pagan o tienen asignados paquetes superiores a su consumo real, con la siguiente propuesta de ajuste:

| Cuenta cPanel | Dominio | Plan Actual | Plan Sugerido | Espacio Libre Resultante | Justificación Técnica |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **`mundialdesillas`** | `mundialdesillas.com` | **Gold** ($289.999) | ➔ **Bronze** ($159.900) | **489 MB libres (97.8%)** | Consume solo 11 MB y no tiene correos creados. |
| **`mrchorro`** | `mrchorro.app` | **Gold** ($289.999) | ➔ **Bronze** ($159.900) | **472 MB libres (94.4%)** | Consume 28 MB y 2 correos (el plan Bronze permite 5). |
| **`mejorseguridad`** | `tumejorseguridad.com` | **Silver** ($199.999) | ➔ **Bronze** ($159.900) | **409 MB libres (81.8%)** | Consume 91 MB y 1 correo. Muy seguro en 500 MB. |
| **`theagadvantagegr`** | `theagadvantagegroup.com` | **Gold** ($289.999) | ➔ **Silver** ($199.999) | **709 MB libres (70.9%)** | Consume 291 MB y 1 correo. Queda con ~30% de uso en 1 GB. |
| **`garixcom`** | `garix.com.co` | **Gold** ($289.999) | ➔ **Silver** ($199.999) | **665 MB libres (66.5%)** | Consume 335 MB y 0 correos. Queda con ~33% de uso en 1 GB. |

---

## 4. Cuentas que NO Deben Reducirse

- **`instanceshape`** (1.866 MB) y **`dualbs`** (1.840 MB):
  - *Motivo:* Si bajaran a Gold (2.000 MB), operarían al **93.3%** y **92.0%** de su capacidad, lo cual bloquearía la entrada de nuevos correos o backups. Deben permanecer en **Platinum (5.000 MB)**.
- **`ansftranslations`** (963 MB), **`tamales`** (808 MB), **`highsolutions`** (801 MB) y **`nmpsicologia`** (770 MB):
  - *Motivo:* En Silver (1.000 MB) operarían entre el **77% y el 96.3%** de ocupación. Deben permanecer en **Gold (2.000 MB)** para garantizar estabilidad operativa.

---

## 5. Procedimiento de Aplicación

Para aplicar una reducción de paquete:
1. **En Panel Admin:**
   - Ir a `/hosting/[id]/edit`.
   - Seleccionar el nuevo paquete (`Bronze` o `Silver`).
   - Guardar cambios.
2. **En Servidor cPanel / WHM:**
   - La API de WHM aplica la nueva cuota mediante:
     ```bash
     curl -s -H "Authorization: whm shape:$TOKEN" \
       "https://46.224.80.244:2087/json-api/changepackage?api.version=1&user=$USER&pkg=$PLAN"
     ```
   - cPanel ajusta automáticamente los límites de disco, cuotas de correo y ancho de banda sin interrupción de servicio para el sitio web.
