# Google Calendar Event Creator

Crea eventos masivos en Google Calendar desde un archivo CSV de forma interactiva.

---

## 1. Obtener credenciales de Google

### 1.1 Crear un proyecto en Google Cloud Console

1. Entrá a [console.cloud.google.com](https://console.cloud.google.com)
2. Clic en el selector de proyectos (arriba a la izquierda) → **Nuevo proyecto**
3. Dale un nombre (ej: `calendar-app`) → **Crear**

### 1.2 Habilitar la Google Calendar API

1. En el menú izquierdo → **APIs y servicios** → **Biblioteca**
2. Buscá `Google Calendar API`
3. Clic en ella → **Habilitar**

### 1.3 Configurar la pantalla de consentimiento OAuth

1. En el menú izquierdo → **Google Auth Platform** → **Información de la marca**
2. Completá el nombre de la app y el email de soporte → **Guardar**
3. Ir a **Público** → seleccioná **Externo**
4. En **Usuarios de prueba** → agregá tu email de Google → **Guardar**
5. Ir a **Acceso a los datos** → **Agregar o quitar scopes**
6. Buscá `calendar` y seleccioná:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
7. **Guardar**

### 1.4 Crear las credenciales OAuth 2.0

1. Ir a **Clientes** → **Crear cliente de OAuth**
2. Tipo de aplicación: **Aplicación de escritorio**
3. Dale un nombre → **Crear**
4. Descargá el JSON y guardalo como `credentials.json` en la raíz del proyecto

---

## 2. Correr la app

### Requisitos

- [Node.js](https://nodejs.org) v18 o superior

### Instalación

```bash
git clone https://github.com/alejorrojas/calendar.git
cd calendar
npm install
```

### Formato del CSV

El archivo CSV debe tener las siguientes columnas:

```csv
name,topic,date
1er parcial,Inv Operativa,2026-05-07
Examen Final,Ing y Calidad,2026-07-02
```

| Columna | Descripción                        | Formato      |
|---------|------------------------------------|--------------|
| `name`  | Nombre del evento                  | Texto libre  |
| `topic` | Materia o categoría                | Texto libre  |
| `date`  | Fecha del evento                   | `YYYY-MM-DD` |

Los eventos se crean con el formato **`topic - name`** (ej: `Inv Operativa - 1er parcial`).

Podés usar `events.example.csv` como referencia.

### Ejecución

```bash
node index.js
```

El script te va a preguntar de forma interactiva:

1. **Ruta del CSV** — aceptá cualquier formato de path, con o sin comillas
2. **Nombre del calendario** — debe existir en tu Google Calendar
3. **Color de los eventos** — elegís entre los 11 colores disponibles
4. **Días antes para la notificación** — cuántos días antes del evento
5. **Hora de la notificación** — a qué hora recibís el email (0-23)

La primera vez se abrirá una URL para que autorices el acceso. Luego se guarda un `token.json` y no te vuelve a pedir autorización.

---

## Hint: generá el CSV con IA

Si tenés una lista de fechas y eventos en cualquier formato (imagen, texto, PDF, tabla de Notion), podés pedirle a una IA como ChatGPT o Claude que te lo convierta al formato CSV que espera esta app:

> *"Convertí esta lista de fechas al siguiente formato CSV con columnas name, topic, date (YYYY-MM-DD): [pegá tu lista]"*

Una vez que tengas el CSV, corrés `node index.js` y lo cargás.
