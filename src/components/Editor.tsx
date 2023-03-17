import { type RefObject, useEffect, useState } from "react";
import { cx } from "~/utils/general";
import { CircleIcon } from "./icons/CircleIcon";
import { ClearIcon } from "./icons/ClearIcon";
import { ColorIcon } from "./icons/ColorIcon";
import { SquareIcon } from "./icons/SquareIcon";
import { TriangleIcon } from "./icons/TriangleIcon";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

const MIN_SIZE = 10;
const ShapeColors = [
  "#000000",
  "#235789",
  "#c1292e",
  "#f1d302",
  "#56e39f",
  "#e574bc",
  "#ffffff",
] as const;
type ShapeColor = (typeof ShapeColors)[number];
type Shape = {
  id: number;
  type: "SQUARE" | "TRIANGLE" | "CIRCLE";
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex: number;
  color: ShapeColor;
};
const InteractiveEditor = ({
  shapes,
  background,
  activeShapeId,
  setActiveShapeId,
}: {
  shapes: Shape[];
  background: string | null;
  activeShapeId: number;
  setActiveShapeId: (n: number) => void;
}) => {
  const { setNodeRef, node } = useDroppable({
    id: "droppable",
  });
  useClickOutside(node, () => {
    setActiveShapeId(-1);
  });
  return (
    <div
      className="relative aspect-square w-full border-2 border-white/20 bg-opacity-60 bg-contain bg-center bg-no-repeat"
      style={{
        backgroundImage: background ? `url(${background})` : undefined,
      }}
      ref={setNodeRef}
    >
      {shapes.map((shape, idx) => (
        <ShapeDisplay
          key={shape.id}
          isActive={activeShapeId === shape.id}
          shape={shape}
          updateShape={(newShape) => {
            shapes[idx] = newShape;
            const maxZIndex = Math.max(...shapes.map((x) => x.zIndex), 0) + 1;
            newShape.zIndex = maxZIndex;
            return [...shapes];
          }}
        />
      ))}
    </div>
  );
};

