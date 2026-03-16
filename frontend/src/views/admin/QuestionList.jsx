import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import QuestionForm from './QuestionForm.jsx'

// ─── Sortable Item Wrapper ────────────────────────────────────────────────────

function SortableQuestionItem({
  question,
  index,
  onChange,
  onDelete,
  isExpanded,
  onToggle,
  isDragging,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isSortableDragging ? 10 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-start">
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-3 p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0"
        aria-label="Arrastrar para reordenar"
        tabIndex={-1}
      >
        <GripVertical size={16} />
      </button>

      {/* Question form */}
      <div className="flex-1 min-w-0">
        <QuestionForm
          question={question}
          index={index}
          onChange={onChange}
          onDelete={onDelete}
          isExpanded={isExpanded}
          onToggle={onToggle}
        />
      </div>
    </div>
  )
}

// ─── QuestionList ─────────────────────────────────────────────────────────────

/**
 * @param {{
 *   questions: Array,
 *   onChange: (questions: Array) => void,
 * }} props
 */
export default function QuestionList({ questions, onChange }) {
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleQuestionChange(index, updated) {
    const next = [...questions]
    next[index] = updated
    onChange(next)
  }

  function handleDelete(index) {
    const next = questions.filter((_, i) => i !== index)
    // Re-assign order values
    const reordered = next.map((q, i) => ({ ...q, order: i }))
    onChange(reordered)
  }

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const oldIndex = questions.findIndex((q) => q.id === active.id)
    const newIndex = questions.findIndex((q) => q.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(questions, oldIndex, newIndex).map((q, i) => ({
      ...q,
      order: i,
    }))

    onChange(reordered)
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 flex flex-col items-center gap-3 text-center">
        <span className="text-4xl select-none">📋</span>
        <p className="text-sm font-semibold text-gray-500">Aún no hay preguntas</p>
        <p className="text-xs text-gray-400">Haz clic en "Agregar Pregunta" para comenzar.</p>
      </div>
    )
  }

  const activeQuestion = activeId ? questions.find((q) => q.id === activeId) : null
  const activeIndex   = activeId ? questions.findIndex((q) => q.id === activeId) : -1

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {questions.map((q, index) => (
            <SortableQuestionItem
              key={q.id}
              question={q}
              index={index}
              onChange={(updated) => handleQuestionChange(index, updated)}
              onDelete={() => handleDelete(index)}
              isExpanded={expandedIds.has(q.id)}
              onToggle={() => toggleExpand(q.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay — ghost card while dragging */}
      <DragOverlay>
        {activeQuestion ? (
          <div className="flex gap-2 items-start opacity-90 shadow-xl">
            <div className="mt-3 p-1.5 rounded-lg text-gray-400 flex-shrink-0">
              <GripVertical size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <QuestionForm
                question={activeQuestion}
                index={activeIndex}
                onChange={() => {}}
                onDelete={() => {}}
                isExpanded={false}
                onToggle={() => {}}
              />
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
