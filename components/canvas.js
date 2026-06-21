import * as React from "react";
import { useEffect, useState, useRef, useCallback } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import {
  Undo as UndoIcon,
  Trash as TrashIcon,
  Brush as BrushIcon,
  Pencil as PencilIcon,
  SprayCan as SprayIcon,
  PenTool as CalligraphyIcon,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";

const BRUSH_PRESETS = {
  marker: {
    name: "马克笔",
    icon: BrushIcon,
    strokeWidth: 8,
    strokeColor: "rgba(0, 0, 0, 0.85)",
    description: "粗重饱满的笔触",
  },
  pencil: {
    name: "铅笔",
    icon: PencilIcon,
    strokeWidth: 2,
    strokeColor: "rgba(50, 50, 50, 0.6)",
    description: "细腻轻柔的线条",
  },
  spray: {
    name: "喷枪",
    icon: SprayIcon,
    strokeWidth: 12,
    strokeColor: "rgba(0, 0, 0, 0.4)",
    description: "弥散渐变的效果",
  },
  calligraphy: {
    name: "书法笔",
    icon: CalligraphyIcon,
    strokeWidth: 6,
    strokeColor: "rgba(0, 0, 0, 0.95)",
    description: "苍劲有力的笔锋",
  },
};

export default function Canvas({
  startingPaths,
  onScribble,
  scribbleExists,
  setScribbleExists,
}) {
  const canvasRef = React.useRef(null);
  const [selectedBrush, setSelectedBrush] = useState("marker");
  const [showBrushMenu, setShowBrushMenu] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [pathCount, setPathCount] = useState(0);
  const brushMenuRef = useRef(null);

  const currentBrush = BRUSH_PRESETS[selectedBrush];

  useEffect(() => {
    document
      .querySelector("#react-sketch-canvas__stroke-group-0")
      ?.removeAttribute("mask");

    loadStartingPaths();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (brushMenuRef.current && !brushMenuRef.current.contains(event.target)) {
        setShowBrushMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadStartingPaths() {
    if (startingPaths && startingPaths.length > 0) {
      await canvasRef.current.loadPaths(startingPaths);
      setScribbleExists(true);
      setPathCount(startingPaths.length);
      updateStrokeHistory(startingPaths);
      onChange();
    }
  }

  const generateStrokeThumbnail = useCallback(async (paths) => {
    try {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 48;
      tempCanvas.height = 48;
      const ctx = tempCanvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 48, 48);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (paths && paths.length > 0) {
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        paths.forEach((path) => {
          if (path.paths) {
            path.paths.forEach((p) => {
              minX = Math.min(minX, p.x);
              minY = Math.min(minY, p.y);
              maxX = Math.max(maxX, p.x);
              maxY = Math.max(maxY, p.y);
            });
          }
        });

        const padding = 4;
        const scale = Math.min(
          (48 - padding * 2) / Math.max(maxX - minX, 1),
          (48 - padding * 2) / Math.max(maxY - minY, 1)
        );
        const offsetX = padding - minX * scale;
        const offsetY = padding - minY * scale;

        paths.forEach((path) => {
          if (path.paths && path.paths.length > 0) {
            ctx.beginPath();
            ctx.moveTo(
              path.paths[0].x * scale + offsetX,
              path.paths[0].y * scale + offsetY
            );
            path.paths.forEach((p) => {
              ctx.lineTo(p.x * scale + offsetX, p.y * scale + offsetY);
            });
            ctx.stroke();
          }
        });
      }

      return tempCanvas.toDataURL();
    } catch (e) {
      return null;
    }
  }, []);

  const updateStrokeHistory = useCallback(
    async (allPaths) => {
      if (allPaths.length === 0) {
        setStrokeHistory([]);
        return;
      }

      const lastPath = allPaths[allPaths.length - 1];
      const thumbnail = await generateStrokeThumbnail([lastPath]);

      setStrokeHistory((prev) => {
        if (prev.length >= allPaths.length) {
          return prev.slice(0, allPaths.length);
        }
        return [
          ...prev,
          {
            id: Date.now() + Math.random(),
            brush: selectedBrush,
            brushName: BRUSH_PRESETS[selectedBrush]?.name || "自定义",
            thumbnail,
            timestamp: Date.now(),
          },
        ];
      });
    },
    [selectedBrush, generateStrokeThumbnail]
  );

  const onChange = async () => {
    const paths = await canvasRef.current.exportPaths();
    localStorage.setItem("paths", JSON.stringify(paths, null, 2));

    if (!paths.length) {
      setStrokeHistory([]);
      setPathCount(0);
      return;
    }

    if (paths.length !== pathCount) {
      if (paths.length > pathCount) {
        await updateStrokeHistory(paths);
      } else {
        setStrokeHistory((prev) => prev.slice(0, paths.length));
      }
      setPathCount(paths.length);
    }

    setScribbleExists(true);

    const data = await canvasRef.current.exportImage("png");
    onScribble(data);
  };

  const undo = () => {
    canvasRef.current.undo();
  };

  const reset = () => {
    setScribbleExists(false);
    setStrokeHistory([]);
    setPathCount(0);
    canvasRef.current.resetCanvas();
  };

  const selectBrush = (brushKey) => {
    setSelectedBrush(brushKey);
    setShowBrushMenu(false);
  };

  const CurrentBrushIcon = currentBrush.icon;

  return (
    <div className="relative">
      {scribbleExists || (
        <div>
          <div className="absolute grid w-full h-full p-3 place-items-center pointer-events-none text-xl">
            <span className="opacity-40">Draw something here.</span>
          </div>
        </div>
      )}

      <div className="relative mb-2" ref={brushMenuRef}>
        <button
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          onClick={() => setShowBrushMenu(!showBrushMenu)}
        >
          <CurrentBrushIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{currentBrush.name}</span>
          <ChevronDownIcon className="w-4 h-4 opacity-50" />
        </button>

        {showBrushMenu && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            {Object.entries(BRUSH_PRESETS).map(([key, brush]) => {
              const Icon = brush.icon;
              const isSelected = selectedBrush === key;
              return (
                <button
                  key={key}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors first:rounded-t-md last:rounded-b-md ${
                    isSelected ? "bg-gray-100" : ""
                  }`}
                  onClick={() => selectBrush(key)}
                >
                  <div
                    className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center"
                    style={{ background: "white" }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{brush.name}</div>
                    <div className="text-xs text-gray-500">{brush.description}</div>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-black rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ReactSketchCanvas
        ref={canvasRef}
        className="w-full aspect-square border-none cursor-crosshair"
        strokeWidth={currentBrush.strokeWidth}
        strokeColor={currentBrush.strokeColor}
        onChange={onChange}
        withTimestamp={true}
      />

      {strokeHistory.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
          <div className="text-xs text-gray-500 mb-2 px-1">撤销预览 ({strokeHistory.length} 笔)</div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {strokeHistory.map((stroke, index) => (
              <div
                key={stroke.id}
                className="flex-shrink-0 w-12 h-12 rounded border border-gray-300 bg-white overflow-hidden relative group"
                title={`${stroke.brushName} - 第 ${index + 1} 笔`}
              >
                {stroke.thumbnail ? (
                  <img
                    src={stroke.thumbnail}
                    alt={`第 ${index + 1} 笔`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100" />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {scribbleExists && (
        <div className="animate-in fade-in duration-700 text-left mt-2">
          <button className="lil-button" onClick={undo}>
            <UndoIcon className="icon" />
            Undo
          </button>
          <button className="lil-button" onClick={reset}>
            <TrashIcon className="icon" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
