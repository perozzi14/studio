# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## ¡ATENCIÓN! ¿La aplicación no se conecta a la base de datos?

Si ves un error como `(auth/invalid-api-key)` o `Missing or insufficient permissions`, significa que la aplicación no tiene las "llaves" correctas para acceder a tu proyecto de Firebase.

**La solución casi siempre está en configurar correctamente tu archivo `.env.local`.** Sigue estos pasos con mucho cuidado.

### Paso 1: Crea tu archivo de credenciales

1.  En la lista de archivos a la izquierda, busca el archivo llamado `.env.local.example`.
2.  **Haz clic derecho** sobre él y selecciona **"Duplicar"**.
3.  Renombra la copia a `.env.local`. Este es tu archivo de secretos.

### Paso 2: Copia y pega tus credenciales de Firebase

1.  Abre la [Consola de Firebase](https://console.firebase.google.com/) en una nueva pestaña.
2.  Selecciona tu proyecto (ej. `medagenda`).
3.  Haz clic en el **engranaje (⚙️)** al lado de "Project Overview" y luego en **Project settings**.
4.  En la pestaña "General", baja hasta la sección "Your apps".
5.  Busca tu aplicación web (suele tener un ícono `</>`). Si no tienes una, créala haciendo clic en ese ícono y dale un apodo (ej. "MedAgenda Web").
6.  Dentro de la tarjeta de tu aplicación, busca **SDK setup and configuration** y selecciona la opción **"Config"**.

    

7.  Se mostrará un bloque de código. **Copia los valores** para cada una de las variables y pégalos en tu archivo `.env.local`.

    Por ejemplo, si en Firebase ves:
    ```javascript
    const firebaseConfig = {
      apiKey: "AIzaSy...abcde",
      authDomain: "tu-proyecto.firebaseapp.com",
      // ...etc
    };
    ```

    Tu archivo `.env.local` debería quedar así:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy...abcde"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
    # ...y así con todas las demás variables
    ```

**¡Importante!** Al guardar el archivo `.env.local`, la aplicación se reiniciará automáticamente. Si el error persiste, significa que una de las claves fue copiada incorrectamente. Por favor, revísalas con mucho cuidado.
