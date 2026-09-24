import React, { useState, useRef } from 'react';
import { Course, Topic, Priority, KeyConcept } from '../types';
import { 
  X, 
  FileUp, 
  FileText, 
  CheckCircle2, 
  UploadCloud, 
  ListPlus, 
  Sparkles,
  AlertCircle,
  FileCode
} from 'lucide-react';
import { parseUploadedFile, extractTopicsFromText } from '../utils/fileParser';

interface UploadModalProps {
  courses: Course[];
  activeCourseId: string;
  onClose: () => void;
  onAddTopics: (newTopics: Omit<Topic, 'id'>[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  courses,
  activeCourseId,
  onClose,
  onAddTopics,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState(activeCourseId);
  const [uploadMode, setUploadMode] = useState<'files' | 'syllabus'>('files');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Files mode state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Syllabus mode state
  const [syllabusText, setSyllabusText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<{ title: string; summary?: string; concepts: KeyConcept[] }[]>([]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...filesArr]);
    }
    // Reset so re-selecting a file that was removed from the queue still fires onChange
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Syllabus text parsing
  const handleSyllabusTextChange = (text: string) => {
    setSyllabusText(text);
    if (text.trim().length > 10) {
      const extracted = extractTopicsFromText(text);
      setParsedPreview(extracted);
    } else {
      setParsedPreview([]);
    }
  };

  // Submit and create topics starting in "not-done"
  const handleProcessAndCreate = async () => {
    setIsProcessing(true);
    setStatusMessage('Parsing documents and structuring Kanban topics...');

    try {
      const newTopicsList: Omit<Topic, 'id'>[] = [];

      if (uploadMode === 'files') {
        for (let i = 0; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          const docAttachment = await parseUploadedFile(file);

          // Clean topic title from filename
          const cleanTitle = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/^\d+\s*/, '') // remove initial index if any
            .trim();

          // Extract any bullet points from doc if text/docx
          // (block-level tags become line breaks so bullets stay on separate lines for the parser)
          const rawDocText = (docAttachment.content || '')
            .replace(/<\/(p|li|h[1-6]|div|pre)>|<br\s*\/?>/gi, '\n')
            .replace(/<li[^>]*>/gi, '\n- ')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
          const concepts = extractTopicsFromText(rawDocText)[0]?.concepts || [];

          newTopicsList.push({
            courseId: selectedCourseId,
            title: cleanTitle.length > 0 ? cleanTitle : file.name,
            order: i + 1,
            status: 'not-done', // As user specified: starts at not done!
            priority: 'medium',
            estimatedMinutes: 25,
            document: docAttachment,
            summary: `Loaded from ${file.name}. Review this document to prepare for the exam.`,
            keyConcepts: concepts.slice(0, 4),
            personalNotes: '',
            confidenceScore: 0,
          });
        }
      } else {
        // Syllabus text mode
        parsedPreview.forEach((item, index) => {
          newTopicsList.push({
            courseId: selectedCourseId,
            title: item.title,
            order: index + 1,
            status: 'not-done', // starts at not done
            priority: index === 0 ? 'high' : 'medium',
            estimatedMinutes: 20,
            summary: item.summary || 'Syllabus topic ready for exam prep.',
            keyConcepts: item.concepts,
            personalNotes: '',
            confidenceScore: 0,
          });
        });
      }

      if (newTopicsList.length === 0) {
        setStatusMessage('Please select at least one document or enter syllabus text.');
        setIsProcessing(false);
        return;
      }

      onAddTopics(newTopicsList);
      onClose();
    } catch (err) {
      console.error('Error processing files:', err);
      setStatusMessage('Error parsing files. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Load Course Documents & Topics</h3>
              <p className="text-xs text-slate-500">
                Topics are created in <span className="font-semibold text-slate-800">"Not Done"</span> ready to be studied.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          
          {/* Target Course Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Course:
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setUploadMode('files')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                uploadMode === 'files'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Upload Word Docs (.docx) & PDFs</span>
            </button>
            <button
              onClick={() => setUploadMode('syllabus')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                uploadMode === 'syllabus'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListPlus className="w-4 h-4 text-indigo-600" />
              <span>Paste Syllabus / Outline</span>
            </button>
          </div>

          {/* Mode 1: File Upload (PDF, Word docx) */}
          {uploadMode === 'files' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Drop Word Documents (.docx) or PDFs here
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  or click to browse your computer
                </p>
                <div className="inline-flex items-center space-x-2 text-[11px] text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                  <span>Supports:</span>
                  <span className="font-semibold text-blue-600">.docx</span>
                  <span className="font-semibold text-rose-600">.pdf</span>
                  <span className="font-semibold text-slate-600">.txt</span>
                </div>
              </div>

              {/* Uploaded File Queue */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Selected Files ({uploadedFiles.length}):
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{file.name}</span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Syllabus Text Paste */}
          {uploadMode === 'syllabus' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Paste Syllabus Outline or Exam Study Guide:
                  </label>
                  <button
                    onClick={() => {
                      const sample = `1. Introduction to Photosynthesis and Light Reactions\n- Chloroplast anatomy and thylakoid membrane\n- Photosystems I & II electron transport\n2. The Calvin Cycle (Light-Independent Reactions)\n- Carbon fixation by RuBisCO\n- Regeneration of RuBP\n3. C4 and CAM Plant Adaptations\n- Spatial separation in C4 plants\n- Temporal separation in CAM succulents`;
                      handleSyllabusTextChange(sample);
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Paste sample outline
                  </button>
                </div>
                <textarea
                  rows={6}
                  placeholder={`1. Topic Name\n- Key objective or formula\n2. Next Topic Name...`}
                  value={syllabusText}
                  onChange={(e) => handleSyllabusTextChange(e.target.value)}
                  className="w-full p-3 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {parsedPreview.length > 0 && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <span className="text-xs font-bold text-indigo-900 block mb-2">
                    Detected {parsedPreview.length} Topics to Add to Kanban:
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                    {parsedPreview.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-2 rounded border border-indigo-100/70">
                        <span className="font-semibold text-slate-800 truncate">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                          {item.concepts.length} key points
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {statusMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>
          
          <button
            id="load-topics-submit-btn"
            onClick={handleProcessAndCreate}
            disabled={isProcessing || (uploadMode === 'files' ? uploadedFiles.length === 0 : parsedPreview.length === 0)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isProcessing ? 'Processing...' : `Add to Kanban (Starts at Not Done)`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
