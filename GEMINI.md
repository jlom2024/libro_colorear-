# Proyecto: Libro para Colorear con Ivanna

Este archivo sirve como un panel de control y notas para el desarrollo del proyecto, gestionado a través de Gemini CLI.

---

## 📝 Tareas Pendientes (To-Do)

- [ ] Tarea 1: Implementar la función para guardar los dibujos.
- [ ] Tarea 2: Añadir más paletas de colores.
- [ ] Tarea 3: Mejorar el diseño de la interfaz principal.

---

## 🚀 Comandos Frecuentes

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite. |
| `npm run build` | Compila la aplicación web en la carpeta `dist`. |
| `npx cap sync` | Sincroniza los cambios web con las plataformas nativas (Android). |
| `npx cap open android` | Abre el proyecto de Android en Android Studio. |

---

##  workflow
### Flujo de trabajo para actualizar la App Android

1.  Realizar cambios en el código (React, TypeScript, etc.).
2.  Ejecutar `npm run build` para compilar.
3.  Ejecutar `npx cap sync` para copiar los cambios al proyecto nativo.
4.  Ejecutar `npx cap open android` para abrir en Android Studio y generar el APK.

---

## 📌 Notas y Configuraciones

-   **API Key de Gemini:** La clave se gestiona en el archivo `.env.local` (que está en `.gitignore` y no se debe subir al repositorio).
    -   `VITE_GEMINI_API_KEY="TU_API_KEY_AQUI"`
-   **ID de la App:** `com.libroparacolorear.app`
