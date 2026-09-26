/**
 * RadialMenuRuntime.tsx
 * 
 * Standalone runtime component for Radial Menu system
 * Extracted from ElementEditor.tsx - contains only rendering and animation logic
 * No editor UI - perfect for embedding in YouTube player app
 * 
 * USAGE:
 * 1. Copy this file to your YouTube player project as components/RadialMenuRuntime.tsx
 * 2. Copy the required functions from ElementEditor.tsx (see EXTRACTION_GUIDE.md)
 * 3. Install dependencies: npm install gsap perspective-transform
 * 4. Import and use in your app
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import PerspectiveTransform from 'perspective-transform'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Point {
  x: number
  y: number
}

interface Container {
  id: string
  bundleId: string
  name: string
  points: Point[]
  color: string
  contentColor: string
  fontColor: string
  imageUrl: string | null
  aboveContainerId: string | null
  belowContainerId: string | null
  aboveTeleportContainerId: string | null
  belowTeleportContainerId: string | null
  teleportType: 'top' | 'bottom' | 'button' | 'toggle' | null
}

interface Bundle {
  id: string
  name: string
}

interface ContentElement {
  id: string
  bundleId: string
  containerId: string
  itemIndex?: number
  text: string
  color: string
  fontColor: string
  imageUrl: string | null
  points: Point[]
  opacity: number
}

interface LetterData {
  guidePoints: {
    TL: [number, number]
    TR: [number, number]
    BR: [number, number]
    BL: [number, number]
    Center: [number, number]
  }
  svgPathD: string
}

interface ContainerConfig {
  containers: Container[]
  bundles: Bundle[]
  viewportBox: { x: number; y: number; width: number; height: number } | null
  defaultColor: string
}

interface RadialMenuRuntimeProps {
  config: ContainerConfig
  canvasWidth: number
  canvasHeight: number
  onClose?: () => void
  dictionaryUrl?: string // Default: '/dictionary.json'
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RadialMenuRuntime({
  config,
  canvasWidth,
  canvasHeight,
  onClose,
  dictionaryUrl = '/dictionary.json'
}: RadialMenuRuntimeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  
  // State
  const [containers, setContainers] = useState<Container[]>(config.containers)
  const [bundles, setBundles] = useState<Bundle[]>(config.bundles)
  const [contentElements, setContentElements] = useState<ContentElement[]>([])
  const [dictionary, setDictionary] = useState<Record<string, LetterData>>({})
  const [isAnimating, setIsAnimating] = useState(false)
  const [viewportBox] = useState(config.viewportBox)
  
  // Refs for animation management
  const animationRefs = useRef<Record<string, gsap.core.Tween[]>>({})
  const contentElementsRef = useRef<ContentElement[]>([])
  const scrollThrottleRef = useRef<number | null>(null)
  
  // Keep ref in sync with state
  useEffect(() => {
    contentElementsRef.current = contentElements
  }, [contentElements])

  // Load dictionary
  useEffect(() => {
    fetch(dictionaryUrl)
      .then(res => res.json())
      .then(data => {
        const { description, unitSize, ...letters } = data
        setDictionary(letters)
      })
      .catch(err => {
        console.error('Failed to load dictionary:', err)
      })
  }, [dictionaryUrl])

  // Initialize content elements from config (enter animate mode)
  useEffect(() => {
    if (containers.length === 0 || bundles.length === 0) return
    
    // TODO: Copy enterAnimateMode logic from ElementEditor.tsx (lines 854-1053)
    // This creates content elements from containers and sets up teleport duplicates
    
    const initializeElements = () => {
      const allNewContentElements: ContentElement[] = []
      
      bundles.forEach(bundle => {
        const bundleContainers = containers.filter(c => c.bundleId === bundle.id)
        const normalContainers = bundleContainers.filter(c => c.teleportType === null)
        
        // Create one element per normal container
        normalContainers.forEach((container, index) => {
          allNewContentElements.push({
            id: `content-${container.id}`,
            bundleId: bundle.id,
            containerId: container.id,
            text: container.name.replace('Container', 'Item'),
            color: container.contentColor,
            fontColor: container.fontColor,
            imageUrl: container.imageUrl,
            points: [...container.points],
            opacity: 1
          })
        })
        
        // Create teleport duplicates for wrap-around
        const topTeleportContainer = bundleContainers.find(c => c.teleportType === 'top')
        const bottomTeleportContainer = bundleContainers.find(c => c.teleportType === 'bottom')
        
        if (topTeleportContainer && normalContainers.length > 0) {
          const bottomElement = allNewContentElements.find(
            ce => ce.containerId === normalContainers[normalContainers.length - 1]?.id
          )
          if (bottomElement) {
            allNewContentElements.push({
              id: `teleport-top-${topTeleportContainer.id}`,
              bundleId: bundle.id,
              containerId: topTeleportContainer.id,
              text: bottomElement.text,
              color: bottomElement.color,
              fontColor: bottomElement.fontColor,
              imageUrl: bottomElement.imageUrl,
              points: [...topTeleportContainer.points],
              opacity: 0
            })
          }
        }
        
        if (bottomTeleportContainer && normalContainers.length > 0) {
          const topElement = allNewContentElements.find(
            ce => ce.containerId === normalContainers[0]?.id
          )
          if (topElement) {
            allNewContentElements.push({
              id: `teleport-bottom-${bottomTeleportContainer.id}`,
              bundleId: bundle.id,
              containerId: bottomTeleportContainer.id,
              text: topElement.text,
              color: topElement.color,
              fontColor: topElement.fontColor,
              imageUrl: topElement.imageUrl,
              points: [...bottomTeleportContainer.points],
              opacity: 0
            })
          }
        }
      })
      
      setContentElements(allNewContentElements)
    }
    
    initializeElements()
  }, [containers, bundles])

  // ============================================================================
  // ANIMATION FUNCTIONS
  // ============================================================================
  
  // TODO: Copy animateContentMorph from ElementEditor.tsx (lines 1266-1347)
  // This handles GSAP-based morphing animations
  const animateContentMorph = useCallback((
    contentElementId: string,
    targetContainerId: string,
    duration: number = 1
  ): Promise<void> => {
    return new Promise((resolve) => {
      const contentElement = contentElementsRef.current.find(ce => ce.id === contentElementId)
      const targetContainer = containers.find(c => c.id === targetContainerId)
      
      if (!contentElement || !targetContainer) {
        resolve()
        return
      }
      
      // Kill existing animations
      if (animationRefs.current[contentElementId]) {
        animationRefs.current[contentElementId].forEach(tween => tween.kill())
      }
      animationRefs.current[contentElementId] = []
      
      // Animate each point
      const tweens: gsap.core.Tween[] = []
      contentElement.points.forEach((point, index) => {
        const targetPoint = targetContainer.points[index]
        const proxy = { x: point.x, y: point.y }
        
        const tween = gsap.to(proxy, {
          x: targetPoint.x,
          y: targetPoint.y,
          duration: duration,
          ease: 'power2.inOut',
          onUpdate: () => {
            setContentElements(prev => prev.map(ce => {
              if (ce.id === contentElementId) {
                const newPoints = [...ce.points]
                newPoints[index] = { x: proxy.x, y: proxy.y }
                return { ...ce, points: newPoints }
              }
              return ce
            }))
          }
        })
        
        tweens.push(tween)
      })
      
      animationRefs.current[contentElementId] = tweens
      
      // Wait for all animations to complete
      let completedCount = 0
      tweens.forEach(tween => {
        tween.eventCallback('onComplete', () => {
          completedCount++
          if (completedCount === tweens.length) {
            resolve()
          }
        })
      })
    })
  }, [containers])

  // TODO: Copy animateDirection from ElementEditor.tsx (lines 1699-2330)
  // This handles scroll up/down animations with wrap-around support
  const animateDirection = useCallback((direction: 'up' | 'down', scrollSpeed?: number) => {
    if (isAnimating) return
    
    // Calculate duration from scroll speed (if provided)
    const minDuration = 0.2
    const maxDuration = 2
    const defaultDuration = 1
    let duration = defaultDuration
    
    if (scrollSpeed !== undefined) {
      const maxSpeed = 100
      const speedRatio = Math.min(scrollSpeed / maxSpeed, 1)
      duration = maxDuration / (1 + speedRatio * 4) // Inverse relationship
      duration = Math.max(minDuration, Math.min(maxDuration, duration))
    }
    
    // TODO: Implement full animation logic with wrap-around support
    // See ElementEditor.tsx lines 1699-2330 for complete implementation
    
    setIsAnimating(true)
    // ... animation logic here ...
    setIsAnimating(false)
  }, [isAnimating, containers, contentElements, bundles])

  // ============================================================================
  // RENDERING FUNCTIONS
  // ============================================================================
  
  // TODO: Copy drawTransformedPath from ElementEditor.tsx (lines 2530-2745)
  // This handles perspective warping of SVG text paths
  const drawTransformedPath = useCallback((
    ctx: CanvasRenderingContext2D,
    svgPath: string,
    sourceQuad: [number, number, number, number, number, number, number, number],
    destQuad: [number, number, number, number, number, number, number, number]
  ) => {
    const perspT = new PerspectiveTransform(sourceQuad, destQuad)
    
    const transformPoint = (x: number, y: number): [number, number] => {
      const result = perspT.transform(x, y)
      if (Array.isArray(result) && result.length >= 2) {
        return [result[0], result[1]]
      }
      return [x, y]
    }
    
    // TODO: Copy full SVG path parsing logic from ElementEditor.tsx
    // This includes support for M, L, Z, A, C, H, V commands
    
    ctx.beginPath()
    // ... path drawing logic ...
    ctx.fill('evenodd' as CanvasFillRule)
    ctx.stroke()
  }, [])

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Draw background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Clip to viewport if in animate mode
    if (viewportBox) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(viewportBox.x, viewportBox.y, viewportBox.width, viewportBox.height)
      ctx.clip()
    }

    // Draw content elements
    contentElements.forEach(element => {
      if (element.opacity === 0) return
      
      const container = containers.find(c => c.id === element.containerId)
      if (!container) return
      
      ctx.save()
      ctx.globalAlpha = element.opacity
      
      // Draw element shape
      ctx.fillStyle = element.color
      ctx.strokeStyle = element.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(element.points[0].x, element.points[0].y)
      for (let i = 1; i < element.points.length; i++) {
        ctx.lineTo(element.points[i].x, element.points[i].y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      
      // Draw text with perspective warping
      if (element.text && dictionary[element.text[0]]) {
        const letterData = dictionary[element.text[0]]
        const sourceQuad: [number, number, number, number, number, number, number, number] = [
          0, 0, 100, 0, 100, 100, 0, 100
        ]
        const destQuad: [number, number, number, number, number, number, number, number] = [
          element.points[0].x, element.points[0].y,
          element.points[1].x, element.points[1].y,
          element.points[2].x, element.points[2].y,
          element.points[3].x, element.points[3].y
        ]
        
        ctx.fillStyle = element.fontColor
        ctx.strokeStyle = element.fontColor
        drawTransformedPath(ctx, letterData.svgPathD, sourceQuad, destQuad)
      }
      
      ctx.restore()
    })

    if (viewportBox) {
      ctx.restore()
    }
  }, [contentElements, containers, canvasWidth, canvasHeight, viewportBox, dictionary, drawTransformedPath])

  // ============================================================================
  // SCROLL WHEEL HANDLING
  // ============================================================================
  
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isAnimating) return
    
    e.preventDefault()
    
    if (scrollThrottleRef.current !== null) return
    
    const direction = e.deltaY < 0 ? 'up' : 'down'
    const scrollSpeed = Math.abs(e.deltaY)
    
    animateDirection(direction, scrollSpeed)
    
    scrollThrottleRef.current = window.setTimeout(() => {
      scrollThrottleRef.current = null
    }, 100)
  }, [isAnimating, animateDirection])

  useEffect(() => {
    const canvasContainer = canvasContainerRef.current
    if (!canvasContainer) return

    canvasContainer.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvasContainer.removeEventListener('wheel', handleWheel)
      if (scrollThrottleRef.current !== null) {
        clearTimeout(scrollThrottleRef.current)
        scrollThrottleRef.current = null
      }
    }
  }, [handleWheel])

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div
      ref={canvasContainerRef}
      style={{
        position: 'relative',
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        cursor: 'default'
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Optional: Close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '0.5rem 1rem',
            backgroundColor: '#ff6b6b',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 1001
          }}
        >
          Close
        </button>
      )}
    </div>
  )
}

