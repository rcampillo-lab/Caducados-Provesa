# Caducados PROVESA v2.8

App estática tipo **Other** para Vercel/GitHub.

## Novedades v2.8

- Añade carga de políticas de caducidad por proveedor.
- Incluye por defecto `assets/politicas-caducidad-proveedores.xlsx`.
- Permite cargar manualmente otro Excel de políticas con el botón **Cargar políticas**.
- Calcula una nueva columna: **Política caducidad**.
- Añade filtro por política.
- Mantiene el formato de artículo como texto, por ejemplo `000026`.

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
5. La app cargará automáticamente las políticas incluidas si está en Vercel.
6. Si se abre en local y el navegador bloquea la carga automática, usar el botón **Cargar políticas**.

## Despliegue en Vercel

Framework Preset: **Other**

Sin build command, sin `package.json` y sin `vercel.json`.
