import { NextRequest, NextResponse } from "next/server";
import { getBookings, getListings } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/auth";

function setCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token");
  return response;
}

export async function OPTIONS() {
  const response = NextResponse.json({ success: true });
  return setCorsHeaders(response);
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    const errorResponse = NextResponse.json(
      { error: "Unauthorized. Invalid X-Admin-Token." },
      { status: 401 }
    );
    return setCorsHeaders(errorResponse);
  }

  try {
    const listings = getListings();
    const bookings = getBookings();

    const confirmedBookings = bookings.filter(b => b.status === "confirmed");
    const pendingBookings = bookings.filter(b => b.status === "pending");

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const listingsCount = listings.length;
    const bookingsCount = bookings.length;
    const activeBookings = confirmedBookings.length;
    const pendingBookingsCount = pendingBookings.length;

    // Optional: revenue by month or categories counts for premium presentation
    const categoryDistribution = listings.reduce((acc: Record<string, number>, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      totalRevenue,
      listingsCount,
      bookingsCount,
      activeBookings,
      pendingBookings: pendingBookingsCount,
      categoryDistribution,
      lastUpdated: new Date().toISOString()
    };

    const response = NextResponse.json(stats);
    return setCorsHeaders(response);
  } catch (error: any) {
    console.error("Error generating statistics:", error);
    const errResponse = NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
    return setCorsHeaders(errResponse);
  }
}
