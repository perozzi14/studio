
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Despliegue a Producción

¡Excelente! Llegaste al punto de querer lanzar tu aplicación. Esta guía te llevará paso a paso, desde cero, para poner tu proyecto SUMA en línea con tu propio dominio.

> **Nota Importante:** Si ya creaste tu proyecto en Firebase para conectar la base de datos, puedes saltar directamente al **Paso 2**. ¡No necesitas crear un proyecto nuevo!

### **Fase 1: Preparar tu Proyecto en Firebase**

Esto es para asegurar que tu proyecto en la nube esté listo para recibir la aplicación.

1.  **Crea un Proyecto en Firebase:** Si aún no tienes uno, ve a la [Consola de Firebase](https://console.firebase.google.com/) y crea un nuevo proyecto.
2.  **Activa los Servicios:**
    *   **Firestore Database:** Ve a esta sección y crea una base de datos en **modo de producción**.
    *   **Authentication:** Ve a esta sección, haz clic en "Comenzar" y activa el proveedor **Email/Contraseña**.
    *   **Hosting:** Ve a la sección de Hosting y haz clic en "Comenzar".

### **Fase 2: Conectar tu Aplicación**

Ahora le diremos a tu aplicación aquí, en Firebase Studio, a qué proyecto de Firebase debe conectarse.

1.  **Abre el archivo `.env`** que está en la lista de archivos de tu proyecto.
2.  **Busca tus Claves:** En la [Consola de Firebase](https://console.firebase.google.com/), haz clic en el **engranaje (⚙️)** > **Configuración del proyecto**.
3.  **Copia y Pega las Claves:**
    *   En la sección "Tus apps", busca tu aplicación web (suele tener un ícono `</>`). Si no tienes una, créala haciendo clic en ese ícono.
    *   Se mostrará un objeto de configuración (`firebaseConfig`). Copia los valores de `apiKey`, `authDomain`, `projectId`, etc., y pégalos en las líneas correspondientes de tu archivo `.env`.

### **Fase 3: ¡Publicar la Aplicación!**

Este es el paso más sencillo gracias al entorno integrado.

1.  **Haz clic en el botón "Publicar"** que ves en la parte superior de la interfaz de Firebase Studio.
2.  El sistema se encargará de compilar, optimizar y desplegar tu aplicación en Firebase Hosting de forma automática.
3.  Una vez que termine, te dará una URL que termina en `.web.app` (ej. `mi-suma-app.web.app`). ¡Tu aplicación ya está en internet y funcionando!

### **Fase 4: Conectar tu Dominio Personalizado**

Finalmente, vamos a hacer que esa URL se vea profesional con tu propio dominio.

1.  **Ve a Hosting en Firebase:** En la consola de tu proyecto, ve a la sección de "Hosting".
2.  **Añade un Dominio:** Haz clic en el botón **"Añadir dominio personalizado"**.
3.  **Verifica tu Dominio:**
    *   Escribe el dominio que quieres usar (ej. `www.misuma.com`).
    *   Firebase te dirá: "Para demostrar que eres el dueño, añade este **registro TXT** en la configuración de tu dominio". Te dará un valor de texto largo. Cópialo.
    *   Ve a donde compraste tu dominio (GoDaddy, Namecheap, etc.), busca la sección de "Administración de DNS" y crea un nuevo registro de tipo "TXT" con el valor que te dio Firebase.
4.  **Apunta tu Dominio a Firebase:**
    *   Una vez que Firebase verifique el registro TXT (puede tardar unos minutos u horas), te mostrará una o más **direcciones IP**. Estas son las direcciones de los servidores de Firebase.
    *   Vuelve a la "Administración de DNS" de tu dominio.
    *   Busca los **registros de tipo "A"**. Borra los que existan y crea nuevos apuntando a cada una de las IPs que te dio Firebase.
5.  **Espera y Celebra:** Los cambios de DNS pueden tardar un poco en propagarse por internet (desde minutos hasta 24 horas). Una vez que se complete, Firebase lo detectará, **instalará un certificado de seguridad SSL gratuito** (para que tu web sea `https://`) y tu dominio estará funcionando.

¡Y eso es todo! Con estos pasos, tu aplicación SUMA estará en línea, segura y funcionando en tu propio dominio.
