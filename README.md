# Caducados PROVESA v2.9

App estática tipo **Other** para Vercel/GitHub.

## Novedades v2.9

- Las políticas de caducidad ya no se cargan manualmente desde la app.
- Las políticas solo se cambian sustituyendo en GitHub el archivo `assets/politicas-caducidad-proveedores.xlsx`.
- Eliminada la línea de estado al cargar el Excel de SAP.
- Eliminadas las tarjetas resumen superiores.
- El filtro de caducidad pasa de días a meses.
- El filtro mensual incluye todo lo caducado y todos los productos que caduquen hasta fin del mes calculado.
- Ejemplo: si la fecha actual es 25/08/2026 y se filtra por 6 meses, se incluyen productos hasta el 31/03/2027.

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
5. La app cargará automáticamente las políticas incluidas en `assets/politicas-caducidad-proveedores.xlsx`.

## Actualizar políticas

Para cambiar las políticas, sustituir en GitHub el archivo:

`assets/politicas-caducidad-proveedores.xlsx`

Después hacer redeploy en Vercel o esperar a que Vercel despliegue automáticamente el cambio.

## Despliegue en Vercel

Framework Preset: **Other**

Sin build command, sin `package.json` y sin `vercel.json`.
