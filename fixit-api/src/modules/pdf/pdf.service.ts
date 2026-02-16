import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

export interface ExportQuestion {
  id: string;
  content: string;
  answer: string;
  analysis?: string;
  subject: string;
  tags: { tag: { name: string } }[];
}

export interface ExportOptions {
  includeAnswer: boolean;
  includeAnalysis: boolean;
  includeTags: boolean;
  subject?: string;
}

@Injectable()
export class PdfService {
  /**
   * Generate PDF document for questions
   */
  async generateQuestionsPdf(
    questions: ExportQuestion[],
    options: ExportOptions,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 60, bottom: 40, left: 50, right: 50 },
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate filename
      const filename = this.generateFilename(options.subject);
      (doc as any).info['Title'] = filename.replace('.pdf', '');
      (doc as any).info['Author'] = 'Fixit - 错题本应用';

      // Add cover page
      this.addCoverPage(doc, questions.length, options);

      // Add practice section
      this.addPracticeSection(doc, questions, options);

      // Add answer section if needed
      if (options.includeAnswer) {
        this.addAnswerSection(doc, questions, options);
      }

      // Add page numbers
      this.addPageNumbers(doc);

      doc.end();
    });
  }

  private addCoverPage(
    doc: typeof PDFDocument,
    questionCount: number,
    options: ExportOptions,
  ): void {
    // Brand color
    const brandColor = '#ff6b6b';

    // Main title
    doc.fontSize(28).fillColor(brandColor).text('Fixit 试卷', {
      align: 'center',
    });

    doc.moveDown(0.5);

    // Subtitle
    const subject = options.subject || '综合练习';
    doc.fontSize(14).fillColor('#666666').text(subject, {
      align: 'center',
    });

    doc.moveDown(1.5);

    // Stats
    doc.fontSize(12).fillColor('#999999');
    doc.text(`题目数量：${questionCount} 题`, { align: 'center' });
    doc.moveDown(0.3);
    doc.text(`导出时间：${new Date().toLocaleString('zh-CN')}`, {
      align: 'center',
    });

    doc.moveDown(2);

    // Options info
    doc.fontSize(10).fillColor('#bbbbbb');
    const optionsText = [
      `包含答案：${options.includeAnswer ? '是' : '否'}`,
      `包含解析：${options.includeAnalysis ? '是' : '否'}`,
      `包含标签：${options.includeTags ? '是' : '否'}`,
    ];
    doc.text(optionsText.join('  |  '), { align: 'center' });

    doc.addPage();
  }

  private addPracticeSection(
    doc: typeof PDFDocument,
    questions: ExportQuestion[],
    options: ExportOptions,
  ): void {
    const brandColor = '#ff6b6b';
    const textColor = '#333333';
    const grayColor = '#666666';
    const lightGrayColor = '#999999';

    // Section title
    doc
      .fontSize(18)
      .fillColor(brandColor)
      .text('练习区', { underline: false });

    doc.moveDown(0.5);

    let currentPage = 1;
    const totalPages = Math.ceil(questions.length / 6); // 6 questions per page

    questions.forEach((question, index) => {
      // Check if we need a new page
      if (index > 0 && index % 6 === 0) {
        doc.addPage();
        currentPage++;
      }

      const questionNum = index + 1;

      // Question number
      doc.fontSize(12).fillColor(brandColor).text(`${questionNum}.`, {
        continued: false,
      });

      doc.moveDown(0.2);

      // Question content
      doc.fontSize(10).fillColor(textColor);
      const content = this.processContent(question.content);
      this.addWrappedText(doc, content, {
        indent: 20,
        lineGap: 4,
        paragraphGap: 8,
      });

      // Tags
      if (options.includeTags && question.tags.length > 0) {
        doc.moveDown(0.3);
        const tagText = question.tags
          .map((t) => t.tag.name)
          .join('  ');
        doc.fontSize(8).fillColor(lightGrayColor).text(tagText, {
          indent: 20,
        });
      }

      doc.moveDown(0.8);
    });
  }

  private addAnswerSection(
    doc: typeof PDFDocument,
    questions: ExportQuestion[],
    options: ExportOptions,
  ): void {
    const brandColor = '#ff6b6b';
    const textColor = '#333333';
    const grayColor = '#666666';
    const lightGrayColor = '#999999';

    doc.addPage();

    // Section title
    doc
      .fontSize(18)
      .fillColor(brandColor)
      .text('答案区', { underline: false });

    doc.moveDown(0.5);

    questions.forEach((question, index) => {
      const questionNum = index + 1;

      // Question number
      doc.fontSize(12).fillColor(brandColor).text(`${questionNum}.`, {
        continued: false,
      });

      doc.moveDown(0.2);

      // Answer
      doc.fontSize(10).fillColor(textColor);
      const answer = question.answer || '—';
      this.addWrappedText(doc, answer, {
        indent: 20,
        lineGap: 4,
        paragraphGap: 0,
      });

      // Analysis
      if (options.includeAnalysis && question.analysis) {
        doc.moveDown(0.3);
        doc
          .fontSize(9)
          .fillColor(grayColor)
          .text(`解析：`, { continued: false, indent: 20 });

        doc.fontSize(9).fillColor(grayColor);
        const analysis = this.processContent(question.analysis);
        this.addWrappedText(doc, analysis, {
          indent: 50,
          lineGap: 3,
          paragraphGap: 6,
        });
      }

      doc.moveDown(0.8);
    });
  }

  private addPageNumbers(doc: typeof PDFDocument): void {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      // Skip cover page (first page)
      if (i === 0) continue;

      // Page number
      const pageNum = i;
      const total = pages.count - 1; // Exclude cover page

      doc
        .fontSize(9)
        .fillColor('#999999')
        .text(
          `第 ${pageNum} / ${total} 页`,
          0,
          doc.page.height - 40,
          {
            align: 'center',
            width: doc.page.width - 100,
          },
        );
    }
  }

  private processContent(content: string): string {
    // Basic markdown-like processing
    return content
      // Handle bold
      .replace(/\*\*(.+?)\*\*/g, '$1')
      // Handle italic
      .replace(/\*(.+?)\*/g, '$1')
      // Handle LaTeX display mode
      .replace(/\$\$(.+?)\$\$/g, ' $1 ')
      // Handle LaTeX inline mode
      .replace(/\$(.+?)\$/g, ' $1 ')
      // Handle line breaks
      .replace(/\n/g, ' ')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  private addWrappedText(
    doc: typeof PDFDocument,
    text: string,
    options: {
      indent: number;
      lineGap: number;
      paragraphGap: number;
    },
  ): void {
    const maxWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right - options.indent;

    const wrapped = doc.wrapText(text, maxWidth);

    wrapped.forEach((line, index) => {
      doc.text(line, options.indent, doc.y, {
        width: maxWidth,
        lineGap: options.lineGap,
      });

      if (index < wrapped.length - 1) {
        doc.moveDown(0);
      } else {
        doc.moveDown(options.paragraphGap / 10);
      }
    });
  }

  /**
   * Generate PDF filename
   */
  generateFilename(subject?: string): string {
    const dateStr = new Date().toISOString().split('T')[0];
    const subjectStr = subject || '综合';
    return `Fixit试卷_${subjectStr}_${dateStr}.pdf`;
  }
}
