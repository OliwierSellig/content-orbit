import React from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { BubbleMenuProps } from "@tiptap/react/menus";
import { Bold, Italic } from "lucide-react";
import { cn } from "@/lib/utils";

type DescriptionBubbleMenuProps = Omit<BubbleMenuProps, "children">;

export const DescriptionBubbleMenu: React.FC<DescriptionBubbleMenuProps> = (props) => {
  if (!props.editor) {
    return null;
  }

  const { editor } = props;

  return (
    <BubbleMenu
      {...props}
      pluginKey="descriptionBubbleMenu"
      className="flex items-center gap-1 p-1 bg-neutral-800 border border-neutral-700 rounded-md"
      shouldShow={({ editor }) => {
        const { from, to } = editor.state.selection;
        return from !== to;
      }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn("p-2 rounded-md cursor-pointer hover:bg-neutral-700", {
          "bg-neutral-700": editor.isActive("bold"),
        })}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn("p-2 rounded-md cursor-pointer hover:bg-neutral-700", {
          "bg-neutral-700": editor.isActive("italic"),
        })}
      >
        <Italic className="h-4 w-4" />
      </button>
    </BubbleMenu>
  );
};
