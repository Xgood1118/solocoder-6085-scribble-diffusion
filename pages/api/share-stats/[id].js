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

    const allClicks = await prisma.shareClick.findMany({
      where: {
        predictionId: prediction.id,
      },
    });

    const twitterClicks = allClicks.filter((c) => c.platform === "twitter").length;
    const redditClicks = allClicks.filter((c) => c.platform === "reddit").length;
    const directClicks = allClicks.filter((c) => c.platform === "direct").length;
    const totalClicks = allClicks.length;

    return res.json({
      predictionId: prediction.id,
      predictionUuid: prediction.uuid,
      twitter: twitterClicks,
      reddit: redditClicks,
      direct: directClicks,
      total: totalClicks,
      platforms: {
        twitter: twitterClicks,
        reddit: redditClicks,
        direct: directClicks,
      },
    });
  } catch (error) {
    console.error("Share stats error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
