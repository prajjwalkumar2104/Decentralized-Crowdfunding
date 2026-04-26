import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const pinataJwt = process.env.PINATA_JWT;
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

  if (!pinataJwt && (!pinataApiKey || !pinataSecretApiKey)) {
    return NextResponse.json(
      {
        error:
          "Pinata is not configured. Set either PINATA_JWT or PINATA_API_KEY + PINATA_SECRET_API_KEY.",
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file was provided." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  const pinataForm = new FormData();
  pinataForm.append("file", file, file.name);

  const headers: Record<string, string> = {};

  if (pinataJwt) {
    headers.Authorization = `Bearer ${pinataJwt}`;
  } else if (pinataApiKey && pinataSecretApiKey) {
    headers.pinata_api_key = pinataApiKey;
    headers.pinata_secret_api_key = pinataSecretApiKey;
  }

  let response: Response;

  try {
    response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers,
      body: pinataForm,
    });
  } catch (error) {
    console.error("Pinata upload request failed:", error);

    return NextResponse.json(
      {
        error:
          "Unable to reach Pinata. Check your internet connection, DNS access, and PINATA_JWT / API key configuration.",
      },
      { status: 503 }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();

    if (errorText.includes("NO_SCOPES_FOUND")) {
      return NextResponse.json(
        {
          error:
            "Pinata key is missing required scopes. In Pinata, create a new key with permission for pinning files (pinFileToIPFS / files:write), then update your environment variables.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: `Pinata upload failed: ${errorText}` },
      { status: 502 }
    );
  }

  const data = await response.json();
  const cid = data?.IpfsHash;

  if (!cid) {
    return NextResponse.json({ error: "Pinata did not return a CID." }, { status: 502 });
  }

  return NextResponse.json({
    cid,
    ipfsUrl: `ipfs://${cid}`,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
  });
}
