# Caducados PROVESA v2.11

App estática tipo **Other** para Vercel/GitHub.

## Novedades v2.11

- Los filtros secundarios ahora son dependientes entre sí.
- Al elegir una caducidad, proveedor, política, tipo, frío o almacén, el resto de desplegables solo muestra opciones disponibles dentro de ese resultado.
- Ejemplo: si se filtra **6 meses completos** y solo hay artículos de Fatro y Adial, el filtro de proveedor solo mostrará Fatro y Adial.
- Se mantiene el filtro de caducidad por meses naturales completos.
- Se mantiene la carga automática de políticas desde `assets/politicas-caducidad-proveedores.xlsx`.

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
