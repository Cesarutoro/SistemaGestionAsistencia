# Guía de Despliegue de "Registro Asistencia" (Todo en Render)

Esta es la forma **más fácil, robusta y gratuita** de subir tu sistema a internet. Hemos configurado el código para que el **Backend (Node.js)** sirva directamente al **Frontend (React)**.

Esto significa que:
- Solo necesitas conectar **un** servicio en Render.
- No hay problemas de CORS ni de descargas/subidas de Excel.
- Solo tendrás **un** link (URL) para acceder a tu plataforma.

---

## 1. Subir tu proyecto a GitHub

Para que Render pueda descargar tu código, debe estar en GitHub.

1. Crea una cuenta en [GitHub.com](https://github.com/) si no tienes una.
2. Crea un **Nuevo Repositorio** (ej. `registro-asistencia`).
3. Abre tu terminal (consola) en la carpeta principal de tu proyecto (`SISTEMAS/sistema_cesar`) y ejecuta exactamente estos comandos, uno por uno:

```bash
git init
git add .
git commit -m "Versión lista para subir"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/registro-asistencia.git
git push -u origin main
```
*(Asegúrate de cambiar `TU_USUARIO` y el enlace por el que te asigne GitHub).*

---

## 2. Desplegar en Render.com (Gratis)

1. Ve a [Render.com](https://render.com/), haz clic en **"Get Started"** e ingresa con tu cuenta de GitHub.
2. Haz clic en el botón de **"New +"** arriba a la derecha y selecciona **"Web Service"**.
3. En la lista, conecta el repositorio que acabas de crear en GitHub (`registro-asistencia`).
4. **⚠️ APARTADO DE CONFIGURACIÓN (MUY IMPORTANTE):**
   - **Name:** *Elige el nombre que quieras para tu web*
   - **Root Directory:** *déjalo en blanco*
   - **Environment:** Node
   - **Build Command:** Copia y pega exactamente esto: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command:** Copia y pega exactamente esto: `node backend/src/index.js`
   - **Instance Type:** Free (Gratis)

5. **Variables de Entorno (Environment Variables):**
   Desplázate hacia abajo y haz clic en **"Advanced"**, luego en **"Add Environment Variable"**. Copia aquí los mismos datos que tienes en tu archivo `.env` local para conectarte a tu base de datos Aiven:
   
   - `DB_HOST` = (tu host de aiven...)
   - `DB_PORT` = (tu puerto, ej. 26867)
   - `DB_USER` = (tu usuario, e.g. avnadmin)
   - `DB_PASSWORD` = (tu contraseña)
   - `DB_NAME` = defaultdb

6. Al final de la página, haz clic en el botón **"Create Web Service"**.

---

## 3. Esperar y Probar 🎉

Render tomará unos minutos en compilar tu panel web y tu servidor. Puedes ver el proceso en la consola de color negro de la pantalla.
 
Cuando termine, te dirá **"Live"** o "Your service is live" y te asignará un enlace arriba a la izquierda (por ejemplo: `https://registro-asistencia.onrender.com`).

**¡Haz clic en el enlace y ya podrás usar toda la plataforma desde cualquier lugar!**
