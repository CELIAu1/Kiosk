import { getImage } from "@/lib/data/images";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const image = await getImage(id);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.mime,
      // Ids are random and never reused, so the bytes at this URL never change.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
