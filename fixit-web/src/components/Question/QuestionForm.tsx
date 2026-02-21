// components/Question/QuestionForm.tsx
// 题目表单组件 - 统一 Import 和 Edit 页面的公共表单逻辑

import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, AutoComplete, Button, Card, message, Space, Divider } from 'antd';
import {
  SaveOutlined,
  UploadOutlined,
  RobotOutlined,
  FileImageOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import MarkdownEditor, { MarkdownPreview } from '../MarkdownEditor';
import { questionApi, Question, CreateQuestionParams } from '../../api/question';
import { fileApi } from '../../api/file';
import { aiApi } from '../../api/ai';

interface UploadedImage {
  url: string;
  key: string;
  localFile?: File;
}

interface QuestionFormProps {
  mode: 'create' | 'edit';
  initialData?: Question;
  onSuccess?: () => void;
}

export function QuestionForm({ mode, initialData, onSuccess }: QuestionFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === 'edit');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [data, setData] = useState<Question | undefined>(initialData);

  // 在 edit 模式下获取题目数据
  useEffect(() => {
    if (mode === 'edit' && !initialData) {
      if (!id) {
        message.error('缺少题目 ID');
        navigate('/questions');
        return;
      }

      const fetchQuestion = async () => {
        setLoading(true);
        try {
          const res = await questionApi.get(id);
          const question = res.data;
          setData(question);
          form.setFieldsValue({
            subject: question.subject,
          });
        } catch (error: any) {
          message.error(error.response?.data?.message || '获取题目失败');
          navigate('/questions');
        } finally {
          setLoading(false);
        }
      };

      fetchQuestion();
    }
  }, [mode, initialData, id, navigate, form]);

  // 表单状态
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [fetchingSubjects, setFetchingSubjects] = useState(false);
  const subjectSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 图片上传状态
  const [images, setImages] = useState<UploadedImage[]>(
    (data?.images || []).map((url) => ({ url, key: '' }))
  );
  const [uploadingCount, setUploadingCount] = useState(0);

  // AI 指令状态
  const [answerInstruction, setAnswerInstruction] = useState('');
  const [analysisInstruction, setAnalysisInstruction] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 搜索学科（防抖）
  const handleSubjectSearch = useCallback((value: string) => {
    if (subjectSearchTimer.current) {
      clearTimeout(subjectSearchTimer.current);
    }

    subjectSearchTimer.current = setTimeout(async () => {
      if (!value.trim()) {
        setSubjectOptions([]);
        setFetchingSubjects(false);
        return;
      }

      setFetchingSubjects(true);
      try {
        const res = await questionApi.getSubjects(value);
        setSubjectOptions(res.data);
      } catch {
        setSubjectOptions([]);
      } finally {
        setFetchingSubjects(false);
      }
    }, 300);
  }, []);

  // 处理图片选择
  const handleImageSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        message.warning(`${file.name} 不是图片文件`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        message.warning(`${file.name} 超过 5MB 限制`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // 显示本地预览
    const newImages: UploadedImage[] = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      key: '',
      localFile: file,
    }));
    setImages((prev) => [...prev, ...newImages]);

    // 上传到服务器
    setUploadingCount((prev) => prev + validFiles.length);
    for (const file of validFiles) {
      try {
        const result = await fileApi.upload(file);
        setImages((prev) =>
          prev.map((img) =>
            img.localFile === file
              ? { ...img, key: result.data.key, url: result.data.url, localFile: undefined }
              : img
          )
        );
        message.success(`${file.name} 上传成功`);
      } catch {
        message.error(`${file.name} 上传失败`);
        setImages((prev) => prev.filter((img) => img.localFile !== file));
      }
    }
    setUploadingCount((prev) => Math.max(0, prev - validFiles.length));
  }, []);

  // 删除图片
  const handleDeleteImage = useCallback(async (index: number) => {
    const image = images[index];
    if (image.key) {
      try {
        await fileApi.delete(image.key);
      } catch {
        // 忽略删除错误
      }
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, [images]);

  // AI 识别题目
  const handleRecognizeQuestion = useCallback(async () => {
    if (images.length === 0) {
      message.warning('请先上传题目图片');
      return;
    }

    setAiLoading('recognize');
    try {
      const result = await aiApi.recognizeQuestion({
        images: images.map((img) => img.url),
        instruction: '请识别图片中的题目内容，保持 Markdown 格式，支持 LaTeX 公式',
      });
      form.setFieldsValue({ content: result.data.content });
      message.success('题目识别成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '题目识别失败');
    } finally {
      setAiLoading(null);
    }
  }, [images, form]);

  // AI 生成答案
  const handleGenerateAnswer = useCallback(async () => {
    const content = form.getFieldValue('content');
    if (!content) {
      message.warning('请先输入或识别题目内容');
      return;
    }

    setAiLoading('answer');
    try {
      const result = await aiApi.generateAnswer({
        question: content,
        instruction: answerInstruction || undefined,
      });
      form.setFieldsValue({ answer: result.data.answer });
      message.success('答案生成成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '答案生成失败');
    } finally {
      setAiLoading(null);
    }
  }, [answerInstruction, form]);

  // AI 生成解析
  const handleGenerateAnalysis = useCallback(async () => {
    const content = form.getFieldValue('content');
    const answer = form.getFieldValue('answer');
    if (!content) {
      message.warning('请先输入或识别题目内容');
      return;
    }

    setAiLoading('analysis');
    try {
      const result = await aiApi.generateAnalysis({
        question: content,
        answer: answer || undefined,
        instruction: analysisInstruction || undefined,
      });
      form.setFieldsValue({ analysis: result.data.analysis });
      message.success('解析生成成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '解析生成失败');
    } finally {
      setAiLoading(null);
    }
  }, [analysisInstruction, form]);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setLoading(true);

    try {
      const submitData: CreateQuestionParams = {
        subject: values.subject,
        content: values.content,
        answer: values.answer,
        analysis: values.analysis,
        remark: values.remark,
        images: images.filter((img) => img.key).map((img) => img.url),
        tags: values.tags || [],
      };

      if (mode === 'create') {
        await questionApi.create(submitData);
        message.success('题目录入成功');
      } else if (data) {
        await questionApi.update(data.id, submitData);
        message.success('更新成功');
      }

      onSuccess?.();
      navigate('/questions');
    } catch (error: any) {
      message.error(error.response?.data?.message || (mode === 'create' ? '录入失败' : '更新失败'));
    } finally {
      setLoading(false);
    }
  }, [mode, data, images, form, navigate, onSuccess]);

  // 取消
  const handleCancel = useCallback(() => {
    navigate('/questions');
  }, [navigate]);

  // 计算表单完成状态
  const content = Form.useWatch('content', form);
  const answer = Form.useWatch('answer', form);
  const subject = Form.useWatch('subject', form);

  const canSubmit = subject && content && answer;

  return (
    <div className="question-form">
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        multiple
        onChange={(e) => handleImageSelect(e.target.files)}
      />

      <Form form={form} layout="vertical" initialValues={initialData}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：图片和 AI */}
          <div className="space-y-6">
            {/* 图片上传 */}
            <Card
              title={
                <Space>
                  <FileImageOutlined />
                  <span>上传题目图片</span>
                </Space>
              }
              extra={
                images.length > 0 && (
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() => setImages([])}
                  >
                    清除全部
                  </Button>
                )
              }
            >
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadOutlined className="text-4xl text-gray-400 mb-2" />
                <p className="text-gray-500 mb-1">点击或拖拽图片到这里</p>
                <p className="text-gray-400 text-sm">支持 JPG、PNG、GIF、WebP，单张最大 5MB</p>
              </div>

              {uploadingCount > 0 && (
                <div className="mt-4">
                  <div className="ant-progress ant-progress-status-active ant-progress-line ant-progress-show-info">
                    <div className="ant-progress-outer">
                      <div className="ant-progress-inner">
                        <div className="ant-progress-bg" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 图片列表 */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`题目图片 ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteImage(index)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* AI 识别按钮 */}
              {images.length > 0 && (
                <div className="mt-4">
                  <Button
                    type="primary"
                    icon={<RobotOutlined />}
                    block
                    loading={aiLoading === 'recognize'}
                    onClick={handleRecognizeQuestion}
                  >
                    AI 识别题目内容
                  </Button>
                </div>
              )}
            </Card>

            {/* AI 辅助 */}
            <Card title="AI 辅助生成">
              <div className="space-y-4">
                {/* 生成答案 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">生成答案</span>
                  </div>
                  <input
                    className="ant-input ant-input-sm mb-2"
                    placeholder="可选：添加生成答案的指令"
                    value={answerInstruction}
                    onChange={(e) => setAnswerInstruction(e.target.value)}
                  />
                  <Button
                    type="default"
                    icon={<RobotOutlined />}
                    size="small"
                    className="w-full"
                    loading={aiLoading === 'answer'}
                    onClick={handleGenerateAnswer}
                    disabled={!content}
                  >
                    生成答案
                  </Button>
                </div>

                <Divider className="my-3" />

                {/* 生成解析 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">生成解析</span>
                  </div>
                  <input
                    className="ant-input ant-input-sm mb-2"
                    placeholder="可选：添加生成解析的指令"
                    value={analysisInstruction}
                    onChange={(e) => setAnalysisInstruction(e.target.value)}
                  />
                  <Button
                    type="default"
                    icon={<RobotOutlined />}
                    size="small"
                    className="w-full"
                    loading={aiLoading === 'analysis'}
                    onClick={handleGenerateAnalysis}
                    disabled={!content}
                  >
                    生成解析
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* 中间：编辑区 */}
          <div className="space-y-6">
            {/* 基本信息 */}
            <Card title="基本信息">
              <Form.Item
                name="subject"
                label="学科"
                rules={[{ required: true, message: '请输入学科' }]}
              >
                <AutoComplete
                  placeholder="输入学科名称搜索或直接输入新学科"
                  allowClear
                  onSearch={handleSubjectSearch}
                  options={subjectOptions.map((s) => ({ label: s, value: s }))}
                  notFoundContent={fetchingSubjects ? '搜索中...' : null}
                />
              </Form.Item>
            </Card>

            {/* 题目内容 */}
            <Card title="题目内容">
              <Form.Item
                name="content"
                rules={[{ required: true, message: '请输入题目内容' }]}
              >
                <MarkdownEditor
                  value={content || ''}
                  onChange={(value) => form.setFieldValue('content', value)}
                  label="题目描述"
                  height={150}
                  placeholder="请输入题目内容，支持 Markdown 和 LaTeX 公式，如：$\\frac{a}{b}$"
                />
              </Form.Item>
            </Card>

            {/* 答案 */}
            <Card title="答案">
              <Form.Item
                name="answer"
                rules={[{ required: true, message: '请输入答案' }]}
              >
                <MarkdownEditor
                  value={answer || ''}
                  onChange={(value) => form.setFieldValue('answer', value)}
                  label="答案"
                  height={120}
                  placeholder="请输入答案"
                />
              </Form.Item>
            </Card>

            {/* 解析 */}
            <Card title="解析（可选）">
              <Form.Item name="analysis">
                <MarkdownEditor
                  value={form.getFieldValue('analysis') || ''}
                  onChange={(value) => form.setFieldValue('analysis', value)}
                  label="解析"
                  height={120}
                  placeholder="请输入解析（可选）"
                />
              </Form.Item>
            </Card>

            {/* 备注 */}
            <Card title="备注（可选）">
              <Form.Item name="remark">
                <MarkdownEditor
                  value={form.getFieldValue('remark') || ''}
                  onChange={(value) => form.setFieldValue('remark', value)}
                  label="备注"
                  height={120}
                  placeholder="请输入备注（可选），如：这道题的易错点、个人理解等"
                />
              </Form.Item>
            </Card>
          </div>

          {/* 右侧：预览和操作 */}
          <div className="space-y-6">
            <Card title="题目预览">
              <div className="mb-4">
                <span className="text-gray-500">学科：</span>
                <span className="font-medium">{subject || '未填写'}</span>
              </div>
              {images.length > 0 && (
                <div className="mb-4">
                  <span className="text-gray-500">图片：</span>
                  <span className="font-medium">{images.length} 张</span>
                </div>
              )}
              <Divider />
              <div>
                <h3 className="text-lg font-medium mb-2">题目内容</h3>
                <MarkdownPreview content={content || ''} />
              </div>
              <Divider />
              <div>
                <h3 className="text-lg font-medium mb-2">答案</h3>
                <MarkdownPreview content={answer || ''} />
              </div>
              {form.getFieldValue('analysis') && (
                <>
                  <Divider />
                  <div>
                    <h3 className="text-lg font-medium mb-2">解析</h3>
                    <MarkdownPreview content={form.getFieldValue('analysis')} />
                  </div>
                </>
              )}
              {form.getFieldValue('remark') && (
                <>
                  <Divider />
                  <div>
                    <h3 className="text-lg font-medium mb-2">备注</h3>
                    <MarkdownPreview content={form.getFieldValue('remark')} />
                  </div>
                </>
              )}
            </Card>

            {/* 操作按钮 */}
            <Card>
              <div className="flex justify-end gap-4">
                <Button onClick={handleCancel}>取消</Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={loading}
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {mode === 'create' ? '保存题目' : '保存修改'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
