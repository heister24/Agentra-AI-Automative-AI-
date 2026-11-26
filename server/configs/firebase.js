import { cert, initializeApp } from "firebase-admin";
import ServiceAccount from "../ServiceAccount.json" with { type: "json" };

const app = initializeApp({
  credential: cert(ServiceAccount),
});

export default app;
