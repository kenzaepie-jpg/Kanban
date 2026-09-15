import React, { useState, useEffect } from 'react';
import { Topic, DocumentAttachment } from '../types';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  FileText, 
  Paperclip, 
  Download, 
  Maximize2, 
  Minimize2, 
  CheckSquare, 
  Star, 
  Flame,
  FileUp,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseUploadedFile } from '../utils/fileParser';

interface StudyReaderModalProps {
  topic: Topic;
  allCourseTopics: Topic[];
  onClose: () => void;
  onUpdateTopic: (updatedTopic: Topic) => void;
  onMarkDoneAndNext: (currentTopicId: string) => void;
}

export const StudyReaderModal: React.FC<StudyReaderModalProps> = ({
  topic,
  allCourseTopics,
  onClose,
  onUpdateTopic,
  onMarkDoneAndNext,
}) => {
  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'document' | 'notes'>('document');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  // Local copy of notes and concepts for smooth updates
  const [personalNotes, setPersonalNotes] = useState(topic.personalNotes || '');
  const [keyConcepts, setKeyConcepts] = useState(topic.keyConcepts || []);
  const [confidenceScore, setConfidenceScore] = useState(topic.confidenceScore || 0);

  // Sync state when topic changes (e.g., auto-advancing to next topic)
  useEffect(() => {
    setPersonalNotes(topic.personalNotes || '');
    setKeyConcepts(topic.keyConcepts || []);
    setConfidenceScore(topic.confidenceScore || 0);
    setTimerSeconds(0);
    setIsTimerRunning(true);
  }, [topic.id]);

  // Focus Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleConcept = (conceptId: string) => {
    const updated = keyConcepts.map(c => 
      c.id === conceptId ? { ...c, completed: !c.completed } : c
    );
    setKeyConcepts(updated);
    onUpdateTopic({
      ...topic,
      keyConcepts: updated,
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPersonalNotes(val);
    onUpdateTopic({
      ...topic,
      personalNotes: val,
    });
  };

  const handleConfidenceClick = (score: number) => {
    setConfidenceScore(score);
    onUpdateTopic({
      ...topic,
      confidenceScore: score,
    });
  };

  // Allow uploading or attaching a new document to this specific topic
  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const parsedDoc = await parseUploadedFile(file);
      onUpdateTopic({
        ...topic,
        document: parsedDoc,
      });
    }
  };

  // Find next topic in sequence
  const currentIdx = allCourseTopics.findIndex(t => t.id === topic.id);
  const remainingIncomplete = allCourseTopics.filter(
    t => t.id !== topic.id && t.status !== 'done'
  );
  const nextInSequence = allCourseTopics[currentIdx + 1] || remainingIncomplete[0];

  const handleCompleteAndNext = () => {
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onMarkDoneAndNext(topic.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div 
        className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 transition-all duration-300 w-full ${
          isFullscreen 
            ? 'h-full max-w-none rounded-none' 
            : 'max-w-6xl h-[92vh] max-h-[860px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {topic.status === 'in-progress' ? 'Reading Stage (Active)' : topic.status === 'done' ? 'Mastered' : 'Not Done'}
                </span>
                <span className="text-xs text-slate-400">Topic {topic.order} of {allCourseTopics.length}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate" title={topic.title}>
                {topic.title}
              </h2>
            </div>
          </div>

          {/* Center Timer & Study Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-bold text-slate-800">{formatTimer(timerSeconds)}</span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                title={isTimerRunning ? 'Pause timer' : 'Start timer'}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setTimerSeconds(0)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Complete & Next Topic Button (The requested core feature!) */}
            <button
              id="mark-done-and-next-btn"
              onClick={handleCompleteAndNext}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all hover:shadow-emerald-200 hover:scale-[1.02]"
              title="Mark this topic done, celebrate, and auto-load the next topic & PDF in the course"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-bold">Mark Done & Next Topic</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Window controls */}
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                id="close-reader-btn"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                title="Close reader (stays in current Kanban column)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Body - 2 Columns (Document / PDF Reader on Left, Study Notes & Objectives on Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Panel: The Document / PDF Viewer (7 or 8 columns on large screens) */}
          <div className="lg:col-span-8 flex flex-col h-full border-r border-slate-200 bg-white overflow-hidden">
            
            {/* Viewer Header Sub-toolbar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 truncate">
                {topic.document ? (
                  <>
                    <span className={`px-2 py-0.5 uppercase font-bold rounded text-[10px] ${
                      topic.document.type === 'pdf' 
                        ? 'bg-rose-100 text-rose-800' 
                        : topic.document.type === 'docx'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}>
                      {topic.document.type}
                    </span>
                    <span className="font-medium text-slate-800 truncate" title={topic.document.name}>
                      {topic.document.name}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500 italic">No document attached yet</span>
                )}
              </div>

              {/* Reader Controls: Font size + Replace/Attach file */}
              <div className="flex items-center space-x-2 shrink-0">
                <div className="flex items-center bg-white rounded-md border border-slate-200 p-0.5 text-[11px]">
                  <button
                    onClick={() => setFontSize('sm')}
                    className={`px-2 py-0.5 rounded font-medium ${fontSize === 'sm' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSize('base')}
                    className={`px-2 py-0.5 rounded font-medium ${fontSize === 'base' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('lg')}
                    className={`px-2 py-0.5 rounded font-medium ${fontSize === 'lg' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                  >
                    A+
                  </button>
                </div>

                <label className="cursor-pointer inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors">
                  <FileUp className="w-3 h-3" />
                  <span>Attach PDF/Doc</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    onChange={handleAttachFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Document Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
              {topic.document?.url && topic.document.type === 'pdf' ? (
                /* PDF Embed / iFrame Viewer */
                <div className="h-full flex flex-col">
                  <div className="mb-2 p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center justify-between">
                    <span>Previewing PDF: {topic.document.name}</span>
                    <a 
                      href={topic.document.url} 
                      download={topic.document.name}
                      className="inline-flex items-center space-x-1 text-rose-700 hover:text-rose-900 font-medium underline"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                  <iframe
                    src={topic.document.url}
                    className="w-full flex-1 rounded-lg border border-slate-200 bg-white shadow-xs"
                    title="PDF Viewer"
                  />
                </div>
              ) : topic.document?.content ? (
                /* Rich Document Content (Parsed Word DOCX, text, or formatted study notes) */
                <div className={`max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs prose prose-slate ${
                  fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'
                }`}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: topic.document.content }}
                    className="space-y-4 leading-relaxed [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-slate-900 [&>h2]:border-b [&>h2]:pb-2 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-indigo-900 [&>h3]:mt-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:text-slate-700"
                  />
                </div>
              ) : (
                /* Empty state: No document attached yet */
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 mb-1">No Document or PDF Attached Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mb-4">
                    Upload your lecture slides PDF, Word doc (.docx), or study notes to read right here while advancing your Kanban cards.
                  </p>
                  <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors">
                    <FileUp className="w-4 h-4" />
                    <span>Upload Word Doc (.docx) or PDF</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      onChange={handleAttachFile}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Objectives Checklist & Personal Exam Notes (4 columns) */}
          <div className="lg:col-span-4 flex flex-col h-full bg-white overflow-hidden">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/60 text-xs font-medium">
              <button
                onClick={() => setActiveTab('document')}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors ${
                  activeTab === 'document'
                    ? 'border-indigo-600 text-indigo-900 bg-white font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Key Objectives ({keyConcepts.filter(c => c.completed).length}/{keyConcepts.length})
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors ${
                  activeTab === 'notes'
                    ? 'border-indigo-600 text-indigo-900 bg-white font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                My Exam Notes
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              
              {activeTab === 'document' ? (
                <>
                  {/* Confidence Rating */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Exam Confidence for this Topic:
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleConfidenceClick(star)}
                          className="p-1 hover:scale-110 transition-transform"
                          title={`${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star 
                            className={`w-5 h-5 ${
                              star <= confidenceScore 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-slate-300'
                            }`} 
                          />
                        </button>
                      ))}
                      <span className="text-xs font-medium text-slate-500 pl-2">
                        {confidenceScore === 5 ? 'Mastered!' : confidenceScore >= 3 ? 'Good understanding' : 'Needs review'}
                      </span>
                    </div>
                  </div>

                  {/* Checklist of Key Concepts */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Target Concepts to Master
                      </h4>
                    </div>

                    {keyConcepts.length > 0 ? (
                      <div className="space-y-2">
                        {keyConcepts.map((concept) => (
                          <label
                            key={concept.id}
                            className={`flex items-start space-x-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              concept.completed 
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 line-through text-slate-500' 
                                : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={concept.completed}
                              onChange={() => handleToggleConcept(concept.id)}
                              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="leading-snug">{concept.text}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                        No specific objectives listed. You can add notes or summary on the notes tab.
                      </p>
                    )}
                  </div>

                  {/* Next Up Preview Card */}
                  {nextInSequence && nextInSequence.id !== topic.id && (
                    <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        Next Topic in Course:
                      </span>
                      <p className="text-xs font-semibold text-indigo-950 mt-1 truncate">
                        {nextInSequence.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1 text-[11px] text-indigo-700">
                        <Clock className="w-3 h-3" />
                        <span>~{nextInSequence.estimatedMinutes} mins</span>
                        {nextInSequence.document && (
                          <span className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-[10px]">
                            {nextInSequence.document.type.toUpperCase()} attached
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Notes Tab */
                <div className="h-full flex flex-col">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Study Scratchpad & Key Formulas:
                  </label>
                  <textarea
                    rows={12}
                    placeholder="Write important definitions, equations, mnemonics, or exam questions here..."
                    value={personalNotes}
                    onChange={handleNotesChange}
                    className="w-full flex-1 p-3 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-sans leading-relaxed resize-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-2">
                    Auto-saved to your study session.
                  </p>
                </div>
              )}

            </div>

            {/* Bottom Panel Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Status: <strong className="capitalize text-slate-800">{topic.status}</strong>
              </span>

              <button
                id="modal-next-topic-button"
                onClick={handleCompleteAndNext}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <span>Done & Next Topic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
