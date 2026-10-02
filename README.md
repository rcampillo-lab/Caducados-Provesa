# Caducados PROVESA v3.23

## Cambios v3.23

- Todos los listados Excel empiezan por **Nº artículo, Descripción, Cantidad, Lote y Caducidad**, incluida la vista filtrada y las reclamaciones.
- El listado de producción/ganadería fuera de política incorpora el número de artículo y elimina la última entrada. Muestra **Última venta**, con la fecha del último albarán del artículo y su cliente.
- Producción agrupa por número de artículo, descripción, lote y caducidad para evitar mezclar artículos diferentes con la misma descripción.
- Solo existen dos estados de caducidad: **En política** y **Fuera de política**. Los proveedores sin política y los lotes sin datos suficientes para calcularla quedan fuera de política, también en filtros y gestión guiada.
- **KERSIA**, **FATRO** y **VETNOVA** no tienen política de caducidad: todos sus artículos están **Fuera de política**.
- Se mantienen las políticas internas: 12 meses por defecto; MERCK/MSD, 6 meses para frío y 9 meses para el resto.
- En reclamaciones, **Cantidad** corresponde al stock guardado al marcar la gestión.

## Uso

Descomprime el ZIP y abre `index.html`, o sube el contenido de la carpeta de la app a tu alojamiento estático. Carga el Excel de SAP como en v3.22. La biblioteca Excel requiere conexión a Internet, igual que en la versión anterior.

## Cambios v3.22

- Eliminada la dependencia del Excel de políticas de caducidad.
- La app aplica políticas internas directamente en el código.
- Política inicial aplicada:
  - Todos los proveedores: **Política 12 meses**.
  - **FATRO**: **Política: No tiene**.
  - **VETNOVA**: **Política: No tiene**.
  - **MERCK SHARP & DOHME ANIMAL HEALTH, S.L.**:
    - Artículos de frío: **Política 6 meses**.
    - Artículos no frío: **Política 9 meses**.
- En el desplegable de Lotes se mantiene el campo **Política caducidad** con textos como:
  - `Política: No tiene`
  - `Política: 6 meses`
  - `Política: 9 meses`
  - `Política: 12 meses`

## Base mantenida

- La política se calcula contra la entrada real del lote y la fecha de caducidad del lote.
- Fechas en formato `dd/mm/aaaa`.
- Cantidades enteras sin decimales.
- Flujo **Gestionar**.
- Exportaciones Excel de gestión.
- Producción fuera de política contempla almacenes **01 + 02** juntos.
- Excel en A4 horizontal, una página de ancho y sin autofiltros.

## Estados de gestión

- **Pendiente**: estado normal.
- **En trámite**: gestión abierta/tramitándose.
- **En oferta**: artículo enviado a oferta/descuento.

La gestión se guarda en el navegador mediante almacenamiento local.
