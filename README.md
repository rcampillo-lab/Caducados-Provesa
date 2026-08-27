# Caducados PROVESA v3.16

App estática tipo **Other** para Vercel/GitHub.

## Cambios v3.16

1. **Títulos en los Excel de gestión**
   - Todas las exportaciones de gestión incluyen un título en la primera fila.
   - El título usa los valores de filtros en este orden:
     - Caducidad
     - Política
     - Proveedor
     - Tipo artículo
     - Almacén
   - Se muestran los valores, no los nombres de los filtros.
   - Ejemplo: `Caducados actuales - En política - FATRO - Almacén 01`.

2. **Producción fuera política**
   - Reordenada la exportación a:
     - Descripción
     - Cantidad
     - Lote
     - Caducidad
     - Última entrada
     - Última venta
     - Cliente
     - Acción/respuesta

3. **Caducados fuera de política**
   - Añadida la columna **Caducidad** después de **Lote**.
   - Columnas finales:
     - Nº artículo
     - Descripción
     - Cantidad
     - Lote
     - Caducidad

4. **Caducados en política**
   - Añadida la columna **Caducidad**.
   - Columnas finales:
     - Nº artículo
     - Descripción
     - Cantidad
     - Lote
     - Caducidad
     - Albarán de compra
     - Fecha de compra

## Base mantenida desde v3.15

- Fechas en formato fijo `dd/mm/aaaa`.
- Cantidades enteras sin decimales ni coma final.
- Producción fuera política contemplando almacenes **01 + 02** juntos.
- Exportaciones ordenadas por caducidad y con fila en blanco entre meses cuando corresponde.
- Excel preparado para impresión A4 horizontal, una página de ancho y márgenes estrechos.
- Excel sin autofiltros activados por defecto.

## Estados de gestión

- **Pendiente**: estado normal.
- **En trámite**: gestión abierta/tramitándose.
- **En oferta**: artículo enviado a oferta/descuento.

La gestión se guarda en el navegador mediante almacenamiento local.
