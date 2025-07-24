import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import History from "@tiptap/extension-history";
import Placeholder from "@tiptap/extension-placeholder";
import { DescriptionBubbleMenu } from "./DescriptionBubbleMenu";

interface EditableDescriptionProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const EditableDescription: React.FC<EditableDescriptionProps> = ({ value, onChange, disabled }) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: "text-lg text-neutral-400",
        },
      }),
      Text,
      Bold,
      Italic,
      History,
      Placeholder.configure({
        placeholder: "Wpisz opis...",
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
      const isSame = editor.getHTML() === `<p class="text-lg text-neutral-400">${value}</p>`;
      if (!isSame) {
        editor.commands.setContent(value);
      }
      editor.setEditable(!disabled);
    }
  }, [value, disabled, editor]);

  return (
    <>
      {editor && <DescriptionBubbleMenu editor={editor} />}
      <EditorContent editor={editor} />
    </>
  );
};

export default EditableDescription;
