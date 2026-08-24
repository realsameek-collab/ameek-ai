import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { closeArtifact, toggleExpanded } from '../redux/artifactSlice'
import SlidePreview from './SlidePreview'

const ZOOMS = [
  { label: 'Fit', value: 0 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
]

function PptArtifact({ artifact, expanded }) {
  const dispatch = useDispatch()
  const [current, setCurrent] = useState(0)
  const [zoom, setZoom] = useState(0)
  const railRef = useRef(null)

  // cover slide sits at index 0, then the generated slides
  const pages = useMemo(() => {
    const slides = Array.isArray(artifact?.slides) ? artifact.slides : []
    return [{ cover: true }, ...slides.map((s) => ({ slide: s }))]
  }, [artifact])

  const total = pages.length
  const safeIndex = Math.min(current, total - 1)

  const go = (next) => setCurrent(Math.max(0, Math.min(total - 1, next)))

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(safeIndex + 1) }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(safeIndex - 1) }
      if (e.key === 'Escape') dispatch(closeArtifact())
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [safeIndex, total, dispatch])

  // keep the active thumbnail in view as the user pages through
  useEffect(() => {
    const rail = railRef.current
    const active = rail?.querySelector(`[data-thumb="${safeIndex}"]`)
    active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [safeIndex])

  const iconBtn = `flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent
    cursor-pointer text-slate-500 hover:text-slate-200 hover:bg-white/[0.07] disabled:opacity-30
    disabled:cursor-not-allowed transition-[color,background-color,transform] duration-200 ease-premium
    active:scale-[0.94] outline-none focus-visible:focus-ring`

  const zoomStyle = zoom === 0
    ? { width: '100%' }
    : { width: `${zoom * 100}%`, maxWidth: '100%' }

  return (
    <>
      <div className='flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] shrink-0'>
        <p className='flex-1 min-w-0 truncate text-[12.5px] text-slate-300'>
          <span className='font-medium text-slate-200'>{artifact.title}</span>
          <span className='text-slate-600'> · </span>
          <span className='text-slate-500'>PPTX</span>
        </p>

        <div className='flex items-center gap-0.5 shrink-0'>
          <button type='button' onClick={() => go(safeIndex - 1)} disabled={safeIndex === 0}
            aria-label='Previous slide' className={iconBtn}>
            <ChevronLeft size={16} />
          </button>
          <span className='px-1 text-[12px] tabular-nums text-slate-400 select-none'>
            {safeIndex + 1}/{total}
          </span>
          <button type='button' onClick={() => go(safeIndex + 1)} disabled={safeIndex === total - 1}
            aria-label='Next slide' className={iconBtn}>
            <ChevronRight size={16} />
          </button>

          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label='Zoom'
            className='ml-1 h-8 rounded-lg border border-white/[0.08] bg-transparent px-1.5 text-[12px]
              text-slate-400 outline-none cursor-pointer focus-visible:focus-ring
              [&>option]:bg-[#0d0f14] [&>option]:text-slate-200'
          >
            {ZOOMS.map((z) => <option key={z.label} value={z.value}>{z.label}</option>)}
          </select>

          <a
            href={artifact.downloadUrl}
            download
            aria-label='Download presentation'
            className={`${iconBtn} no-underline`}
          >
            <Download size={15} />
          </a>
          <button type='button' onClick={() => dispatch(toggleExpanded())}
            aria-label={expanded ? 'Restore panel' : 'Expand panel'} className={iconBtn}>
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button type='button' onClick={() => dispatch(closeArtifact())}
            aria-label='Close artifact' className={iconBtn}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className='flex flex-1 min-h-0'>
        <div
          ref={railRef}
          className='hidden sm:block w-[132px] shrink-0 overflow-y-auto overscroll-contain border-r border-white/[0.06]
            p-2.5 space-y-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full'
        >
          {pages.map((p, i) => (
            <button
              key={i}
              type='button'
              data-thumb={i}
              onClick={() => go(i)}
              className='flex w-full items-start gap-1.5 border-none bg-transparent p-0 cursor-pointer
                outline-none focus-visible:focus-ring'
            >
              <span className={`w-3 shrink-0 pt-1 text-[10px] tabular-nums
                ${i === safeIndex ? 'text-indigo-400' : 'text-slate-600'}`}>
                {i + 1}
              </span>
              <span
                className={`block flex-1 aspect-video overflow-hidden rounded-md border transition-[border-color] duration-200 ease-premium
                  ${i === safeIndex ? 'border-indigo-500' : 'border-white/[0.08] hover:border-white/20'}`}
                style={{ containerType: 'inline-size' }}
              >
                <SlidePreview
                  slide={p.slide}
                  cover={p.cover}
                  index={i}
                  total={total - 1}
                  title={artifact.title}
                  subtitle={artifact.subtitle}
                />
              </span>
            </button>
          ))}
        </div>

        <div className='flex-1 min-w-0 overflow-auto bg-[#0a0c11] p-4 flex items-center justify-center'>
          <div
            className='aspect-video shadow-ambient-lg rounded-md overflow-hidden animate-fade-in'
            style={{ ...zoomStyle, containerType: 'inline-size' }}
          >
            <SlidePreview
              slide={pages[safeIndex]?.slide}
              cover={pages[safeIndex]?.cover}
              index={safeIndex}
              total={total - 1}
              title={artifact.title}
              subtitle={artifact.subtitle}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default PptArtifact
