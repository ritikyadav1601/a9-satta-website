import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

type ServiceAccountEnvironment = {
  project_id?: unknown;
  client_email?: unknown;
  private_key?: unknown;
};

function readServiceAccount(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  let serviceAccount: ServiceAccountEnvironment = {};

  if (rawServiceAccount) {
    try {
      serviceAccount = JSON.parse(rawServiceAccount) as ServiceAccountEnvironment;
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON.");
    }
  }

  const projectId =
    serviceAccount.project_id ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = serviceAccount.client_email || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = serviceAccount.private_key || process.env.FIREBASE_PRIVATE_KEY;

  if (
    typeof projectId !== "string" ||
    typeof clientEmail !== "string" ||
    typeof privateKey !== "string" ||
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY, or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Vercel."
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

// Do not initialize at module scope: Next imports route modules while collecting
// build data, when Vercel server-only environment variables may not be present.
export function getAdminDb(): Firestore {
  const app =
    getApps()[0] ||
    initializeApp({
      credential: cert(readServiceAccount()),
    });

  return getFirestore(app);
}
