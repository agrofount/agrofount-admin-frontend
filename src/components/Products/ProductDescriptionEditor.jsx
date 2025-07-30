import { ContentState, EditorState, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "html-to-draftjs";
import { useEffect, useState } from "react";

const DescriptionEditor = ({ description, setDescription }) => {
  const [editor, setEditor] = useState(() => {
    if (description) {
      const blocksFromHtml = htmlToDraft(description);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHtml.contentBlocks || []
      );
      return EditorState.createWithContent(contentState);
    } else {
      return EditorState.createEmpty();
    }
  });

  const onEditorStateChange = (editorState) => {
    setEditor(editorState);
    const html = draftToHtml(convertToRaw(editorState.getCurrentContent()));

    if (html !== description) {
      setDescription(html);
    }
  };

  useEffect(() => {
    const currentContent = draftToHtml(
      convertToRaw(editor.getCurrentContent())
    );

    // Only update editor state if description really changed
    if (description && description !== currentContent) {
      const blocksFromHtml = htmlToDraft(description);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHtml.contentBlocks || []
      );
      setEditor(EditorState.createWithContent(contentState));
    } else if (!description && currentContent !== "") {
      setEditor(EditorState.createEmpty());
    }
  }, [description, editor]);
  return (
    <div>
      <Editor
        editorState={editor}
        wrapperClassName="wrapper-class"
        editorClassName="editor-class"
        toolbarClassName="toolbar-class"
        onEditorStateChange={onEditorStateChange}
      />
    </div>
  );
};

export default DescriptionEditor;
