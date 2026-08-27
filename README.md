# Caducados PROVESA v3.22

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
