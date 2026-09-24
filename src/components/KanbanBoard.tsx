import React, { useState } from 'react';
import { Topic, KanbanStatus, Priority } from '../types';
import { TopicCard } from './TopicCard';
import { 
  CircleDot, 
  BookOpen, 
  CheckCircle2, 
  Search, 
  Filter, 
  Plus,
  Flame,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KanbanBoardProps {
  topics: Topic[];
  onOpenReader: (topic: Topic) => void;
  onMoveStatus: (topicId: string, newStatus: KanbanStatus) => void;
  onDeleteTopic: (topicId: string) => void;
  onOpenAddTopic: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  topics,
  onOpenReader,
  onMoveStatus,
  onDeleteTopic,
  onOpenAddTopic,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);

  // Filter topics
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (topic.summary && topic.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (topic.document && topic.document.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPriority = priorityFilter === 'all' || topic.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const notDoneTopics = filteredTopics.filter(t => t.status === 'not-done');
  const inProgressTopics = filteredTopics.filter(t => t.status === 'in-progress');
  const doneTopics = filteredTopics.filter(t => t.status === 'done');

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, topicId: string) => {
    e.dataTransfer.setData('text/plain', topicId);
    setDraggedTopicId(topicId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: KanbanStatus) => {
    e.preventDefault();
    const topicId = e.dataTransfer.getData('text/plain') || draggedTopicId;
    if (topicId) {
      onMoveStatus(topicId, targetStatus);
    }
    setDraggedTopicId(null);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-topics-input"
            type="text"
            placeholder="Search topics, documents, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Priority:</span>
          </div>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {(['all', 'high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                  priorityFilter === p
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            id="board-add-topic-btn"
            onClick={onOpenAddTopic}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Topic</span>
          </button>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-start">
        
        {/* Column 1: Not Done */}
        <div 
          id="kanban-column-not-done"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'not-done')}
          className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 flex flex-col min-h-[500px] transition-colors hover:border-slate-300"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Not Done</h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
                {notDoneTopics.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">To Study</span>
          </div>

          {/* Cards List */}
          <div className="space-y-3 flex-1">
            <AnimatePresence>
              {notDoneTopics.map((topic) => (
                <motion.div
                  key={topic.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {/* Native drag handlers live on a plain div: motion.div treats onDragStart
                      as its own gesture prop and never passes it to the DOM element */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, topic.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TopicCard
                      topic={topic}
                      onOpenReader={onOpenReader}
                      onMoveStatus={onMoveStatus}
                      onDeleteTopic={onDeleteTopic}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {notDoneTopics.length === 0 && (
              <div className="h-36 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-400 mb-2">No topics pending in Not Done</p>
                <button
                  onClick={onOpenAddTopic}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  + Add a new topic or doc
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Reading / In Progress (The middle stage!) */}
        <div 
          id="kanban-column-in-progress"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'in-progress')}
          className="bg-indigo-50/40 rounded-2xl border border-indigo-200/90 p-4 flex flex-col min-h-[500px] shadow-xs ring-1 ring-indigo-200/40"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-indigo-100">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h3 className="text-sm font-bold text-indigo-950 tracking-tight">Reading & Active</h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {inProgressTopics.length}
              </span>
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold uppercase tracking-wider">Middle Stage</span>
          </div>

          <div className="text-xs text-indigo-900/70 bg-indigo-100/50 p-2 rounded-lg mb-3 border border-indigo-200/60 flex items-center justify-between">
            <span>Currently studying & reading documents</span>
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          </div>

          {/* Cards List */}
          <div className="space-y-3 flex-1">
            <AnimatePresence>
              {inProgressTopics.map((topic) => (
                <motion.div
                  key={topic.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {/* Native drag handlers live on a plain div: motion.div treats onDragStart
                      as its own gesture prop and never passes it to the DOM element */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, topic.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TopicCard
                      topic={topic}
                      onOpenReader={onOpenReader}
                      onMoveStatus={onMoveStatus}
                      onDeleteTopic={onDeleteTopic}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {inProgressTopics.length === 0 && (
              <div className="h-36 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-indigo-200/80 rounded-xl">
                <BookOpen className="w-6 h-6 text-indigo-400 mb-1" />
                <p className="text-xs font-medium text-indigo-900/80">No topic currently being read</p>
                <p className="text-[11px] text-indigo-600/70 mt-0.5">
                  Click "Start Reading" on any topic in Not Done to move it here!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Done / Mastered */}
        <div 
          id="kanban-column-done"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'done')}
          className="bg-emerald-50/40 rounded-2xl border border-emerald-200/90 p-4 flex flex-col min-h-[500px] shadow-xs"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-emerald-100">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-emerald-950 tracking-tight">Done & Mastered</h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {doneTopics.length}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Exam Ready</span>
          </div>

          <div className="text-xs text-emerald-900/70 bg-emerald-100/40 p-2 rounded-lg mb-3 border border-emerald-200/60 flex items-center justify-between">
            <span>Completed & reviewed topics</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>

          {/* Cards List */}
          <div className="space-y-3 flex-1">
            <AnimatePresence>
              {doneTopics.map((topic) => (
                <motion.div
                  key={topic.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {/* Native drag handlers live on a plain div: motion.div treats onDragStart
                      as its own gesture prop and never passes it to the DOM element */}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, topic.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TopicCard
                      topic={topic}
                      onOpenReader={onOpenReader}
                      onMoveStatus={onMoveStatus}
                      onDeleteTopic={onDeleteTopic}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {doneTopics.length === 0 && (
              <div className="h-36 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-emerald-200 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1" />
                <p className="text-xs text-emerald-800/80">Finish reading topics to mark them Done</p>
                <p className="text-[11px] text-emerald-600/70 mt-0.5">
                  The app will automatically queue the next topic in the course!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
