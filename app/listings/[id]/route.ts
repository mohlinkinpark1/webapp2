import { NextRequest, NextResponse } from "next/server";
import { updateListing, deleteListing } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/auth";

function setCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token");
  return response;
}

export async function OPTIONS() {
  const response = NextResponse.json({ success: true });
  return setCorsHeaders(response);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(req)) {
    const errorResponse = NextResponse.json(
      { error: "Unauthorized. Invalid X-Admin-Token." },
      { status: 401 }
    );
    return setCorsHeaders(errorResponse);
  }

  const { id } = await params;

  try {
    const body = await req.json();
    
    // Build update object
    const updates: any = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.pricePerDay !== undefined) updates.pricePerDay = Number(body.pricePerDay);
    if (body.price !== undefined) updates.pricePerDay = Number(body.price); // fallback
    if (body.location !== undefined) updates.location = body.location;
    if (body.capacity !== undefined) updates.capacity = Number(body.capacity);
    if (body.available !== undefined) updates.available = Boolean(body.available);
    if (body.images !== undefined) updates.images = Array.isArray(body.images) ? body.images : [body.images];
    if (body.amenities !== undefined) updates.amenities = Array.isArray(body.amenities) ? body.amenities : [body.amenities];

    const updated = updateListing(id, updates);
    if (!updated) {
      const notFoundResponse = NextResponse.json(
        { error: `Listing with ID ${id} not found.` },
        { status: 404 }
      );
      return setCorsHeaders(notFoundResponse);
    }

    const successResponse = NextResponse.json(updated);
    return setCorsHeaders(successResponse);
  } catch (error: any) {
    console.error(`Error updating listing ${id}:`, error);
    const errResponse = NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
    return setCorsHeaders(errResponse);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Aliasing PUT to PATCH for ease of integration
  return PATCH(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(req)) {
    const errorResponse = NextResponse.json(
      { error: "Unauthorized. Invalid X-Admin-Token." },
      { status: 401 }
    );
    return setCorsHeaders(errorResponse);
  }

  const { id } = await params;

  try {
    const deleted = deleteListing(id);
    if (!deleted) {
      const notFoundResponse = NextResponse.json(
        { error: `Listing with ID ${id} not found.` },
        { status: 404 }
      );
      return setCorsHeaders(notFoundResponse);
    }

    const successResponse = NextResponse.json({ success: true, message: `Listing ${id} successfully deleted.` });
    return setCorsHeaders(successResponse);
  } catch (error: any) {
    console.error(`Error deleting listing ${id}:`, error);
    const errResponse = NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
    return setCorsHeaders(errResponse);
  }
}
