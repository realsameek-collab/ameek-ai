import React, { useEffect, useMemo, useState } from 'react'
import { Check, Code2, Copy, Eye, Maximize2, Minimize2, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { closeArtifact, setView, toggleExpanded } from '../redux/artifactSlice'
import { toDocument } from '../utils/detectArtifact'
import PptArtifact from './PptArtifact'

function Artifact() {
  const dispatch = useDispatch()
  const { artifact, open, view, expanded } = useSelector((state) => state.artifact)
  const [copied, setCopied] = useState(false)

  // nothing generated yet, or the user closed it - reserve no space at all
  const visible = Boolean(artifact) && open

  const isPpt = artifact?.type === 'ppt'

  const srcDoc = useMemo(
    () => (artifact && !isPpt ? toDocument(artifact.code) : ''),
    [artifact, isPpt]
  )

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (!visible) return
    const onKeyDown = (e) => { if (e.key === 'Escape') dispatch(closeArtifact()) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [visible, dispatch])

  if (!visible) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.code ?? '')
      setCopied(true)
    } catch {
      // clipboard unavailable outside a secure context - fail quietly
    }
  }

  const tab = (active) => `flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium
    border-none cursor-pointer outline-none focus-visible:focus-ring
    transition-[background-color,color] duration-200 ease-premium
    ${active ? 'bg-white/[0.09] text-slate-100' : 'bg-transparent text-slate-500 hover:text-slate-300'}`

  const iconBtn = `flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent
    cursor-pointer text-slate-500 hover:text-slate-200 hover:bg-white/[0.07]
    transition-[color,background-color,transform] duration-200 ease-premium
    active:scale-[0.94] outline-none focus-visible:focus-ring`

  return (
    <div
      className={`flex flex-col shrink-0 bg-[#0d0f14] border-white/[0.06] overflow-hidden
        animate-fade-in
        ${expanded
          ? 'fixed inset-0 z-[90] border-0'
          : 'fixed inset-0 z-[90] lg:static lg:z-auto lg:h-full lg:border-l lg:w-[46%] lg:max-w-[720px]'}`}
    >
      {isPpt ? <PptArtifact artifact={artifact} expanded={expanded} /> : (<>
      <div className='flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0'>
        <div className='flex items-center gap-0.5 shrink-0'>
          <button type='button' onClick={() => dispatch(setView('preview'))} className={tab(view === 'preview')}>
            <Eye size={13} /> Preview
          </button>
          <button type='button' onClick={() => dispatch(setView('code'))} className={tab(view === 'code')}>
            <Code2 size={13} /> Code
          </button>
        </div>

        <div className='flex-1 min-w-0 px-1 text-center'>
          <p className='truncate text-[12.5px] text-slate-300'>
            <span className='font-medium text-slate-200'>{artifact.title}</span>
            <span className='text-slate-600'> · </span>
            <span className='text-slate-500'>{artifact.language}</span>
          </p>
        </div>

        <div className='flex items-center gap-0.5 shrink-0'>
          <button type='button' onClick={handleCopy} aria-label={copied ? 'Copied' : 'Copy code'} className={iconBtn}>
            {copied ? <Check size={15} className='text-emerald-400' /> : <Copy size={15} />}
          </button>
          <button
            type='button'
            onClick={() => dispatch(toggleExpanded())}
            aria-label={expanded ? 'Restore panel' : 'Expand panel'}
            className={iconBtn}
          >
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button type='button' onClick={() => dispatch(closeArtifact())} aria-label='Close artifact' className={iconBtn}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className='relative flex-1 min-h-0'>
        {view === 'preview' ? (
          <iframe
            key={srcDoc.length}
            title={artifact.title}
            srcDoc={srcDoc}
            sandbox='allow-scripts allow-forms allow-modals allow-popups'
            className='w-full h-full border-0 bg-white animate-fade-in'
          />
        ) : (
          <pre className='w-full h-full m-0 overflow-auto px-4 py-3 bg-[#0a0c11] text-[12.5px]
            leading-relaxed text-slate-200 animate-fade-in
            [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5
            [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full'>
            <code className='font-mono'>{artifact.code}</code>
          </pre>
        )}
      </div>
      </>)}
    </div>
  )
}

export default Artifact
