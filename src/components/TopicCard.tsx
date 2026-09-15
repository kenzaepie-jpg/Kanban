import React from 'react';
import { Topic, KanbanStatus } from '../types';
import { 
  BookOpen, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Paperclip,
  CheckSquare,
  Sparkles,
  Flame
} from 'lucide-react';

interface TopicCardProps {
  topic: Topic;
  onOpenReader: (topic: Topic) => void;
  onMoveStatus: (topicId: string, newStatus: KanbanStatus) => void;
  onDeleteTopic: (topicId: string) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  onOpenReader,
  onMoveStatus,
  onDeleteTopic,
}) => {
  const completedConcepts = topic.keyConcepts.filter(c => c.completed).length;
  const totalConcepts = topic.keyConcepts.length;

  const getPriorityBadge = () => {
    switch (topic.priority) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Flame className="w-3 h-3 mr-1 text-rose-500" /> High Yield
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
            Low
          </span>
        );
    }
  };

  const getDocumentBadge = () => {
    if (!topic.document) return null;
    const isPdf = topic.document.type === 'pdf';
    const isDocx = topic.document.type === 'docx';

    return (
      <div 
        className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono font-medium border truncate max-w-full ${
          isPdf 
            ? 'bg-rose-50/70 border-rose-200/80 text-rose-800' 
            : isDocx 
            ? 'bg-blue-50/70 border-blue-200/80 text-blue-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
        title={topic.document.name}
      >
        <Paperclip className="w-3 h-3 shrink-0" />
        <span className="uppercase text-[10px] font-bold px-1 rounded bg-white/70">
          {topic.document.type}
        </span>
        <span className="truncate text-[11px]">{topic.document.name}</span>
      </div>
    );
  };

  return (
    <div 
      id={`topic-card-${topic.id}`}
      className={`group bg-white rounded-xl border p-4 shadow-xs transition-all hover:shadow-md ${
        topic.status === 'in-progress' 
          ? 'border-indigo-300 ring-1 ring-indigo-200/70 bg-gradient-to-b from-indigo-50/20 to-white' 
          : topic.status === 'done'
          ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/15 to-white'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header Badges & Order */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          {getPriorityBadge()}
          <span className="inline-flex items-center space-x-1 text-[11px] text-slate-500 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{topic.estimatedMinutes}m</span>
          </span>
        </div>

        {/* Delete topic option */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Remove topic "${topic.title}"?`)) {
              onDeleteTopic(topic.id);
            }
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-600 rounded transition-opacity"
          title="Delete topic"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1.5 group-hover:text-indigo-900 transition-colors">
        {topic.title}
      </h4>

      {/* Summary if present */}
      {topic.summary && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          {topic.summary}
        </p>
      )}

      {/* Attached Document or PDF Indicator */}
      <div className="mb-3">
        {getDocumentBadge()}
      </div>

      {/* Key Concepts Progress Checklist Indicator */}
      {totalConcepts > 0 && (
        <div className="mb-3 flex items-center justify-between text-xs bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100">
          <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>Objectives</span>
          </div>
          <span className={`text-[11px] font-semibold ${
            completedConcepts === totalConcepts ? 'text-emerald-600' : 'text-slate-600'
          }`}>
            {completedConcepts}/{totalConcepts} checked
          </span>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
        {/* Status Transition & Reader Launcher */}
        {topic.status === 'not-done' && (
          <button
            id={`start-reading-${topic.id}`}
            onClick={() => {
              // As requested: when reading a topic, it moves to the middle stage ("in-progress")
              onMoveStatus(topic.id, 'in-progress');
              onOpenReader({ ...topic, status: 'in-progress' });
            }}
            className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Start Reading & Move to Active</span>
          </button>
        )}

        {topic.status === 'in-progress' && (
          <div className="w-full flex items-center space-x-2">
            <button
              id={`continue-reading-${topic.id}`}
              onClick={() => onOpenReader(topic)}
              className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Document</span>
            </button>
            <button
              id={`quick-done-${topic.id}`}
              onClick={() => onMoveStatus(topic.id, 'done')}
              className="p-2 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-lg border border-emerald-300 transition-colors"
              title="Quick mark as Mastered"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {topic.status === 'done' && (
          <div className="w-full flex items-center justify-between">
            <button
              id={`review-${topic.id}`}
              onClick={() => onOpenReader(topic)}
              className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 py-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Review Notes & Doc</span>
            </button>
            <button
              onClick={() => onMoveStatus(topic.id, 'in-progress')}
              className="text-[11px] text-slate-400 hover:text-indigo-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
              title="Move back to Reading"
            >
              Re-study
            </button>
          </div>
        )}
      </div>

      {/* Manual Column Shift Controls */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 mt-1">
        <div>
          {topic.status !== 'not-done' && (
            <button
              onClick={() => {
                const prev = topic.status === 'done' ? 'in-progress' : 'not-done';
                onMoveStatus(topic.id, prev);
              }}
              className="hover:text-slate-700 inline-flex items-center space-x-0.5"
              title="Move to previous stage"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back</span>
            </button>
          )}
        </div>
        <div>
          {topic.status !== 'done' && (
            <button
              onClick={() => {
                const next = topic.status === 'not-done' ? 'in-progress' : 'done';
                onMoveStatus(topic.id, next);
              }}
              className="hover:text-indigo-600 inline-flex items-center space-x-0.5"
              title="Move to next stage"
            >
              <span>Move forward</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
