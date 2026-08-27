# Caducados PROVESA v3.20

App estática tipo **Other** para Vercel/GitHub.

## Cambios v3.20

1. **Políticas de caducidad en meses**
   - El archivo `assets/politicas-caducidad-proveedores.xlsx` ahora se interpreta en meses.
   - Ejemplos:
     - `12` = Política 12 meses.
     - `9` = Política 9 meses.
     - `6` = Política 6 meses.

2. **Proveedores sin devolución**
   - La app interpreta textos como `Sin politica`, `Sin política`, `No tiene`, `No acepta`, `No admite` o `Sin devolución` como:
     - **No acepta devolución**.

3. **Compatibilidad con archivo anterior**
   - Si en la columna general aparece `0`, se interpreta como **no acepta devolución**.
   - Si en la columna de frío aparece `0` o está vacía, se interpreta como **sin política especial de frío**, usando la política general.

4. **Nuevo Excel de políticas incluido**
   - Sustituido el archivo de políticas por el último aportado por Ramón.

## Base mantenida desde v3.17

- Base política mostrada en meses en el desplegable de Lotes.
- Títulos en los Excel de gestión.
- Fechas `dd/mm/aaaa`.
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


## v3.20

- La política de caducidad se calcula contra la compra/entrada del lote (`Fecha entrada real`) y la fecha de caducidad del lote.
- Ya no depende de la última compra del artículo, que puede pertenecer a otro lote.
- Si el Excel de SAP trae el campo `Días vida útil al entrar`, solo se usa como respaldo cuando no se puede calcular desde la entrada real del lote.


## v3.20

- Corregida política de MERCK SHARP & DOHME ANIMAL HEALTH, S.L.: general 9 meses y frío 6 meses.
- El desplegable muestra la base como `Política: X meses`.
- La política se sigue calculando contra la fecha de entrada real del lote.
