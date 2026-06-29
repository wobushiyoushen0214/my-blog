"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  ImageIcon,
  LinkIcon,
  CodeSquare,
  Minus,
  Loader2,
} from "lucide-react";

const lowlight = createLowlight(common);
const toolbarButtonClass =
  "h-8 w-8 rounded-none border border-border/60 data-[variant=ghost]:bg-background/60 data-[variant=secondary]:border-primary/40 data-[variant=secondary]:bg-primary/10 data-[variant=secondary]:text-primary";
const toolbarSeparatorClass = "mx-1 h-8 w-px bg-border/70";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "开始撰写你的文章...",
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none min-h-[400px] p-4 focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  // Sync content updates from parent if changed externally (e.g. async fetch)
  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      // Avoid re-rendering if content is effectively the same to prevent cursor jumps
      // A simple check is usually enough, but here we just check if it's different
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过 5MB");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `post-images/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      editor.chain().focus().setImage({ src: publicUrl }).run();
      toast.success("图片上传成功");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("图片上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const openLinkEditor = () => {
    const currentUrl = editor.getAttributes("link").href || "";
    setLinkUrl(currentUrl);
    setLinkEditorOpen(true);
  };

  const closeLinkEditor = () => {
    setLinkEditorOpen(false);
    setLinkUrl("");
  };

  const applyLink = () => {
    const url = linkUrl.trim();

    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      closeLinkEditor();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    closeLinkEditor();
  };

  return (
    <div className="border bg-card">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
      />
      <div className="flex flex-wrap gap-1 border-b bg-background p-2">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          className={toolbarButtonClass}
          aria-label="加粗"
          title="加粗"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          className={toolbarButtonClass}
          aria-label="斜体"
          title="斜体"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="icon"
          className={toolbarButtonClass}
          aria-label="删除线"
          title="删除线"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("code") ? "secondary" : "ghost"}
          size="icon"
          className={toolbarButtonClass}
          aria-label="行内代码"
          title="行内代码"
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className={toolbarSeparatorClass} />
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"
          }
          size="icon"
          className={toolbarButtonClass}
          aria-label="一级标题"
          title="一级标题"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
          }
          size="icon"
          className={toolbarButtonClass}
          aria-label="二级标题"
          title="二级标题"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
          }
          size="icon"
          className={toolbarButtonClass}
          aria-label="三级标题"
          title="三级标题"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className={toolbarSeparatorClass} />
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon"
          className={toolbarButtonClass}
          aria-label="无序列表"
          title="无序列表"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon"
          className={toolbarButtonClass}
          aria-label="有序列表"
          title="有序列表"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="icon"
          className={toolbarButtonClass}
          aria-label="引用"
          title="引用"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
          size="icon"
          className={toolbarButtonClass}
          aria-label="代码块"
          title="代码块"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <CodeSquare className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarButtonClass}
          aria-label="分割线"
          title="分割线"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className={toolbarSeparatorClass} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarButtonClass}
          aria-label={uploading ? "正在上传图片" : "上传图片"}
          title={uploading ? "正在上传图片" : "上传图片"}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="icon"
          className={toolbarButtonClass}
          aria-label={editor.isActive("link") ? "编辑链接" : "插入链接"}
          title={editor.isActive("link") ? "编辑链接" : "插入链接"}
          onClick={openLinkEditor}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        {linkEditorOpen ? (
          <div className="flex min-w-[240px] flex-1 items-center gap-1 border border-border/70 bg-background p-1">
            <label htmlFor="editor-link-url" className="sr-only">
              链接 URL
            </label>
            <Input
              id="editor-link-url"
              type="url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  closeLinkEditor();
                }
              }}
              placeholder="https://example.com"
              className="h-8 border-border/60 bg-background text-sm"
              autoFocus
            />
            <Button type="button" size="xs" onClick={applyLink}>
              应用
            </Button>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={closeLinkEditor}
            >
              取消
            </Button>
          </div>
        ) : null}
        <div className={toolbarSeparatorClass} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarButtonClass}
          aria-label="撤销"
          title="撤销"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={toolbarButtonClass}
          aria-label="重做"
          title="重做"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
