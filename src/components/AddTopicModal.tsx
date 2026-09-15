import React, { useState } from 'react';
import { Course, Topic, Priority, DocumentAttachment } from '../types';
import { X, Plus, FileUp, CheckCircle2, Clock, Flame } from 'lucide-react';
import { parseUploadedFile } from '../utils/fileParser';

interface AddTopicModalProps {
  course: Course;
  onClose: () => void;
  onAddTopic: (topic: Omit<Topic, 'id'>) => void;
}

export const AddTopicModal: React.FC<AddTopicModalProps> = ({
  course,
  onClose,
  onAddTopic,
}) => {
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [priority, setPriority] = useState<Priority>('medium');
  const [summary, setSummary] = useState('');
  const [conceptInput, setConceptInput] = useState('');
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [attachedDoc, setAttachedDoc] = useState<DocumentAttachment | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddConcept = () => {
    if (conceptInput.trim()) {
      setKeyConcepts(prev => [...prev, conceptInput.trim()]);
      setConceptInput('');
    }
  };

  const handleRemoveConcept = (index: number) => {
    setKeyConcepts(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const doc = await parseUploadedFile(e.target.files[0]);
      setAttachedDoc(doc);
      if (!title) {
        // Auto-populate title if empty
        setTitle(doc.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTopic({
      courseId: course.id,
      title: title.trim(),
      order: Date.now(),
      status: 'not-done', // As specified: starts at Not Done!
      priority,
      estimatedMinutes,
      document: attachedDoc,
      summary: summary.trim() || undefined,
      keyConcepts: keyConcepts.map(c => ({
        id: 'c-' + Math.random().toString(36).substring(2, 8),
        text: c,
        completed: false,
      })),
      personalNotes: '',
      confidenceScore: 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">Add Exam Topic</h3>
            <p className="text-xs text-slate-500">
              Adding to <span className="font-semibold text-slate-800">{course.title}</span> (Starts in Not Done)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Topic Title: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chapter 4: Protein Folding & Thermodynamics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority Yield:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="high">High Yield (Exam Priority)</option>
                <option value="medium">Medium Yield</option>
                <option value="low">Low Yield / Supplementary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Study Time:
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="5"
                  max="180"
                  step="5"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500 shrink-0">mins</span>
              </div>
            </div>
          </div>

          {/* Attach PDF or Word doc */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attach Study Document / PDF:
            </label>
            {attachedDoc ? (
              <div className="flex items-center justify-between p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs">
                <span className="font-semibold text-indigo-900 truncate">{attachedDoc.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedDoc(undefined)}
                  className="text-slate-400 hover:text-rose-600 text-xs font-medium ml-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center space-x-2 p-3 rounded-lg border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 cursor-pointer text-xs text-slate-600 hover:text-indigo-600 transition-colors">
                <FileUp className="w-4 h-4 text-indigo-500" />
                <span>{isUploading ? 'Parsing document...' : 'Upload Word doc (.docx) or PDF'}</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Topic Summary / Objectives:
            </label>
            <textarea
              rows={2}
              placeholder="Brief summary of what will be covered..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Key Concepts checklist items */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Key Concepts / Formulas to Master:
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                placeholder="e.g. Rate equation for 2nd order kinetics"
                value={conceptInput}
                onChange={(e) => setConceptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddConcept();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddConcept}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>

            {keyConcepts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {keyConcepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs"
                  >
                    <span>{concept}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveConcept(idx)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Topic (Not Done)</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
