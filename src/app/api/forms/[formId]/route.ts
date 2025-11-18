import { NextRequest, NextResponse } from "next/server";
import { getForm } from "@/lib/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> | { formId: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15+ uses Promise)
    const resolvedParams = params instanceof Promise ? await params : params;
    const formId = resolvedParams.formId;

    if (!formId || typeof formId !== "string" || formId.trim() === "") {
      return NextResponse.json(
        { error: "Invalid formId parameter" },
        { status: 400 }
      );
    }

    const form = await getForm(formId);

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      formId: form.formId,
      fields: form.fields,
      title: form.title,
    });
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Failed to fetch form" },
      { status: 500 }
    );
  }
}

