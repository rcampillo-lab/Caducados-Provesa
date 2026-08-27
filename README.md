# Caducados PROVESA v3.14

App estática tipo **Other** para Vercel/GitHub.

## Cambios v3.14

1. **Cabeceras de Excel simplificadas**
   - En exportaciones con fecha de caducidad, la columna pasa de **Fecha de caducidad** a **Caducidad**.
   - En **Producción fuera política**, la columna **Última entrada del artículo** pasa a **Última entrada**.
   - En **Producción fuera política**, la columna **Última venta artículo** pasa a **Última venta**.

2. **Cantidad centrada**
   - En los Excel de gestión, la columna **Cantidad** queda alineada al centro.
   - Se mantiene formato numérico compacto: enteros sin decimales y decimales solo cuando existan.

3. **Sin filtros automáticos en Excel**
   - Los Excel exportados ya no aparecen con autofiltros activados por defecto.
   - Se mantiene la congelación de cabecera y la configuración de impresión.

## Base mantenida desde v3.13

- Flujo **Gestionar** con producción fuera de política contemplando almacenes **01 + 02** juntos.
- Exportación de producción fuera política ordenada por caducidad y con fila en blanco entre meses.
- Excel preparado para impresión A4 horizontal, una página de ancho y márgenes estrechos.

## Estados de gestión

- **Pendiente**: estado normal.
- **En trámite**: gestión abierta/tramitándose.
- **En oferta**: artículo enviado a oferta/descuento.

La gestión se guarda en el navegador mediante almacenamiento local.
