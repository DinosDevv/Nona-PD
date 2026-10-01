import { useRef, useState, type DragEvent } from 'react'
import type { ProjectFile } from '../api/files'
import { timeAgo } from '../lib/todoView'
import { shortName } from '../lib/people'
import { DownloadIcon, FileIcon, TrashIcon, UploadIcon } from './icons'

type Props = {
  files: ProjectFile[] | null
  uploading: boolean
  currentUserId: string
  isManager: boolean
  memberName: (id: string) => string
  onUpload: (files: FileList) => void
  onOpen: (file: ProjectFile) => void
  onDelete: (file: ProjectFile) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function FilesPanel({ files, uploading, currentUserId, isManager, memberName, onUpload, onOpen, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files)
  }

  return (
    <section className="stack">
      <div
        className={`dropzone${dragging ? ' dropzone--active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <UploadIcon />
        <span>{uploading ? 'Uploading…' : 'Drag files here, or'}</span>
        <button type="button" className="button--ghost" disabled={uploading} onClick={() => inputRef.current?.click()}>
          Choose files
        </button>
        <span className="muted small">Up to 25 MB each</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) onUpload(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {files === null ? (
        <p className="muted">Loading…</p>
      ) : files.length === 0 ? (
        <p className="muted">No files yet.</p>
      ) : (
        <ul className="file-list card">
          {files.map((f) => (
            <li key={f.id}>
              <span className="file-list__icon"><FileIcon /></span>
              <div className="file-list__text">
                <span className="file-list__name">{f.name}</span>
                <span className="muted small">
                  {formatSize(f.size)} · {f.uploaded_by ? shortName(memberName(f.uploaded_by)) : 'Unknown'} · {timeAgo(f.created_at)}
                </span>
              </div>
              <button type="button" className="icon-button" title="Download" aria-label={`Download ${f.name}`} onClick={() => onOpen(f)}>
                <DownloadIcon />
              </button>
              {(f.uploaded_by === currentUserId || isManager) && (
                <button
                  type="button"
                  className="icon-button"
                  title="Delete"
                  aria-label={`Delete ${f.name}`}
                  onClick={() => confirm(`Delete ${f.name}?`) && onDelete(f)}
                >
                  <TrashIcon />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
