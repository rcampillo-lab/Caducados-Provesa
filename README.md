# Caducados PROVESA v3.0

App estática tipo **Other** para Vercel/GitHub.

## Novedades v3.0

- Añadida gestión local de reclamaciones.
- Se pueden seleccionar líneas de lote/entrada y guardarlas como:
  - Reclamado
  - En trámite
  - Aceptado
  - Rechazado
  - Abonado
  - No reclamar
- Se puede añadir una nota de reclamación.
- Las líneas guardadas dejan de aparecer en la vista de **Pendientes**.
- Nueva pestaña **Reclamados** para consultar lo reclamado o en trámite.
- Nuevo filtro **Gestión**:
  - Pendientes
  - Reclamados / en trámite
  - Todos
- Botón **Devolver a pendientes** para quitar una línea de reclamados.
- Botón **Exportar reclamaciones** para descargar el histórico local a Excel.
- Botón **Borrar reclamaciones locales** para limpiar el navegador.

## Importante sobre el guardado

Esta versión guarda las reclamaciones en el navegador mediante almacenamiento local.

Esto significa:

- No hay base de datos.
- No se guarda en GitHub.
- No se comparte entre ordenadores ni entre navegadores.
- Si se borra la caché/datos del navegador, se pueden perder las reclamaciones.
- Para conservar copia de seguridad, usar periódicamente **Exportar reclamaciones**.

## Lógica de identificación

Cada línea se identifica internamente por:

- Nº artículo
- Lote
- Almacén
- Fecha caducidad
- Nº entrada mercancía
- Proveedor entrada

Así, al cargar un nuevo Excel de SAP, si la misma línea sigue existiendo, la app la reconoce como ya reclamada/en trámite.

## Lógica de política

La app cruza por la columna **Proveedor entrada**.

Interpretación del Excel de políticas:

- `365` = se considera en política si entró con menos de 365 días de vida útil.
- `270` = se considera en política si entró con menos de 270 días.
- `181` = se considera en política si entró con menos de 181 días.
- `0` en la columna **Política** = proveedor no acepta devolución.
- `0` en la columna **Política frio** = sin política especial de frío; se usa la política general.

Si un proveedor no aparece en el Excel, se aplica la norma general de 365 días.

## Uso

1. Ejecutar la query en SAP.
2. Exportar el resultado a Excel.
3. Abrir la app.
4. Cargar el Excel de SAP.
5. Filtrar los productos.
6. Seleccionar las líneas que quieras gestionar.
7. Elegir estado y escribir una nota si procede.
8. Pulsar **Guardar estado**.

## Actualizar políticas

Para cambiar las políticas, sustituir en GitHub el archivo:

`assets/politicas-caducidad-proveedores.xlsx`

Después hacer redeploy en Vercel o esperar a que Vercel despliegue automáticamente el cambio.

## Despliegue en Vercel

Framework Preset: **Other**

Sin build command, sin `package.json` y sin `vercel.json`.
