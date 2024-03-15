import { getServerSideConfig } from "@/app/config/server";
import LocalFileStorage from "@/app/utils/local_file_storage";
import S3FileStorage from "@/app/utils/s3_file_storage";
import { NextRequest, NextResponse } from "next/server";
import { getGigachatToken } from "../../common";

async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }

  const getGigachatFile = async (fileId: string) => {
    try {
      const token = await getGigachatToken(process.env.OPENAI_API_KEY!);
      const fetchOptions: RequestInit = {
        headers: {
          Authorization: token!,
        },
        method: "GET",
      };
      const response = await fetch(
        `https://gigachat.devices.sberbank.ru/api/v1/files/${fileId}/content`,
        fetchOptions,
      );
      const content = await response.arrayBuffer();
      const buffer = Buffer.from(content);
      return buffer;
    } catch (error) {
      console.error("Get GigaChat File Error", error);
    }
  };

  try {
    var fileName = `${Date.now()}.png`;
    const buffer = await getGigachatFile(params.path[0]);
    const filePath = await LocalFileStorage.put(fileName, buffer!);
    var fileBuffer = await LocalFileStorage.get(
      filePath.replace("/api/file/", ""),
    );
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (e) {
    return new Response("not found", {
      status: 404,
    });
  }
}

export const GET = handle;

export const runtime = "nodejs";
export const revalidate = 0;
