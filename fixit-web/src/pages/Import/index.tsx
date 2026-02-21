// pages/Import/index.tsx
// 录入题目页面 - "禅意·秩序" 设计风格

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, message } from 'antd';
import { MarkdownPreview } from '../../components/MarkdownEditor';
import { questionApi, CreateQuestionParams } from '../../api/question';
import { fileApi } from '../../api/file';
import { aiApi } from '../../api/ai';
import { tagApi, Tag } from '../../api/tag';
import { findMatchingSubject } from '../../utils/string-matching';
import styles from './Import.module.css';

// ===== Types =====

interface ImportPageProps {
  readonly mode?: 'create' | 'edit';
}

// ===== Sub-components =====

function ProgressIndicator({
  steps,
}: {
  readonly steps: ReadonlyArray<{
    readonly label: string;
    readonly filled: boolean;
  }>;
}) {
  return (
    <div className={styles.progressBar}>
      {steps.map((step, idx) => (
        <div key={step.label} className={styles.progressStep}>
          <div
            className={`${styles.progressDot} ${step.filled ? styles.completed : ''} ${
              !step.filled && idx === steps.findIndex((s) => !s.filled) ? styles.active : ''
            }`}
          />
          <span
            className={`${styles.progressLabel} ${step.filled ? styles.completed : ''} ${
              !step.filled && idx === steps.findIndex((s) => !s.filled) ? styles.active : ''
            }`}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div className={`${styles.progressLine} ${step.filled ? styles.completed : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SubjectSelector({
  value,
  onChange,
  usedSubjects = [],
  aiDetected = false,
  isNewSubject = false,
}: {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly usedSubjects?: ReadonlyArray<string>;
  readonly aiDetected?: boolean;
  readonly isNewSubject?: boolean;
}) {
  const [customMode, setCustomMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCustomClick = useCallback(() => {
    setCustomMode(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleCustomConfirm = useCallback(
    (val: string) => {
      const trimmed = val.trim();
      if (trimmed) {
        onChange(trimmed);
      }
      setCustomMode(false);
    },
    [onChange],
  );

  // 当选择已有学科时，添加选中样式
  const isExistingSubject = usedSubjects.some(
    (s) => s.toLowerCase() === value.toLowerCase(),
  );

  return (
    <div className={styles.subjectSelector}>
      {/* 已有学科列表 */}
      {usedSubjects.map((subj) => (
        <button
          key={subj}
          type="button"
          className={`${styles.subjectPill} ${value.toLowerCase() === subj.toLowerCase() ? styles.selected : ''} ${aiDetected && value.toLowerCase() === subj.toLowerCase() ? styles.aiDetected : ''}`}
          onClick={() => onChange(value.toLowerCase() === subj.toLowerCase() ? '' : subj)}
        >
          {aiDetected && value.toLowerCase() === subj.toLowerCase() && (
            <span className={styles.aiBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </span>
          )}
          {subj}
        </button>
      ))}

      {/* 自定义输入 */}
      {customMode ? (
        <div
          className={`${styles.subjectPill} ${!isExistingSubject && value ? styles.selected : ''}`}
        >
          <input
            ref={inputRef}
            className={styles.subjectInputInline}
            placeholder="输入学科"
            defaultValue={!isExistingSubject ? value : ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCustomConfirm((e.target as HTMLInputElement).value);
              }
              if (e.key === 'Escape') {
                setCustomMode(false);
              }
            }}
            onBlur={(e) => handleCustomConfirm(e.target.value)}
          />
        </div>
      ) : (
        <button
          type="button"
          className={styles.subjectCustomInput}
          onClick={handleCustomClick}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>自定义</span>
        </button>
      )}

      {/* 新学科标识 */}
      {!isExistingSubject && value && !customMode && (
        <span className={`${styles.subjectPill} ${styles.selected} ${isNewSubject ? styles.aiNewLabel : ''}`}>
          {aiDetected && (
            <span className={styles.aiBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </span>
          )}
          {value}
          {isNewSubject && <span className={styles.aiNewLabel}> 新</span>}
        </span>
      )}

      {/* 暂无数据提示 */}
      {usedSubjects.length === 0 && !customMode && !value && (
        <span className={styles.subjectEmptyHint}>暂无历史学科，请选择"自定义"添加</span>
      )}
    </div>
  );
}

function EditorArea({
  value,
  onChange,
  placeholder,
  minHeight = 120,
  uploadTarget,
  onAiRecognize,
  onUploadImage,
  onInsertImage,
  aiRecognizing,
}: {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly placeholder: string;
  readonly minHeight?: number;
  readonly uploadTarget?: 'content' | 'answer' | 'analysis' | null;
  readonly onAiRecognize?: () => void;
  readonly onUploadImage?: () => void;
  readonly onInsertImage?: (url: string, filename: string, target?: 'content' | 'answer' | 'analysis') => void;
  readonly aiRecognizing?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end);
      const replacement = `${prefix}${selected}${suffix}`;
      const newValue = value.slice(0, start) + replacement + value.slice(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + prefix.length + selected.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, onChange],
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          if (file.size > 5 * 1024 * 1024) {
            message.warning('图片大小不能超过 5MB');
            return;
          }

          if (onInsertImage && uploadTarget) {
            // 上传图片并插入到编辑器
            try {
              const formData = new FormData();
              formData.append('file', file);

              const response = await fetch('/api/files/upload', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                },
                body: formData,
              });

              if (!response.ok) {
                throw new Error('上传失败');
              }

              const data = await response.json();
              onInsertImage?.(data.url, file.name, uploadTarget || 'content');
            } catch {
              message.error('图片上传失败');
            }
          }
          break;
        }
      }
    },
    [onInsertImage, uploadTarget],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (!files.length || !onInsertImage) return;

      const imageFile = files[0];
      if (!imageFile.type.startsWith('image/')) {
        return;
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        // 显示错误（通过全局 message）
        return;
      }

      // 上传图片
      try {
        const formData = new FormData();
        formData.append('file', imageFile);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('上传失败');
        }

        const data = await response.json();
        onInsertImage?.(data.url, imageFile.name, 'content');
      } catch {
        // 上传失败，不做处理
      }
    },
    [onInsertImage],
  );

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.editorToolbar}>
        <button
          type="button"
          className={styles.toolbarBtn}
          title="加粗"
          onClick={() => insertMarkdown('**', '**')}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          title="斜体"
          onClick={() => insertMarkdown('*', '*')}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          title="代码"
          onClick={() => insertMarkdown('`', '`')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.854 4.854a.5.5 0 10-.708-.708l-3.5 3.5a.5.5 0 000 .708l3.5 3.5a.5.5 0 00.708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 01.708-.708l3.5 3.5a.5.5 0 010 .708l-3.5 3.5a.5.5 0 01-.708-.708L13.293 8l-3.147-3.146z"/>
          </svg>
        </button>
        <div className={styles.toolbarDivider} />
        <button
          type="button"
          className={styles.toolbarBtn}
          title="LaTeX 行内公式"
          onClick={() => insertMarkdown('$', '$')}
        >
          <span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '15px' }}>x</span>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          title="LaTeX 块级公式"
          onClick={() => insertMarkdown('\n$$\n', '\n$$\n')}
        >
          <span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '13px' }}>fx</span>
        </button>
        <div className={styles.toolbarDivider} />
        <button
          type="button"
          className={styles.toolbarBtn}
          title="列表"
          onClick={() => insertMarkdown('- ')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M2 4a1 1 0 100-2 1 1 0 000 2zm3.75-1.5a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5zm0 5a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5zm0 5a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5zM3 8a1 1 0 11-2 0 1 1 0 012 0zm-1 5a1 1 0 100-2 1 1 0 000 2z"/>
          </svg>
        </button>
        {uploadTarget && onUploadImage && (
          <>
            <div className={styles.toolbarDivider} />
            {/* AI 识别按钮 - 彩色科技图标 */}
            {onAiRecognize && (
              <button
                type="button"
                className={`${styles.toolbarBtn} ${styles.toolbarBtnAi} ${aiRecognizing ? styles.loading : ''}`}
                title={aiRecognizing ? 'AI 识别中...' : 'AI 智能识别'}
                onClick={onAiRecognize}
                disabled={aiRecognizing}
              >
                {aiRecognizing ? (
                  <span className={styles.aiSpinner} />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  {/* 神经网络节点 */}
                  <circle cx="7" cy="12" r="2.5" fill="#ff6b6b">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="12" cy="7" r="2.5" fill="#4ecdc4">
                    <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" begin="0.3s" />
                  </circle>
                  <circle cx="12" cy="17" r="2.5" fill="#45b7d1">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="0.6s" />
                  </circle>
                  <circle cx="17" cy="12" r="2.5" fill="#96ceb4">
                    <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" begin="0.9s" />
                  </circle>
                  {/* 连接线 */}
                  <line x1="7" y1="12" x2="12" y2="7" stroke="url(#aiGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="3s" repeatCount="indefinite" />
                  </line>
                  <line x1="12" y1="7" x2="17" y2="12" stroke="url(#aiGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
                    <animate attributeName="stroke-dasharray" values="100,0;0,100" dur="3s" repeatCount="indefinite" begin="0.5s" />
                  </line>
                  <line x1="7" y1="12" x2="12" y2="17" stroke="url(#aiGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
                    <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="3s" repeatCount="indefinite" begin="1s" />
                  </line>
                  <line x1="12" y1="17" x2="17" y2="12" stroke="url(#aiGradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
                    <animate attributeName="stroke-dasharray" values="100,0;0,100" dur="3s" repeatCount="indefinite" begin="1.5s" />
                  </line>
                  {/* 中心 AI 核心 */}
                  <circle cx="12" cy="12" r="3" fill="none" stroke="url(#aiGradient)" strokeWidth="1.5">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="12" cy="12" r="1.5" fill="#ffe66d">
                    <animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite" />
                  </circle>
                  <defs>
                    <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff6b6b" />
                      <stop offset="50%" stopColor="#4ecdc4" />
                      <stop offset="100%" stopColor="#ffe66d" />
                    </linearGradient>
                  </defs>
                </svg>
                )}
              </button>
            )}
            {/* 直接上传图片按钮 */}
            <button
              type="button"
              className={styles.toolbarBtn}
              title="上传图片"
              onClick={onUploadImage}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
          </>
        )}
      </div>
      <textarea
        ref={textareaRef}
        className={`${styles.editorTextarea} ${isDragging ? styles.editorTextareaDragging : ''}`}
        style={{ minHeight: `${minHeight}px` }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onPaste={handlePaste}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
      <div className={styles.editorFooter}>
        <span className={styles.editorHint}>支持 Markdown 和 LaTeX</span>
        <span className={styles.charCount}>{value.length} 字符</span>
      </div>
    </div>
  );
}

function TagSelector({
  allTags,
  selectedTags,
  onToggle,
}: {
  readonly allTags: ReadonlyArray<Tag>;
  readonly selectedTags: ReadonlyArray<string>;
  readonly onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<ReadonlyArray<Tag>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 搜索匹配
  useEffect(() => {
    if (!search.trim()) {
      setSuggestedTags([]);
      return;
    }
    const lower = search.toLowerCase();
    const matched = allTags.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) && !selectedTags.includes(t.id),
    );
    setSuggestedTags(matched.slice(0, 5));
  }, [search, allTags, selectedTags]);

  // 键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const trimmed = search.trim();
        if (!trimmed) return;

        // 检查是否已选
        const existing = allTags.find(
          (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (existing) {
          onToggle(existing.id);
        } else {
          // 新标签，添加到 selectedTags（使用特殊前缀标记）
          onToggle(`__new__:${trimmed}`);
        }
        setSearch('');
      }
    },
    [search, allTags, selectedTags, onToggle],
  );

  // 点击建议的标签
  const handleSuggestClick = useCallback(
    (tag: Tag) => {
      onToggle(tag.id);
      setSearch('');
    },
    [onToggle],
  );

  // 获取选中的标签名称列表（包含自定义标签）
  const selectedTagInfo = useMemo(() => {
    return selectedTags.map((id) => {
      if (id.startsWith('__new__:')) {
        return { id, name: id.slice(8), isNew: true };
      }
      const tag = allTags.find((t) => t.id === id);
      return { id, name: tag?.name || id, isNew: false };
    });
  }, [selectedTags, allTags]);

  return (
    <div className={styles.tagSelector}>
      {/* 搜索输入 */}
      <div className={styles.tagSearchWrapper}>
        <svg
          className={styles.tagSearchIcon}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className={styles.tagSearchInput}
          placeholder="输入标签名，按回车添加"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* 建议列表 */}
      {suggestedTags.length > 0 && (
        <div className={styles.tagSuggestions}>
          {suggestedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={styles.tagSuggestionItem}
              onClick={() => handleSuggestClick(tag)}
            >
              <span
                className={styles.tagDot}
                style={{ background: tag.color || 'var(--fi-primary-500)' }}
              />
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* 已添加的标签 */}
      {selectedTagInfo.length > 0 && (
        <div className={styles.tagSelectedList}>
          {selectedTagInfo.map(({ id, name, isNew }) => (
            <button
              key={id}
              type="button"
              className={`${styles.tag} ${isNew ? styles.tagNew : ''}`}
              onClick={() => onToggle(id)}
            >
              <span
                className={styles.tagDot}
                style={{
                  background: isNew
                    ? 'var(--import-text-tertiary)'
                    : 'var(--fi-primary-500)',
                }}
              />
              {name}
              <svg
                className={styles.tagRemoveIcon}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* 已有标签快捷选择 */}
      {selectedTagInfo.length === 0 && allTags.length > 0 && (
        <div className={styles.tagQuickSelect}>
          <span className={styles.tagQuickLabel}>快捷选择：</span>
          <div className={styles.tagQuickList}>
            {allTags.slice(0, 8).map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={styles.tagQuickItem}
                onClick={() => onToggle(tag.id)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewPanel({
  subject,
  content,
  answer,
  analysis,
  remark,
  selectedTags,
  allTags,
}: {
  readonly subject: string;
  readonly content: string;
  readonly answer: string;
  readonly analysis: string;
  readonly remark: string;
  readonly selectedTags: ReadonlyArray<string>;
  readonly allTags: ReadonlyArray<Tag>;
}) {
  const hasContent = subject || content || answer;
  const tagNames = useMemo(
    () => allTags.filter((t) => selectedTags.includes(t.id)).map((t) => t.name),
    [allTags, selectedTags],
  );

  return (
    <div className={styles.previewPanel}>
      <div className={styles.previewHeader}>
        <span className={styles.previewTitle}>Preview</span>
      </div>

      {!hasContent ? (
        <div className={styles.previewEmpty}>
          <div className={styles.previewEmptyIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className={styles.previewEmptyText}>
            在左侧填写内容<br />这里将实时预览效果
          </p>
        </div>
      ) : (
        <div className={styles.previewContent}>
          {/* Subject & Tags */}
          {subject && (
            <div className={styles.previewBlock}>
              <div className={styles.previewSubject}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                </svg>
                {subject}
              </div>
              {tagNames.length > 0 && (
                <div className={styles.previewTags}>
                  {tagNames.map((name) => (
                    <span key={name} className={styles.previewTag}>{name}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          {content && (
            <div className={styles.previewBlock}>
              <div className={styles.previewBlockLabel}>
                <span className={styles.previewBlockLabelDot} />
                题目内容
              </div>
              <div className={styles.previewBlockContent}>
                <MarkdownPreview content={content} />
              </div>
            </div>
          )}

          {content && answer && <div className={styles.previewDivider} />}

          {/* Answer */}
          {answer && (
            <div className={styles.previewBlock}>
              <div className={styles.previewBlockLabel}>
                <span className={styles.previewBlockLabelDot} />
                答案
              </div>
              <div className={styles.previewBlockContent}>
                <MarkdownPreview content={answer} />
              </div>
            </div>
          )}

          {/* Analysis */}
          {analysis && (
            <>
              <div className={styles.previewDivider} />
              <div className={styles.previewBlock}>
                <div className={styles.previewBlockLabel}>
                  <span className={styles.previewBlockLabelDot} />
                  解析
                </div>
                <div className={styles.previewBlockContent}>
                  <MarkdownPreview content={analysis} />
                </div>
              </div>
            </>
          )}

          {/* Remark */}
          {remark && (
            <>
              <div className={styles.previewDivider} />
              <div className={styles.previewBlock}>
                <div className={styles.previewBlockLabel}>
                  <span className={styles.previewBlockLabelDot} style={{ background: 'var(--fi-primary, #ff6b6b)' }} />
                  备注
                </div>
                <div className={styles.previewBlockContent}>
                  <MarkdownPreview content={remark} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Main Component =====

export default function ImportPage({ mode = 'create' }: ImportPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Form state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [remark, setRemark] = useState('');

  // Tag state
  const [allTags, setAllTags] = useState<ReadonlyArray<Tag>>([]);
  const [selectedTags, setSelectedTags] = useState<ReadonlyArray<string>>([]);

  // Subject state
  const [usedSubjects, setUsedSubjects] = useState<ReadonlyArray<string>>([]);

  // AI detection state
  const [aiDetectedSubject, setAiDetectedSubject] = useState<string | null>(null);
  const [isAiDetected, setIsAiDetected] = useState(false);
  const [isNewSubject, setIsNewSubject] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(mode === 'edit');
  const [aiRecognizing, setAiRecognizing] = useState(false);

  // Fetch tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await tagApi.list();
        setAllTags(res.data);
      } catch {
        // silently fail - tags are optional
      }
    };
    fetchTags();
  }, []);

  // Fetch used subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await questionApi.getSubjects();
        setUsedSubjects(res.data);
      } catch {
        // silently fail - subjects are optional
      }
    };
    fetchSubjects();
  }, []);

  // Fetch question data in edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      const fetchQuestion = async () => {
        setInitialLoading(true);
        try {
          const res = await questionApi.get(id);
          const question = res.data;
          setSubject(question.subject);
          setContent(question.content);
          setAnswer(question.answer);
          setAnalysis(question.analysis || '');
          if (question.tags) {
            setSelectedTags(question.tags.map((t) => t.tag.id));
          }
          // 确保编辑时当前学科在列表中（如果不在则添加）
          setUsedSubjects((prev) => {
            if (!prev.includes(question.subject)) {
              return [question.subject, ...prev];
            }
            return prev;
          });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          message.error(err.response?.data?.message || '获取题目失败');
          navigate('/questions');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchQuestion();
    }
  }, [mode, id, navigate]);

  // Image upload handler
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<'content' | 'answer' | 'analysis' | null>(null);
  const [uploadMode, setUploadMode] = useState<'ai' | 'direct' | 'ai-all'>('ai');

  // AI 识别上传（单字段）
  const handleAiRecognize = useCallback((target: 'content' | 'answer' | 'analysis') => {
    setUploadMode('ai');
    setUploadTarget(target);
    fileInputRef.current?.click();
  }, []);

  // AI 一键识别上传（全部字段）
  const handleAiRecognizeAll = useCallback(() => {
    setUploadMode('ai-all');
    setUploadTarget('content');
    fileInputRef.current?.click();
  }, []);

  // 直接上传图片（不进行 AI 识别）
  const handleDirectUpload = useCallback((target: 'content' | 'answer' | 'analysis') => {
    setUploadMode('direct');
    setUploadTarget(target);
    fileInputRef.current?.click();
  }, []);

  // Insert image directly into editor field (without AI recognition)
  const handleInsertImage = useCallback(
    async (url: string, filename: string, target: 'content' | 'answer' | 'analysis') => {
      const markdownImage = `\n![${filename}](${url})\n`;

      if (target === 'content') {
        setContent(prev => `${prev}${markdownImage}`);
      } else if (target === 'answer') {
        setAnswer(prev => `${prev}${markdownImage}`);
      } else if (target === 'analysis') {
        setAnalysis(prev => `${prev}${markdownImage}`);
      }
    },
    [],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !uploadTarget) return;

      const fileList = Array.from(files);

      // 验证所有文件
      for (const file of fileList) {
        if (!file.type.startsWith('image/')) {
          message.warning('请选择图片文件');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          message.warning(`图片 ${file.name} 大小不能超过 5MB`);
          return;
        }
      }

      // 处理文件上传和识别
      try {
        const uploadedImages: Array<{ url: string; key: string; name: string }> = [];
        const base64Images: string[] = [];

        for (const file of fileList) {
          // Convert to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          if (!base64) {
            message.error(`图片 ${file.name} 读取失败`);
            continue;
          }

          // Upload to MinIO
          const uploadResult = await fileApi.upload(file);
          uploadedImages.push({
            url: uploadResult.data.url,
            key: uploadResult.data.key,
            name: file.name,
          });
          base64Images.push(base64);
        }

        // 根据上传模式处理
        if (uploadMode === 'direct') {
          // 直接上传模式：只插入图片，不进行 AI 识别
          for (let i = 0; i < uploadedImages.length; i++) {
            const img = uploadedImages[i];
            const markdownImage = `\n![${img.name}](${img.url})\n`;
            if (uploadTarget === 'content') {
              setContent(prev => `${prev}${markdownImage}`);
            } else if (uploadTarget === 'answer') {
              setAnswer(prev => `${prev}${markdownImage}`);
            } else if (uploadTarget === 'analysis') {
              setAnalysis(prev => `${prev}${markdownImage}`);
            }
          }
          message.success(`图片上传成功 (${uploadedImages.length} 张)`);
        } else if (uploadMode === 'ai-all') {
          // AI 一键识别模式：多张图片一起识别
          setAiRecognizing(true);
          try {
            const recognizeResult = await aiApi.recognizeQuestion({
              images: base64Images,
              instruction: '请完整识别图片中的题目内容、答案和解析',
            });

            // Handle AI-detected subject
            if (recognizeResult.data.subject) {
              const detectedSubject = recognizeResult.data.subject.trim();
              const matchedSubject = findMatchingSubject(detectedSubject, usedSubjects);

              if (matchedSubject) {
                // Found matching subject in existing list
                setSubject(matchedSubject);
                setIsAiDetected(true);
                setAiDetectedSubject(detectedSubject);
                setIsNewSubject(false);
                message.success(`题目识别成功，已自动识别学科：${matchedSubject}`);
              } else {
                // New subject - add to usedSubjects and mark as new
                setSubject(detectedSubject);
                setIsAiDetected(true);
                setAiDetectedSubject(detectedSubject);
                setIsNewSubject(true);
                setUsedSubjects(prev => [detectedSubject, ...prev]);
                message.success(`题目识别成功，已识别新学科：${detectedSubject}`);
              }
            } else {
              message.success('题目识别成功');
            }

            if (recognizeResult.data.content) {
              setContent(recognizeResult.data.content);
            }
            if (recognizeResult.data.answer) {
              setAnswer(recognizeResult.data.answer);
            }
            if (recognizeResult.data.analysis) {
              setAnalysis(recognizeResult.data.analysis);
            }
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || 'AI 识别失败');
          } finally {
            setAiRecognizing(false);
          }
        } else {
          // AI 单字段识别模式
          setAiRecognizing(true);
          try {
            let recognizeResult;
            if (uploadTarget === 'content') {
              recognizeResult = await aiApi.recognizeQuestion({
                images: base64Images,
                instruction: '请识别图片中的题目内容',
              });
              if (recognizeResult.data.content) {
                setContent(recognizeResult.data.content);
              }
              if (recognizeResult.data.answer) {
                setAnswer(recognizeResult.data.answer);
              }
              if (recognizeResult.data.analysis) {
                setAnalysis(recognizeResult.data.analysis);
              }
              message.success('题目识别成功');
            } else if (uploadTarget === 'answer') {
              recognizeResult = await aiApi.recognizeQuestion({
                images: base64Images,
                instruction: '请识别图片中的答案',
              });
              if (recognizeResult.data.answer) {
                setAnswer(recognizeResult.data.answer);
              }
              message.success('答案识别成功');
            } else if (uploadTarget === 'analysis') {
              recognizeResult = await aiApi.recognizeQuestion({
                images: base64Images,
                instruction: '请识别图片中的解析',
              });
              if (recognizeResult.data.analysis) {
                setAnalysis(recognizeResult.data.analysis);
              }
              message.success('解析识别成功');
            }
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            message.error(err.response?.data?.message || 'AI 识别失败');
          } finally {
            setAiRecognizing(false);
          }
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        message.error(err.response?.data?.message || '处理失败');
      } finally {
        setUploadTarget(null);
        setUploadMode('ai');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [uploadTarget, uploadMode],
  );

  // Tag handler
  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }, []);

  // Subject change handler - clears AI detection on manual override
  const handleSubjectChange = useCallback((newSubject: string) => {
    setSubject(newSubject);
    setIsAiDetected(false);
    setAiDetectedSubject(null);
    setIsNewSubject(false);
  }, []);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!subject || !content || !answer) return;

    setSubmitting(true);
    try {
      // Step 1: Separate existing tags from new tags
      const existingTagNames: string[] = [];
      const newTagNames: string[] = [];
      const createdTagIds: string[] = [];

      for (const id of selectedTags) {
        if (id.startsWith('__new__:')) {
          // 新标签
          newTagNames.push(id.slice(8));
        } else {
          // 已有标签，获取名称
          const tag = allTags.find((t) => t.id === id);
          if (tag) {
            existingTagNames.push(tag.name);
          }
        }
      }

      // Step 2: Create new tags first
      if (newTagNames.length > 0) {
        for (const name of newTagNames) {
          try {
            const res = await tagApi.create({ name, category: '自定义' });
            createdTagIds.push(res.data.id);
            // Update local tags list
            setAllTags((prev) => [res.data, ...prev]);
          } catch {
            // Ignore errors for duplicate tags
          }
        }
      }

      // Step 3: Build submit data with all tag names
      const allTagNames = [...existingTagNames, ...newTagNames];
      const submitData: CreateQuestionParams = {
        subject,
        content,
        answer,
        analysis: analysis || undefined,
        remark: remark || undefined,
        tags: allTagNames.length > 0 ? allTagNames : undefined,
      };

      if (mode === 'create') {
        await questionApi.create(submitData);
        message.success('题目录入成功');
      } else if (id) {
        await questionApi.update(id, submitData);
        message.success('更新成功');
      }

      navigate('/questions');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(
        err.response?.data?.message || (mode === 'create' ? '录入失败' : '更新失败'),
      );
    } finally {
      setSubmitting(false);
    }
  }, [subject, content, answer, analysis, remark, selectedTags, allTags, mode, id, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/questions');
  }, [navigate]);

  // Progress steps
  const progressSteps = useMemo(
    () => [
      { label: '学科', filled: !!subject },
      { label: '题目', filled: !!content },
      { label: '答案', filled: !!answer },
      { label: '完成', filled: !!subject && !!content && !!answer },
    ],
    [subject, content, answer],
  );

  const canSubmit = !!subject && !!content && !!answer;

  if (initialLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitle}>加载中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className={styles.hidden}
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      {/* Hidden form for antd validation compatibility */}
      <Form form={form} className={styles.hidden}>
        <Form.Item name="subject"><input /></Form.Item>
      </Form>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.backButton}
            onClick={handleCancel}
            aria-label="返回"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className={styles.headerTitle}>
              {mode === 'create' ? '录入新题目' : '编辑题目'}
            </h1>
            <p className={styles.headerSubtitle}>
              {mode === 'create'
                ? '将错题转化为可复习的知识卡片'
                : '修改题目内容和答案'}
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.submitBtn}
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <span className={styles.aiSpinner} />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{mode === 'create' ? '保存题目' : '保存修改'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress */}
      <ProgressIndicator steps={progressSteps} />

      {/* Main Layout: Editor + Preview */}
      <div className={styles.mainLayout}>
        {/* Left: Editor */}
        <div className={styles.editorPanel}>
          {/* Subject */}
          <div className={styles.section}>
            <div className={`${styles.sectionLabel} ${styles.sectionRequired}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
              学科
            </div>
            <SubjectSelector
              value={subject}
              onChange={handleSubjectChange}
              usedSubjects={usedSubjects}
              aiDetected={isAiDetected}
              isNewSubject={isNewSubject}
            />
          </div>

          {/* Content */}
          <div className={styles.section}>
            <div className={`${styles.sectionLabel} ${styles.sectionRequired}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              题目内容
            </div>
            {/* AI 一键识别按钮 */}
            <div className={styles.aiQuickActions}>
              <button
                type="button"
                className={`${styles.aiQuickBtn} ${aiRecognizing ? styles.loading : ''}`}
                onClick={handleAiRecognizeAll}
                disabled={aiRecognizing}
              >
                {aiRecognizing ? (
                  <>
                    <span className={styles.aiSpinner} />
                    <span>AI 识别中...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" strokeLinejoin="round" />
                      <path d="M2 17l10 5 10-5" strokeLinejoin="round" />
                      <path d="M2 12l10 5 10-5" strokeLinejoin="round" />
                    </svg>
                    <span>AI 一键识别全部</span>
                  </>
                )}
              </button>
              <span className={styles.aiQuickHint}>上传图片自动识别题目、答案和解析</span>
            </div>
            <EditorArea
              value={content}
              onChange={setContent}
              placeholder="点击工具栏的图片图标上传图片，自动识别题目内容；也可直接粘贴或拖拽图片"
              minHeight={160}
              uploadTarget="content"
              onAiRecognize={() => handleAiRecognize('content')}
              onUploadImage={() => handleDirectUpload('content')}
              onInsertImage={(url, filename) => handleInsertImage(url, filename, 'content')}
              aiRecognizing={aiRecognizing}
            />
          </div>

          {/* Answer */}
          <div className={styles.section}>
            <div className={`${styles.sectionLabel} ${styles.sectionRequired}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              答案
            </div>
            <EditorArea
              value={answer}
              onChange={setAnswer}
              placeholder="点击工具栏的图片图标上传图片，自动识别答案；也可直接粘贴或拖拽图片"
              minHeight={120}
              uploadTarget="answer"
              onAiRecognize={() => handleAiRecognize('answer')}
              onUploadImage={() => handleDirectUpload('answer')}
              onInsertImage={(url, filename) => handleInsertImage(url, filename, 'answer')}
              aiRecognizing={aiRecognizing}
            />
          </div>

          {/* Analysis */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              解析（可选）
            </div>
            <EditorArea
              value={analysis}
              onChange={setAnalysis}
              placeholder="点击工具栏的图片图标上传图片，自动识别解析；也可直接粘贴或拖拽图片"
              minHeight={100}
              uploadTarget="analysis"
              onAiRecognize={() => handleAiRecognize('analysis')}
              onUploadImage={() => handleDirectUpload('analysis')}
              onInsertImage={(url, filename) => handleInsertImage(url, filename, 'analysis')}
              aiRecognizing={aiRecognizing}
            />
          </div>

          {/* Tags */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              标签
            </div>
            <TagSelector
              allTags={allTags as Tag[]}
              selectedTags={selectedTags}
              onToggle={handleTagToggle}
            />
          </div>

          {/* Remark */}
          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              备注（可选）
            </div>
            <EditorArea
              value={remark}
              onChange={setRemark}
              placeholder="记录这道题的易错点、个人理解等..."
              minHeight={80}
            />
          </div>
        </div>

        {/* Right: Preview */}
        <PreviewPanel
          subject={subject}
          content={content}
          answer={answer}
          analysis={analysis}
          remark={remark}
          selectedTags={selectedTags}
          allTags={allTags}
        />
      </div>

      {/* Bottom Submit Bar */}
      <div className={styles.submitSection}>
        <div className={styles.submitInfo}>
          <div className={styles.submitInfoItem}>
            <span className={`${styles.submitInfoDot} ${subject ? styles.filled : ''}`} />
            <span>学科</span>
          </div>
          <div className={styles.submitInfoItem}>
            <span className={`${styles.submitInfoDot} ${content ? styles.filled : ''}`} />
            <span>题目</span>
          </div>
          <div className={styles.submitInfoItem}>
            <span className={`${styles.submitInfoDot} ${answer ? styles.filled : ''}`} />
            <span>答案</span>
          </div>
        </div>
        <div className={styles.submitActions}>
          <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
            取消
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <span className={styles.aiSpinner} />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{mode === 'create' ? '保存题目' : '保存修改'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
