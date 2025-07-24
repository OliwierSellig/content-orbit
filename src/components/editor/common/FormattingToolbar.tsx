import React, { useCallback, useState, useEffect } from "react";
import { type Editor } from "@tiptap/react";
import { Bold, Italic, List, ListOrdered, Link, Unlink, ChevronDown } from "lucide-react";
import type { LucideProps } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormattingToolbarProps {
  editor: Editor | null;
  isLinkPopoverOpen: boolean;
  onLinkPopoverOpenChange: (isOpen: boolean) => void;
  onSetLink: (url: string, isExternal: boolean) => void;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  editor,
  isLinkPopoverOpen,
  onLinkPopoverOpenChange,
  onSetLink,
}) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [isExternal, setIsExternal] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkSet = useCallback(() => {
    onSetLink(linkUrl, isExternal);
  }, [linkUrl, isExternal, onSetLink]);

  useEffect(() => {
    let valid = false;
    let currentError: string | null = null;

    if (linkUrl.length > 0) {
      if (isExternal) {
        valid = linkUrl.startsWith("https://");
        if (!valid) currentError = "External links must start with `https://`";
      } else {
        valid = linkUrl.startsWith("/");
        if (!valid) currentError = "Internal links must start with a `/`";
      }
    } else {
      valid = false;
    }

    setIsValid(valid);
    setError(currentError);
  }, [linkUrl, isExternal]);

  useEffect(() => {
    if (isLinkPopoverOpen) {
      if (editor?.isActive("link")) {
        const href = editor.getAttributes("link").href;
        setLinkUrl(href);
        setIsExternal(/^https?:\/\//i.test(href));
      } else {
        setLinkUrl("");
        setIsExternal(false);
      }
    }
  }, [isLinkPopoverOpen, editor]);

  if (!editor) {
    return null;
  }

  const getHeadingLevel = (): number | "P" => {
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive("heading", { level: i })) {
        return i;
      }
    }
    return "P";
  };

  const currentHeading = getHeadingLevel();

  return (
    <div className="flex items-center gap-1 p-2 border-b border-neutral-700">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-36 justify-start text-left font-normal cursor-pointer hover:bg-neutral-700"
          >
            <span className="flex-1 truncate">
              {currentHeading === "P" ? "Normal Text" : `Heading ${currentHeading}`}
            </span>
            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-neutral-900/90 backdrop-blur-sm border-neutral-700" align="start">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={cn("cursor-pointer hover:bg-neutral-700/50", {
              "bg-neutral-700": editor.isActive("paragraph"),
            })}
          >
            Normal Text
          </DropdownMenuItem>
          {[1, 2, 3].map((level) => {
            const headingClasses = {
              1: "text-lg font-bold",
              2: "text-base font-semibold",
              3: "text-sm font-medium",
            }[level];
            return (
              <DropdownMenuItem
                key={level}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .toggleHeading({ level: level as any })
                    .run()
                }
                className={cn("cursor-pointer hover:bg-neutral-700/50", {
                  "bg-neutral-700": editor.isActive("heading", { level }),
                })}
              >
                <span className={headingClasses}>{`Heading ${level}`}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" className="h-8" />
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        className="cursor-pointer hover:bg-neutral-700"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        className="cursor-pointer hover:bg-neutral-700"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8" />
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        className="cursor-pointer hover:bg-neutral-700"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        className="cursor-pointer hover:bg-neutral-700"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8" />
      <Popover open={isLinkPopoverOpen} onOpenChange={onLinkPopoverOpenChange}>
        <PopoverTrigger asChild>
          <Toggle size="sm" pressed={editor.isActive("link")} className="cursor-pointer hover:bg-neutral-700">
            <Link className="h-4 w-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2 bg-neutral-800 border border-neutral-700" align="start">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isValid) handleLinkSet();
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-1 rounded-md bg-neutral-900 p-1">
                <Button
                  variant={!isExternal ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={() => setIsExternal(false)}
                >
                  Internal
                </Button>
                <Button
                  variant={isExternal ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onClick={() => setIsExternal(true)}
                >
                  External
                </Button>
              </div>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  id="link-url"
                  type="text"
                  placeholder={isExternal ? "https://example.com" : "/page-path"}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex justify-end gap-2">
                {editor.isActive("link") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:bg-red-400/10 hover:text-red-400"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      onLinkPopoverOpenChange(false);
                    }}
                  >
                    <Unlink className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                )}
                <Button size="sm" type="submit" disabled={!isValid}>
                  {editor.isActive("link") ? "Update Link" : "Set Link"}
                </Button>
              </div>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  );
};
