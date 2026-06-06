import { NextRequest, NextResponse } from "next/server";
import { getBookings, createBooking, getListings } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/auth";

export const dynamic = 'force-dynamic';

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

export async function GET(req: NextRequest) {
  const bookings = getBookings();
  const isAdmin = isAdminAuthorized(req);

  if (isAdmin) {
    const response = NextResponse.json(bookings);
    return setCorsHeaders(response);
  } else {
    // Public view: only send listingId, startDate, endDate for confirmed bookings
    const confirmedBookings = bookings
      .filter(b => b.status === "confirmed")
      .map(b => ({
        listingId: b.listingId,
        startDate: b.startDate,
        endDate: b.endDate
      }));
    const response = NextResponse.json(confirmedBookings);
    return setCorsHeaders(response);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, clientName, clientPhone, startDate, endDate, totalPrice } = body;

    if (!listingId || !clientName || !clientPhone || !startDate || !endDate) {
      const badReqResponse = NextResponse.json(
        { error: "Missing required fields: listingId, clientName, clientPhone, startDate, endDate." },
        { status: 400 }
      );
      return setCorsHeaders(badReqResponse);
    }

    // Try to find the listing to get its official title:
    const listings = getListings();
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
      const notFoundResponse = NextResponse.json(
        { error: `Listing with ID ${listingId} not found.` },
        { status: 400 }
      );
      return setCorsHeaders(notFoundResponse);
    }

    // Calculate dynamic price if not supplied
    let calculatedTotalPrice = Number(totalPrice);
    if (!calculatedTotalPrice) {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      calculatedTotalPrice = diffDays * listing.pricePerDay;
    }

    const newBooking = createBooking({
      listingId,
      listingTitle: listing.title,
      clientName,
      clientPhone,
      startDate,
      endDate,
      totalPrice: calculatedTotalPrice
    });

    const successResponse = NextResponse.json(newBooking, { status: 201 });
    return setCorsHeaders(successResponse);
  } catch (error: any) {
    console.error("Error creating booking:", error);
    const errResponse = NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
    return setCorsHeaders(errResponse);
  }
}
