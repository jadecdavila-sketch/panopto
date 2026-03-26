import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { MindMap, MindMapNode } from '../../types/domain'
import { getKTPerformance, computeNeedsReview } from '../../utils/ktPerformance'

interface MindMapViewerProps {
  mindMap: MindMap
  onNodeClick?: (node: MindMapNode) => void
}

interface NodePosition {
  node: MindMapNode
  x: number
  y: number
  type: 'root' | 'branch' | 'leaf'
}

interface EdgeDef {
  x1: number
  y1: number
  x2: number
  y2: number
  type: 'branch' | 'leaf'
}

const BRANCH_RADIUS = 200
const LEAF_OFFSET = 120
const LEAF_SPREAD_DEG = 15

function computeLayout(mindMap: MindMap): {
  positions: NodePosition[]
  edges: EdgeDef[]
} {
  const positions: NodePosition[] = []
  const edges: EdgeDef[] = []
  const posMap = new Map<string, { x: number; y: number }>()

  // Find root
  const root = mindMap.nodes.find((n) => n.parentId === null)
  if (!root) return { positions, edges }

  const cx = 0
  const cy = 0
  positions.push({ node: root, x: cx, y: cy, type: 'root' })
  posMap.set(root.id, { x: cx, y: cy })

  // Branch nodes (children of root)
  const branches = mindMap.nodes.filter((n) => n.parentId === root.id)
  const branchCount = branches.length

  branches.forEach((branch, i) => {
    const angle = (2 * Math.PI * i) / branchCount - Math.PI / 2
    const bx = cx + BRANCH_RADIUS * Math.cos(angle)
    const by = cy + BRANCH_RADIUS * Math.sin(angle)

    positions.push({ node: branch, x: bx, y: by, type: 'branch' })
    posMap.set(branch.id, { x: bx, y: by })
    edges.push({ x1: cx, y1: cy, x2: bx, y2: by, type: 'branch' })

    // Leaf nodes (children of this branch)
    const leaves = mindMap.nodes.filter((n) => n.parentId === branch.id)
    const leafCount = leaves.length

    leaves.forEach((leaf, li) => {
      const spreadRad = (LEAF_SPREAD_DEG * Math.PI) / 180
      const centerAngle = angle
      const leafAngle =
        leafCount === 1
          ? centerAngle
          : centerAngle -
            ((leafCount - 1) * spreadRad) / 2 +
            li * spreadRad

      const lx = bx + LEAF_OFFSET * Math.cos(leafAngle)
      const ly = by + LEAF_OFFSET * Math.sin(leafAngle)

      positions.push({ node: leaf, x: lx, y: ly, type: 'leaf' })
      posMap.set(leaf.id, { x: lx, y: ly })
      edges.push({ x1: bx, y1: by, x2: lx, y2: ly, type: 'leaf' })
    })
  })

  return { positions, edges }
}

