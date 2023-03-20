import { DndContext, useDraggable } from "@dnd-kit/core";
import { useRef, useState } from "react";
import { restrictToElement } from "./Editor";

export const DraggableBackground = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const [currentX, setCurrentX] = useState(0);
  const imageWrapperRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className="relative mx-auto my-4 h-80 w-80 overflow-hidden rounded-md border-[1px] border-white/20"
      ref={imageWrapperRef}
    >
      <DndContext
        modifiers={[restrictToElement(imageWrapperRef.current)]}
        onDragEnd={(e) => setCurrentX(currentX + e.delta.x)}
        onDragStart={console.log}
      >
        {children}
        <Inner currentX={currentX} />
      </DndContext>
    </div>
  );
};

const Inner = ({ currentX }: { currentX: number }) => {
  const { setNodeRef, transform, listeners } = useDraggable({
    id: "dragHandler",
  });

  return (
    <div
      className="absolute inset-0 flex h-full w-full items-center justify-start bg-black outline-2 outline-black"
      style={{
        transform: `translateX(${Math.max(
          0,
          currentX + (transform?.x ?? 0)
        )}px)`,
      }}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        className="absolute z-50 h-full w-2 cursor-grab border-2 border-black bg-gradient-to-l from-gray-400 via-white to-gray-400"
      ></div>
    </div>
  );
};