type ClickEvent = MouseEvent | TouchEvent;
function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: ClickEvent) => void
) {
  useEffect(() => {
    const listener = (event: ClickEvent) => {
      const el = ref?.current;
      if (
        el !== event.target &&
        (!el || el.contains((event?.target as Node) || null))
      ) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export const Editor = ({ isActive }: { isActive: boolean }) => {
  const [background, setBackground] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState<ShapeColor>("#235789");
  const [toolboxMod, setToolboxMod] = useState<"shapes" | "colors">("shapes");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeShapeId, setActiveShapeId] = useState<number>(-1);

  function updateShapeById(id: number, modifier: (oldShape: Shape) => Shape) {
    setShapes((prev) => {
      // Normal movement
      return prev.map((s) => {
        if (s.id === id) {
          return modifier(s);
        }
        return s;
      });
    });
  }

  function addShape(type: Shape["type"]) {
    setShapes((prev) => [
      ...prev,
      {
        id: Math.max(...prev.map((x) => x.id), 0) + 1,
        color: currentColor,
        left: 0,
        top: 0,
        width: 32,
        height: 32,
        zIndex: 0,
        type,
      },
    ]);
  }

  return (
    <div
      className={cx(
        "mx-auto w-80 overflow-hidden transition-all",
        isActive ? "m-0 h-0" : "mt-4 h-96"
      )}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          if (typeof reader.result === "string") setBackground(reader.result);
        };
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <DndContext
        onDragStart={(e) => {
          if (typeof e.active.id === "number") {
            // Normal movement
            updateShapeById(e.active.id, (s) => ({
              ...s,
              zIndex: Math.max(...shapes.map((x) => x.zIndex), 0) + 1,
            }));
            setActiveShapeId(e.active.id);
          } else {
            const id = e.active.data.current?.id as number | undefined;
            if (!id) return;
            setActiveShapeId(id);
          }
        }}
        onDragEnd={(e) => {
          if (typeof e.active.id === "number") {
            // Normal movement
            updateShapeById(e.active.id, (s) => ({
              ...s,
              left: s.left + e.delta.x,
              top: s.top + e.delta.y,
            }));
          } else {
            const id = e.active.data.current?.id as number | undefined;
            if (!id) return;
            // side resize
            if (e.active.id.endsWith("_handleResizeRight")) {
              updateShapeById(id, (s) => ({
                ...s,
                width: Math.max(MIN_SIZE, s.width + e.delta.x),
              }));
            } else if (e.active.id.endsWith("_handleResizeLeft")) {
              updateShapeById(id, (s) => ({
                ...s,
                left: s.left + Math.min(s.width - MIN_SIZE, e.delta.x),
                width: Math.max(MIN_SIZE, s.width - e.delta.x),
              }));
            } else if (e.active.id.endsWith("_handleResizeTop")) {
              updateShapeById(id, (s) => ({
                ...s,
                top: s.top + Math.min(s.height - MIN_SIZE, e.delta.y),
                height: Math.max(MIN_SIZE, s.height - e.delta.y),
              }));
            } else if (e.active.id.endsWith("_handleResizeBottom")) {
              updateShapeById(id, (s) => ({
                ...s,
                height: Math.max(MIN_SIZE, s.height + e.delta.y),
              }));
            }
            // corner resize
            else if (e.active.id.endsWith("_handleResizeTopRight")) {
              updateShapeById(id, (s) => ({
                ...s,
                width: Math.max(MIN_SIZE, s.width + e.delta.x),
                top: s.top + Math.min(s.height - MIN_SIZE, e.delta.y),
                height: Math.max(MIN_SIZE, s.height - e.delta.y),
              }));
            } else if (e.active.id.endsWith("_handleResizeTopLeft")) {
              updateShapeById(id, (s) => ({
                ...s,
                top: s.top + Math.min(s.height - MIN_SIZE, e.delta.y),
                height: Math.max(MIN_SIZE, s.height - e.delta.y),
                left: s.left + Math.min(s.width - MIN_SIZE, e.delta.x),
                width: Math.max(MIN_SIZE, s.width - e.delta.x),
              }));
            } else if (e.active.id.endsWith("_handleResizeBottomRight")) {
              updateShapeById(id, (s) => ({
                ...s,
                height: Math.max(MIN_SIZE, s.height + e.delta.y),
                width: Math.max(MIN_SIZE, s.width + e.delta.x),
              }));
            } else if (e.active.id.endsWith("_handleResizeBottomLeft")) {
              updateShapeById(id, (s) => ({
                ...s,
                height: Math.max(MIN_SIZE, s.height + e.delta.y),
                left: s.left + Math.min(s.width - MIN_SIZE, e.delta.x),
                width: Math.max(MIN_SIZE, s.width - e.delta.x),
              }));
            }
          }
        }}
      >
        <InteractiveEditor
          activeShapeId={activeShapeId}
          setActiveShapeId={setActiveShapeId}
          shapes={shapes}
          background={background}
        />
      </DndContext>
      <div className="flex w-full bg-zinc-900 p-2 text-2xl">
        <div
          className={cx(
            "flex gap-2 overflow-hidden transition-all",
            toolboxMod === "colors" ? "flex-0 w-0" : "flex-1"
          )}
        >
          <button onClick={() => addShape("SQUARE")}>
            <SquareIcon style={{ color: "white" }} />
          </button>
          <button onClick={() => addShape("TRIANGLE")}>
            <TriangleIcon style={{ color: "white" }} />
          </button>
          <button onClick={() => addShape("CIRCLE")}>
            <CircleIcon style={{ color: "white" }} />
          </button>
        </div>

        <div className="flex flex-1 justify-end gap-2 overflow-hidden transition-all">
          <div
            className={cx(
              "flex h-full gap-2 overflow-hidden",
              toolboxMod === "colors" ? "flex-1" : "flex-0 w-0"
            )}
          >
            {ShapeColors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className="block aspect-square h-full rounded-full"
                style={{ background: color }}
              ></button>
            ))}
          </div>
          <button
            onClick={() =>
              setToolboxMod(toolboxMod === "colors" ? "shapes" : "colors")
            }
          >
            <ColorIcon style={{ color: currentColor }} />
          </button>
          {background && (
            <button onClick={() => setBackground(null)}>
              <ClearIcon className="text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ShapeDisplay = ({
  shape,
  isActive,
}: //   updateShape,
{
  shape: Shape;
  updateShape: (newShape: Shape) => void;
  isActive: boolean;
}) => {
  const { setNodeRef, transform, listeners } = useDraggable({
    id: shape.id,
  });

  const handleResizeRight = useDraggable({
    id: shape.id.toString() + "_handleResizeRight",
    data: { id: shape.id },
  });
  const handleResizeLeft = useDraggable({
    id: shape.id.toString() + "_handleResizeLeft",
    data: { id: shape.id },
  });
  const handleResizeTop = useDraggable({
    id: shape.id.toString() + "_handleResizeTop",
    data: { id: shape.id },
  });
  const handleResizeBottom = useDraggable({
    id: shape.id.toString() + "_handleResizeBottom",
    data: { id: shape.id },
  });

  const handleResizeTopLeft = useDraggable({
    id: shape.id.toString() + "_handleResizeTopLeft",
    data: { id: shape.id },
  });
  const handleResizeTopRight = useDraggable({
    id: shape.id.toString() + "_handleResizeTopRight",
    data: { id: shape.id },
  });
  const handleResizeBottomLeft = useDraggable({
    id: shape.id.toString() + "_handleResizeBottomLeft",
    data: { id: shape.id },
  });
  const handleResizeBottomRight = useDraggable({
    id: shape.id.toString() + "_handleResizeBottomRight",
    data: { id: shape.id },
  });

  const topResize =
    handleResizeTop.transform?.y ??
    handleResizeTopLeft.transform?.y ??
    handleResizeTopRight.transform?.y ??
    0;
  const bottomResize =
    handleResizeBottom.transform?.y ??
    handleResizeBottomLeft.transform?.y ??
    handleResizeBottomRight.transform?.y ??
    0;
  const leftResize =
    handleResizeLeft.transform?.x ??
    handleResizeTopLeft.transform?.x ??
    handleResizeBottomLeft.transform?.x ??
    0;
  const rightResize =
    handleResizeRight.transform?.x ??
    handleResizeTopRight.transform?.x ??
    handleResizeBottomRight.transform?.x ??
    0;

  return (
    <div
      ref={setNodeRef}
      className="absolute"
      {...listeners}
      style={{
        top:
          shape.top +
          (transform?.y ?? 0) +
          Math.min(shape.height - MIN_SIZE, topResize),
        left:
          shape.left +
          (transform?.x ?? 0) +
          Math.min(shape.width - MIN_SIZE, leftResize),
        width: Math.max(MIN_SIZE, shape.width + rightResize - leftResize),
        height: Math.max(MIN_SIZE, shape.height + bottomResize - topResize),
        zIndex: shape.zIndex,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
      >
        {shape.type === "SQUARE" ? (
          <rect x="0" y="0" width="100" height="100" fill={shape.color} />
        ) : shape.type === "TRIANGLE" ? (
          <polygon points="50 15, 100 100, 0 100" fill={shape.color} />
        ) : (
          <circle cx="50" cy="50" r="50" fill={shape.color} />
        )}
      </svg>
      {isActive && (
        <>
          {" "}
          <div
            className="absolute right-0 h-full w-0.5 cursor-w-resize bg-white/50"
            ref={handleResizeRight.setNodeRef}
            {...handleResizeRight.listeners}
          ></div>
          <div
            className="absolute left-0 h-full w-0.5 cursor-w-resize bg-white/50"
            ref={handleResizeLeft.setNodeRef}
            {...handleResizeLeft.listeners}
          ></div>
          <div
            className="absolute top-0 h-0.5 w-full cursor-n-resize bg-white/50"
            ref={handleResizeTop.setNodeRef}
            {...handleResizeTop.listeners}
          ></div>
          <div
            className="absolute bottom-0 h-0.5 w-full cursor-n-resize bg-white/50"
            ref={handleResizeBottom.setNodeRef}
            {...handleResizeBottom.listeners}
          ></div>
          <div
            className="absolute top-0 left-0 h-0.5 w-0.5 cursor-nw-resize bg-white/50"
            ref={handleResizeTopLeft.setNodeRef}
            {...handleResizeTopLeft.listeners}
          ></div>
          <div
            className="absolute top-0 right-0 h-0.5 w-0.5 cursor-ne-resize bg-white/50"
            ref={handleResizeTopRight.setNodeRef}
            {...handleResizeTopRight.listeners}
          ></div>
          <div
            className="absolute bottom-0 left-0 h-0.5 w-0.5 cursor-sw-resize bg-white/50"
            ref={handleResizeBottomLeft.setNodeRef}
            {...handleResizeBottomLeft.listeners}
          ></div>
          <div
            className="absolute bottom-0 right-0 h-0.5 w-0.5 cursor-se-resize bg-white/50"
            ref={handleResizeBottomRight.setNodeRef}
            {...handleResizeBottomRight.listeners}
          ></div>
        </>
      )}
    </div>
  );
};