export function MindMapViewer({ mindMap, onNodeClick }: MindMapViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Pan & zoom state
  const [viewBox, setViewBox] = useState({
    x: -500,
    y: -400,
    width: 1000,
    height: 800,
  })
  const [isPanningState, setIsPanningState] = useState(false)
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const viewBoxStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: skip animation for reduced-motion users
      setMounted(true)
    } else {
      requestAnimationFrame(() => setMounted(true))
    }
  }, [])

  const { positions, edges } = computeLayout(mindMap)

  // Compute which KT nodes need review
  const reviewSet = useMemo(() => {
    const ids = new Set<string>()
    for (const node of mindMap.nodes) {
      if (node.ktId) {
        const record = getKTPerformance(node.ktId)
        if (computeNeedsReview(record)) {
          ids.add(node.id)
        }
      }
    }
    return ids
  }, [mindMap.nodes])


  /* ---------------------------------------------------------------- */
  /*  Pan handlers                                                     */
  /* ---------------------------------------------------------------- */

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isPanning.current = true
      setIsPanningState(true)
      panStart.current = { x: e.clientX, y: e.clientY }
      viewBoxStart.current = { x: viewBox.x, y: viewBox.y }
    },
    [viewBox.x, viewBox.y],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning.current || !svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const scaleX = viewBox.width / rect.width
      const scaleY = viewBox.height / rect.height
      const dx = (e.clientX - panStart.current.x) * scaleX
      const dy = (e.clientY - panStart.current.y) * scaleY
      setViewBox((prev) => ({
        ...prev,
        x: viewBoxStart.current.x - dx,
        y: viewBoxStart.current.y - dy,
      }))
    },
    [viewBox.width, viewBox.height],
  )

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
    setIsPanningState(false)
  }, [])

  /* ---------------------------------------------------------------- */
  /*  Zoom handler                                                     */
  /* ---------------------------------------------------------------- */

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9

    setViewBox((prev) => {
      const newWidth = prev.width * zoomFactor
      const newHeight = prev.height * zoomFactor
      const dw = newWidth - prev.width
      const dh = newHeight - prev.height
      return {
        x: prev.x - dw / 2,
        y: prev.y - dh / 2,
        width: newWidth,
        height: newHeight,
      }
    })
  }, [])

  /* ---------------------------------------------------------------- */
  /*  Touch handlers for mobile                                        */
  /* ---------------------------------------------------------------- */

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        isPanning.current = true
        setIsPanningState(true)
        panStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        }
        viewBoxStart.current = { x: viewBox.x, y: viewBox.y }
      }
    },
    [viewBox.x, viewBox.y],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPanning.current || e.touches.length !== 1 || !svgRef.current)
        return
      const rect = svgRef.current.getBoundingClientRect()
      const scaleX = viewBox.width / rect.width
      const scaleY = viewBox.height / rect.height
      const dx = (e.touches[0].clientX - panStart.current.x) * scaleX
      const dy = (e.touches[0].clientY - panStart.current.y) * scaleY
      setViewBox((prev) => ({
        ...prev,
        x: viewBoxStart.current.x - dx,
        y: viewBoxStart.current.y - dy,
      }))
    },
    [viewBox.width, viewBox.height],
  )

  const handleTouchEnd = useCallback(() => {
    isPanning.current = false
    setIsPanningState(false)
  }, [])

  /* ---------------------------------------------------------------- */
  /*  Node click                                                       */
  /* ---------------------------------------------------------------- */

  function handleNodeClick(node: MindMapNode) {
    if (node.ktId && onNodeClick) {
      onNodeClick(node)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  function renderEdge(edge: EdgeDef, i: number) {
    if (edge.type === 'branch') {
      // Quadratic bezier
      const mx = (edge.x1 + edge.x2) / 2
      const ctrlX = mx
      const ctrlY = edge.y1
      return (
        <path
          key={`edge-${i}`}
          d={`M ${edge.x1} ${edge.y1} Q ${ctrlX} ${ctrlY} ${edge.x2} ${edge.y2}`}
          fill="none"
          stroke="#E8E8E8"
          strokeWidth="2"
        />
      )
    }
    return (
      <line
        key={`edge-${i}`}
        x1={edge.x1}
        y1={edge.y1}
        x2={edge.x2}
        y2={edge.y2}
        stroke="#E8E8E8"
        strokeWidth="2"
      />
    )
  }

  function renderNode(pos: NodePosition, i: number) {
    const isHovered = hoveredId === pos.node.id
    const isClickable = !!pos.node.ktId && !!onNodeClick
    const opacity = mounted ? 1 : 0

    if (pos.type === 'root') {
      const rw = 160
      const rh = 48
      return (
        <g
          key={pos.node.id}
          style={{
            opacity,
            transition: 'opacity 0.4s ease-out',
          }}
        >
          <rect
            x={pos.x - rw / 2}
            y={pos.y - rh / 2}
            width={rw}
            height={rh}
            rx={12}
            fill="#004232"
            stroke={isHovered ? '#2AC271' : 'none'}
            strokeWidth={2}
          />
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="14"
            fontWeight="600"
            className="pointer-events-none select-none"
          >
            {truncate(pos.node.label, 20)}
          </text>
        </g>
      )
    }

    if (pos.type === 'branch') {
      const rw = 140
      const rh = 36
      const needsReviewFlag = reviewSet.has(pos.node.id)
      return (
        <g
          key={pos.node.id}
          style={{
            opacity,
            transition: `opacity 0.4s ease-out ${i * 50}ms`,
            cursor: isClickable ? 'pointer' : 'default',
          }}
          role={isClickable ? 'button' : undefined}
          tabIndex={isClickable ? 0 : undefined}
          aria-label={
            isClickable
              ? `View details for ${pos.node.label}`
              : pos.node.label
          }
          onClick={() => handleNodeClick(pos.node)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleNodeClick(pos.node)
            }
          }}
          onMouseEnter={() => setHoveredId(pos.node.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <rect
            x={pos.x - rw / 2}
            y={pos.y - rh / 2}
            width={rw}
            height={rh}
            rx={10}
            fill={needsReviewFlag ? '#FEF3C7' : '#2AC271'}
            stroke={needsReviewFlag ? '#F59E0B' : isHovered ? '#004232' : 'none'}
            strokeWidth={2}
          />
          {needsReviewFlag && (
            <text
              x={pos.x - rw / 2 + 10}
              y={pos.y}
              textAnchor="start"
              dominantBaseline="central"
              fill="#F59E0B"
              fontSize="12"
              className="pointer-events-none select-none"
            >
              ⚠
            </text>
          )}
          <text
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#1A1A1A"
            fontSize="11"
            fontWeight="500"
            className="pointer-events-none select-none"
          >
            {truncate(pos.node.label, 18)}
          </text>
        </g>
      )
    }

    // Leaf
    const rw = 100
    const rh = 28
    const needsReviewFlag = reviewSet.has(pos.node.id)
    return (
      <g
        key={pos.node.id}
        style={{
          opacity,
          transition: `opacity 0.4s ease-out ${i * 50 + 100}ms`,
        }}
        onMouseEnter={() => setHoveredId(pos.node.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <rect
          x={pos.x - rw / 2}
          y={pos.y - rh / 2}
          width={rw}
          height={rh}
          rx={14}
          fill={needsReviewFlag ? '#FEF3C7' : '#F5F5F5'}
          stroke={needsReviewFlag ? '#F59E0B' : isHovered ? '#D0D0D0' : '#E8E8E8'}
          strokeWidth={needsReviewFlag ? 1.5 : 1}
        />
        {needsReviewFlag && (
          <text
            x={pos.x - rw / 2 + 8}
            y={pos.y}
            textAnchor="start"
            dominantBaseline="central"
            fill="#F59E0B"
            fontSize="10"
            className="pointer-events-none select-none"
          >
            ⚠
          </text>
        )}
        <text
          x={needsReviewFlag ? pos.x + 4 : pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#6B6B6B"
          fontSize="10"
          className="pointer-events-none select-none"
        >
          {truncate(pos.node.label, needsReviewFlag ? 12 : 14)}
        </text>
      </g>
    )
  }

  function truncate(text: string, maxLen: number): string {
    return text.length > maxLen ? text.slice(0, maxLen - 1) + '\u2026' : text
  }

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        aria-label={`Mind map: ${mindMap.title}`}
        role="img"
        className="select-none"
        style={{ cursor: isPanningState ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Edges */}
        {edges.map((edge, i) => renderEdge(edge, i))}

        {/* Nodes */}
        {positions.map((pos, i) => renderNode(pos, i))}
      </svg>

    </div>
  )
}
