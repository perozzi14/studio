# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Despliegue a Producción

¡Excelente! Llegaste al punto de querer lanzar tu aplicación. Esta guía te llevará paso a paso, desde cero, para poner tu proyecto SUMA en línea con tu propio dominio.

> **Nota Importante:** Si ya creaste tu proyecto en Firebase para conectar la base de datos, puedes saltar directamente al **Paso 2**. ¡No necesitas crear un proyecto nuevo!

### **Fase 1: Obtener el Código del Proyecto**

Primero, necesitas tener el código de la aplicación en tu computadora.

1.  **Descarga el Código:** En la interfaz de Firebase Studio, busca un botón de **"Descargar Código"** o "Exportar Proyecto".
2.  **Descomprime el Archivo:** Se descargará un archivo `.zip`. Descomprímelo en un lugar fácil de recordar (como el Escritorio o tu carpeta de Documentos). Esto creará la carpeta de tu proyecto.

### **Fase 2: Preparar tu Computadora**

Estas herramientas son necesarias para que tu computadora pueda "hablar" con Firebase. Solo se instalan una vez.

1.  **Instala Node.js:** Si no lo tienes, ve a [nodejs.org](https://nodejs.org/) y descarga la versión que dice **"LTS"**. Esto es como el "motor" para tu aplicación.
2.  **Abre una Terminal:**
    *   En **Windows**, busca y abre el "Símbolo del sistema" o "PowerShell".
    *   En **Mac** o **Linux**, busca y abre la "Terminal".
3.  **Instala las Herramientas de Firebase:** En la terminal que abriste, escribe este comando y presiona Enter:
    ```bash
    npm install -g firebase-tools
    ```
4.  **Navega a la Carpeta de tu Proyecto:** En la misma terminal, usa el comando `cd` para entrar a la carpeta que descomprimiste. Ejemplo:
    ```bash
    cd Desktop/nombre-de-la-carpeta-del-proyecto
    ```
5.  **Instala las "Piezas" del Proyecto:** Una vez dentro de la carpeta, ejecuta este comando. Descargará todas las librerías que tu app necesita.
    ```bash
    npm install
    ```

### **Fase 3: Conectar y Desplegar en Firebase**

Ahora vamos a conectar tu código con tu proyecto en la nube y a subirlo.

1.  **Inicia Sesión:** En la terminal (dentro de la carpeta de tu proyecto), ejecuta:
    ```bash
    firebase login
    ```
    Se abrirá una ventana de tu navegador para que inicies sesión con Google.

2.  **Inicializa Firebase:** Ahora, ejecuta:
    ```bash
    firebase init
    ```
    Sigue los pasos con atención:
    *   Usa las flechas del teclado para moverte hasta **Hosting**, presiona la **barra espaciadora** para marcarlo y luego presiona **Enter**.
    *   Elige **Use an existing project** y selecciona el proyecto que ya habías creado en Firebase.
    *   **¡Paso Clave!** Cuando pregunte `What do you want to use as your public directory?`, escribe un solo punto: **`.`** y presiona Enter.
    *   **¡Paso Clave!** Cuando pregunte `Configure as a single-page app?`, responde que no, escribiendo: **`n`** y presiona Enter.
    *   Si te pregunta por builds automáticos con GitHub, responde que no por ahora (`n`).

3.  **Rellena las Variables de Entorno:**
    *   Abre el archivo `.env` en tu proyecto.
    *   Ve a la [Consola de Firebase](https://console.firebase.google.com/), haz clic en el **engranaje (⚙️)** > **Configuración del proyecto**.
    *   En la sección "Tus apps", busca tu app web (suele tener un ícono `</>`) y copia los valores de `apiKey`, `authDomain`, `projectId`, etc., en el archivo `.env`.

4.  **¡El Gran Momento! Despliega la Aplicación:**
    ```bash
    firebase deploy
    ```
    Este comando compilará tu aplicación y la subirá a los servidores de Google. Al final, te dará una URL como `tu-proyecto.web.app`. ¡Tu aplicación ya está en internet!

### **Fase 4: Conectar tu Dominio Personalizado**

Finalmente, hagamos que tu aplicación se vea profesional con tu propio dominio.

1.  **Ve a Hosting en Firebase:** En la consola de tu proyecto, ve a la sección de "Hosting".
2.  **Añade un Dominio:** Haz clic en el botón **"Añadir dominio personalizado"**.
3.  **Verifica tu Dominio:**
    *   Escribe el dominio que quieres usar (ej. `www.misuma.com`).
    *   Firebase te dirá: "Para demostrar que eres el dueño, añade este **registro TXT** en la configuración de tu dominio". Te dará un valor de texto largo. Cópialo.
    *   Ve a donde compraste tu dominio (GoDaddy, Namecheap, etc.), busca la sección de "Administración de DNS" y crea un nuevo registro de tipo "TXT" con el valor que te dio Firebase.
4.  **Apunta tu Dominio a Firebase:**
    *   Una vez que Firebase verifique el registro TXT (puede tardar unos minutos), te mostrará una o más **direcciones IP**. Estas son las direcciones de los servidores de Firebase.
    *   Vuelve a la "Administración de DNS" de tu dominio.
    *   Busca los **registros de tipo "A"**. Borra los que existan y crea nuevos apuntando a cada una de las IPs que te dio Firebase.
5.  **Espera y Celebra:** Los cambios de DNS pueden tardar un poco en propagarse por internet (desde minutos hasta 24 horas). Una vez que se complete, Firebase lo detectará, **instalará un certificado de seguridad SSL gratuito** (para que tu web sea `https://`) y tu dominio estará funcionando.

¡Y eso es todo! Con estos pasos, tu aplicación SUMA estará en línea, segura y funcionando en tu propio dominio.
