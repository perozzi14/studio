
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Deployment to Production

To deploy your SUMA application to Firebase Hosting, follow these steps.

### 1. Set Up Your Firebase Project

- **Create a Firebase Project:** If you haven't already, go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
- **Enable Firestore:** In your new project, go to the "Firestore Database" section and create a new database. Start in **production mode**, which provides secure default rules.
- **Enable Authentication:** Go to the "Authentication" section, click "Get Started", and enable the "Email/Password" sign-in method.

### 2. Configure Your Local Environment

- **Install Firebase CLI:** If you don't have it, install the Firebase Command Line Interface globally:
  ```bash
  npm install -g firebase-tools
  ```
- **Log In to Firebase:**
  ```bash
  firebase login
  ```
- **Initialize Firebase in your Project:** Connect your local code to your Firebase project.
  ```bash
  firebase init
  ```
  - Select **Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys**.
  - Choose "Use an existing project" and select the project you created.
  - When asked for your public directory, enter `.`.
  - When asked to configure as a single-page app, say **No**.
  - When asked about automatic builds and deploys with GitHub, you can say **No** for now.
- **Fill Environment Variables:** Open the `.env` file and fill in the values from your Firebase project's settings as instructed in the file's comments.

### 3. Deploy Your Application

- **Deploy:** Run the following command from your project's root directory:
  ```bash
  firebase deploy
  ```
This command will build your Next.js application, deploy it to Firebase Hosting, and apply the Firestore security rules located in `firestore.rules`.

After the command finishes, it will provide you with your live URL. Congratulations, your application is now live!
