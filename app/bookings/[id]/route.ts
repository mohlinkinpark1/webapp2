import { NextRequest, NextResponse } from "next/server";
import { updateBooking, deleteBooking } from "@/lib/db";
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
    const updates: any = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.clientName !== undefined) updates.clientName = body.clientName;
    if (body.clientPhone !== undefined) updates.clientPhone = body.clientPhone;
    if (body.startDate !== undefined) updates.startDate = body.startDate;
    if (body.endDate !== undefined) updates.endDate = body.endDate;
    if (body.totalPrice !== undefined) updates.totalPrice = Number(body.totalPrice);

    const updated = updateBooking(id, updates);
    if (!updated) {
      const notFoundResponse = NextResponse.json(
        { error: `Booking with ID ${id} not found.` },
        { status: 404 }
      );
      return setCorsHeaders(notFoundResponse);
    }

    const successResponse = NextResponse.json(updated);
    return setCorsHeaders(successResponse);
  } catch (error: any) {
    console.error(`Error updating booking ${id}:`, error);
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
    const deleted = deleteBooking(id);
    if (!deleted) {
      const notFoundResponse = NextResponse.json(
        { error: `Booking with ID ${id} not found.` },
        { status: 404 }
      );
      return setCorsHeaders(notFoundResponse);
    }

    const successResponse = NextResponse.json({ success: true, message: `Booking ${id} successfully deleted.` });
    return setCorsHeaders(successResponse);
  } catch (error: any) {
    console.error(`Error deleting booking ${id}:`, error);
    const errResponse = NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
    return setCorsHeaders(errResponse);
  }
}
