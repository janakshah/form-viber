import { NextResponse } from "next/server";
import { getAllForms } from "@/lib/firestore";

export async function GET() {
  try {
    const forms = await getAllForms();
    // Convert Timestamp to ISO string for JSON serialization
    const serializedForms = forms.map((form) => ({
      formId: form.formId,
      title: form.title,
      createdAt: form.createdAt.toDate().toISOString(),
    }));
    return NextResponse.json(serializedForms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

