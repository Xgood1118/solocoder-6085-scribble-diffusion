import prisma from "lib/prisma";

export default async function handler(req, res) {
  const { id } = req.query;

  try {

    const prediction = await prisma.prediction.findFirst({
      where: {
        OR: [{ uuid: id }, { id: parseInt(id) || -1 }],
      },
    });

    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    const platform = req.query.platform || "direct";
    const referer = req.headers.referer || null;
    const userAgent = req.headers["user-agent"] || null;
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["x-real-ip"] ||
      req.socket?.remoteAddress ||
      null;

    try {
      await prisma.shareClick.create({
        data: {
          predictionId: prediction.id,
          platform: String(platform),
          referer: referer,
          ipAddress: ipAddress,
          userAgent: userAgent,
        },
      });
    } catch (dbError) {
      console.error("Error recording share click:", dbError);
    }

    const baseUrl = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    return res.redirect(`${baseUrl}/scribbles/${prediction.uuid || prediction.id}`);
  } catch (error) {
    console.error("Share handler error:", error);
    const baseUrl = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;
    return res.redirect(`${baseUrl}/`);
  }
}
