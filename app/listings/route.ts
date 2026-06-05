import { NextRequest, NextResponse } from "next/server";
import { getListings, addListing } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/auth";

// Direct support for CORS so that the Android APK can retrieve data easily
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
  const listings = getListings();
  const url = new URL(req.url);
  const showAll = url.searchParams.get("all") === "true";
  const authorized = isAdminAuthorized(req);

  let filteredListings = listings;
  
  // If not admin and not explicitly requesting showAll with authorization, only show available listings
  if (!authorized && !showAll) {
    filteredListings = listings.filter((l) => l.available);
  }

  // Convert relative image URLs to absolute ones
  const origin = `${url.protocol}//${url.host}`;
  const mappedListings = filteredListings.map(listing => {
    return {
      ...listing,
      images: listing.images.map(img => {
        if (img.startsWith('/')) {
          return `${origin}${img}`;
        }
        return img;
      })
    };
  });

  const response = NextResponse.json(mappedListings);
  return setCorsHeaders(response);
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    const errorResponse = NextResponse.json(
      { error: "Unauthorized. Invalid X-Admin-Token." },
      { status: 401 }
    );
    return setCorsHeaders(errorResponse);
  }

  try {
    const body = await req.json();

    // Mapping inputs robustly
    const title = body.title || "";
    const description = body.description || "";
    const category = body.category || "villas";
    // Android code sends fields likes pricePerDay, but might send price. We accept either.
    const pricePerDay = Number(body.pricePerDay !== undefined ? body.pricePerDay : (body.price !== undefined ? body.price : 0));
    const location = body.location || "";
    const capacity = Number(body.capacity !== undefined ? body.capacity : 4);
    
    // Images: can be list of strings or single image URL
    let images: string[] = [];
    if (Array.isArray(body.images)) {
      images = body.images.filter((img: any) => typeof img === "string" && img.trim() !== "");
    } else if (typeof body.imageUrl === "string" && body.imageUrl.trim() !== "") {
      images = [body.imageUrl];
    } else if (typeof body.image === "string" && body.image.trim() !== "") {
      images = [body.image];
    }
    
    if (images.length === 0) {
      images = ["https://picsum.photos/seed/" + encodeURIComponent(title || "room") + "/800/600"];
    }

    // Amenities: can be list of strings or comma-separated list
    let amenities: string[] = [];
    if (Array.isArray(body.amenities)) {
      amenities = body.amenities;
    } else if (typeof body.amenities === "string") {
      amenities = body.amenities.split(",").map((s: string) => s.trim()).filter(Boolean);
    } else {
      amenities = ["Wifi", "Climatisation"];
    }

    if (!title || pricePerDay <= 0) {
      const badReqResponse = NextResponse.json(
        { error: "Title and pricePerDay are required. Price must be > 0." },
        { status: 400 }
      );
      return setCorsHeaders(badReqResponse);
    }

    const newListing = addListing({
      title,
      description,
      category,
      pricePerDay,
      images,
      location,
      capacity,
      amenities
    });

    const successResponse = NextResponse.json(newListing, { status: 201 });
    return setCorsHeaders(successResponse);
  } catch (error: any) {
    console.error("Error creating listing:", error);
    const errResponse = NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
    return setCorsHeaders(errResponse);
  }
}
