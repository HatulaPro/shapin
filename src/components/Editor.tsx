import { useState } from "react";
import { cx } from "~/utils/general";
import { CircleIcon } from "./icons/CircleIcon";
import { ClearIcon } from "./icons/ClearIcon";
import { ColorIcon } from "./icons/ColorIcon";
import { SquareIcon } from "./icons/SquareIcon";
import { TriangleIcon } from "./icons/TriangleIcon";

export const Editor = ({ isActive }: { isActive: boolean }) => {
  const [background, setBackground] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState<string>("#3355ff");
  const [toolboxMod, setToolboxMod] = useState<"shapes" | "colors">("colors");

  return (
    <div
      className={cx(
        "mx-auto w-80 overflow-hidden transition-all",
        isActive ? "m-0 h-0" : "mt-4 h-96"
      )}
    >
      <div
        className="relative aspect-square w-full border-2 border-white/20 bg-opacity-60 bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: background ? `url(${background})` : undefined,
        }}
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
      ></div>
      <div className="flex w-full bg-zinc-900 p-2 text-2xl">
        <div
          className={cx(
            "flex gap-2 overflow-hidden transition-all",
            toolboxMod === "colors" ? "flex-0 w-0" : "flex-1"
          )}
        >
          <button>
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
            {[
              "#000000",
              "#235789",
              "#c1292e",
              "#f1d302",
              "#56e39f",
              "#e574bc",
              "#ffffff",
            ].map((color) => (
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
