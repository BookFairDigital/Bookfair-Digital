Firebase project connected: bookfair-digital-a969f

Enable Authentication > Sign-in method > Email/Password.
Firestore is used for student profiles.

IMPORTANT: A browser-only site cannot securely create Firebase Authentication users in bulk.
For the final production Admin CSV import, use a trusted Cloud Function/server with Firebase Admin SDK.
Never put a service-account private key in the website.
The current demo maps a visible username to a synthetic auth email internally.
