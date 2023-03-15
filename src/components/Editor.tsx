import { useState } from "react";
import { cx } from "~/utils/general";
import { CircleIcon } from "./icons/CircleIcon";
import { ClearIcon } from "./icons/ClearIcon";
import { ColorIcon } from "./icons/ColorIcon";
import { SquareIcon } from "./icons/SquareIcon";
import { TriangleIcon } from "./icons/TriangleIcon";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

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
}: {
  shapes: Shape[];
  background: string | null;
}) => {
  const { setNodeRef } = useDroppable({
    id: "droppable",
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
          key={idx}
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
export const Editor = ({ isActive }: { isActive: boolean }) => {
  const [background, setBackground] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState<ShapeColor>("#235789");
  const [toolboxMod, setToolboxMod] = useState<"shapes" | "colors">("colors");
  const [shapes, setShapes] = useState<Shape[]>([]);

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
        onDragEnd={(e) => {
          console.log(e);
          setShapes((prev) => {
            if (typeof e.active.id === "number") {
              return prev.map((s) => {
                if (s.id === e.active.id) {
                  s.left += e.delta.x;
                  s.top += e.delta.y;
                }
                return s;
              });
            } else {
              if (e.active.id.endsWith("_handleResizeRight")) {
                const id = e.active.data.current?.id as number;
                return prev.map((s) => {
                  if (s.id === id) {
                    s.width = Math.max(1, s.width + e.delta.x);
                  }
                  return s;
                });
              } else if (e.active.id.endsWith("_handleResizeLeft")) {
                const id = e.active.data.current?.id as number;
                return prev.map((s) => {
                  if (s.id === id) {
                    s.left += Math.min(s.width, e.delta.x);
                    s.width = Math.max(1, s.width - e.delta.x);
                    console.log(s);
                  }
                  return s;
                });
              } else if (e.active.id.endsWith("_handleResizeTop")) {
                const id = e.active.data.current?.id as number;
                return prev.map((s) => {
                  if (s.id === id) {
                    s.top += Math.min(s.height, e.delta.y);
                    s.height = Math.max(1, s.height - e.delta.y);
                  }
                  return s;
                });
              } else if (e.active.id.endsWith("_handleResizeBottom")) {
                const id = e.active.data.current?.id as number;
                return prev.map((s) => {
                  if (s.id === id) {
                    s.height = Math.max(1, s.height + e.delta.y);
                  }
                  return s;
                });
              }
            }
            return prev;
          });
        }}
      >
        <InteractiveEditor shapes={shapes} background={background} />
      </DndContext>
      <div className="flex w-full bg-zinc-900 p-2 text-2xl">
        <div
          className={cx(
            "flex gap-2 overflow-hidden transition-all",
            toolboxMod === "colors" ? "flex-0 w-0" : "flex-1"
          )}
        >
          <button
            onClick={() =>
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
                  type: "SQUARE",
                },
              ])
            }
          >
            <SquareIcon style={{ color: "white" }} />
          </button>
          <button>
            <TriangleIcon style={{ color: "white" }} />
          </button>
          <button>
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
}: //   updateShape,
{
  shape: Shape;
  updateShape: (newShape: Shape) => void;
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
  return (
    <div
      ref={setNodeRef}
      className="absolute"
      {...listeners}
      style={{
        top:
          shape.top +
          (transform?.y ?? 0) +
          Math.min(shape.height, handleResizeTop.transform?.y ?? 0),
        left:
          shape.left +
          (transform?.x ?? 0) +
          Math.min(shape.width, handleResizeLeft.transform?.x ?? 0),
        width: Math.max(
          1,
          shape.width +
            (handleResizeRight.transform?.x ?? 0) -
            (handleResizeLeft.transform?.x ?? 0)
        ),
        height: Math.max(
          1,
          shape.height +
            (handleResizeBottom.transform?.y ?? 0) -
            (handleResizeTop.transform?.y ?? 0)
        ),
        background: shape.color,
      }}
    >
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
    </div>
  );
};
