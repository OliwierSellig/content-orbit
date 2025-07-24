import React, { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import { cn } from "@/lib/utils";
import { FormattingToolbar } from "../common/FormattingToolbar";
import { Link as LinkIcon, Edit } from "lucide-react";

const CustomListItem = ListItem.extend({
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Backspace: () => {
        const { empty, $from } = this.editor.state.selection;
        if (!empty || $from.parent.content.size > 0) {
          return false;
        }
        return this.editor.commands.liftListItem(this.name);
      },
    };
  },
});

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  disabled = false,
  isLoading = false,
}) => {
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<{ top: number; left: number; url: string } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const [loadingText, setLoadingText] = useState("");
  const [showLoading, setShowLoading] = useState(false);
  const fullLoadingText = "Chwileczkę, generuję dla Ciebie tekst...";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        listItem: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Markdown,
      CustomListItem,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "prose prose-invert min-h-[500px] w-full max-w-none p-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange((editor.storage as any).markdown.getMarkdown());
    },
  });

  const handleSetLink = useCallback(
    (url: string, isExternal: boolean) => {
      let finalUrl = url;
      if (isExternal && !/^https?:\/\//i.test(url)) {
        finalUrl = `https://${url}`;
      }

      if (finalUrl) {
        editor?.chain().focus().extendMarkRange("link").setLink({ href: finalUrl }).run();
        setIsLinkPopoverOpen(false);
      }
    },
    [editor]
  );

  useEffect(() => {
    if (editor && content !== (editor.storage as any).markdown.getMarkdown()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && !isLoading);
    }
  }, [disabled, isLoading, editor]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      const target = event.target as HTMLElement;
      if (target.tagName === "A" && target.closest(".ProseMirror")) {
        const rect = target.getBoundingClientRect();
        if (editorRef.current) {
          const editorRect = editorRef.current.getBoundingClientRect();
          setHoveredLink({
            top: rect.top - editorRect.top + rect.height,
            left: rect.left - editorRect.left,
            url: target.getAttribute("href") || "",
          });
        }
      } else if (!target.closest("[data-hover-menu]")) {
        hideTimeoutRef.current = window.setTimeout(() => {
          setHoveredLink(null);
        }, 200);
      }
    };

    const editorElement = editorRef.current;
    editorElement?.addEventListener("mousemove", handleMouseMove);
    return () => {
      editorElement?.removeEventListener("mousemove", handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [editor]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setShowLoading(true);
      let i = 0;
      const interval = setInterval(() => {
        setLoadingText(fullLoadingText.substring(0, i + 1));
        i++;
        if (i >= fullLoadingText.length) {
          clearInterval(interval);
        }
      }, 25);
      return () => clearInterval(interval);
    } else {
      timer = setTimeout(() => setShowLoading(false), 500); // Wait for fade out
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleHoverMenuMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleHoverMenuMouseLeave = () => {
    setHoveredLink(null);
  };

  return (
    <div
      ref={editorRef}
      className={cn("transition-all duration-300 relative", {
        "opacity-50 cursor-not-allowed": disabled,
      })}
    >
      <FormattingToolbar
        editor={editor}
        isLinkPopoverOpen={isLinkPopoverOpen}
        onLinkPopoverOpenChange={setIsLinkPopoverOpen}
        onSetLink={handleSetLink}
      />
      <EditorContent editor={editor} />
      {hoveredLink && (
        <div
          data-hover-menu
          className="absolute z-10 flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1.5 text-sm"
          style={{ top: hoveredLink.top, left: hoveredLink.left }}
          onMouseEnter={handleHoverMenuMouseEnter}
        >
          <a
            href={hoveredLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline max-w-[200px] truncate"
          >
            {hoveredLink.url}
          </a>
          <span className="text-neutral-600">|</span>
          <button
            onClick={() => {
              setIsLinkPopoverOpen(true);
              setHoveredLink(null);
            }}
            className="flex cursor-pointer items-center gap-1 text-white hover:underline"
          >
            <Edit className="h-3 w-3" />
            Edit
          </button>
        </div>
      )}
      {showLoading && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-neutral-900/50 backdrop-blur-sm transition-opacity duration-500",
            {
              "opacity-100": isLoading,
              "opacity-0": !isLoading,
            }
          )}
        >
          <p className="text-xl font-medium text-neutral-300 animate-pulse">{loadingText}</p>
        </div>
      )}
    </div>
  );
};
