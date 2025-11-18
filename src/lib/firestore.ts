import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, query, where, orderBy, Timestamp } from "firebase/firestore";
import { app } from "./firebase";

const db = getFirestore(app);

export interface FormField {
  id: string;
  type: "text" | "date" | "dropdown" | "checkbox" | "dynamic";
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  order: number;
  // For dynamic forms: nested fields that will be repeated
  fields?: Array<{
    id: string;
    type: "text" | "date" | "dropdown" | "checkbox";
    label: string;
    required?: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
}

export interface FormData {
  formId: string;
  fields: FormField[];
  title?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FormResult {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: Timestamp;
}

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        cleaned[key] = value.map(item => 
          typeof item === "object" && item !== null ? removeUndefined(item as Record<string, unknown>) : item
        );
      } else if (typeof value === "object" && value !== null && !(value instanceof Timestamp) && !(value instanceof Date)) {
        cleaned[key] = removeUndefined(value as Record<string, unknown>);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

/**
 * Create a new form definition in Firestore
 */
export async function createForm(formData: Omit<FormData, "createdAt" | "updatedAt">): Promise<FormData> {
  if (!formData.formId || typeof formData.formId !== "string" || formData.formId.trim() === "") {
    throw new Error("Invalid formId: formId must be a non-empty string");
  }
  const now = Timestamp.now();
  const formDoc: FormData = {
    ...formData,
    createdAt: now,
    updatedAt: now,
  };

  // Remove undefined values before saving (Firestore doesn't allow undefined)
  const cleanedFormDoc = removeUndefined(formDoc);
  await setDoc(doc(db, "forms", formData.formId), cleanedFormDoc);
  return formDoc;
}

/**
 * Validate FormData structure
 */
function validateFormData(data: any): data is FormData {
  if (!data || typeof data !== "object") {
    return false;
  }

  // Check required fields
  if (typeof data.formId !== "string") {
    return false;
  }

  if (!Array.isArray(data.fields)) {
    return false;
  }

  // Validate each field
  for (const field of data.fields) {
    if (
      typeof field.id !== "string" ||
      typeof field.label !== "string" ||
      typeof field.order !== "number" ||
      !["text", "date", "dropdown", "checkbox", "dynamic"].includes(field.type)
    ) {
      return false;
    }
    if (field.options && !Array.isArray(field.options)) {
      return false;
    }
    // Validate nested fields for dynamic type
    if (field.type === "dynamic") {
      if (!field.fields || !Array.isArray(field.fields)) {
        return false;
      }
      for (const nestedField of field.fields) {
        if (
          typeof nestedField.id !== "string" ||
          typeof nestedField.label !== "string" ||
          !["text", "date", "dropdown", "checkbox"].includes(nestedField.type)
        ) {
          return false;
        }
      }
    }
  }

  // Check Timestamp fields
  if (!data.createdAt || !data.updatedAt) {
    return false;
  }

  return true;
}

/**
 * Get a form definition by formId
 */
export async function getForm(formId: string): Promise<FormData | null> {
  if (!formId || typeof formId !== "string" || formId.trim() === "") {
    throw new Error("Invalid formId: formId must be a non-empty string");
  }
  const formDoc = await getDoc(doc(db, "forms", formId));
  if (!formDoc.exists()) {
    return null;
  }

  const data = formDoc.data();
  if (!validateFormData(data)) {
    console.error("Invalid FormData structure in Firestore:", formId, data);
    return null;
  }

  return data;
}

/**
 * Get all forms
 */
export async function getAllForms(): Promise<Array<{ formId: string; title?: string; createdAt: Timestamp }>> {
  const formsQuery = query(collection(db, "forms"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(formsQuery);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      formId: doc.id,
      title: data.title,
      createdAt: data.createdAt,
    };
  });
}

/**
 * Save a form submission result
 */
export async function saveFormResult(formId: string, data: Record<string, any>): Promise<string> {
  if (!formId || typeof formId !== "string" || formId.trim() === "") {
    throw new Error("Invalid formId: formId must be a non-empty string");
  }
  const result: Omit<FormResult, "id"> = {
    formId,
    data,
    submittedAt: Timestamp.now(),
  };

  // Remove undefined values before saving (Firestore doesn't allow undefined)
  const cleanedResult = removeUndefined(result);
  const docRef = await addDoc(collection(db, "formResults"), cleanedResult);
  return docRef.id;
}

/**
 * Validate FormResult structure
 */
function validateFormResult(data: unknown): data is FormResult {
  if (data === null || typeof data !== "object") {
    return false;
  }

  // Type guard to narrow to object with properties
  const obj = data as Record<string, unknown>;

  // Check required fields
  if (typeof obj.formId !== "string") {
    return false;
  }

  if (typeof obj.data !== "object" || obj.data === null) {
    return false;
  }

  // Check submittedAt is a valid Timestamp or can be converted to Date
  if (!obj.submittedAt) {
    return false;
  }

  // Firestore Timestamp has toDate() method, or it might be a Date
  // We'll accept both Timestamp and Date objects
  const submittedAt = obj.submittedAt;
  if (typeof submittedAt !== "object" || submittedAt === null) {
    return false;
  }
  
  // Check if it's a Firestore Timestamp (has toDate method) or a Date object
  const isValidTimestamp =
    typeof (submittedAt as { toDate?: unknown }).toDate === "function" ||
    submittedAt instanceof Date;
  
  if (!isValidTimestamp) {
    return false;
  }

  return true;
}

/**
 * Get all results for a specific form
 */
export async function getFormResults(formId: string): Promise<FormResult[]> {
  if (!formId || typeof formId !== "string" || formId.trim() === "") {
    throw new Error("Invalid formId: formId must be a non-empty string");
  }
  const resultsQuery = query(
    collection(db, "formResults"),
    where("formId", "==", formId),
    orderBy("submittedAt", "desc")
  );
  const snapshot = await getDocs(resultsQuery);
  
  const validResults: FormResult[] = [];
  
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    const resultData = {
      id: docSnapshot.id,
      ...data,
    };

    if (validateFormResult(resultData)) {
      validResults.push(resultData);
    } else {
      console.error("Invalid FormResult structure in Firestore:", docSnapshot.id, data);
    }
  }

  if (validResults.length === 0 && snapshot.docs.length > 0) {
    throw new Error("No valid form results found, but documents exist. Data may be corrupted.");
  }

  return validResults;
}

