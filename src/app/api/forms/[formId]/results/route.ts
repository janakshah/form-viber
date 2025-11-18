import { NextRequest, NextResponse } from "next/server";
import { getFormResults, getForm } from "@/lib/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await params;

    if (!formId || typeof formId !== "string" || formId.trim() === "") {
      return NextResponse.json(
        { error: "Invalid formId parameter" },
        { status: 400 }
      );
    }

    // Verify form exists
    const form = await getForm(formId);
    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Get all results
    const results = await getFormResults(formId);

    // Convert Timestamp to ISO string for JSON serialization
    const serializedResults = results.map((result) => ({
      id: result.id,
      formId: result.formId,
      data: result.data,
      submittedAt: result.submittedAt.toDate().toISOString(),
    }));

    return NextResponse.json(serializedResults);
  } catch (error) {
    console.error("Error fetching form results:", error);
    return NextResponse.json(
      { error: "Failed to fetch form results" },
      { status: 500 }
    );
  }
}

