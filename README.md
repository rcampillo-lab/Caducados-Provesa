# Caducados PROVESA v3.13

App estática tipo **Other** para Vercel/GitHub.

## Cambios v3.13

1. **Flujo Gestionar — producción fuera de política conjunta**
   - El paso de **producción fuera de política próximos 6 meses** se gestiona una sola vez contemplando los almacenes **01 y 02 juntos**.
   - Ya no se repite por separado en almacén 01 y almacén 02.
   - En el flujo guiado, tras producción conjunta se pasa al almacén 02 para continuar con el resto de gestiones.

2. **Exportación Producción fuera política**
   - Incluye almacenes **01 + 02** en un único Excel.
   - Ordena por **fecha de caducidad ascendente**.
   - Inserta una fila en blanco entre meses.
   - Sustituye la columna **Última entrada del lote** por **Última entrada del artículo**.

3. **Impresión Excel**
   - Exportaciones de gestión configuradas para impresión en **A4 horizontal**.
   - Ajuste a una página de ancho.
   - Márgenes estrechos y columnas compactas.

## Estados de gestión

- **Pendiente**: estado normal.
- **En trámite**: gestión abierta/tramitándose.
- **En oferta**: artículo enviado a oferta/descuento.

La gestión se guarda en el navegador mediante almacenamiento local.
