# Caducados PROVESA v2.3 — Other / estática pura

App informativa para cargar el Excel de SAP generado por la query de caducados y analizar stock por artículo, lote, almacén, fecha de entrada real y caducidad.

## Enfoque

- Sin políticas de caducidad.
- Sin reglas de devolución.
- Sin registro de acciones.
- Solo lectura y análisis del Excel cargado.
- Pensada para desplegar en Vercel como **Other**.

## Archivos

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

No lleva `package.json`, `vite.config.js`, `vercel.json`, `src` ni `node_modules`.

## Despliegue en Vercel

1. Crear repositorio en GitHub.
2. Subir estos archivos directamente a la raíz del repositorio.
3. Importar en Vercel.
4. Framework Preset: **Other**.
5. Build Command: vacío.
6. Output Directory: vacío o `.`.
7. Install Command: vacío.

## Uso

1. Abrir la app.
2. Pulsar **Cargar Excel SAP**.
3. Seleccionar el Excel exportado desde SAP.
4. Usar los filtros por caducidad, tiempo en PROVESA, grupo, tipo artículo, frío, almacén y búsqueda.
5. Exportar la vista filtrada si hace falta trabajar fuera de la app.


## Cambios v2.3

- Una línea por `artículo + lote + almacén`.
- Se elimina la visión de stock total + stock 01 + stock 02.
- Nueva columna y filtro `Tipo artículo`: Compañía / Producción / Compañía y producción / Sin propiedad.
- Tablas y exportación adaptadas a la nueva query v2.5.


## Cambios v2.3

- El Excel de “Exportar vista” se ha depurado para uso externo.
- La exportación elimina grupo, tipo, frío, almacén, días hasta caducidad, días en PROVESA, fecha de última compra y datos específicos del último albarán/lote.
- El nombre del archivo exportado y la pestaña del Excel se generan según los filtros activos.
