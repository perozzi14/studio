# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Deployment to Production

To deploy your SUMA application to Firebase Hosting and connect a custom domain, follow these steps.

### **Paso 1: Configurar tu Proyecto en Firebase**

1.  **Crea un Proyecto en Firebase:** Si aún no tienes uno, ve a la [Consola de Firebase](https://console.firebase.google.com/) y crea un nuevo proyecto.
2.  **Activa Firestore:** En tu nuevo proyecto, ve a la sección "Firestore Database" y crea una nueva base de datos. **Inicia en modo de producción**, que proporciona reglas de seguridad seguras por defecto.
3.  **Activa la Autenticación:** Ve a la sección de "Authentication", haz clic en "Comenzar" y activa el método de inicio de sesión **Email/Contraseña**.

### **Paso 2: Configurar tu Entorno Local**

1.  **Instala la Firebase CLI:** Si no la tienes, instala la Interfaz de Línea de Comandos de Firebase de forma global:
    ```bash
    npm install -g firebase-tools
    ```
2.  **Inicia Sesión en Firebase:**
    ```bash
    firebase login
    ```
3.  **Inicializa Firebase en tu Proyecto:** Conecta tu código local con tu proyecto de Firebase.
    ```bash
    firebase init
    ```
    *   Selecciona **Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys**.
    *   Elige **Use an existing project** y selecciona el proyecto que creaste.
    *   Cuando te pregunten por tu directorio público, ingresa **`.`** (un solo punto) y presiona Enter. Esto es crucial porque Next.js gestiona la carpeta de build.
    *   Cuando te pregunten si quieres configurarlo como una single-page app, responde **No (n)**.
    *   Cuando te pregunten sobre compilaciones y despliegues automáticos con GitHub, puedes decir **No (n)** por ahora.
4.  **Rellena las Variables de Entorno:** Abre el archivo `.env` en tu proyecto. Ve a la configuración de tu proyecto en la Consola de Firebase (haz clic en el ícono de engranaje > Configuración del proyecto), baja hasta "Tus apps", selecciona la app web y copia los valores de configuración en el archivo `.env` donde corresponda.

### **Paso 3: Desplegar tu Aplicación**

1.  **Despliega:** Ejecuta el siguiente comando desde la raíz de tu proyecto:
    ```bash
    firebase deploy
    ```
Este comando compilará tu aplicación Next.js, la desplegará en Firebase Hosting y aplicará las reglas de seguridad de Firestore ubicadas en `firestore.rules`.

Al finalizar, la terminal te proporcionará la URL de tu aplicación en vivo (algo como `tu-proyecto.web.app`).

### **Paso 4: Conectar tu Dominio Personalizado**

¡Sí, puedes usar tu propio dominio! Una vez que la aplicación esté desplegada, sigue estos pasos:

1.  **Ve a Hosting:** En la Consola de Firebase, ve a la sección de "Hosting".
2.  **Añade un Dominio Personalizado:** Haz clic en el botón **"Añadir dominio personalizado"**.
3.  **Sigue el Asistente:**
    *   Ingresa el dominio que quieres conectar (ej., `www.misuma.com`).
    *   Firebase te pedirá que **verifiques la propiedad** del dominio. Generalmente, esto implica añadir un registro TXT a la configuración DNS de tu dominio. Firebase te dará el valor exacto que necesitas copiar.
    *   Ve al panel de control de tu proveedor de dominio (GoDaddy, Namecheap, etc.), busca la configuración de DNS y añade ese registro TXT.
4.  **Apunta tu Dominio a Firebase:**
    *   Una vez verificado, Firebase te proporcionará uno o más **registros A**. Estos son las direcciones IP de los servidores de Firebase.
    *   Vuelve a la configuración de DNS de tu proveedor de dominio y **crea o actualiza los registros A** para que apunten a las IPs que Firebase te dio.
5.  **Espera la Propagación:** Los cambios de DNS pueden tardar un tiempo en propagarse por todo el internet (desde unos minutos hasta 24 horas). Una vez que se complete, Firebase lo detectará automáticamente.
6.  **Certificado SSL Automático:** En cuanto Firebase confirme que tu dominio apunta correctamente a sus servidores, **aprovisionará e instalará automáticamente un certificado SSL gratuito** para tu dominio, dándote seguridad con `https://`.

¡Y listo! Con estos pasos, tu aplicación SUMA estará en línea, segura y funcionando en tu propio dominio.