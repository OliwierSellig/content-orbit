import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import { TitleBubbleMenu } from "./TitleBubbleMenu";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const EditableTitle: React.FC<EditableTitleProps> = ({ value, onChange, disabled }) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: "text-4xl font-bold text-white",
        },
      }),
      Text,
      Bold,
      Italic,
      History,
      Placeholder.configure({
        placeholder: "Wpisz tytuł...",
        emptyNodeClass: "is-editor-empty",
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const firstNodeHtml = editor.view.dom.querySelector("p")?.innerHTML || "";
      onChange(firstNodeHtml);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor) {
      const isSame = editor.getHTML() === `<p class="text-4xl font-bold text-white">${value}</p>`;
      if (!isSame) {
        editor.commands.setContent(value);
      }
      editor.setEditable(!disabled);
    }
  }, [value, disabled, editor]);

  return (
    <>
      <TitleBubbleMenu editor={editor} />
      <EditorContent editor={editor} className="mb-4" />
    </>
  );
};

export default EditableTitle;
