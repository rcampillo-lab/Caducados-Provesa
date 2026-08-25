# Caducados PROVESA v3.3

App estática tipo **Other** para Vercel/GitHub.

## Novedades v3.3

- Se simplifican las secciones visibles a:
  - Resumen
  - Artículos
  - Lotes
- Se eliminan de la interfaz las pestañas:
  - Reclamados
  - Próximos
  - Stock antiguo
  - Proveedores entrada
- Los estados de gestión quedan reducidos a:
  - Pendiente
  - En trámite
  - En oferta
- La sección **Lotes** muestra solo las columnas principales:
  - Sel.
  - Gestión
  - Nota recl.
  - Nº artículo
  - Descripción
  - Grupo
  - Tipo
  - Frío
  - Lote
  - Almacén
  - Stock
  - Caducidad
  - Estado
  - Política
- Al hacer clic en una línea de **Lotes**, se despliega el detalle con el resto de información.
- La columna **Entrada real** pasa a mostrarse como **Entrada** dentro del detalle.
- Se elimina de la tabla principal la columna de proveedor, días de caducidad y días en PROVESA.
- La cabecera de las tablas queda fija al bajar por el listado.

## Gestión local

La app guarda la gestión en el navegador mediante almacenamiento local.

Esto significa:

- No hay base de datos.
- No se guarda en GitHub.
- No se comparte entre ordenadores ni entre navegadores.
- Apagar el PC o cerrar el navegador no borra los datos.
- Si se borran los datos del sitio/caché del navegador, se pueden perder.
- Para conservar copia de seguridad, usar periódicamente **Exportar reclamaciones**.

## Lógica de estados

- **Pendiente**: estado normal. La línea aparece en la vista pendiente.
- **En trámite**: la línea queda marcada como gestionada.
- **En oferta**: la línea queda marcada como gestionada para salida/oferta.

Si seleccionas una línea y la pones en **Pendiente**, se elimina su gestión local y vuelve a la vista pendiente.

## Lógica de identificación

Cada línea se identifica internamente por:

- Nº artículo
- Lote
- Almacén
- Fecha caducidad
- Nº entrada mercancía
- Proveedor entrada

Así, al cargar un nuevo Excel de SAP, si la misma línea sigue existiendo, la app la reconoce como ya gestionada.

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
5. Filtrar los productos.
6. Seleccionar las líneas que quieras gestionar.
7. Elegir estado y escribir una nota si procede.
8. Pulsar **Guardar estado**.

## Actualizar políticas

Para cambiar las políticas, sustituir en GitHub el archivo:

`assets/politicas-caducidad-proveedores.xlsx`

Después hacer redeploy en Vercel o esperar a que Vercel despliegue automáticamente el cambio.

## Despliegue en Vercel

Framework Preset: **Other**

Sin build command, sin `package.json` y sin `vercel.json`.


## Cambios v3.3

- Añadido un checkbox en la cabecera de la tabla de Lotes.
- El checkbox de cabecera selecciona o deselecciona todas las líneas visibles con los filtros activos.
- Se mantiene la lógica anterior de filtros estables y detalle desplegable.
