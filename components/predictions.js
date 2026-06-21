import copy from "copy-to-clipboard";
import {
  Copy as CopyIcon,
  PlusCircle as PlusCircleIcon,
  ThumbsDown as ThumbsDownIcon,
  Twitter as TwitterIcon,
  MessageSquare as RedditIcon,
  BarChart3 as StatsIcon,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import Loader from "components/loader";

const SHARE_CLICKS_KEY = "scribble_share_clicks";

function getShareClicks() {
  try {
    const saved = localStorage.getItem(SHARE_CLICKS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function incrementShareClick(predictionId, platform) {
  const clicks = getShareClicks();
  if (!clicks[predictionId]) {
    clicks[predictionId] = { twitter: 0, reddit: 0, total: 0 };
  }
  clicks[predictionId][platform] = (clicks[predictionId][platform] || 0) + 1;
  clicks[predictionId].total = (clicks[predictionId].total || 0) + 1;
  localStorage.setItem(SHARE_CLICKS_KEY, JSON.stringify(clicks));
  return clicks[predictionId];
}

export default function Predictions({
  predictions,
  submissionCount,
  onRetry,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (submissionCount > 0) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [predictions, submissionCount]);

  if (submissionCount === 0) return;

  const predictionList = Object.values(predictions)
    .slice()
    .reverse();

  return (
    <section className="w-full my-10">
      <h2 className="text-center text-3xl font-bold m-6">Results</h2>

      {submissionCount > Object.keys(predictions).length && (
        <div className="pb-10 mx-auto w-full text-center">
          <div className="pt-10" ref={scrollRef} />
          <Loader />
        </div>
      )}

      {predictionList.map((prediction, index) => (
        <Fragment key={prediction.id}>
          {index === 0 &&
            submissionCount == Object.keys(predictions).length && (
              <div ref={scrollRef} />
            )}
          <Prediction
            prediction={prediction}
            previousPrediction={
              index < predictionList.length - 1
                ? predictionList[index + 1]
                : null
            }
            isLatest={index === 0}
            onRetry={onRetry}
          />
        </Fragment>
      ))}
    </section>
  );
}

export function Prediction({
  prediction,
  previousPrediction,
  showLinkToNewScribble = false,
  isLatest = false,
  onRetry,
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareStats, setShareStats] = useState(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const clicks = getShareClicks();
    setShareStats(clicks[prediction.id] || { twitter: 0, reddit: 0, total: 0 });
  }, [prediction.id]);

  const predictionUrl =
    typeof window !== "undefined"
      ? window.location.origin +
        "/scribbles/" +
        (prediction.uuid || prediction.id)
      : "";

  const copyLink = () => {
    copy(predictionUrl);
    setLinkCopied(true);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry(prediction);
    }
  };

  const handleShare = (platform) => {
    const rawPrompt = prediction.input?.rawPrompt || prediction.input?.prompt || "";
    const shareText = `我用 Scribble Diffusion 画的：${rawPrompt}`;
    const imageUrl =
      prediction.output?.[prediction.output.length - 1] ||
      prediction.input?.image ||
      "";

    let shareUrl = "";
    if (platform === "twitter") {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(predictionUrl)}`;
    } else if (platform === "reddit") {
      shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(
        predictionUrl
      )}&title=${encodeURIComponent(shareText)}`;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      const newStats = incrementShareClick(prediction.id, platform);
      setShareStats(newStats);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLinkCopied(false);
    }, 4 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (!prediction) return null;

  const outputImage = prediction.output?.[prediction.output.length - 1];
  const inputImage = prediction.input?.image;
  const previousOutputImage = previousPrediction?.output?.[
    previousPrediction.output.length - 1
  ];
  const rawPrompt = prediction.input?.rawPrompt;
  const styleName = prediction.input?.styleName;

  return (
    <div className="mt-6 mb-12">
      {styleName && (
        <div className="text-center mb-2">
          <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
            风格：{styleName}
          </span>
        </div>
      )}

      <div className="shadow-lg border my-5 p-4 bg-white">
        <div className="grid grid-cols-3 gap-3">
          <div className="relative border rounded-md overflow-hidden">
            <div className="absolute top-1 left-1 z-10 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
              涂鸦输入
            </div>
            <img
              src={inputImage}
              alt="input scribble"
              className="w-full aspect-square object-contain bg-white"
            />
          </div>

          <div className="relative border rounded-md overflow-hidden">
            <div className="absolute top-1 left-1 z-10 bg-gray-600 bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
              {previousOutputImage ? "上次结果" : "待生成"}
            </div>
            {previousOutputImage ? (
              <img
                src={previousOutputImage}
                alt="previous output"
                className="w-full aspect-square object-contain bg-white"
              />
            ) : (
              <div className="w-full aspect-square bg-gray-50 flex items-center justify-center text-gray-300 text-xs">
                暂无历史
              </div>
            )}
          </div>

          <div className="relative border rounded-md overflow-hidden">
            <div className="absolute top-1 left-1 z-10 bg-green-600 bg-opacity-80 text-white text-xs px-2 py-0.5 rounded">
              新生成结果
            </div>
            {outputImage ? (
              <img
                src={outputImage}
                alt="output image"
                className="w-full aspect-square object-contain bg-white"
              />
            ) : (
              <div className="w-full aspect-square grid place-items-center bg-white">
                <Loader />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center px-4 opacity-60 text-xl mb-2">
        &ldquo;{rawPrompt || prediction.input.prompt}&rdquo;
      </div>

      <div className="text-center py-2 flex flex-wrap justify-center gap-2">
        <button className="lil-button" onClick={copyLink}>
          <CopyIcon className="icon" />
          {linkCopied ? "Copied!" : "Copy link"}
        </button>

        <button
          className="lil-button"
          onClick={() => handleShare("twitter")}
          title="分享到 Twitter"
        >
          <TwitterIcon className="icon" />
          Twitter
        </button>

        <button
          className="lil-button"
          onClick={() => handleShare("reddit")}
          title="分享到 Reddit"
        >
          <RedditIcon className="icon" />
          Reddit
        </button>

        <button
          className="lil-button relative"
          onClick={() => setShowStats(!showStats)}
          title="查看分享统计"
        >
          <StatsIcon className="icon" />
          统计
          {shareStats && shareStats.total > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {shareStats.total}
            </span>
          )}
        </button>

        {isLatest && outputImage && onRetry && (
          <button
            className="lil-button"
            onClick={handleRetry}
            title="不喜欢，重新生成（随机seed）"
          >
            <ThumbsDownIcon className="icon" />
            不喜欢
          </button>
        )}

        {showLinkToNewScribble && (
          <Link href="/">
            <button className="lil-button" onClick={copyLink}>
              <PlusCircleIcon className="icon" />
              Create a new scribble
            </button>
          </Link>
        )}
      </div>

      {showStats && shareStats && (
        <div className="text-center py-2">
          <div className="inline-flex gap-4 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-md">
            <span>
              <TwitterIcon className="w-4 h-4 inline mr-1" />
              Twitter: {shareStats.twitter || 0}
            </span>
            <span>
              <RedditIcon className="w-4 h-4 inline mr-1" />
              Reddit: {shareStats.reddit || 0}
            </span>
            <span className="font-medium">总计: {shareStats.total || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}
