import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import '@uiw/react-md-editor/markdown-editor.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  height?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  label,
  required = false,
  height = 200,
}: MarkdownEditorProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div data-color-mode="light">
        <textarea
          className="w-full border rounded p-2"
          style={{ minHeight: `${height}px` }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

// Markdown 预览组件
interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  // 预处理：将普通换行转换为 Markdown 兼容的换行（空行表示段落分隔）
  const processedContent = content.replace(/\n/g, '  \n');

  return (
    <div className="prose max-w-none preview-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

// Markdown 查看器（用于详情页）
interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  if (!content) {
    return <span className="text-gray-400">暂无内容</span>;
  }

  return (
    <div className="markdown-body p-4 bg-gray-50 rounded">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Markdown 内联查看器（用于列表等紧凑场景）
interface MarkdownInlineProps {
  content: string;
}

export function MarkdownInline({ content }: MarkdownInlineProps) {
  if (!content) {
    return <span className="text-gray-400">暂无内容</span>;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {content}
    </ReactMarkdown>
  );
}
