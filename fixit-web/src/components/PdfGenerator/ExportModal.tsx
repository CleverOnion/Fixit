// components/PdfGenerator/ExportModal.tsx
// PDF 导出弹窗 - 前端直接生成 PDF

import { useState, useCallback, useMemo } from 'react';
import { Modal, Checkbox, Button, message, Divider, Space, Progress } from 'antd';
import { DownloadOutlined, FilePdfOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Question } from '../../api/question';
import styles from './ExportModal.module.css';

interface ExportModalProps {
  open: boolean;
  onCancel: () => void;
  questions: Question[];
}

interface ExportState {
  exporting: boolean;
  progress: number;
}

// types for html2pdf.js extended options
interface ExtendedHtml2PdfOptions {
  margin?: number | [number, number] | [number, number, number, number];
  filename?: string;
  image?: {
    type?: "jpeg" | "png" | "webp";
    quality?: number;
  };
  enableLinks?: boolean;
  html2canvas?: {
    scale?: number;
    useCORS?: boolean;
    letterRendering?: boolean;
    logging?: boolean;
    ignoreElements?: (element: HTMLElement) => boolean;
  };
  jsPDF?: {
    unit?: string;
    format?: string | [number, number];
    orientation?: "portrait" | "landscape";
  };
  pagebreak?: {
    mode?: string[];
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

export function ExportModal({ open, onCancel, questions }: ExportModalProps) {
  const [exportState, setExportState] = useState<ExportState>({
    exporting: false,
    progress: 0,
  });
  const [includeAnswer, setIncludeAnswer] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(false);
  const [includeTags, setIncludeTags] = useState(true);

  // 计算导出信息
  const exportInfo = useMemo(() => {
    const subjects = [...new Set(questions.map((q) => q.subject))];
    const subject = subjects.length === 1 ? subjects[0] : '综合';
    return {
      subject,
      questionCount: questions.length,
      subjects,
    };
  }, [questions]);

  // HTML 转义
  const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  // 格式化内容（处理LaTeX公式）
  const formatContent = (content: string): string => {
    if (!content) return '';
    let formatted = escapeHtml(content);
    // 换行处理
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  };

  // 生成完整的 PDF HTML
  const generatePdfHtml = useCallback(() => {
    const date = new Date().toLocaleDateString('zh-CN');
    const totalQuestions = questions.length;

    // 生成题目列表HTML
    const questionsHtml = questions.map((q, index) => {
      const tagsHtml = includeTags && q.tags.length > 0
        ? `<div class="tags" style="margin: 8px 0;">
             ${q.tags.map((t) => `<span class="tag">${escapeHtml(t.tag.name)}</span>`).join('')}
           </div>`
        : '';

      // 答案和解析放在最后
      const answerHtml = includeAnswer
        ? `<div class="answer-box" style="margin-top: 10px; padding: 8px 12px; background: #f0f0f0; border-radius: 4px;">
             <span style="font-weight: bold; color: #333;">【答案】</span>
             <span>${formatContent(q.answer)}</span>
           </div>`
        : '';

      const analysisHtml = includeAnalysis && q.analysis
        ? `<div class="analysis-box" style="margin-top: 8px; padding: 8px 12px; background: #fafafa; border-radius: 4px; border: 1px dashed #ddd;">
             <span style="font-weight: bold; color: #666;">【解析】</span>
             <span>${formatContent(q.analysis)}</span>
           </div>`
        : '';

      return `
        <div class="question" style="margin-bottom: 25px; page-break-inside: avoid; padding: 15px; background: white;">
          <div class="q-header" style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #999; font-size: 9pt;">
            <span>${escapeHtml(exportInfo.subject)}</span>
            <span>${index + 1} / ${totalQuestions}</span>
          </div>
          <div class="q-num" style="font-weight: bold; font-size: 14pt; margin-bottom: 8px; color: #333;">${index + 1}.</div>
          <div class="q-content" style="font-size: 11pt; line-height: 1.9; color: #222;">${formatContent(q.content)}</div>
          ${tagsHtml}
          ${answerHtml}
          ${analysisHtml}
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>练习试卷</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    body {
      font-family: "Microsoft YaHei", "PingFang SC", "Microsoft JhengHei", sans-serif;
      font-size: 11pt;
      line-height: 1.8;
      color: #333;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background: white;
    }
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 45px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 30px;
      font-size: 10pt;
      color: #666;
      z-index: 100;
    }
    .header-left { font-weight: bold; color: #333; }
    .header-right { color: #999; }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10pt;
      color: #999;
      z-index: 100;
    }
    .main-content {
      padding: 55px 25px 50px;
      background: white;
      min-height: 100vh;
    }
    .paper-title {
      text-align: center;
      font-size: 22pt;
      font-weight: bold;
      color: #222;
      margin-bottom: 8px;
      padding-bottom: 15px;
      border-bottom: 2px solid #333;
    }
    .paper-info {
      text-align: center;
      font-size: 11pt;
      color: #666;
      margin-bottom: 30px;
    }
    .tag {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 10pt;
      margin-right: 5px;
    }
    .question {
      background: #fff;
    }
  </style>
</head>
<body>
  <!-- 页眉 -->
  <div class="header">
    <span class="header-left">练习试卷</span>
    <span class="header-right">${date}</span>
  </div>

  <!-- 主内容区 -->
  <div class="main-content">
    <div class="paper-title">练习试卷</div>
    <div class="paper-info">${escapeHtml(exportInfo.subject)} | 共 ${totalQuestions} 题</div>
    <div class="questions">
      ${questionsHtml}
    </div>
  </div>

  <!-- 页脚 -->
  <div class="footer">
    第 <span class="pageNumber"></span> 页 / 共 <span class="totalPages"></span> 页
  </div>
</body>
</html>`;
  }, [questions, includeAnswer, includeAnalysis, includeTags, exportInfo]);

  // 处理 PDF 导出
  const handleExportPdf = useCallback(async () => {
    if (questions.length === 0) {
      message.warning('没有可导出的题目');
      return;
    }

    setExportState({ exporting: true, progress: 10 });

    try {
      // 创建 iframe 来渲染内容
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '800px';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.id = 'pdf-iframe';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('无法创建PDF渲染容器');
      }

      iframeDoc.open();
      iframeDoc.write(generatePdfHtml());
      iframeDoc.close();

      setExportState({ exporting: true, progress: 30 });

      // 等待内容渲染
      await new Promise((resolve) => setTimeout(resolve, 800));

      setExportState({ exporting: true, progress: 50 });

      // 动态导入 html2pdf
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      // 获取 body 内容
      const element = iframeDoc.body;

      const options: ExtendedHtml2PdfOptions = {
        margin: [0, 0, 0, 0],
        filename: `Fixit试卷_${exportInfo.subject}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          ignoreElements: (element: HTMLElement) => {
            // 忽略页眉页脚元素
            return element.classList?.contains('header') || element.classList?.contains('footer');
          },
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['avoid-all', 'legacy'] },
        // 使用jsPDF内置的页眉页脚功能
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="width:100%; height:45px; background:#f8f9fa; border-bottom:1px solid #e0e0e0; display:flex; align-items:center; justify-content:space-between; padding:0 20px; font-size:10pt; color:#666;">
            <span style="font-weight:bold;color:#333;">练习试卷</span>
            <span style="color:#999;">${new Date().toLocaleDateString('zh-CN')}</span>
          </div>
        `,
        footerTemplate: `
          <div style="width:100%; height:40px; background:#f8f9fa; border-top:1px solid #e0e0e0; display:flex; align-items:center; justify-content:center; font-size:10pt; color:#999;">
            第 <span class="pageNumber"></span> 页 / 共 <span class="totalPages"></span> 页
          </div>
        `,
      };
      await html2pdf(element, options);

      setExportState({ exporting: true, progress: 100 });

      // 清理
      document.body.removeChild(iframe);

      message.success(`成功导出 ${questions.length} 道题目到 PDF`);
      onCancel();
    } catch (error) {
      console.error('PDF导出错误:', error);
      message.error('PDF 导出失败，请重试');

      // 清理
      const leftover = document.getElementById('pdf-iframe');
      if (leftover) document.body.removeChild(leftover);
    } finally {
      setExportState({ exporting: false, progress: 0 });
    }
  }, [questions, generatePdfHtml, exportInfo, onCancel]);

  // 处理关闭
  const handleClose = useCallback(() => {
    if (!exportState.exporting) {
      onCancel();
    }
  }, [exportState.exporting, onCancel]);

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <FilePdfOutlined className={styles.titleIcon} />
          <span>导出 PDF 试卷</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={480}
      className={styles.exportModal}
      closable={!exportState.exporting}
      maskClosable={!exportState.exporting}
    >
      <div className={styles.exportInfo}>
        <div className={styles.infoCard}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>题目数量</span>
            <span className={styles.infoValue}>{exportInfo.questionCount} 题</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>学科</span>
            <span className={styles.infoValue}>{exportInfo.subject}</span>
          </div>
        </div>
      </div>

      <Divider />

      <div className={styles.optionsSection}>
        <h4 className={styles.optionsTitle}>导出选项</h4>

        <div className={styles.optionList}>
          <div className={styles.optionItem}>
            <Checkbox
              checked={includeAnswer}
              onChange={(e) => setIncludeAnswer(e.target.checked)}
              disabled={exportState.exporting}
            >
              <span className={styles.optionLabel}>包含答案</span>
            </Checkbox>
            <span className={styles.optionHint}>在每道题最后显示答案</span>
          </div>

          <div className={styles.optionItem}>
            <Checkbox
              checked={includeAnalysis}
              onChange={(e) => setIncludeAnalysis(e.target.checked)}
              disabled={exportState.exporting}
            >
              <span className={styles.optionLabel}>包含解析</span>
            </Checkbox>
            <span className={styles.optionHint}>在每道题最后显示解析</span>
          </div>

          <div className={styles.optionItem}>
            <Checkbox
              checked={includeTags}
              onChange={(e) => setIncludeTags(e.target.checked)}
              disabled={exportState.exporting}
            >
              <span className={styles.optionLabel}>包含标签</span>
            </Checkbox>
            <span className={styles.optionHint}>在题目下方显示关联标签</span>
          </div>
        </div>
      </div>

      <Divider />

      {exportState.exporting && (
        <div className={styles.progressSection}>
          <Progress
            percent={exportState.progress}
            status="active"
            strokeColor={{
              '0%': '#ff6b6b',
              '100%': '#e54d2e',
            }}
          />
          <p className={styles.progressText}>
            {exportState.progress < 40 && '正在准备 PDF 内容...'}
            {exportState.progress >= 40 && exportState.progress < 80 && '正在生成 PDF 文件...'}
            {exportState.progress >= 80 && '即将完成下载...'}
          </p>
        </div>
      )}

      {!exportState.exporting && (
        <div className={styles.footer}>
          <div className={styles.footerTips}>
            <CheckCircleOutlined className={styles.tipIcon} />
            <span>PDF 将自动下载到本地</span>
          </div>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportPdf}
              disabled={questions.length === 0}
              className={styles.exportButton}
            >
              导出 PDF
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  );
}
