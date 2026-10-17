# Reglas de Comportamiento del Asistente

## Política de Envíos de Correo Electrónico (Email Dispatch Guardrail)
1. **Prohibición de Envíos Automáticos en Pruebas:**
   - No ejecutar llamadas a endpoints, comandos `curl`, scripts o funciones que despachen correos electrónicos reales a clientes o administradores mediante SMTP, a menos que el usuario lo solicite o autorice de forma explícita y textual en su mensaje.
   - En pruebas de endpoints de cron (como `/api/cron/renewal-reminders`), utilizar mocks, banderas de simulación (`dryRun=true`), o verificar la lógica y respuestas JSON sin ejecutar el método de transporte de correo real (`sendEmail`).
