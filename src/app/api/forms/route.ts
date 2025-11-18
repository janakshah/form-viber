import { NextRequest, NextResponse } from "next/server";
import { getAllForms } from "@/lib/firestore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pageSizeParam = searchParams.get("pageSize");
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 50;
    
    // Note: cursor would need to be passed as a query param and decoded
    // For now, we'll just use the default (first page)
    const result = await getAllForms(pageSize, null);
    
    // Convert Timestamp to ISO string for JSON serialization
    const serializedForms = result.forms.map((form) => ({
      formId: form.formId,
      title: form.title,
      createdAt: form.createdAt.toDate().toISOString(),
    }));
    
    // Return array format for backward compatibility when no pagination params are provided
    // If pageSize is explicitly set, return the new paginated format
    if (pageSizeParam) {
      return NextResponse.json({
        forms: serializedForms,
        hasMore: result.nextCursor !== null,
        // Note: In a real implementation, you'd encode the cursor for the client
      });
    }
    
    // Default: return array for backward compatibility
    return NextResponse.json(serializedForms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

