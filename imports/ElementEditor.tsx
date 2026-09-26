'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import PerspectiveTransform from 'perspective-transform'

interface Point {
  x: number
  y: number
}

interface Bundle {
  id: string
  name: string
}

interface Container {
  id: string
  bundleId: string // Which bundle this container belongs to
  name: string
  points: Point[]
  color: string
  contentColor: string // Fill color for the content element shape
  fontColor: string // Color for the text/font in the content element
  imageUrl: string | null // Image URL (data URL) for the content element
  aboveContainerId: string | null // Which container is above this one (within same bundle)
  belowContainerId: string | null // Which container is below this one (within same bundle)
  aboveTeleportContainerId: string | null // Which container to teleport to when going up (instant, no morph)
  belowTeleportContainerId: string | null // Which container to teleport to when going down (instant, no morph)
  teleportType: 'top' | 'bottom' | 'button' | 'toggle' | null // Special container type for wrap-around animations or button
}

interface Item {
  id: string
  text: string
  color: string
  fontColor: string
  imageUrl: string | null
}

interface ContentElement {
  id: string
  bundleId: string // Which bundle this content element belongs to
  containerId: string // Which container this content is currently in
  itemIndex?: number // Index in the items array (for scrolling list support, optional)
  text: string // Text to display (will be warped with perspective)
  color: string // Fill color for the element shape
  fontColor: string // Color for the text/font
  imageUrl: string | null // Image URL (data URL) for the element
  points: Point[] // Will match container's points
  opacity: number // Opacity for fade in/out effects (0-1)
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

export default function ElementEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bundles, setBundles] = useState<Bundle[]>([
    { id: 'bundle-1', name: 'Bundle 1' }
  ])
  const [selectedBundleId, setSelectedBundleId] = useState<string>('bundle-1')
  const [containers, setContainers] = useState<Container[]>([
    {
      id: 'container-1',
      bundleId: 'bundle-1',
      name: 'Container 1',
      points: [
        { x: 200, y: 200 },
        { x: 800, y: 200 },
        { x: 800, y: 600 },
        { x: 200, y: 600 },
      ],
      color: '#1a1a1a',
      contentColor: '#1a1a1a', // Default fill color same as container color
      fontColor: '#ffffff', // Default font color (white for contrast)
      imageUrl: null, // Default no image
      aboveContainerId: null,
      belowContainerId: null,
      aboveTeleportContainerId: null,
      belowTeleportContainerId: null,
      teleportType: null
    }
  ])
  const [contentElements, setContentElements] = useState<ContentElement[]>([])
  // Items are now bundle-specific, stored in bundleItems state
  const [visibleStartIndex, setVisibleStartIndex] = useState<Record<string, number>>({}) // Track which items are visible per bundle (start index)
  const [isAnimateMode, setIsAnimateMode] = useState(false)
  const [selectedContainerId, setSelectedContainerId] = useState<string>('container-1')
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null)
  const [imagePosition, setImagePosition] = useState<Point>({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 1200, height: 1000 })
  const [isResizingImage, setIsResizingImage] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null)
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<'se' | 'sw' | 'ne' | 'nw' | null>(null)
  const [defaultColor, setDefaultColor] = useState<string>('#1a1a1a')
  const [hoverColor, setHoverColor] = useState<string | null>(null) // Override color for hover state
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null) // Currently hovered content element
  const [cascadeDelay, setCascadeDelay] = useState<number>(0.4) // Delay between elements in initialization animation (0 to 2 seconds)
  const [isAnimating, setIsAnimating] = useState(false)
  const [elementsVisible, setElementsVisible] = useState<boolean>(true) // Global visibility state for toggle button
  const originalOpacitiesRef = useRef<Map<string, number>>(new Map()) // Store original opacities for toggle button
  const animationRefs = useRef<Record<string, gsap.core.Tween[]>>({})
  const contentElementsRef = useRef<ContentElement[]>([])
  const [initializedBundles, setInitializedBundles] = useState<Set<string>>(new Set()) // Track which bundles have completed initialization
  const triggerButtonAnimationRef = useRef<((bundleId: string) => Promise<void>) | null>(null)
  const triggerClosingAnimationRef = useRef<((bundleId: string) => Promise<void>) | null>(null)
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map()) // Cache loaded images
  
  // Keep ref in sync with state
  useEffect(() => {
    contentElementsRef.current = contentElements
  }, [contentElements])
  const [draggedContainerId, setDraggedContainerId] = useState<string | null>(null)
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null)
  const [viewportBox, setViewportBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDraggingViewport, setIsDraggingViewport] = useState(false)
  const [viewportDragStart, setViewportDragStart] = useState<Point | null>(null)
  const [isResizingViewport, setIsResizingViewport] = useState(false)
  const [viewportResizeHandle, setViewportResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const [hoveredViewportHandle, setHoveredViewportHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const [hitbox, setHitbox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDraggingHitbox, setIsDraggingHitbox] = useState(false)
  const [hitboxDragStart, setHitboxDragStart] = useState<Point | null>(null)
  const [isResizingHitbox, setIsResizingHitbox] = useState(false)
  const [hitboxResizeHandle, setHitboxResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const [hoveredHitboxHandle, setHoveredHitboxHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const scrollThrottleRef = useRef<number | null>(null)
  const dictionaryFileInputRef = useRef<HTMLInputElement>(null)
  const [dictionary, setDictionary] = useState<Record<string, LetterData>>({})

  const canvasWidth = 1200
  const canvasHeight = 1000

  // Load dictionary on mount
  useEffect(() => {
    fetch('/dictionary.json')
      .then(res => res.json())
      .then(data => {
        // Remove description and unitSize from the dictionary
        const { description, unitSize, ...letters } = data
        
        // Initialize numbers 0-9 if they don't exist in the dictionary
        const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        numbers.forEach(num => {
          if (!letters[num]) {
            // Create default empty entry for numbers
            letters[num] = {
              guidePoints: {
                TL: [10, 10],
                TR: [90, 10],
                BR: [90, 90],
                BL: [10, 90],
                Center: [50, 50]
              },
              svgPathD: '' // Empty path, user will draw it in LetterEditor
            }
          }
        })
        
        setDictionary(letters)
      })
      .catch(err => {
        console.error('Failed to load dictionary:', err)
      })
  }, [])

  // Get selected container
  const selectedContainer = containers.find(c => c.id === selectedContainerId) || containers[0]
  const points = selectedContainer.points

  // Calculate center point
  const getCenter = useCallback((containerPoints: Point[]) => {
    const avgX = containerPoints.reduce((sum, p) => sum + p.x, 0) / containerPoints.length
    const avgY = containerPoints.reduce((sum, p) => sum + p.y, 0) / containerPoints.length
    return { x: avgX, y: avgY }
  }, [])

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  // Check if point is near mouse
  const getPointAt = useCallback((x: number, y: number, containerPoints: Point[], threshold = 10) => {
    for (let i = 0; i < containerPoints.length; i++) {
      const dx = containerPoints[i].x - x
      const dy = containerPoints[i].y - y
      if (Math.sqrt(dx * dx + dy * dy) < threshold) {
        return i
      }
    }
    return null
  }, [])

  // Check if point is in viewport box
  const isPointInViewportBox = useCallback((x: number, y: number, box: { x: number; y: number; width: number; height: number }) => {
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
  }, [])

  // Check if point is in hitbox
  const isPointInHitbox = useCallback((x: number, y: number, box: { x: number; y: number; width: number; height: number }) => {
    return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
  }, [])

  // Check if point is inside a quadrilateral (point-in-polygon using ray casting)
  const isPointInQuadrilateral = useCallback((x: number, y: number, points: Point[]): boolean => {
    if (points.length !== 4) return false
    
    // Ray casting algorithm: count intersections with polygon edges
    let inside = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x
      const yi = points[i].y
      const xj = points[j].x
      const yj = points[j].y
      
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }, [])

  // Get viewport resize handle at point
  const getViewportResizeHandleAt = useCallback((x: number, y: number, box: { x: number; y: number; width: number; height: number }) => {
    const handleSize = 10
    const handles = [
      { x: box.x, y: box.y, type: 'nw' as const },
      { x: box.x + box.width, y: box.y, type: 'ne' as const },
      { x: box.x, y: box.y + box.height, type: 'sw' as const },
      { x: box.x + box.width, y: box.y + box.height, type: 'se' as const },
    ]
    
    for (const handle of handles) {
      const dx = handle.x - x
      const dy = handle.y - y
      if (Math.sqrt(dx * dx + dy * dy) < handleSize) {
        return handle.type
      }
    }
    return null
  }, [])

  // Get hitbox resize handle at point
  const getHitboxResizeHandleAt = useCallback((x: number, y: number, box: { x: number; y: number; width: number; height: number }) => {
    const handleSize = 10
    const handles = [
      { x: box.x, y: box.y, type: 'nw' as const },
      { x: box.x + box.width, y: box.y, type: 'ne' as const },
      { x: box.x, y: box.y + box.height, type: 'sw' as const },
      { x: box.x + box.width, y: box.y + box.height, type: 'se' as const },
    ]
    
    for (const handle of handles) {
      const dx = handle.x - x
      const dy = handle.y - y
      if (Math.sqrt(dx * dx + dy * dy) < handleSize) {
        return handle.type
      }
    }
    return null
  }, [])

  // Check if mouse is on image resize handle
  const getResizeHandleAt = useCallback((x: number, y: number) => {
    const threshold = 10
    const { width, height } = imageSize
    const { x: imgX, y: imgY } = imagePosition

    // Check corners
    if (Math.abs(x - (imgX + width)) < threshold && Math.abs(y - (imgY + height)) < threshold) {
      return 'se' // Southeast
    }
    if (Math.abs(x - imgX) < threshold && Math.abs(y - (imgY + height)) < threshold) {
      return 'sw' // Southwest
    }
    if (Math.abs(x - (imgX + width)) < threshold && Math.abs(y - imgY) < threshold) {
      return 'ne' // Northeast
    }
    if (Math.abs(x - imgX) < threshold && Math.abs(y - imgY) < threshold) {
      return 'nw' // Northwest
    }
    return null
  }, [imagePosition, imageSize])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    
    // Check for hitbox resize handle (only in edit mode)
    if (!isAnimateMode && hitbox) {
      const hitboxHandle = getHitboxResizeHandleAt(pos.x, pos.y, hitbox)
      if (hitboxHandle) {
        setIsResizingHitbox(true)
        setHitboxResizeHandle(hitboxHandle)
        return
      }
      
      // Check if clicking inside hitbox to drag it
      if (isPointInHitbox(pos.x, pos.y, hitbox)) {
        setIsDraggingHitbox(true)
        setHitboxDragStart({ x: pos.x - hitbox.x, y: pos.y - hitbox.y })
        return
      }
    }
    
    // Check for viewport box resize handle (only in edit mode)
    if (!isAnimateMode && viewportBox) {
      const viewportHandle = getViewportResizeHandleAt(pos.x, pos.y, viewportBox)
      if (viewportHandle) {
        setIsResizingViewport(true)
        setViewportResizeHandle(viewportHandle)
        return
      }
      
      // Check if clicking inside viewport box to drag it
      if (isPointInViewportBox(pos.x, pos.y, viewportBox)) {
        setIsDraggingViewport(true)
        setViewportDragStart({ x: pos.x - viewportBox.x, y: pos.y - viewportBox.y })
        return
      }
    }
    
    // Check for image resize handle
    const handle = getResizeHandleAt(pos.x, pos.y)
    if (handle && uploadedImage) {
      setIsResizingImage(true)
      setResizeHandle(handle)
      return
    }
    
    // Check for button click in animate mode
    if (isAnimateMode && !isAnimating) {
      // First check for toggle button (affects all bundles)
      const toggleButtonContainer = containers.find(c => {
        if (c.teleportType !== 'toggle') return false
        return isPointInQuadrilateral(pos.x, pos.y, c.points)
      })
      
      if (toggleButtonContainer) {
        // Toggle visibility of all elements across all bundles
        // IMPORTANT: Never toggle teleport container duplicates (they must always stay invisible)
        setElementsVisible(prev => {
          const newVisibility = !prev
          setContentElements(prevElements => {
            return prevElements.map(ce => {
              // Skip teleport container duplicates - they should always have opacity 0
              const isTeleportDuplicate = ce.id.startsWith('teleport-top-') || ce.id.startsWith('teleport-bottom-')
              if (isTeleportDuplicate) {
                return {
                  ...ce,
                  opacity: 0 // Always keep teleport duplicates invisible
                }
              }
              
              if (newVisibility) {
                // Toggling ON: restore original opacity (or use 1 as default) for normal content elements only
                const originalOpacity = originalOpacitiesRef.current.get(ce.id) ?? 1
                return {
                  ...ce,
                  opacity: originalOpacity
                }
              } else {
                // Toggling OFF: store current opacity (if visible) and set to 0 for normal content elements only
                if (ce.opacity > 0) {
                  originalOpacitiesRef.current.set(ce.id, ce.opacity)
                }
                return {
                  ...ce,
                  opacity: 0
                }
              }
            })
          })
          return newVisibility
        })
        return
      }
      
      // Then check for regular button (affects only its bundle)
      const buttonContainer = containers.find(c => {
        if (c.teleportType !== 'button') return false
        return isPointInQuadrilateral(pos.x, pos.y, c.points)
      })
      
      if (buttonContainer) {
        // Check if bundle has completed initialization - if yes, trigger closing animation, otherwise initialization
        if (initializedBundles.has(buttonContainer.bundleId)) {
          triggerClosingAnimationRef.current?.(buttonContainer.bundleId)
        } else {
          triggerButtonAnimationRef.current?.(buttonContainer.bundleId)
        }
        return
      }
    }
    
    // Check for vertex point on selected container (only if not in animate mode)
    if (!isAnimateMode) {
      const index = getPointAt(pos.x, pos.y, points)
      if (index !== null) {
        setDraggingIndex(index)
      }
    }
    }, [getMousePos, getPointAt, getResizeHandleAt, getViewportResizeHandleAt, getHitboxResizeHandleAt, isPointInViewportBox, isPointInHitbox, uploadedImage, points, isAnimateMode, viewportBox, hitbox, containers, isPointInQuadrilateral, isAnimating, initializedBundles])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    
    // Handle hitbox resizing
    if (isResizingHitbox && hitboxResizeHandle && hitbox) {
      const { x: boxX, y: boxY, width: oldWidth, height: oldHeight } = hitbox
      let newX = boxX
      let newY = boxY
      let newWidth = oldWidth
      let newHeight = oldHeight
      
      switch (hitboxResizeHandle) {
        case 'se': // Southeast - resize from top-left
          newWidth = Math.max(50, pos.x - boxX)
          newHeight = Math.max(50, pos.y - boxY)
          break
        case 'sw': // Southwest - resize from top-right
          newWidth = Math.max(50, (boxX + oldWidth) - pos.x)
          newHeight = Math.max(50, pos.y - boxY)
          newX = pos.x
          break
        case 'ne': // Northeast - resize from bottom-left
          newWidth = Math.max(50, pos.x - boxX)
          newHeight = Math.max(50, (boxY + oldHeight) - pos.y)
          newY = pos.y
          break
        case 'nw': // Northwest - resize from bottom-right
          newWidth = Math.max(50, (boxX + oldWidth) - pos.x)
          newHeight = Math.max(50, (boxY + oldHeight) - pos.y)
          newX = pos.x
          newY = pos.y
          break
      }
      
      // Constrain to canvas bounds
      newX = Math.max(0, Math.min(newX, canvasWidth - newWidth))
      newY = Math.max(0, Math.min(newY, canvasHeight - newHeight))
      newWidth = Math.min(newWidth, canvasWidth - newX)
      newHeight = Math.min(newHeight, canvasHeight - newY)
      
      setHitbox({ x: newX, y: newY, width: newWidth, height: newHeight })
      return
    }
    
    // Handle hitbox dragging
    if (isDraggingHitbox && hitboxDragStart && hitbox) {
      const newX = Math.max(0, Math.min(canvasWidth - hitbox.width, pos.x - hitboxDragStart.x))
      const newY = Math.max(0, Math.min(canvasHeight - hitbox.height, pos.y - hitboxDragStart.y))
      setHitbox({ ...hitbox, x: newX, y: newY })
      return
    }
    
    // Handle viewport box resizing
    if (isResizingViewport && viewportResizeHandle && viewportBox) {
      const { x: boxX, y: boxY, width: oldWidth, height: oldHeight } = viewportBox
      let newX = boxX
      let newY = boxY
      let newWidth = oldWidth
      let newHeight = oldHeight
      
      switch (viewportResizeHandle) {
        case 'se': // Southeast - resize from top-left
          newWidth = Math.max(50, pos.x - boxX)
          newHeight = Math.max(50, pos.y - boxY)
          break
        case 'sw': // Southwest - resize from top-right
          newWidth = Math.max(50, (boxX + oldWidth) - pos.x)
          newHeight = Math.max(50, pos.y - boxY)
          newX = pos.x
          break
        case 'ne': // Northeast - resize from bottom-left
          newWidth = Math.max(50, pos.x - boxX)
          newHeight = Math.max(50, (boxY + oldHeight) - pos.y)
          newY = pos.y
          break
        case 'nw': // Northwest - resize from bottom-right
          newWidth = Math.max(50, (boxX + oldWidth) - pos.x)
          newHeight = Math.max(50, (boxY + oldHeight) - pos.y)
          newX = pos.x
          newY = pos.y
          break
      }
      
      // Constrain to canvas bounds
      newX = Math.max(0, Math.min(newX, canvasWidth - newWidth))
      newY = Math.max(0, Math.min(newY, canvasHeight - newHeight))
      newWidth = Math.min(newWidth, canvasWidth - newX)
      newHeight = Math.min(newHeight, canvasHeight - newY)
      
      setViewportBox({ x: newX, y: newY, width: newWidth, height: newHeight })
      return
    }
    
    // Handle viewport box dragging
    if (isDraggingViewport && viewportDragStart && viewportBox) {
      const newX = Math.max(0, Math.min(canvasWidth - viewportBox.width, pos.x - viewportDragStart.x))
      const newY = Math.max(0, Math.min(canvasHeight - viewportBox.height, pos.y - viewportDragStart.y))
      setViewportBox({ ...viewportBox, x: newX, y: newY })
      return
    }
    
    if (isResizingImage && resizeHandle && uploadedImage) {
      const { x: imgX, y: imgY } = imagePosition
      const { width: oldWidth, height: oldHeight } = imageSize
      const aspectRatio = uploadedImage.width / uploadedImage.height
      
      let newWidth = oldWidth
      let newHeight = oldHeight
      let newX = imgX
      let newY = imgY
      
      switch (resizeHandle) {
        case 'se': // Southeast - resize from top-left
          newWidth = Math.max(50, pos.x - imgX)
          newHeight = newWidth / aspectRatio
          break
        case 'sw': // Southwest - resize from top-right
          newWidth = Math.max(50, (imgX + oldWidth) - pos.x)
          newHeight = newWidth / aspectRatio
          newX = pos.x
          break
        case 'ne': // Northeast - resize from bottom-left
          newWidth = Math.max(50, pos.x - imgX)
          newHeight = newWidth / aspectRatio
          newY = (imgY + oldHeight) - newHeight
          break
        case 'nw': // Northwest - resize from bottom-right
          newWidth = Math.max(50, (imgX + oldWidth) - pos.x)
          newHeight = newWidth / aspectRatio
          newX = pos.x
          newY = (imgY + oldHeight) - newHeight
          break
      }
      
      // Constrain to canvas bounds
      newX = Math.max(0, Math.min(newX, canvasWidth - newWidth))
      newY = Math.max(0, Math.min(newY, canvasHeight - newHeight))
      
      setImageSize({ width: newWidth, height: newHeight })
      setImagePosition({ x: newX, y: newY })
      return
    }
    
    if (draggingIndex !== null && !isAnimateMode) {
      setContainers(prev => prev.map(container => {
        if (container.id !== selectedContainerId) return container
        const newPoints = [...container.points]
        newPoints[draggingIndex] = {
          x: Math.max(0, Math.min(canvasWidth, pos.x)),
          y: Math.max(0, Math.min(canvasHeight, pos.y))
        }
        return { ...container, points: newPoints }
      }))
      // Update content element points if in animate mode
      if (isAnimateMode) {
        setContentElements(prev => prev.map(ce => {
          if (ce.containerId !== selectedContainerId) return ce
          const container = containers.find(c => c.id === selectedContainerId)
          if (container) {
            return { ...ce, points: [...container.points] }
          }
          return ce
        }))
      }
    } else {
      // Check for hover
      if (isAnimateMode) {
        // Check if mouse is over any content element
        let foundHover = false
        for (const contentElement of contentElements) {
          // Skip invisible elements
          if (contentElement.opacity === 0) continue
          
          // Check if mouse is inside the element's quadrilateral
          if (isPointInQuadrilateral(pos.x, pos.y, contentElement.points)) {
            setHoveredElementId(contentElement.id)
            foundHover = true
            break
          }
        }
        if (!foundHover) {
          setHoveredElementId(null)
        }
      } else {
        const index = getPointAt(pos.x, pos.y, points)
        setHoveredIndex(index)
        
        // Check for hitbox resize handle hover
        if (hitbox) {
          const hitboxHandle = getHitboxResizeHandleAt(pos.x, pos.y, hitbox)
          setHoveredHitboxHandle(hitboxHandle)
        }
        
        // Check for viewport box resize handle hover
        if (viewportBox) {
          const viewportHandle = getViewportResizeHandleAt(pos.x, pos.y, viewportBox)
          setHoveredViewportHandle(viewportHandle)
        }
      }
      
      // Check for image resize handle hover
      const handle = getResizeHandleAt(pos.x, pos.y)
      setHoveredResizeHandle(handle)
    }
  }, [getMousePos, isResizingImage, isResizingViewport, isResizingHitbox, isDraggingViewport, isDraggingHitbox, resizeHandle, viewportResizeHandle, hitboxResizeHandle, viewportDragStart, hitboxDragStart, viewportBox, hitbox, uploadedImage, imagePosition, imageSize, draggingIndex, selectedContainerId, getPointAt, getResizeHandleAt, getViewportResizeHandleAt, getHitboxResizeHandleAt, points, isAnimateMode, containers, contentElements, isPointInQuadrilateral])

  const handleMouseUp = useCallback(() => {
    setDraggingIndex(null)
    setIsResizingImage(false)
    setResizeHandle(null)
    setIsDraggingViewport(false)
    setViewportDragStart(null)
    setIsResizingViewport(false)
    setViewportResizeHandle(null)
    setIsDraggingHitbox(false)
    setHitboxDragStart(null)
    setIsResizingHitbox(false)
    setHitboxResizeHandle(null)
  }, [])

  const handleMouseLeave = useCallback(() => {
    // Clear hover state when mouse leaves canvas
    setHoveredElementId(null)
    handleMouseUp()
  }, [handleMouseUp])

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setUploadedImage(img)
        // Set initial size to fit canvas while maintaining aspect ratio
        const aspectRatio = img.width / img.height
        let width = canvasWidth
        let height = canvasWidth / aspectRatio
        if (height > canvasHeight) {
          height = canvasHeight
          width = canvasHeight * aspectRatio
        }
        setImageSize({ width, height })
        setImagePosition({ x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2 })
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [])

  // Handle dictionary upload
  const handleDictionaryUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const data = JSON.parse(text)
        
        // Extract letter data (skip description and unitSize if present)
        const { description, unitSize, ...letters } = data
        
        // Validate that it looks like a dictionary
        if (typeof letters !== 'object' || Object.keys(letters).length === 0) {
          alert('Invalid dictionary format. The file should contain letter definitions.')
          return
        }
        
        // Initialize numbers 0-9 if they don't exist in the dictionary
        const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        numbers.forEach(num => {
          if (!letters[num]) {
            // Create default empty entry for numbers
            letters[num] = {
              guidePoints: {
                TL: [10, 10],
                TR: [90, 10],
                BR: [90, 90],
                BL: [10, 90],
                Center: [50, 50]
              },
              svgPathD: '' // Empty path, user will draw it in LetterEditor
            }
          }
        })
        
        // Replace the dictionary
        setDictionary(letters)
        
        // Reset file input
        if (dictionaryFileInputRef.current) {
          dictionaryFileInputRef.current.value = ''
        }
        
        alert(`Successfully loaded dictionary with ${Object.keys(letters).length} letters!`)
      } catch (error) {
        console.error('Failed to parse dictionary:', error)
        alert('Failed to parse dictionary file. Please make sure it is valid JSON.')
      }
    }
    reader.onerror = () => {
      alert('Failed to read dictionary file.')
    }
    reader.readAsText(file)
  }, [])

  // Items per bundle (for scrolling list mode)
  // Structure: { bundleId: { numberOfItems: number, items: Item[] } }
  const [bundleItems, setBundleItems] = useState<Record<string, { numberOfItems: number, items: Item[] }>>({})

  // Generate items with default naming conventions
  const generateItems = useCallback((count: number): Item[] => {
    if (count <= 0) return []
    
    return Array.from({ length: count }, (_, index) => {
      const itemNumber = index + 1
      return {
        id: `item-${itemNumber}`,
        text: `ITEM ${itemNumber}`,
        color: defaultColor,
        fontColor: '#ffffff',
        imageUrl: null
      }
    })
  }, [defaultColor])

  // Get items for a specific bundle
  const getBundleItems = useCallback((bundleId: string): Item[] => {
    return bundleItems[bundleId]?.items || []
  }, [bundleItems])

  // Get number of items for a specific bundle
  const getBundleNumberOfItems = useCallback((bundleId: string): number => {
    return bundleItems[bundleId]?.numberOfItems || 0
  }, [bundleItems])

  // Set items for a specific bundle
  const setBundleItemsForBundle = useCallback((bundleId: string, numberOfItems: number) => {
    setBundleItems(prev => {
      const generatedItems = numberOfItems > 0 ? generateItems(numberOfItems) : []
      return {
        ...prev,
        [bundleId]: {
          numberOfItems,
          items: generatedItems
        }
      }
    })
  }, [generateItems])

  // Bundle management functions
  const addBundle = useCallback(() => {
    const newId = `bundle-${Date.now()}`
    const bundleCount = bundles.length + 1
    const newBundle: Bundle = {
      id: newId,
      name: `Bundle ${bundleCount}`
    }
    setBundles(prev => [...prev, newBundle])
    setSelectedBundleId(newId)
  }, [bundles.length])

  const removeBundle = useCallback((bundleId: string) => {
    if (bundles.length <= 1) {
      alert('Cannot delete the last bundle. You need at least one bundle.')
      return
    }
    setBundles(prev => prev.filter(b => b.id !== bundleId))
    setContainers(prev => prev.filter(c => c.bundleId !== bundleId))
    setContentElements(prev => prev.filter(ce => ce.bundleId !== bundleId))
    
    // Select a different bundle
    const remainingBundles = bundles.filter(b => b.id !== bundleId)
    if (remainingBundles.length > 0) {
      setSelectedBundleId(remainingBundles[0].id)
      const firstContainer = containers.find(c => c.bundleId === remainingBundles[0].id)
      if (firstContainer) {
        setSelectedContainerId(firstContainer.id)
      }
    }
  }, [bundles, containers])

  const updateBundleName = useCallback((bundleId: string, name: string) => {
    setBundles(prev => prev.map(b => 
      b.id === bundleId ? { ...b, name } : b
    ))
  }, [])

  // Get containers for selected bundle
  const getSelectedBundleContainers = useCallback(() => {
    return containers.filter(c => c.bundleId === selectedBundleId)
  }, [containers, selectedBundleId])

  // Get content elements for selected bundle
  const getSelectedBundleContentElements = useCallback(() => {
    return contentElements.filter(ce => ce.bundleId === selectedBundleId)
  }, [contentElements, selectedBundleId])

  // Add new container
  const addContainer = useCallback(() => {
    const bundleContainers = getSelectedBundleContainers()
    const newId = `container-${Date.now()}`
    const newContainer: Container = {
      id: newId,
      bundleId: selectedBundleId,
      name: `Container ${bundleContainers.length + 1}`,
      points: [
        { x: 300, y: 300 },
        { x: 700, y: 300 },
        { x: 700, y: 500 },
        { x: 300, y: 500 },
      ],
      color: defaultColor,
      contentColor: defaultColor,
      fontColor: '#ffffff', // Default font color (white for contrast)
      imageUrl: null, // Default no image
      aboveContainerId: null,
      belowContainerId: null,
      aboveTeleportContainerId: null,
      belowTeleportContainerId: null,
      teleportType: null
    }
    setContainers(prev => [...prev, newContainer])
    setSelectedContainerId(newId)
  }, [selectedBundleId, getSelectedBundleContainers, defaultColor])

  // Enter animate mode - create content elements for each container in ALL bundles
  // If items exist, create elements for all items and use scrolling list mode
  const enterAnimateMode = useCallback(() => {
    const allNewContentElements: ContentElement[] = []
    const newVisibleStartIndex: Record<string, number> = {}
    
    // Process each bundle independently
    bundles.forEach(bundle => {
      // Get containers for this bundle
      const bundleContainers = containers.filter(c => c.bundleId === bundle.id)
      
      // Check if this bundle has a button container
      const hasButton = bundleContainers.some(c => c.teleportType === 'button')
      
      // Filter out teleport containers and button containers to get normal containers
      const normalContainers = bundleContainers.filter(container => container.teleportType === null)
      
      // Find top teleport container for this bundle (where elements will queue)
      const topTeleportContainer = bundleContainers.find(c => c.teleportType === 'top')
      
      // Get items for this bundle (if any exist, use scrolling list mode)
      const bundleItems = getBundleItems(bundle.id)
      
      // If we have items, use scrolling list mode (items can be more than containers)
      // Otherwise, use legacy mode (one element per container)
      const useScrollingList = bundleItems.length > 0
      
      let bundleContentElements: ContentElement[] = []
      
      if (useScrollingList) {
        // SCROLLING LIST MODE: Create elements for ALL items
        // Only show the first N items (where N = number of normal containers)
        const numVisible = normalContainers.length
        newVisibleStartIndex[bundle.id] = 0 // Start at index 0
        
        bundleContentElements = bundleItems.map((item, itemIndex) => {
          const isVisible = itemIndex < numVisible
          const targetContainer = isVisible ? normalContainers[itemIndex] : null
          
          if (hasButton && topTeleportContainer) {
            // Place in top teleport container (queue) at opacity 0
            return {
              id: `content-item-${item.id}`,
              bundleId: bundle.id,
              itemIndex: itemIndex,
              containerId: topTeleportContainer.id,
              text: item.text,
              color: item.color,
              fontColor: item.fontColor,
              imageUrl: item.imageUrl || null,
              points: [...topTeleportContainer.points],
              opacity: 0
            }
          } else if (isVisible && targetContainer) {
            // Place in visible container
            return {
              id: `content-item-${item.id}`,
              bundleId: bundle.id,
              itemIndex: itemIndex,
              containerId: targetContainer.id,
              text: item.text,
              color: item.color,
              fontColor: item.fontColor,
              imageUrl: item.imageUrl || null,
              points: [...targetContainer.points],
              opacity: 1
            }
          } else {
            // Item is not visible yet - place in top teleport container (invisible)
            return {
              id: `content-item-${item.id}`,
              bundleId: bundle.id,
              itemIndex: itemIndex,
              containerId: topTeleportContainer?.id || normalContainers[0]?.id || '',
              text: item.text,
              color: item.color,
              fontColor: item.fontColor,
              imageUrl: item.imageUrl || null,
              points: topTeleportContainer ? [...topTeleportContainer.points] : (normalContainers[0] ? [...normalContainers[0].points] : []),
              opacity: 0
            }
          }
        })
      } else {
        // LEGACY MODE: One element per container
        bundleContentElements = normalContainers
          .filter(container => container.teleportType !== 'button' && container.teleportType !== 'toggle')
          .map((container, containerIndex) => {
            if (hasButton && topTeleportContainer) {
              return {
                id: `content-${container.id}`,
                bundleId: bundle.id,
                itemIndex: containerIndex,
                containerId: topTeleportContainer.id,
                text: container.name.replace('Container', 'Item'),
                color: container.contentColor,
                fontColor: container.fontColor,
                imageUrl: container.imageUrl || null,
                points: [...topTeleportContainer.points],
                opacity: 0
              }
            } else {
              return {
                id: `content-${container.id}`,
                bundleId: bundle.id,
                itemIndex: containerIndex,
                containerId: container.id,
                text: container.name.replace('Container', 'Item'),
                color: container.contentColor,
                fontColor: container.fontColor,
                imageUrl: container.imageUrl || null,
                points: [...container.points],
                opacity: 1
              }
            }
          })
      }
      
      // Find bottom teleport container for this bundle
      const bottomTeleportContainer = bundleContainers.find(c => c.teleportType === 'bottom')
      
      // Only create duplicates in teleport containers if bundle does NOT have a button
      // (If it has a button, elements are already queued in top teleport container)
      if (!hasButton) {
        if (useScrollingList) {
          // SCROLLING LIST MODE: Initialize teleport containers with items for circular buffer
          // Top teleport: last item (highest number) - will come in when scrolling down
          // Bottom teleport: first item (index 0) - will come in when scrolling up
          if (topTeleportContainer && bundleItems.length > 0) {
            const lastItem = bundleItems[bundleItems.length - 1]
            bundleContentElements.push({
              id: `teleport-top-${topTeleportContainer.id}-${lastItem.id}`,
              bundleId: bundle.id,
              itemIndex: bundleItems.length - 1,
              containerId: topTeleportContainer.id,
              text: lastItem.text,
              color: lastItem.color,
              fontColor: lastItem.fontColor,
              imageUrl: lastItem.imageUrl || null,
              points: [...topTeleportContainer.points],
              opacity: 0
            })
          }
          
          if (bottomTeleportContainer && bundleItems.length > 0) {
            const firstItem = bundleItems[0]
            bundleContentElements.push({
              id: `teleport-bottom-${bottomTeleportContainer.id}-${firstItem.id}`,
              bundleId: bundle.id,
              itemIndex: 0,
              containerId: bottomTeleportContainer.id,
              text: firstItem.text,
              color: firstItem.color,
              fontColor: firstItem.fontColor,
              imageUrl: firstItem.imageUrl || null,
              points: [...bottomTeleportContainer.points],
              opacity: 0
            })
          }
        } else {
          // LEGACY MODE: Create duplicates in teleport containers (invisible, ready for wrap-around)
          // REVERSED: topmost element goes in bottom teleport container, bottommost element goes in top teleport container
          if (bottomTeleportContainer && normalContainers.length > 0) {
            // Get the topmost normal container (first in menu order) - duplicate goes in BOTTOM teleport container
            const topNormalContainer = normalContainers[0]
            const topContentElement = bundleContentElements.find(ce => ce.containerId === topNormalContainer.id)
            if (topContentElement) {
              bundleContentElements.push({
                id: `teleport-bottom-${bottomTeleportContainer.id}`,
                bundleId: bundle.id,
                itemIndex: topContentElement.itemIndex,
                containerId: bottomTeleportContainer.id,
                text: topContentElement.text,
                color: topContentElement.color,
                fontColor: topContentElement.fontColor,
                imageUrl: topContentElement.imageUrl,
                points: [...bottomTeleportContainer.points], // Start in teleport container
                opacity: 0 // Start invisible
              })
            }
          }
          
          if (topTeleportContainer && normalContainers.length > 0) {
            // Get the bottommost normal container (last in menu order) - duplicate goes in TOP teleport container
            const bottomNormalContainer = normalContainers[normalContainers.length - 1]
            const bottomContentElement = bundleContentElements.find(ce => ce.containerId === bottomNormalContainer.id)
            if (bottomContentElement) {
              bundleContentElements.push({
                id: `teleport-top-${topTeleportContainer.id}`,
                bundleId: bundle.id,
                itemIndex: bottomContentElement.itemIndex,
                containerId: topTeleportContainer.id,
                text: bottomContentElement.text,
                color: bottomContentElement.color,
                fontColor: bottomContentElement.fontColor,
                imageUrl: bottomContentElement.imageUrl,
                points: [...topTeleportContainer.points], // Start in teleport container
                opacity: 0 // Start invisible
              })
            }
          }
        }
      }
      
      allNewContentElements.push(...bundleContentElements)
    })
    
    setContentElements(allNewContentElements)
    setVisibleStartIndex(newVisibleStartIndex)
    setIsAnimateMode(true)
    
    // Select the first normal container in selected bundle so text input appears
    const selectedBundleContainers = getSelectedBundleContainers()
    const normalContainers = selectedBundleContainers.filter(c => c.teleportType === null)
    if (normalContainers.length > 0 && !selectedContainerId) {
      setSelectedContainerId(normalContainers[0].id)
    } else if (normalContainers.length > 0) {
      // Make sure selected container is a normal container (not a teleport container) and belongs to selected bundle
      const selectedIsNormal = normalContainers.some(c => c.id === selectedContainerId)
      if (!selectedIsNormal) {
        setSelectedContainerId(normalContainers[0].id)
      }
    }
  }, [containers, selectedContainerId, bundles, getSelectedBundleContainers, bundleItems, getBundleItems])


  // Exit animate mode
  const exitAnimateMode = useCallback(() => {
    setContentElements([])
    setIsAnimateMode(false)
  }, [])

  // Remove container
  const removeContainer = useCallback((containerId: string) => {
    setContainers(prev => {
      const filtered = prev.filter(c => c.id !== containerId)
      if (filtered.length > 0 && selectedContainerId === containerId) {
        setSelectedContainerId(filtered[0].id)
      }
      return filtered
    })
    // Also remove associated content element if in animate mode
    if (isAnimateMode) {
      setContentElements(prev => prev.filter(ce => ce.containerId !== containerId))
    }
  }, [selectedContainerId, isAnimateMode])

  // Update container name
  const updateContainerName = useCallback((containerId: string, name: string) => {
    setContainers(prev => prev.map(container => 
      container.id === containerId ? { ...container, name } : container
    ))
    // Update content element text if in animate mode
    if (isAnimateMode) {
      setContentElements(prev => prev.map(ce => 
        ce.containerId === containerId ? { ...ce, text: name.replace('Container', 'Item') } : ce
      ))
    }
  }, [isAnimateMode])

  // Update container color
  const updateContainerColor = useCallback((containerId: string, color: string) => {
    setContainers(prev => prev.map(container => 
      container.id === containerId ? { ...container, color } : container
    ))
    // Update content element color if in animate mode
    if (isAnimateMode) {
      setContentElements(prev => prev.map(ce => 
        ce.containerId === containerId ? { ...ce, color } : ce
      ))
    }
  }, [isAnimateMode])

  // Update container content color (fill color for the content element)
  const updateContainerContentColor = useCallback((containerId: string, contentColor: string) => {
    setContainers(prev => prev.map(container => 
      container.id === containerId ? { ...container, contentColor } : container
    ))
    // Update content element fill color if in animate mode
    if (isAnimateMode) {
      setContentElements(prev => prev.map(ce => 
        ce.containerId === containerId ? { ...ce, color: contentColor } : ce
      ))
    }
  }, [isAnimateMode])

  // Update container font color (text color for the content element)
  const updateContainerFontColor = useCallback((containerId: string, fontColor: string) => {
    setContainers(prev => prev.map(container => 
      container.id === containerId ? { ...container, fontColor } : container
    ))
    // Update content element font color if in animate mode
    if (isAnimateMode) {
      setContentElements(prev => prev.map(ce => 
        ce.containerId === containerId ? { ...ce, fontColor: fontColor } : ce
      ))
    }
  }, [isAnimateMode])

  // Update content element text
  const updateContentElementText = useCallback((contentElementId: string, text: string) => {
    setContentElements(prev => prev.map(ce => 
      ce.id === contentElementId ? { ...ce, text } : ce
    ))
  }, [])

  // Update content element image (also updates container for persistence)
  const updateContentElementImage = useCallback((contentElementId: string, imageUrl: string | null) => {
    setContentElements(prev => prev.map(ce => {
      if (ce.id === contentElementId) {
        // Also update the container's imageUrl for persistence
        const containerId = ce.containerId
        setContainers(prevContainers => prevContainers.map(c => 
          c.id === containerId ? { ...c, imageUrl } : c
        ))
        
        // Clear image from cache if removing
        if (!imageUrl && ce.imageUrl) {
          imageCacheRef.current.delete(ce.imageUrl)
        }
        
        return { ...ce, imageUrl }
      }
      return ce
    }))
  }, [])

  // Update container's above/below relationships
  const updateContainerRelationship = useCallback((containerId: string, field: 'aboveContainerId' | 'belowContainerId', targetContainerId: string | null) => {
    setContainers(prev => prev.map(container => 
      container.id === containerId ? { ...container, [field]: targetContainerId } : container
    ))
  }, [])

  // Update container's teleport relationships
  const updateContainerTeleport = useCallback((containerId: string, field: 'aboveTeleportContainerId' | 'belowTeleportContainerId', targetContainerId: string | null) => {
    setContainers(prev => prev.map(container => 
      container.id === containerId ? { ...container, [field]: targetContainerId } : container
    ))
  }, [])

  // Update container's teleport type
  const updateContainerTeleportType = useCallback((containerId: string, teleportType: 'top' | 'bottom' | 'button' | 'toggle' | null) => {
    setContainers(prev => prev.map(container => 
      container.id === containerId ? { ...container, teleportType } : container
    ))
  }, [])

  // Reorder containers (move container to new index)
  const reorderContainers = useCallback((containerId: string, newIndex: number) => {
    setContainers(prev => {
      const containerIndex = prev.findIndex(c => c.id === containerId)
      if (containerIndex === -1 || containerIndex === newIndex) return prev
      
      const newContainers = [...prev]
      const [movedContainer] = newContainers.splice(containerIndex, 1)
      newContainers.splice(newIndex, 0, movedContainer)
      
      return newContainers
    })
  }, [])

  // Handle drag start for container reordering
  const handleContainerDragStart = useCallback((e: React.DragEvent, containerId: string) => {
    if (isAnimateMode || isAnimating) {
      e.preventDefault()
      return
    }
    setDraggedContainerId(containerId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', containerId)
  }, [isAnimateMode, isAnimating])

  // Handle drag over for container reordering
  const handleContainerDragOver = useCallback((e: React.DragEvent, containerId: string) => {
    if (isAnimateMode || isAnimating || !draggedContainerId) {
      e.preventDefault()
      return
    }
    if (draggedContainerId !== containerId) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragOverContainerId(containerId)
    }
  }, [isAnimateMode, isAnimating, draggedContainerId])

  // Handle drop for container reordering
  const handleContainerDrop = useCallback((e: React.DragEvent, targetContainerId: string) => {
    e.preventDefault()
    if (!draggedContainerId || draggedContainerId === targetContainerId || isAnimateMode || isAnimating) {
      setDraggedContainerId(null)
      setDragOverContainerId(null)
      return
    }

    const targetIndex = containers.findIndex(c => c.id === targetContainerId)
    if (targetIndex === -1) {
      setDraggedContainerId(null)
      setDragOverContainerId(null)
      return
    }

    reorderContainers(draggedContainerId, targetIndex)
    setDraggedContainerId(null)
    setDragOverContainerId(null)
  }, [draggedContainerId, containers, isAnimateMode, isAnimating, reorderContainers])

  // Handle drag end
  const handleContainerDragEnd = useCallback(() => {
    setDraggedContainerId(null)
    setDragOverContainerId(null)
  }, [])

  // Animate content element to morph into target container's shape
  const animateContentMorph = useCallback((contentElementId: string, targetContainerId: string, duration: number = 1): Promise<void> => {
    return new Promise((resolve) => {
      // Use ref to get fresh state instead of closure
      const contentElement = contentElementsRef.current.find(ce => ce.id === contentElementId)
      const targetContainer = containers.find(c => c.id === targetContainerId)
      
      if (!contentElement || !targetContainer || contentElement.containerId === targetContainerId) {
        resolve()
        return
      }
      
      // Kill any existing animations for this element
      if (animationRefs.current[contentElementId]) {
        animationRefs.current[contentElementId].forEach(tween => tween.kill())
      }
      animationRefs.current[contentElementId] = []

      // Animate each point from source to target
      const tweens: gsap.core.Tween[] = []
      
      contentElement.points.forEach((point, index) => {
        const targetPoint = targetContainer.points[index]
        
        // Create a proxy object for GSAP to animate
        const proxy = { x: point.x, y: point.y }
        
        // Animate the proxy
        const tween = gsap.to(proxy, {
          x: targetPoint.x,
          y: targetPoint.y,
          duration: duration,
          ease: 'power2.inOut',
          onUpdate: () => {
            // Update the content element points during animation
            setContentElements(prev => prev.map(ce => {
              if (ce.id === contentElementId) {
                const newPoints = [...ce.points]
                newPoints[index] = { x: proxy.x, y: proxy.y }
                return { ...ce, points: newPoints }
              }
              return ce
            }))
          },
          onComplete: () => {
            // Ensure final position is exact
            setContentElements(prev => prev.map(ce => {
              if (ce.id === contentElementId) {
                const newPoints = [...ce.points]
                newPoints[index] = { x: targetPoint.x, y: targetPoint.y }
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
      const totalTweens = tweens.length
      
      if (totalTweens === 0) {
        resolve()
        return
      }
      
      tweens.forEach(tween => {
        const originalOnComplete = tween.vars.onComplete
        tween.eventCallback('onComplete', () => {
          if (originalOnComplete) originalOnComplete()
          completedCount++
          if (completedCount === totalTweens) {
            resolve()
          }
        })
      })
    })
  }, [contentElements, containers])

  // Teleport content element instantly to target container (no animation)
  const teleportContentElement = useCallback((contentElementId: string, targetContainerId: string) => {
    const targetContainer = containers.find(c => c.id === targetContainerId)
    if (!targetContainer) return
    
    // Instantly update the content element's position and container
    setContentElements(prev => prev.map(ce => {
      if (ce.id === contentElementId) {
        return {
          ...ce,
          containerId: targetContainerId,
          points: [...targetContainer.points] // Instantly match target container's shape
        }
      }
      return ce
    }))
  }, [containers])

  // Trigger cascading initialization animation when button is clicked
  // Queue system: elements wait in top teleport container, then animate sequentially from bottom to top
  // Each element moves through containers as if user was manually scrolling down
  const triggerButtonAnimation = useCallback(async (bundleId: string) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    
    // Get bundle containers and content elements
    const bundleContainers = containers.filter(c => c.bundleId === bundleId)
    const bundleContentElements = contentElements.filter(ce => ce.bundleId === bundleId)
    
    // Filter to normal containers only (exclude button, teleport containers)
    const normalContainers = bundleContainers.filter(c => c.teleportType === null)
    
    // Find top teleport container (where elements are queued)
    const topTeleportContainer = bundleContainers.find(c => c.teleportType === 'top')
    
    if (normalContainers.length === 0 || !topTeleportContainer) {
      setIsAnimating(false)
      return
    }
    
    // Find all elements currently queued in top teleport container (opacity 0)
    const queuedElements = bundleContentElements.filter(ce => 
      ce.containerId === topTeleportContainer.id && ce.opacity === 0
    )
    
    if (queuedElements.length === 0) {
      setIsAnimating(false)
      return
    }
    
    // Map queued elements to their target containers (by matching element ID to container ID)
    const elementTargets = queuedElements.map(element => {
      const targetContainerId = element.id.replace('content-', '')
      const targetContainer = normalContainers.find(c => c.id === targetContainerId)
      return { element, targetContainer, targetIndex: normalContainers.findIndex(c => c.id === targetContainerId) }
    }).filter(item => item.targetContainer !== undefined) as Array<{
      element: ContentElement
      targetContainer: Container
      targetIndex: number
    }>
    
    // Sort by target index (bottommost first, index length-1, then length-2, etc.)
    elementTargets.sort((a, b) => b.targetIndex - a.targetIndex)
    
    const firstContainer = normalContainers[0]
    if (!firstContainer) {
      setIsAnimating(false)
      return
    }
    
    // Process each element with cascading effect - elements follow each other
    // Each element starts moving shortly after the previous one, creating a chain effect
    // Use the cascadeDelay state variable (controlled by slider)
    const morphDuration = 0.6 // Duration for each morph segment
    
    // Start all elements moving in cascade - each one follows the previous
    const animationPromises = elementTargets.map(({ element, targetContainer, targetIndex }, i) => {
      return new Promise<void>(async (resolve) => {
        // Delay start based on position in queue (bottommost starts first)
        await new Promise(r => setTimeout(r, i * cascadeDelay * 1000))
        
        // Element is already in top teleport container - just make it visible
        setContentElements(prev => prev.map(ce => {
          if (ce.id === element.id) {
            return { 
              ...ce, 
              opacity: 1 // Make visible while still in teleport container
            }
          }
          return ce
        }))
        
        // Wait a tiny bit for state to update
        await new Promise(resolve => setTimeout(resolve, 10))
        
        // First: Morph from top teleport container to first normal container
        await animateContentMorph(element.id, firstContainer.id, morphDuration)
        
        // Update element to first container
        setContentElements(prev => prev.map(ce => {
          if (ce.id === element.id) {
            return { 
              ...ce, 
              containerId: firstContainer.id,
              points: [...firstContainer.points]
            }
          }
          return ce
        }))
        
        // Small delay between morphs
        await new Promise(resolve => setTimeout(resolve, 30))
        
        // Then: Animate down until element reaches its target container
        let currentIndex = 0
        while (currentIndex < targetIndex) {
          const nextContainer = normalContainers[currentIndex + 1]
          await animateContentMorph(element.id, nextContainer.id, morphDuration)
          
          // Update element position
          setContentElements(prev => prev.map(ce => {
            if (ce.id === element.id) {
              return { 
                ...ce, 
                containerId: nextContainer.id,
                points: [...nextContainer.points]
              }
            }
            return ce
          }))
          
          currentIndex++
          
          // Small delay between morphs
          await new Promise(resolve => setTimeout(resolve, 30))
        }
        
        resolve()
      })
    })
    
    // Wait for all animations to complete
    await Promise.all(animationPromises)
    
    // Mark bundle as initialized
    setInitializedBundles(prev => new Set(prev).add(bundleId))
    
    setIsAnimating(false)
  }, [containers, contentElements, isAnimating, animateContentMorph, cascadeDelay])
  
  // Store ref to triggerButtonAnimation
  useEffect(() => {
    triggerButtonAnimationRef.current = triggerButtonAnimation
  }, [triggerButtonAnimation])
  
  // Closing animation: elements stack on top of each other and climb to topmost, then disappear
  const triggerClosingAnimation = useCallback(async (bundleId: string) => {
    if (isAnimating) return
    
    setIsAnimating(true)
    
    // Get bundle containers and content elements
    const bundleContainers = containers.filter(c => c.bundleId === bundleId)
    const bundleContentElements = contentElements.filter(ce => ce.bundleId === bundleId)
    
    // Filter to normal containers only (exclude button, teleport containers)
    const normalContainers = bundleContainers.filter(c => c.teleportType === null)
    
    if (normalContainers.length === 0) {
      setIsAnimating(false)
      return
    }
    
    // Get all visible elements in normal containers, sorted by container index (bottommost first)
    const visibleElements = bundleContentElements
      .filter(ce => {
        const container = normalContainers.find(c => c.id === ce.containerId)
        return container && ce.opacity === 1
      })
      .map(ce => {
        const containerIndex = normalContainers.findIndex(c => c.id === ce.containerId)
        return { element: ce, containerIndex }
      })
      .sort((a, b) => b.containerIndex - a.containerIndex) // Bottommost first
    
    if (visibleElements.length === 0) {
      setIsAnimating(false)
      return
    }
    
    const topmostContainer = normalContainers[0]
    const morphDuration = 0.5
    
    // Process elements from bottom to top: each element moves to the container above it
    // Element 9 → container 8, Element 8 → container 7, etc.
    // When an element moves into a container, the element already in that container should be hidden
    // We need to process by container index, not by element, to ensure cascading effect
    for (let containerIndex = normalContainers.length - 1; containerIndex > 0; containerIndex--) {
      const currentContainer = normalContainers[containerIndex]
      if (!currentContainer) continue
      
      // Find the element currently in this container (using current state via ref)
      const elementInContainer = contentElementsRef.current.find(ce => 
        ce.bundleId === bundleId &&
        ce.containerId === currentContainer.id && 
        ce.opacity === 1
      )
      
      if (!elementInContainer) continue
      
      // Target: move to container above (index - 1)
      const targetIndex = containerIndex - 1
      const targetContainer = normalContainers[targetIndex]
      
      if (!targetContainer) continue
      
      // Find the element that's currently in the target container (the one being "passed")
      const elementInTarget = contentElementsRef.current.find(ce => 
        ce.bundleId === bundleId &&
        ce.containerId === targetContainer.id && 
        ce.opacity === 1 &&
        ce.id !== elementInContainer.id
      )
      
      // Morph element to target container (the container above it)
      await animateContentMorph(elementInContainer.id, targetContainer.id, morphDuration)
      
      // Update element position and hide the element that was in the target container
      setContentElements(prev => prev.map(ce => {
        if (ce.id === elementInContainer.id) {
          return { 
            ...ce, 
            containerId: targetContainer.id,
            points: [...targetContainer.points]
          }
        }
        // Hide the element that was in the target container (it's been "passed")
        if (elementInTarget && ce.id === elementInTarget.id) {
          return { 
            ...ce, 
            opacity: 0 // Hide it
          }
        }
        return ce
      }))
      
      // Update ref to reflect the move and hide
      contentElementsRef.current = contentElementsRef.current.map(ce => {
        if (ce.id === elementInContainer.id) {
          return { 
            ...ce, 
            containerId: targetContainer.id,
            points: [...targetContainer.points]
          }
        }
        if (elementInTarget && ce.id === elementInTarget.id) {
          return { 
            ...ce, 
            opacity: 0
          }
        }
        return ce
      })
      
      // Small delay between morphs
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    
    // Now all elements are stacked at topmost container - fade them all out together
    const fadeOutTween = gsap.to({}, {
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        setContentElements(prev => prev.map(ce => {
          if (bundleContentElements.some(be => be.id === ce.id && ce.opacity === 1)) {
            return { ...ce, opacity: Math.max(0, 1 - fadeOutTween.progress()) }
          }
          return ce
        }))
      }
    })
    
    await new Promise(resolve => {
      fadeOutTween.eventCallback('onComplete', () => {
        // Move all elements back to top teleport container and reset opacity to 0
        const topTeleportContainer = bundleContainers.find(c => c.teleportType === 'top')
        if (topTeleportContainer) {
          setContentElements(prev => prev.map(ce => {
            if (bundleContentElements.some(be => be.id === ce.id)) {
              return {
                ...ce,
                containerId: topTeleportContainer.id,
                points: [...topTeleportContainer.points],
                opacity: 0
              }
            }
            return ce
          }))
        }
        
        // Mark bundle as not initialized (ready for initialization again)
        setInitializedBundles(prev => {
          const updated = new Set(prev)
          updated.delete(bundleId)
          return updated
        })
        
        resolve(undefined)
      })
      
      if (fadeOutTween.progress() >= 1) {
        const topTeleportContainer = bundleContainers.find(c => c.teleportType === 'top')
        if (topTeleportContainer) {
          setContentElements(prev => prev.map(ce => {
            if (bundleContentElements.some(be => be.id === ce.id)) {
              return {
                ...ce,
                containerId: topTeleportContainer.id,
                points: [...topTeleportContainer.points],
                opacity: 0
              }
            }
            return ce
          }))
        }
        
        setInitializedBundles(prev => {
          const updated = new Set(prev)
          updated.delete(bundleId)
          return updated
        })
        
        resolve(undefined)
      }
    })
    
    setIsAnimating(false)
  }, [containers, contentElements, isAnimating, animateContentMorph])
  
  // Store ref to triggerClosingAnimation
  useEffect(() => {
    triggerClosingAnimationRef.current = triggerClosingAnimation
  }, [triggerClosingAnimation])

  // Animate all content elements in a specific direction
  // Uses menu order: up = move to container above in menu, down = move to container below in menu
  // Wrap-around: top container animating up teleports to bottom, bottom container animating down teleports to top
  // Works per bundle: each bundle animates independently
  // If items exist and items.length > containers.length, use scrolling list mode
  const animateDirection = useCallback((direction: 'up' | 'down', scrollSpeed?: number) => {
    if (isAnimating || !isAnimateMode) return
    
    // Calculate animation duration based on scroll speed
    // Faster scroll (larger deltaY) = shorter duration (faster animation)
    // Slower scroll (smaller deltaY) = longer duration (slower animation)
    // Default to 1 second if no scroll speed provided
    let duration = 1
    if (scrollSpeed !== undefined) {
      // Map scroll speed to duration: larger deltaY = shorter duration
      // Clamp between 0.2s (very fast) and 2s (very slow)
      // Use inverse relationship: duration = maxDuration / (1 + speed/maxSpeed)
      const maxSpeed = 100 // Maximum expected scroll delta
      const minDuration = 0.2
      const maxDuration = 2
      const normalizedSpeed = Math.min(Math.abs(scrollSpeed), maxSpeed)
      duration = Math.max(minDuration, Math.min(maxDuration, maxDuration / (1 + normalizedSpeed / (maxSpeed * 0.5))))
    }
    
    // Check if we're in scrolling list mode (items exist and more items than containers)
    // Check if any bundle is in scrolling list mode
    const anyBundleInScrollingList = bundles.some(bundle => {
      const bundleContainers = containers.filter(c => c.bundleId === bundle.id)
      const normalContainers = bundleContainers.filter(c => c.teleportType === null)
      const bundleItems = getBundleItems(bundle.id)
      return bundleItems.length > 0 && bundleItems.length > normalContainers.length
    })
    
    // If in scrolling list mode, handle scrolling list animation
    if (anyBundleInScrollingList) {
      const allAnimations: Promise<void>[] = []
      
      bundles.forEach(bundle => {
        const bundleContainers = containers.filter(c => c.bundleId === bundle.id)
        const normalContainers = bundleContainers.filter(c => c.teleportType === null)
        
        // Only handle scrolling list mode if this bundle has more items than containers
        const bundleItems = getBundleItems(bundle.id)
        if (bundleItems.length > 0 && bundleItems.length > normalContainers.length) {
          // Find teleport containers for this bundle
          const topTeleportContainer = bundleContainers.find(c => c.teleportType === 'top')
          const bottomTeleportContainer = bundleContainers.find(c => c.teleportType === 'bottom')
          
          if (topTeleportContainer && bottomTeleportContainer) {
            const bundleContentElements = contentElements.filter(ce => ce.bundleId === bundle.id)
            const numVisible = normalContainers.length
            
            // Get current item indices in each container position
            const currentItemIndices: number[] = []
            for (let i = 0; i < numVisible; i++) {
              const container = normalContainers[i]
              const element = bundleContentElements.find(ce => 
                ce.containerId === container.id && ce.opacity === 1
              )
              if (element && element.itemIndex !== undefined) {
                currentItemIndices[i] = element.itemIndex
              }
            }
            
            if (currentItemIndices.length === numVisible) {
              // Circular buffer scrolling: elements shift one position, new item enters from teleport
              
              if (direction === 'down') {
                // Scrolling down:
                // 1. Bottommost element → bottom teleport (fade out)
                // 2. All other elements shift down one position
                // 3. New element from top teleport → topmost position (fade in)
                
                const bottomContainer = normalContainers[normalContainers.length - 1]
                const topContainer = normalContainers[0]
                
                const bottomElement = bundleContentElements.find(ce => 
                  ce.containerId === bottomContainer.id && ce.opacity === 1
                )
                
                // Find element in top teleport (this will be the new topmost)
                const topTeleportElement = bundleContentElements.find(ce => 
                  ce.containerId === topTeleportContainer.id && ce.opacity === 0 && ce.itemIndex !== undefined
                )
                
                if (bottomElement && topTeleportElement) {
                  // Step 1: Bottommost element fades out to bottom teleport
                  const fadeOutAndMorph = animateContentMorph(bottomElement.id, bottomTeleportContainer.id, duration).then(() => {
                    setContentElements(prev => prev.map(ce => {
                      if (ce.id === bottomElement.id) {
                        return { ...ce, containerId: bottomTeleportContainer.id, opacity: 0 }
                      }
                      return ce
                    }))
                  })
                  
                  const fadeOutTween = gsap.to({}, {
                    duration: duration,
                    ease: 'power2.inOut',
                    onUpdate: () => {
                      setContentElements(prev => prev.map(ce => {
                        if (ce.id === bottomElement.id) {
                          return { ...ce, opacity: Math.max(0, 1 - fadeOutTween.progress()) }
                        }
                        return ce
                      }))
                    }
                  })
                  
                  // Step 2: Shift all elements down (except bottommost)
                  const shiftAnimations: Promise<void>[] = []
                  for (let i = numVisible - 2; i >= 0; i--) {
                    const currentContainer = normalContainers[i]
                    const nextContainer = normalContainers[i + 1]
                    const element = bundleContentElements.find(ce => 
                      ce.containerId === currentContainer.id && ce.opacity === 1
                    )
                    
                    if (element) {
                      shiftAnimations.push(
                        animateContentMorph(element.id, nextContainer.id, duration).then(() => {
                          setContentElements(prev => prev.map(ce => {
                            if (ce.id === element.id) {
                              return { ...ce, containerId: nextContainer.id }
                            }
                            return ce
                          }))
                        })
                      )
                    }
                  }
                  
                  // Step 3: Top teleport element fades in to topmost position
                  const fadeInDelay = duration * 0.3
                  const fadeInTween = gsap.to({}, {
                    duration: duration - fadeInDelay,
                    delay: fadeInDelay,
                    ease: 'power2.inOut',
                    onUpdate: () => {
                      setContentElements(prev => prev.map(ce => {
                        if (ce.id === topTeleportElement.id) {
                          const fadeInProgress = fadeInTween.progress()
                          const totalProgress = fadeInDelay + (fadeInProgress * (duration - fadeInDelay))
                          return { ...ce, opacity: Math.min(1, totalProgress / duration) }
                        }
                        return ce
                      }))
                    }
                  })
                  
                  const fadeInAndMorph = animateContentMorph(topTeleportElement.id, topContainer.id, duration).then(() => {
                    setContentElements(prev => prev.map(ce => {
                      if (ce.id === topTeleportElement.id) {
                        return { ...ce, containerId: topContainer.id, opacity: 1 }
                      }
                      return ce
                    }))
                  })
                  
                  allAnimations.push(
                    Promise.all([fadeOutAndMorph, ...shiftAnimations, fadeInAndMorph]).then(() => {
                      // Update teleport duplicates for next scroll
                      // Top teleport should have the next item that will come in from the top
                      // Bottom teleport should have the item that just left (bottomElement)
                      setContentElements(prev => {
                        const bundlePrevElements = prev.filter(ce => ce.bundleId === bundle.id)
                        const newTopElement = bundlePrevElements.find(ce => 
                          ce.containerId === topContainer.id && ce.opacity === 1
                        )
                        
                        // Calculate next item index for top teleport (current top - 1, wrapping)
                        let nextTopItemIndex: number | undefined
                        if (topTeleportElement.itemIndex !== undefined) {
                          nextTopItemIndex = (topTeleportElement.itemIndex - 1 + bundleItems.length) % bundleItems.length
                        }
                        
                        let updated = prev.map(ce => {
                          if (ce.bundleId !== bundle.id) return ce
                          const isTopDuplicate = ce.containerId === topTeleportContainer.id && ce.opacity === 0
                          const isBottomDuplicate = ce.containerId === bottomTeleportContainer.id && ce.opacity === 0
                          if (isTopDuplicate || isBottomDuplicate) return null
                          return ce
                        }).filter((ce): ce is ContentElement => ce !== null)
                        
                        // Update top teleport with next item
                        if (topTeleportContainer && nextTopItemIndex !== undefined) {
                          const nextItem = bundleItems[nextTopItemIndex]
                          if (nextItem) {
                            updated.push({
                              id: `teleport-top-${topTeleportContainer.id}-${nextItem.id}`,
                              bundleId: bundle.id,
                              itemIndex: nextTopItemIndex,
                              containerId: topTeleportContainer.id,
                              text: nextItem.text,
                              color: nextItem.color,
                              fontColor: nextItem.fontColor,
                              imageUrl: nextItem.imageUrl,
                              points: [...topTeleportContainer.points],
                              opacity: 0
                            })
                          }
                        }
                        
                        // Update bottom teleport with the item that just left (bottomElement)
                        if (bottomTeleportContainer && bottomElement) {
                          updated.push({
                            id: `teleport-bottom-${bottomTeleportContainer.id}-${bottomElement.itemIndex}`,
                            bundleId: bundle.id,
                            itemIndex: bottomElement.itemIndex,
                            containerId: bottomTeleportContainer.id,
                            text: bottomElement.text,
                            color: bottomElement.color,
                            fontColor: bottomElement.fontColor,
                            imageUrl: bottomElement.imageUrl,
                            points: [...bottomTeleportContainer.points],
                            opacity: 0
                          })
                        }
                        
                        return updated
                      })
                    })
                  )
                }
              } else {
                // Scrolling up:
                // 1. Topmost element → top teleport (fade out)
                // 2. All other elements shift up one position
                // 3. New element from bottom teleport → bottommost position (fade in)
                
                const topContainer = normalContainers[0]
                const bottomContainer = normalContainers[normalContainers.length - 1]
                
                const topElement = bundleContentElements.find(ce => 
                  ce.containerId === topContainer.id && ce.opacity === 1
                )
                
                // Find element in bottom teleport (this will be the new bottommost)
                const bottomTeleportElement = bundleContentElements.find(ce => 
                  ce.containerId === bottomTeleportContainer.id && ce.opacity === 0 && ce.itemIndex !== undefined
                )
                
                if (topElement && bottomTeleportElement) {
                  // Step 1: Topmost element fades out to top teleport
                  const fadeOutAndMorph = animateContentMorph(topElement.id, topTeleportContainer.id, duration).then(() => {
                    setContentElements(prev => prev.map(ce => {
                      if (ce.id === topElement.id) {
                        return { ...ce, containerId: topTeleportContainer.id, opacity: 0 }
                      }
                      return ce
                    }))
                  })
                  
                  const fadeOutTween = gsap.to({}, {
                    duration: duration,
                    ease: 'power2.inOut',
                    onUpdate: () => {
                      setContentElements(prev => prev.map(ce => {
                        if (ce.id === topElement.id) {
                          return { ...ce, opacity: Math.max(0, 1 - fadeOutTween.progress()) }
                        }
                        return ce
                      }))
                    }
                  })
                  
                  // Step 2: Shift all elements up (except topmost)
                  const shiftAnimations: Promise<void>[] = []
                  for (let i = 1; i < numVisible; i++) {
                    const currentContainer = normalContainers[i]
                    const prevContainer = normalContainers[i - 1]
                    const element = bundleContentElements.find(ce => 
                      ce.containerId === currentContainer.id && ce.opacity === 1
                    )
                    
                    if (element) {
                      shiftAnimations.push(
                        animateContentMorph(element.id, prevContainer.id, duration).then(() => {
                          setContentElements(prev => prev.map(ce => {
                            if (ce.id === element.id) {
                              return { ...ce, containerId: prevContainer.id }
                            }
                            return ce
                          }))
                        })
                      )
                    }
                  }
                  
                  // Step 3: Bottom teleport element fades in to bottommost position
                  const fadeInDelay = duration * 0.3
                  const fadeInTween = gsap.to({}, {
                    duration: duration - fadeInDelay,
                    delay: fadeInDelay,
                    ease: 'power2.inOut',
                    onUpdate: () => {
                      setContentElements(prev => prev.map(ce => {
                        if (ce.id === bottomTeleportElement.id) {
                          const fadeInProgress = fadeInTween.progress()
                          const totalProgress = fadeInDelay + (fadeInProgress * (duration - fadeInDelay))
                          return { ...ce, opacity: Math.min(1, totalProgress / duration) }
                        }
                        return ce
                      }))
                    }
                  })
                  
                  const fadeInAndMorph = animateContentMorph(bottomTeleportElement.id, bottomContainer.id, duration).then(() => {
                    setContentElements(prev => prev.map(ce => {
                      if (ce.id === bottomTeleportElement.id) {
                        return { ...ce, containerId: bottomContainer.id, opacity: 1 }
                      }
                      return ce
                    }))
                  })
                  
                  allAnimations.push(
                    Promise.all([fadeOutAndMorph, ...shiftAnimations, fadeInAndMorph]).then(() => {
                      // Update teleport duplicates for next scroll
                      // Bottom teleport should have the next item that will come in from the bottom
                      // Top teleport should have the item that just left (topElement)
                      
                      // Calculate next item index for bottom teleport (current bottom + 1, wrapping)
                      let nextBottomItemIndex: number | undefined
                      if (bottomTeleportElement.itemIndex !== undefined) {
                        nextBottomItemIndex = (bottomTeleportElement.itemIndex + 1) % bundleItems.length
                      }
                      
                      setContentElements(prev => {
                        let updated = prev.map(ce => {
                          if (ce.bundleId !== bundle.id) return ce
                          const isTopDuplicate = ce.containerId === topTeleportContainer.id && ce.opacity === 0
                          const isBottomDuplicate = ce.containerId === bottomTeleportContainer.id && ce.opacity === 0
                          if (isTopDuplicate || isBottomDuplicate) return null
                          return ce
                        }).filter((ce): ce is ContentElement => ce !== null)
                        
                        // Update bottom teleport with next item
                        if (bottomTeleportContainer && nextBottomItemIndex !== undefined) {
                          const nextItem = bundleItems[nextBottomItemIndex]
                          if (nextItem) {
                            updated.push({
                              id: `teleport-bottom-${bottomTeleportContainer.id}-${nextItem.id}`,
                              bundleId: bundle.id,
                              itemIndex: nextBottomItemIndex,
                              containerId: bottomTeleportContainer.id,
                              text: nextItem.text,
                              color: nextItem.color,
                              fontColor: nextItem.fontColor,
                              imageUrl: nextItem.imageUrl,
                              points: [...bottomTeleportContainer.points],
                              opacity: 0
                            })
                          }
                        }
                        
                        // Update top teleport with the item that just left (topElement)
                        if (topTeleportContainer && topElement) {
                          updated.push({
                            id: `teleport-top-${topTeleportContainer.id}-${topElement.itemIndex}`,
                            bundleId: bundle.id,
                            itemIndex: topElement.itemIndex,
                            containerId: topTeleportContainer.id,
                            text: topElement.text,
                            color: topElement.color,
                            fontColor: topElement.fontColor,
                            imageUrl: topElement.imageUrl,
                            points: [...topTeleportContainer.points],
                            opacity: 0
                          })
                        }
                        
                        return updated
                      })
                    })
                  )
                }
              }
            }
          } else {
            // Note: This section should not be reached if teleport containers exist
            // If teleport containers don't exist, scrolling list mode won't work properly
          }
        }
      })
      
      setIsAnimating(true)
      Promise.all(allAnimations).then(() => {
        setIsAnimating(false)
      }).catch(() => {
        setIsAnimating(false)
      })
      
      return // Skip normal animation logic
    }
    
    // Normal animation logic (when not in scrolling list mode)
    const teleportKey = direction === 'up' ? 'aboveTeleportContainerId' : 'belowTeleportContainerId'
    
    // Find all content elements that should animate or teleport
    const animations: Promise<void>[] = []
    
    // Process each bundle independently
    bundles.forEach(bundle => {
      // Get containers and content elements for this bundle
      const bundleContainers = containers.filter(c => c.bundleId === bundle.id)
      const bundleContentElements = contentElements.filter(ce => ce.bundleId === bundle.id)
      
      bundleContentElements.forEach(contentElement => {
        const currentContainer = bundleContainers.find(c => c.id === contentElement.containerId)
        if (!currentContainer) return
        
        // Check for teleport target first (teleports take priority over morph)
        // BUT skip if target is a teleport container (they don't receive elements)
        const teleportTargetId = currentContainer[teleportKey]
        if (teleportTargetId) {
          const targetContainer = bundleContainers.find(c => c.id === teleportTargetId)
          // Only teleport if target is NOT a teleport container
          if (targetContainer && targetContainer.teleportType === null) {
            // Instant teleport - this happens when animating from a container that has teleport settings
            teleportContentElement(contentElement.id, teleportTargetId)
            return
          }
        }
        
        // Otherwise, use menu order to determine target
        // Filter to normal containers only (exclude teleport containers and button containers) within this bundle
        const normalContainers = bundleContainers.filter(c => c.teleportType === null)
        
        // Find current container's index in normal containers
        const currentIndex = normalContainers.findIndex(c => c.id === contentElement.containerId)
        if (currentIndex === -1) return
        
        // Determine target index based on direction with wrap-around
        let targetIndex: number
        if (direction === 'up') {
          // If at top (index 0), wrap to bottom (last index)
          targetIndex = currentIndex === 0 ? normalContainers.length - 1 : currentIndex - 1
        } else {
          // If at bottom (last index), wrap to top (index 0)
          targetIndex = currentIndex === normalContainers.length - 1 ? 0 : currentIndex + 1
        }
        
        const targetContainerId = normalContainers[targetIndex].id
        
        // Check if this is a wrap-around (top to bottom or bottom to top)
        const isWrapAround = (direction === 'up' && currentIndex === 0) || 
                            (direction === 'down' && currentIndex === normalContainers.length - 1)
      
        if (isWrapAround) {
        // For wrap-around animations:
        // UP: topmost element → TOP teleport container (fade out), BOTTOM teleport duplicate → bottommost container (fade in)
        // DOWN: bottommost element → BOTTOM teleport container (fade out), TOP teleport duplicate → topmost container (fade in)
        
        // Find the teleport container where the current element should go (fade out destination) - within this bundle
        const fadeOutTeleportType = direction === 'up' ? 'top' : 'bottom'
        const fadeOutTeleportContainer = bundleContainers.find(c => c.teleportType === fadeOutTeleportType)
        
        // Find the teleport container that has the duplicate that should come in (fade in source) - within this bundle
        const fadeInTeleportType = direction === 'up' ? 'bottom' : 'top'
        const fadeInTeleportContainer = bundleContainers.find(c => c.teleportType === fadeInTeleportType)
        
        if (fadeOutTeleportContainer && fadeInTeleportContainer) {
          // Find the duplicate element in the fade-in teleport container (within this bundle)
          const duplicateElement = bundleContentElements.find(ce => 
            ce.containerId === fadeInTeleportContainer.id && ce.opacity === 0
          )
          
          if (duplicateElement) {
            // DUAL ANIMATION:
            // 1. Original element fades out while morphing to its teleport container (fadeOutTeleportContainer)
            // 2. Duplicate element fades in while morphing from its teleport container (fadeInTeleportContainer) to target
            
            // Animation 1: Original element moves to fade-out teleport container while fading out
            const fadeOutAndMorphToTeleport = animateContentMorph(contentElement.id, fadeOutTeleportContainer.id, duration).then(() => {
              // Update original element's container to teleport container and make it invisible
              setContentElements(prev => prev.map(ce => {
                if (ce.id === contentElement.id) {
                  return { ...ce, containerId: fadeOutTeleportContainer.id, opacity: 0 }
                }
                return ce
              }))
            })
            
            // Fade out original element while it morphs
            const fadeOutTween = gsap.to({}, {
              duration: duration,
              ease: 'power2.inOut',
              onUpdate: () => {
                setContentElements(prev => prev.map(ce => {
                  if (ce.id === contentElement.id) {
                    return { ...ce, opacity: Math.max(0, 1 - fadeOutTween.progress()) }
                  }
                  return ce
                }))
              }
            })
            
            // Animation 2: Duplicate element fades in while morphing from fade-in teleport container to target
            const fadeInDelay = duration * 0.3 // Start fading in at 30% of animation
            const fadeInTween = gsap.to({}, {
              duration: duration - fadeInDelay,
              delay: fadeInDelay,
              ease: 'power2.inOut',
              onUpdate: () => {
                setContentElements(prev => prev.map(ce => {
                  if (ce.id === duplicateElement.id) {
                    const fadeInProgress = fadeInTween.progress()
                    const totalProgress = fadeInDelay + (fadeInProgress * (duration - fadeInDelay))
                    return { ...ce, opacity: Math.min(1, totalProgress / duration) }
                  }
                  return ce
                }))
              }
            })
            
            animations.push(
              Promise.all([
                fadeOutAndMorphToTeleport,
                animateContentMorph(duplicateElement.id, targetContainerId, duration)
              ]).then(() => {
                // Update duplicate's container and make it fully visible
                setContentElements(prev => prev.map(ce => {
                  if (ce.id === duplicateElement.id) {
                    return { ...ce, containerId: targetContainerId, opacity: 1 }
                  }
                  return ce
                }))
                
                // Remove original element (it's now in fade-out teleport container with opacity 0)
                setContentElements(prev => prev.filter(ce => ce.id !== contentElement.id))
                
                // Rename duplicate to original ID for consistency
                setContentElements(prev => prev.map(ce => {
                  if (ce.id === duplicateElement.id) {
                    return { ...ce, id: contentElement.id }
                  }
                  return ce
                }))
                
                // Update duplicates in BOTH teleport containers to reflect current top/bottom elements (within this bundle)
                // REVERSED: topmost element goes in bottom teleport container, bottommost element goes in top teleport container
                setContentElements(prev => {
                  // Filter to normal containers only (exclude teleport containers) within this bundle
                  const bundleNormalContainers = bundleContainers.filter(c => c.teleportType === null)
                  
                  // Find the current topmost and bottommost normal containers in this bundle
                  const topNormalContainer = bundleNormalContainers[0]
                  const bottomNormalContainer = bundleNormalContainers[bundleNormalContainers.length - 1]
                  
                  // Find the elements currently in topmost and bottommost containers (within this bundle)
                  const bundlePrevElements = prev.filter(ce => ce.bundleId === bundle.id)
                  const topElement = bundlePrevElements.find(ce => ce.containerId === topNormalContainer?.id && ce.opacity === 1)
                  const bottomElement = bundlePrevElements.find(ce => ce.containerId === bottomNormalContainer?.id && ce.opacity === 1)
                  
                  // Find top and bottom teleport containers in this bundle
                  const topTeleportContainer = bundleContainers.find(c => c.teleportType === 'top')
                  const bottomTeleportContainer = bundleContainers.find(c => c.teleportType === 'bottom')
                  
                  // Remove old duplicates for this bundle only
                  let updated = prev.map(ce => {
                    if (ce.bundleId !== bundle.id) return ce // Keep elements from other bundles
                    const isTopDuplicate = ce.containerId === topTeleportContainer?.id && ce.opacity === 0
                    const isBottomDuplicate = ce.containerId === bottomTeleportContainer?.id && ce.opacity === 0
                    if (isTopDuplicate || isBottomDuplicate) return null // Remove duplicates
                    return ce
                  }).filter((ce): ce is ContentElement => ce !== null)
                  
                  // Create new duplicate in TOP teleport container (copy of current BOTTOM element) for this bundle
                  if (topTeleportContainer && bottomElement) {
                    updated.push({
                      id: `teleport-top-${topTeleportContainer.id}`,
                      bundleId: bundle.id,
                      itemIndex: bottomElement.itemIndex,
                      containerId: topTeleportContainer.id,
                      text: bottomElement.text,
                      color: bottomElement.color,
                      fontColor: bottomElement.fontColor,
                      imageUrl: bottomElement.imageUrl,
                      points: [...topTeleportContainer.points],
                      opacity: 0
                    })
                  }
                  
                  // Create new duplicate in BOTTOM teleport container (copy of current TOP element) for this bundle
                  if (bottomTeleportContainer && topElement) {
                    updated.push({
                      id: `teleport-bottom-${bottomTeleportContainer.id}`,
                      bundleId: bundle.id,
                      itemIndex: topElement.itemIndex,
                      containerId: bottomTeleportContainer.id,
                      text: topElement.text,
                      color: topElement.color,
                      fontColor: topElement.fontColor,
                      imageUrl: topElement.imageUrl,
                      points: [...bottomTeleportContainer.points],
                      opacity: 0
                    })
                  }
                  
                  return updated
                })
              })
            )
            return
          }
        }
        
        // No teleport container or duplicate found, use instant teleport as fallback
        teleportContentElement(contentElement.id, targetContainerId)
        return
      }
      
      // Otherwise, morph the content element to match the target container's shape
      animations.push(
        animateContentMorph(contentElement.id, targetContainerId, duration).then(() => {
          // Update the content element's current container after animation
          setContentElements(prev => prev.map(ce => {
            if (ce.id === contentElement.id) {
              return { ...ce, containerId: targetContainerId }
            }
            return ce
          }))
        })
      )
      })
    })
    
    setIsAnimating(true)
    
    // Wait for all animations to complete (teleports are instant, so they're already done)
    Promise.all(animations).then(() => {
      setIsAnimating(false)
    }).catch(() => {
      setIsAnimating(false)
    })
  }, [contentElements, containers, isAnimating, isAnimateMode, animateContentMorph, teleportContentElement, bundles, bundleItems, getBundleItems, visibleStartIndex])

  // Handle scroll wheel for animate up/down
  const handleWheel = useCallback((e: WheelEvent) => {
    // Only work in animate mode and when not already animating
    if (!isAnimateMode || isAnimating) return
    
    // If hitbox exists, check if mouse is within it
    if (hitbox) {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Only trigger animation if mouse is within hitbox
      if (!isPointInHitbox(mouseX, mouseY, hitbox)) {
        return // Mouse is outside hitbox, ignore scroll
      }
    }
    
    // Prevent default scroll behavior
    e.preventDefault()
    
    // Throttle scroll events to prevent too many rapid animations
    // But allow immediate animation start with speed-based duration
    if (scrollThrottleRef.current !== null) return
    
    // Determine direction: negative deltaY = scroll up = animate up, positive = scroll down = animate down
    const direction = e.deltaY < 0 ? 'up' : 'down'
    
    // Get scroll speed (absolute deltaY value)
    const scrollSpeed = Math.abs(e.deltaY)
    
    // Trigger animation with scroll speed
    animateDirection(direction, scrollSpeed)
    
    // Set throttle: prevent another animation until current one completes
    // Use a shorter throttle since duration is variable now
    scrollThrottleRef.current = window.setTimeout(() => {
      scrollThrottleRef.current = null
    }, 100) // Short throttle to allow rapid scrolling but prevent spam
  }, [isAnimateMode, isAnimating, animateDirection, hitbox, isPointInHitbox])

  // Add/remove scroll wheel listener
  useEffect(() => {
    const canvasContainer = canvasContainerRef.current
    if (!canvasContainer) return

    if (isAnimateMode) {
      canvasContainer.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      canvasContainer.removeEventListener('wheel', handleWheel)
      // Cleanup throttle timeout on unmount
      if (scrollThrottleRef.current !== null) {
        clearTimeout(scrollThrottleRef.current)
        scrollThrottleRef.current = null
      }
    }
  }, [isAnimateMode, handleWheel])

  // Draw SVG path on canvas with perspective transform
  // Draw perspective-warped image using PerspectiveTransform
  const drawWarpedImage = useCallback((
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    destQuad: [number, number, number, number, number, number, number, number]
  ) => {
    // Source quad: image dimensions (0,0 to width,height)
    const sourceQuad: [number, number, number, number, number, number, number, number] = [
      0, 0,                    // TL
      image.width, 0,          // TR
      image.width, image.height, // BR
      0, image.height          // BL
    ]
    
    // Create inverse transform (dest -> source) by swapping quads
    const inversePerspT = new PerspectiveTransform(destQuad, sourceQuad)
    
    // Calculate bounding box
    const xs = [destQuad[0], destQuad[2], destQuad[4], destQuad[6]]
    const ys = [destQuad[1], destQuad[3], destQuad[5], destQuad[7]]
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    
    const width = Math.ceil(maxX - minX)
    const height = Math.ceil(maxY - minY)
    
    // Create temporary canvas for warped image
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return
    
    // Draw source image to a canvas to get pixel data
    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = image.width
    sourceCanvas.height = image.height
    const sourceCtx = sourceCanvas.getContext('2d')
    if (!sourceCtx) return
    sourceCtx.drawImage(image, 0, 0)
    const sourceImageData = sourceCtx.getImageData(0, 0, image.width, image.height)
    
    // Create destination image data
    const destImageData = tempCtx.createImageData(width, height)
    const destData = destImageData.data
    const sourceData = sourceImageData.data
    
    // Sample pixels using inverse transform
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const destX = x + minX
        const destY = y + minY
        
        // Transform destination point back to source using inverse transform
        const sourcePoint = inversePerspT.transform(destX, destY)
        const srcX = Array.isArray(sourcePoint) ? sourcePoint[0] : sourcePoint.x || 0
        const srcY = Array.isArray(sourcePoint) ? sourcePoint[1] : sourcePoint.y || 0
        
        // Bilinear interpolation
        if (srcX >= 0 && srcX < image.width && srcY >= 0 && srcY < image.height) {
          const x1 = Math.floor(srcX)
          const y1 = Math.floor(srcY)
          const x2 = Math.min(x1 + 1, image.width - 1)
          const y2 = Math.min(y1 + 1, image.height - 1)
          
          const fx = srcX - x1
          const fy = srcY - y1
          
          // Get pixel values
          const getPixel = (px: number, py: number) => {
            const idx = (py * image.width + px) * 4
            return {
              r: sourceData[idx],
              g: sourceData[idx + 1],
              b: sourceData[idx + 2],
              a: sourceData[idx + 3]
            }
          }
          
          const p11 = getPixel(x1, y1)
          const p21 = getPixel(x2, y1)
          const p12 = getPixel(x1, y2)
          const p22 = getPixel(x2, y2)
          
          // Interpolate
          const r = Math.round(
            p11.r * (1 - fx) * (1 - fy) +
            p21.r * fx * (1 - fy) +
            p12.r * (1 - fx) * fy +
            p22.r * fx * fy
          )
          const g = Math.round(
            p11.g * (1 - fx) * (1 - fy) +
            p21.g * fx * (1 - fy) +
            p12.g * (1 - fx) * fy +
            p22.g * fx * fy
          )
          const b = Math.round(
            p11.b * (1 - fx) * (1 - fy) +
            p21.b * fx * (1 - fy) +
            p12.b * (1 - fx) * fy +
            p22.b * fx * fy
          )
          const a = Math.round(
            p11.a * (1 - fx) * (1 - fy) +
            p21.a * fx * (1 - fy) +
            p12.a * (1 - fx) * fy +
            p22.a * fx * fy
          )
          
          const destIdx = (y * width + x) * 4
          destData[destIdx] = r
          destData[destIdx + 1] = g
          destData[destIdx + 2] = b
          destData[destIdx + 3] = a
        }
      }
    }
    
    tempCtx.putImageData(destImageData, 0, 0)
    
    // Draw with clipping
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(destQuad[0], destQuad[1])
    ctx.lineTo(destQuad[2], destQuad[3])
    ctx.lineTo(destQuad[4], destQuad[5])
    ctx.lineTo(destQuad[6], destQuad[7])
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(tempCanvas, minX, minY)
    ctx.restore()
  }, [])

  const drawTransformedPath = useCallback((
    ctx: CanvasRenderingContext2D,
    svgPath: string,
    sourceQuad: [number, number, number, number, number, number, number, number],
    destQuad: [number, number, number, number, number, number, number, number]
  ) => {
    // Create perspective transform instance
    const perspT = new PerspectiveTransform(sourceQuad, destQuad)
    
    // Helper function to transform a point and return [x, y]
    const transformPoint = (x: number, y: number): [number, number] => {
      const result = perspT.transform(x, y)
      // The transform method returns an array [x, y]
      if (Array.isArray(result) && result.length >= 2) {
        return [result[0], result[1]]
      }
      // Fallback if result is unexpected
      return [x, y]
    }

    // Helper to convert SVG arc to canvas arc points
    const arcToCanvas = (
      x1: number, y1: number,
      rx: number, ry: number,
      rotation: number,
      largeArc: number,
      sweep: number,
      x2: number, y2: number
    ): Array<[number, number]> => {
      // Convert SVG arc to points using proper ellipse arc math
      const numSegments = 40
      const points: Array<[number, number]> = []
      
      // Normalize radii
      const dx = (x1 - x2) / 2
      const dy = (y1 - y2) / 2
      const cosPhi = Math.cos(rotation * Math.PI / 180)
      const sinPhi = Math.sin(rotation * Math.PI / 180)
      const x1p = cosPhi * dx + sinPhi * dy
      const y1p = -sinPhi * dx + cosPhi * dy
      
      // Ensure radii are large enough
      const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
      let rxScaled = rx
      let ryScaled = ry
      if (lambda > 1) {
        rxScaled = Math.sqrt(lambda) * rx
        ryScaled = Math.sqrt(lambda) * ry
      }
      
      // Calculate center
      const sign = largeArc === sweep ? -1 : 1
      const denom = (rxScaled * rxScaled) * (ryScaled * ryScaled) - (rxScaled * rxScaled) * (y1p * y1p) - (ryScaled * ryScaled) * (x1p * x1p)
      const s = sign * Math.sqrt(Math.max(0, denom) / ((rxScaled * rxScaled) * (y1p * y1p) + (ryScaled * ryScaled) * (x1p * x1p)))
      const cxp = s * rxScaled * y1p / ryScaled
      const cyp = s * -ryScaled * x1p / rxScaled
      
      const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2
      const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2
      
      // Calculate start and end angles
      const ux = (x1p - cxp) / rxScaled
      const uy = (y1p - cyp) / ryScaled
      const vx = (-x1p - cxp) / rxScaled
      const vy = (-y1p - cyp) / ryScaled
      
      let startAngle = Math.atan2(uy, ux)
      let deltaAngle = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
      
      if (sweep === 0 && deltaAngle > 0) {
        deltaAngle -= 2 * Math.PI
      } else if (sweep === 1 && deltaAngle < 0) {
        deltaAngle += 2 * Math.PI
      }
      
      // Generate points along the arc
      for (let i = 0; i <= numSegments; i++) {
        const angle = startAngle + (deltaAngle * i) / numSegments
        const x = cx + rxScaled * Math.cos(angle) * cosPhi - ryScaled * Math.sin(angle) * sinPhi
        const y = cy + rxScaled * Math.cos(angle) * sinPhi + ryScaled * Math.sin(angle) * cosPhi
        points.push([x, y])
      }
      
      return points
    }
    
    // Parse SVG path commands - improved regex to handle all commands
    const commands = svgPath.match(/[MLZACQTHVmlzacthv][^MLZACQTHVmlzacthv]*/g) || []
    
    // Start a single path for the entire letter
    ctx.beginPath()
    
    let currentX = 0
    let currentY = 0
    let startX = 0
    let startY = 0
    let pathStarted = false
    
    for (const command of commands) {
      const type = command[0].toUpperCase()
      const isRelative = command[0] === command[0].toLowerCase()
      const coords = command.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number)
      
      if (type === 'M') {
        // Move to - start a new subpath (but don't begin a new canvas path)
        if (coords.length >= 2) {
          const x = isRelative ? currentX + coords[0] : coords[0]
          const y = isRelative ? currentY + coords[1] : coords[1]
          const [tx, ty] = transformPoint(x, y)
          currentX = x
          currentY = y
          startX = x
          startY = y
          if (pathStarted) {
            // Move to new position without drawing (creates a new subpath)
            ctx.moveTo(tx, ty)
          } else {
            ctx.moveTo(tx, ty)
            pathStarted = true
          }
        }
      } else if (type === 'L') {
        // Line to
        for (let i = 0; i < coords.length; i += 2) {
          if (i + 1 < coords.length) {
            const x = isRelative ? currentX + coords[i] : coords[i]
            const y = isRelative ? currentY + coords[i + 1] : coords[i + 1]
            const [tx, ty] = transformPoint(x, y)
            currentX = x
            currentY = y
            ctx.lineTo(tx, ty)
          }
        }
      } else if (type === 'Z') {
        // Close path - return to start of current subpath
        const [tx, ty] = transformPoint(startX, startY)
        ctx.lineTo(tx, ty)
        ctx.closePath()
        // Don't fill/stroke here - we'll do it once at the end
      } else if (type === 'A') {
        // Arc command - better approximation
        if (coords.length >= 7) {
          const [rx, ry, rotation, largeArc, sweep, x, y] = coords
          const endX = isRelative ? currentX + x : x
          const endY = isRelative ? currentY + y : y
          
          // Get arc points
          const arcPoints = arcToCanvas(
            currentX, currentY,
            rx, ry,
            rotation,
            largeArc,
            sweep,
            endX, endY
          )
          
          // Draw arc segments
          for (let i = 1; i < arcPoints.length; i++) {
            const [px, py] = arcPoints[i]
            const [tx, ty] = transformPoint(px, py)
            ctx.lineTo(tx, ty)
          }
          
          currentX = endX
          currentY = endY
        }
      } else if (type === 'C') {
        // Cubic Bezier curve
        if (coords.length >= 6) {
          const [x1, y1, x2, y2, x, y] = coords
          const cp1X = isRelative ? currentX + x1 : x1
          const cp1Y = isRelative ? currentY + y1 : y1
          const cp2X = isRelative ? currentX + x2 : x2
          const cp2Y = isRelative ? currentY + y2 : y2
          const endX = isRelative ? currentX + x : x
          const endY = isRelative ? currentY + y : y
          
          // Transform control points and end point
          const [tx1, ty1] = transformPoint(cp1X, cp1Y)
          const [tx2, ty2] = transformPoint(cp2X, cp2Y)
          const [tx, ty] = transformPoint(endX, endY)
          
          ctx.bezierCurveTo(tx1, ty1, tx2, ty2, tx, ty)
          currentX = endX
          currentY = endY
        }
      } else if (type === 'H') {
        // Horizontal line
        for (let i = 0; i < coords.length; i++) {
          const x = isRelative ? currentX + coords[i] : coords[i]
          const [tx, ty] = transformPoint(x, currentY)
          currentX = x
          ctx.lineTo(tx, ty)
        }
      } else if (type === 'V') {
        // Vertical line
        for (let i = 0; i < coords.length; i++) {
          const y = isRelative ? currentY + coords[i] : coords[i]
          const [tx, ty] = transformPoint(currentX, y)
          currentY = y
          ctx.lineTo(tx, ty)
        }
      }
    }
    
    // Fill and stroke the entire path once at the end using evenodd rule
    // This creates holes for inner paths (like the center of O, A, etc.)
    try {
      // Use evenodd fill rule if supported (creates holes for overlapping paths)
      ctx.fill('evenodd' as CanvasFillRule)
    } catch {
      // Fallback for browsers that don't support evenodd
      ctx.fill()
    }
    ctx.stroke()
  }, [])

  // Draw everything
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

    // Draw uploaded image if available
    if (uploadedImage) {
      ctx.drawImage(
        uploadedImage,
        imagePosition.x,
        imagePosition.y,
        imageSize.width,
        imageSize.height
      )
      
      // Draw image border
      ctx.strokeStyle = '#999999'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 2])
      ctx.strokeRect(imagePosition.x, imagePosition.y, imageSize.width, imageSize.height)
      ctx.setLineDash([])
      
      // Draw resize handles
      const handleSize = 8
      const handles: Array<{ x: number; y: number; type: 'nw' | 'ne' | 'sw' | 'se' }> = [
        { x: imagePosition.x, y: imagePosition.y, type: 'nw' }, // NW
        { x: imagePosition.x + imageSize.width, y: imagePosition.y, type: 'ne' }, // NE
        { x: imagePosition.x, y: imagePosition.y + imageSize.height, type: 'sw' }, // SW
        { x: imagePosition.x + imageSize.width, y: imagePosition.y + imageSize.height, type: 'se' }, // SE
      ]
      
      handles.forEach((handle) => {
        const isHovered = hoveredResizeHandle === handle.type || resizeHandle === handle.type
        ctx.fillStyle = isHovered ? '#ff6b6b' : '#2196f3'
        ctx.beginPath()
        ctx.arc(handle.x, handle.y, isHovered ? handleSize + 2 : handleSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }

    // Draw border
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, canvasWidth, canvasHeight)

    // In animate mode, clip to viewport box if it exists
    if (isAnimateMode && viewportBox) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(viewportBox.x, viewportBox.y, viewportBox.width, viewportBox.height)
      ctx.clip()
    }

    // Draw containers first (invisible/transparent during animation)
    containers.forEach((container) => {
      const containerPoints = container.points
      const isSelected = container.id === selectedContainerId
      const isTeleportContainer = container.teleportType === 'top' || container.teleportType === 'bottom'
      const isButtonContainer = container.teleportType === 'button'
      const isToggleButtonContainer = container.teleportType === 'toggle'
      
      // Teleport containers (top/bottom) are invisible in both edit and animate mode (except for very faint outline in edit mode for positioning)
      if (isTeleportContainer) {
        if (!isAnimateMode && isSelected) {
          // Very faint outline in edit mode when selected (for positioning only)
          ctx.strokeStyle = `rgba(150, 150, 150, 0.2)`
          ctx.lineWidth = 1
          ctx.setLineDash([10, 10])
          ctx.beginPath()
          ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
          for (let i = 1; i < containerPoints.length; i++) {
            ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
          }
          ctx.closePath()
          ctx.stroke()
          ctx.setLineDash([])
          
          // Very faint label
          const centerX = containerPoints.reduce((sum, p) => sum + p.x, 0) / containerPoints.length
          const centerY = containerPoints.reduce((sum, p) => sum + p.y, 0) / containerPoints.length
          ctx.fillStyle = 'rgba(150, 150, 150, 0.3)'
          ctx.font = '10px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${container.name} (Teleport)`, centerX, centerY)
        }
        return // Skip normal drawing for teleport containers
      }
      
      // Button containers are visible and clickable in animate mode
      if (isButtonContainer) {
        if (isAnimateMode) {
          // Draw button container with visible styling in animate mode
          ctx.fillStyle = `${container.color}${Math.floor(0.6 * 255).toString(16).padStart(2, '0')}`
          ctx.beginPath()
          ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
          for (let i = 1; i < containerPoints.length; i++) {
            ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
          }
          ctx.closePath()
          ctx.fill()
          
          ctx.strokeStyle = container.color
          ctx.lineWidth = 3
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
          for (let i = 1; i < containerPoints.length; i++) {
            ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
          }
          ctx.closePath()
          ctx.stroke()
          
          // Draw button label
          const centerX = containerPoints.reduce((sum, p) => sum + p.x, 0) / containerPoints.length
          const centerY = containerPoints.reduce((sum, p) => sum + p.y, 0) / containerPoints.length
          ctx.fillStyle = container.color
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(container.name || 'Button', centerX, centerY)
        } else if (isSelected) {
          // Draw button container in edit mode when selected
          ctx.fillStyle = `${container.color}${Math.floor(0.4 * 255).toString(16).padStart(2, '0')}`
          ctx.beginPath()
          ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
          for (let i = 1; i < containerPoints.length; i++) {
            ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
          }
          ctx.closePath()
          ctx.fill()
          
          ctx.strokeStyle = container.color
          ctx.lineWidth = 3
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
          for (let i = 1; i < containerPoints.length; i++) {
            ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
          }
          ctx.closePath()
          ctx.stroke()
          ctx.setLineDash([])
          
          // Draw button label
          const centerX = containerPoints.reduce((sum, p) => sum + p.x, 0) / containerPoints.length
          const centerY = containerPoints.reduce((sum, p) => sum + p.y, 0) / containerPoints.length
          ctx.fillStyle = container.color
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${container.name} (Button)`, centerX, centerY)
        }
        return // Skip normal drawing for button containers
      }
      
      // Toggle button containers are visible and clickable in animate mode
      if (isToggleButtonContainer) {
        if (isAnimateMode) {
          // Draw toggle button container with visible styling in animate mode
          ctx.fillStyle = `${container.color}${Math.floor(0.6 * 255).toString(16).padStart(2, '0')}`
          ctx.beginPath()
          ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
          for (let i = 1; i < containerPoints.length; i++) {
            ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
          }
          ctx.closePath()
          ctx.fill()
          
          ctx.strokeStyle = container.color
          ctx.lineWidth = 3
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
          for (let i = 1; i < containerPoints.length; i++) {
            ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
          }
          ctx.closePath()
          ctx.stroke()
          
          // Draw toggle button label with visibility indicator
          const centerX = containerPoints.reduce((sum, p) => sum + p.x, 0) / containerPoints.length
          const centerY = containerPoints.reduce((sum, p) => sum + p.y, 0) / containerPoints.length
          ctx.fillStyle = container.color
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(container.name || (elementsVisible ? 'Toggle (ON)' : 'Toggle (OFF)'), centerX, centerY)
        } else if (isSelected) {
          // Draw toggle button container in edit mode when selected
          ctx.fillStyle = `${container.color}${Math.floor(0.4 * 255).toString(16).padStart(2, '0')}`
          ctx.beginPath()
          ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
          for (let i = 1; i < containerPoints.length; i++) {
            ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
          }
          ctx.closePath()
          ctx.fill()
          
          ctx.strokeStyle = container.color
          ctx.lineWidth = 3
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
          for (let i = 1; i < containerPoints.length; i++) {
            ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
          }
          ctx.closePath()
          ctx.stroke()
          ctx.setLineDash([])
          
          // Draw toggle button label
          const centerX = containerPoints.reduce((sum, p) => sum + p.x, 0) / containerPoints.length
          const centerY = containerPoints.reduce((sum, p) => sum + p.y, 0) / containerPoints.length
          ctx.fillStyle = container.color
          ctx.font = 'bold 14px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${container.name} (Toggle)`, centerX, centerY)
        }
        return // Skip normal drawing for toggle button containers
      }
      
      // Containers are drawn with very low opacity in animate mode, but more visible in edit mode
      const opacity = isAnimateMode ? (isSelected ? 0.3 : 0.1) : (isSelected ? 0.8 : 0.6)
      
      // Draw container fill (semi-transparent) in edit mode
      if (!isAnimateMode) {
        ctx.fillStyle = `${container.color}${Math.floor(opacity * 0.3 * 255).toString(16).padStart(2, '0')}`
        ctx.beginPath()
        ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
        for (let i = 1; i < containerPoints.length; i++) {
          ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
        }
        ctx.closePath()
        ctx.fill()
      }
      
      // Draw container outline (dashed, more visible in edit mode)
      ctx.strokeStyle = isAnimateMode 
        ? `rgba(100, 100, 100, ${opacity})`
        : isSelected 
          ? container.color 
          : `rgba(100, 100, 100, ${opacity})`
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(containerPoints[0].x, containerPoints[0].y)
      for (let i = 1; i < containerPoints.length; i++) {
        ctx.lineTo(containerPoints[i].x, containerPoints[i].y)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.setLineDash([])
      
      // Draw container label (more visible in edit mode)
      if (isSelected || !isAnimateMode) {
        const centerX = containerPoints.reduce((sum, p) => sum + p.x, 0) / containerPoints.length
        const centerY = containerPoints.reduce((sum, p) => sum + p.y, 0) / containerPoints.length
        
        ctx.fillStyle = isAnimateMode 
          ? `rgba(100, 100, 100, ${opacity * 2})`
          : isSelected
            ? container.color
            : 'rgba(100, 100, 100, 0.8)'
        ctx.font = isSelected ? 'bold 14px Arial' : '12px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(container.name, centerX, centerY)
      }

      // Draw vertex points (only for selected container, and not in animate mode)
      if (isSelected && !isAnimateMode) {
        containerPoints.forEach((point, index) => {
          const isHovered = hoveredIndex === index
          const isDragging = draggingIndex === index
          
          ctx.fillStyle = isDragging ? '#ff0000' : isHovered ? '#ff6b6b' : '#2196f3'
          ctx.beginPath()
          ctx.arc(point.x, point.y, isHovered || isDragging ? 10 : 8, 0, Math.PI * 2)
          ctx.fill()
          
          // Draw point number
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText((index + 1).toString(), point.x, point.y)
        })
      }
    })

    // Draw content elements (visible, with perspective-warped text) - only in animate mode
    if (isAnimateMode) {
      contentElements.forEach((contentElement) => {
        const contentPoints = contentElement.points
        const elementOpacity = contentElement.opacity ?? 1

        // Skip drawing if opacity is 0 (invisible elements in teleport containers)
        if (elementOpacity === 0) return

        // Check if this element is hovered or is the topmost container (within its bundle)
        const isHovered = hoveredElementId === contentElement.id
        const bundleContainers = containers.filter(c => c.bundleId === contentElement.bundleId)
        const normalContainers = bundleContainers.filter(c => c.teleportType === null) // Exclude button, toggle, and teleport containers
        const topmostContainer = normalContainers.length > 0 ? normalContainers[0] : null
        const isTopmostContainer = topmostContainer && contentElement.containerId === topmostContainer.id
        
        // Use hoverColor if element is hovered OR if it's topmost container and hoverColor is set (and not hovered)
        const effectiveFontColor = (isHovered && hoverColor) 
          ? hoverColor 
          : (!isHovered && isTopmostContainer && hoverColor)
            ? hoverColor
            : contentElement.fontColor
        
        // Use the element's font color for the outline to match
        const outlineColor = effectiveFontColor || '#666666'
        
        // Fill color is always the element's contentColor (fill color)
        const fillColor = contentElement.color || '#1a1a1a'

        // Draw filled shape first (using fill color)
        ctx.save()
        ctx.globalAlpha = elementOpacity
        ctx.fillStyle = fillColor
        ctx.beginPath()
        ctx.moveTo(contentPoints[0].x, contentPoints[0].y)
        for (let i = 1; i < contentPoints.length; i++) {
          ctx.lineTo(contentPoints[i].x, contentPoints[i].y)
        }
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        // Draw container outline that morphs with the element (always at full opacity for visibility)
        ctx.save() // Save context state
        ctx.globalAlpha = 1 // Always draw outline at full opacity
        ctx.strokeStyle = outlineColor
        ctx.lineWidth = 3
        // Solid outline (no dash)
        ctx.beginPath()
        ctx.moveTo(contentPoints[0].x, contentPoints[0].y)
        for (let i = 1; i < contentPoints.length; i++) {
          ctx.lineTo(contentPoints[i].x, contentPoints[i].y)
        }
        ctx.closePath()
        ctx.stroke()
        ctx.restore() // Restore context state

        // Set opacity for the content (can fade in/out)
        ctx.globalAlpha = elementOpacity

        // Draw perspective-warped image if imageUrl is set
        if (contentElement.imageUrl) {
          let img = imageCacheRef.current.get(contentElement.imageUrl)
          
          if (!img) {
            // Load image and cache it
            img = new Image()
            img.onload = () => {
              // Trigger redraw by forcing a state update (we'll use a dummy state)
              // For now, the useEffect will redraw on next frame
            }
            img.src = contentElement.imageUrl
            imageCacheRef.current.set(contentElement.imageUrl, img)
          }
          
          // Draw if image is loaded
          if (img.complete && img.naturalWidth > 0) {
            const destQuad: [number, number, number, number, number, number, number, number] = [
              contentPoints[0].x, contentPoints[0].y,      // TL
              contentPoints[1].x, contentPoints[1].y,     // TR
              contentPoints[2].x, contentPoints[2].y,     // BR
              contentPoints[3].x, contentPoints[3].y      // BL
            ]
            drawWarpedImage(ctx, img, destQuad)
          }
        }

        // Draw perspective-warped text if text is set (only if no image)
        if (!contentElement.imageUrl && contentElement.text && contentElement.text.length > 0) {
          // Split text into characters, keeping only letters and numbers
          // Convert letters to uppercase for dictionary lookup, but keep numbers as-is
          const textChars = contentElement.text.split('').map(char => {
            if (/[A-Za-z]/.test(char)) {
              return char.toUpperCase() // Convert letters to uppercase
            } else if (/[0-9]/.test(char)) {
              return char // Keep numbers as-is
            }
            return null // Filter out spaces and other characters
          }).filter((char): char is string => char !== null)
          
          if (textChars.length > 0) {
            ctx.fillStyle = effectiveFontColor
            ctx.strokeStyle = effectiveFontColor
            ctx.lineWidth = 2

            // Divide container into segments (one per character)
            const numChars = textChars.length
            
            for (let i = 0; i < numChars; i++) {
              const t1 = i / numChars // Start of segment (0 to 1)
              const t2 = (i + 1) / numChars // End of segment (0 to 1)
              
              // Interpolate top edge (between TL and TR)
              const topLeft = {
                x: contentPoints[0].x + (contentPoints[1].x - contentPoints[0].x) * t1,
                y: contentPoints[0].y + (contentPoints[1].y - contentPoints[0].y) * t1
              }
              const topRight = {
                x: contentPoints[0].x + (contentPoints[1].x - contentPoints[0].x) * t2,
                y: contentPoints[0].y + (contentPoints[1].y - contentPoints[0].y) * t2
              }
              
              // Interpolate bottom edge (between BL and BR)
              const bottomLeft = {
                x: contentPoints[3].x + (contentPoints[2].x - contentPoints[3].x) * t1,
                y: contentPoints[3].y + (contentPoints[2].y - contentPoints[3].y) * t1
              }
              const bottomRight = {
                x: contentPoints[3].x + (contentPoints[2].x - contentPoints[3].x) * t2,
                y: contentPoints[3].y + (contentPoints[2].y - contentPoints[3].y) * t2
              }
              
              // Create sub-quadrilateral for this character
              const letterQuad: [number, number, number, number, number, number, number, number] = [
                topLeft.x, topLeft.y,      // TL
                topRight.x, topRight.y,     // TR
                bottomRight.x, bottomRight.y, // BR
                bottomLeft.x, bottomLeft.y   // BL
              ]
              
              // Source quad: 100x100 square
              const sourceQuad: [number, number, number, number, number, number, number, number] = [
                0, 0,    // TL
                100, 0,  // TR
                100, 100, // BR
                0, 100   // BL
              ]
              
              // Get character data and draw (lookup in dictionary)
              const char = textChars[i]
              if (dictionary[char]) {
                const letterData = dictionary[char] as LetterData
                // Only draw if there's an actual path (not empty)
                if (letterData.svgPathD && letterData.svgPathD.trim().length > 0) {
                  drawTransformedPath(ctx, letterData.svgPathD, sourceQuad, letterQuad)
                }
              }
            }
          }
        }
        
        ctx.globalAlpha = 1 // Reset alpha
      })
    }

    // Restore clipping if it was applied
    if (isAnimateMode && viewportBox) {
      ctx.restore()
    }

    // Draw viewport box outline (only in edit mode)
    if (!isAnimateMode && viewportBox) {
      ctx.strokeStyle = '#ff6b6b'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(viewportBox.x, viewportBox.y, viewportBox.width, viewportBox.height)
      ctx.setLineDash([])
      
      // Draw resize handles
      const handleSize = 8
      const handles: Array<{ x: number; y: number; type: 'nw' | 'ne' | 'sw' | 'se' }> = [
        { x: viewportBox.x, y: viewportBox.y, type: 'nw' },
        { x: viewportBox.x + viewportBox.width, y: viewportBox.y, type: 'ne' },
        { x: viewportBox.x, y: viewportBox.y + viewportBox.height, type: 'sw' },
        { x: viewportBox.x + viewportBox.width, y: viewportBox.y + viewportBox.height, type: 'se' },
      ]
      
      handles.forEach((handle) => {
        const isHovered = hoveredViewportHandle === handle.type || viewportResizeHandle === handle.type
        ctx.fillStyle = isHovered ? '#ff0000' : '#ff6b6b'
        ctx.beginPath()
        ctx.arc(handle.x, handle.y, isHovered ? handleSize + 2 : handleSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      })
      
      // Draw viewport label
      ctx.fillStyle = '#ff6b6b'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText('Viewport', viewportBox.x + 5, viewportBox.y + 5)
    }

    // Draw hitbox outline (only in edit mode)
    if (!isAnimateMode && hitbox) {
      ctx.strokeStyle = '#4caf50'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height)
      ctx.setLineDash([])
      
      // Draw resize handles
      const handleSize = 8
      const handles: Array<{ x: number; y: number; type: 'nw' | 'ne' | 'sw' | 'se' }> = [
        { x: hitbox.x, y: hitbox.y, type: 'nw' },
        { x: hitbox.x + hitbox.width, y: hitbox.y, type: 'ne' },
        { x: hitbox.x, y: hitbox.y + hitbox.height, type: 'sw' },
        { x: hitbox.x + hitbox.width, y: hitbox.y + hitbox.height, type: 'se' },
      ]
      
      handles.forEach((handle) => {
        const isHovered = hoveredHitboxHandle === handle.type || hitboxResizeHandle === handle.type
        ctx.fillStyle = isHovered ? '#ff0000' : '#4caf50'
        ctx.beginPath()
        ctx.arc(handle.x, handle.y, isHovered ? handleSize + 2 : handleSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      })
      
      // Draw hitbox label
      ctx.fillStyle = '#4caf50'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText('Scroll Hitbox', hitbox.x + 5, hitbox.y + 5)
    }
  }, [containers, contentElements, selectedContainerId, hoveredIndex, draggingIndex, uploadedImage, imagePosition, imageSize, hoveredResizeHandle, resizeHandle, isAnimateMode, isAnimating, viewportBox, hoveredViewportHandle, viewportResizeHandle, hitbox, hoveredHitboxHandle, hitboxResizeHandle, dictionary, drawTransformedPath, drawWarpedImage, hoverColor, hoveredElementId])

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: '1rem',
      maxWidth: '1600px',
      width: '100%'
    }}>
      {/* Controls Sidebar */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '250px',
        maxHeight: '800px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Dictionary Upload */}
        <div>
          <input
            ref={dictionaryFileInputRef}
            type="file"
            accept=".json"
            onChange={handleDictionaryUpload}
            style={{ display: 'none' }}
            id="dictionary-upload-input"
          />
          <label
            htmlFor="dictionary-upload-input"
            style={{
              display: 'block',
              padding: '0.75rem',
              backgroundColor: '#9c27b0',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            Upload Dictionary JSON
          </label>
        </div>

        {/* Items Selector (for scrolling list mode) - Bundle Specific */}
        {!isAnimateMode && (
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#333'
            }}>
              Items for Bundle:
            </label>
            <select
              value={selectedBundleId || ''}
              onChange={(e) => setSelectedBundleId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
                marginBottom: '0.5rem'
              }}
            >
              {bundles.map(bundle => (
                <option key={bundle.id} value={bundle.id}>
                  {bundle.name}
                </option>
              ))}
            </select>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#333'
            }}>
              Number of Items (1-99):
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={selectedBundleId ? getBundleNumberOfItems(selectedBundleId) : 0}
              onChange={(e) => {
                if (!selectedBundleId) return
                const value = parseInt(e.target.value, 10)
                if (isNaN(value) || value < 0) {
                  setBundleItemsForBundle(selectedBundleId, 0)
                } else if (value > 99) {
                  setBundleItemsForBundle(selectedBundleId, 99)
                } else {
                  setBundleItemsForBundle(selectedBundleId, value)
                }
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            />
            {selectedBundleId && getBundleItems(selectedBundleId).length > 0 && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#fff3cd',
                borderRadius: '4px',
                fontSize: '0.85rem',
                color: '#856404'
              }}>
                {getBundleItems(selectedBundleId).length} item{getBundleItems(selectedBundleId).length !== 1 ? 's' : ''} generated for {bundles.find(b => b.id === selectedBundleId)?.name || 'bundle'} (item 1, item 2, ... item {getBundleItems(selectedBundleId).length})
              </div>
            )}
          </div>
        )}

        {/* Bundles Management */}
        {!isAnimateMode && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <h3 style={{ 
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#1a1a1a'
              }}>
                Bundles
              </h3>
              <button
                onClick={addBundle}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.85rem',
                  backgroundColor: '#9c27b0',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                + Add Bundle
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {bundles.map((bundle) => {
                const bundleContainers = containers.filter(c => c.bundleId === bundle.id)
                const isSelected = bundle.id === selectedBundleId
                return (
                  <div
                    key={bundle.id}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: isSelected ? '#e1bee7' : '#f5f5f5',
                      borderRadius: '4px',
                      border: isSelected ? '2px solid #9c27b0' : '1px solid #ddd',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedBundleId(bundle.id)
                      // Select first container in bundle if available
                      if (bundleContainers.length > 0) {
                        setSelectedContainerId(bundleContainers[0].id)
                      }
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={bundle.name}
                        onChange={(e) => updateBundleName(bundle.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          padding: '0.25rem',
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '0.9rem',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          color: '#1a1a1a'
                        }}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                        {bundleContainers.length} container{bundleContainers.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {bundles.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeBundle(bundle.id)
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          backgroundColor: '#ff6b6b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginLeft: '0.5rem'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Containers Management */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <h3 style={{ 
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#1a1a1a'
            }}>
              Containers
            </h3>
            {!isAnimateMode && (
              <button
                onClick={addContainer}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.85rem',
                  backgroundColor: '#2196f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                + Add
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {containers.filter(c => c.bundleId === selectedBundleId).map((container, index) => (
              <div
                key={container.id}
                draggable={!isAnimateMode && !isAnimating}
                onDragStart={(e) => handleContainerDragStart(e, container.id)}
                onDragOver={(e) => handleContainerDragOver(e, container.id)}
                onDrop={(e) => handleContainerDrop(e, container.id)}
                onDragEnd={handleContainerDragEnd}
                onDragLeave={() => {
                  if (dragOverContainerId === container.id) {
                    setDragOverContainerId(null)
                  }
                }}
                style={{
                  padding: '0.75rem',
                  backgroundColor: selectedContainerId === container.id ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '4px',
                  border: selectedContainerId === container.id 
                    ? '2px solid #2196f3' 
                    : dragOverContainerId === container.id
                      ? '2px dashed #4caf50'
                      : '1px solid #ddd',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  cursor: !isAnimateMode && !isAnimating ? 'grab' : 'default',
                  opacity: draggedContainerId === container.id ? 0.5 : 1,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {/* Drag handle indicator */}
                {!isAnimateMode && !isAnimating && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '4px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      cursor: 'grab',
                      padding: '4px'
                    }}
                  >
                    <div style={{ width: '12px', height: '2px', backgroundColor: '#999', borderRadius: '1px' }}></div>
                    <div style={{ width: '12px', height: '2px', backgroundColor: '#999', borderRadius: '1px' }}></div>
                    <div style={{ width: '12px', height: '2px', backgroundColor: '#999', borderRadius: '1px' }}></div>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingLeft: !isAnimateMode && !isAnimating ? '24px' : '0'
                }}>
                  <span 
                    style={{ 
                      fontSize: '0.9rem',
                      fontWeight: selectedContainerId === container.id ? 'bold' : 'normal',
                      cursor: isAnimating ? 'not-allowed' : 'pointer',
                      userSelect: 'none'
                    }}
                    onClick={() => {
                      if (!isAnimating) {
                        setSelectedContainerId(container.id)
                      }
                    }}
                  >
                    {container.name}
                  </span>
                  {getSelectedBundleContainers().length > 1 && !isAnimateMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isAnimating) {
                          removeContainer(container.id)
                        }
                      }}
                      disabled={isAnimating}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        backgroundColor: isAnimating ? '#ccc' : '#ff6b6b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isAnimating ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {!isAnimateMode && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontSize: '0.8rem',
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        Content Color (Fill):
                      </label>
                      <input
                        type="color"
                        value={container.contentColor || container.color}
                        onChange={(e) => {
                          if (!isAnimating) {
                            updateContainerContentColor(container.id, e.target.value)
                          }
                        }}
                        disabled={isAnimating}
                        style={{
                          width: '100%',
                          height: '40px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: isAnimating ? 'not-allowed' : 'pointer'
                        }}
                      />
                      <div style={{
                        marginTop: '0.25rem',
                        fontSize: '0.7rem',
                        color: '#666'
                      }}>
                        Fills the entire element shape
                      </div>
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontSize: '0.8rem',
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        Font Color:
                      </label>
                      <input
                        type="color"
                        value={container.fontColor || '#ffffff'}
                        onChange={(e) => {
                          if (!isAnimating) {
                            updateContainerFontColor(container.id, e.target.value)
                          }
                        }}
                        disabled={isAnimating}
                        style={{
                          width: '100%',
                          height: '40px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: isAnimating ? 'not-allowed' : 'pointer'
                        }}
                      />
                      <div style={{
                        marginTop: '0.25rem',
                        fontSize: '0.7rem',
                        color: '#666'
                      }}>
                        Color for text and outline
                      </div>
                    </div>
                    {getSelectedBundleContainers().length > 1 && (
                      <>
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '0.25rem',
                            fontSize: '0.8rem',
                            color: '#666',
                            fontWeight: '500'
                          }}>
                            Teleport Type:
                          </label>
                          <select
                            value={container.teleportType || ''}
                            onChange={(e) => {
                              if (!isAnimating) {
                                updateContainerTeleportType(container.id, (e.target.value as 'top' | 'bottom' | 'button' | 'toggle' | '') || null)
                              }
                            }}
                            disabled={isAnimating}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              backgroundColor: isAnimating ? '#f5f5f5' : '#fff',
                              cursor: isAnimating ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <option value="">Normal Container</option>
                            <option value="top">Top Teleport Container</option>
                            <option value="bottom">Bottom Teleport Container</option>
                            <option value="button">Button Container</option>
                            <option value="toggle">Toggle Button Container</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Animate Mode Toggle */}
        {!isAnimateMode ? (
          <button
            onClick={enterAnimateMode}
            disabled={isAnimating || containers.filter(c => c.bundleId === selectedBundleId).length === 0}
            style={{
              padding: '1rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              backgroundColor: isAnimating || containers.filter(c => c.bundleId === selectedBundleId).length === 0 ? '#ccc' : '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: isAnimating || containers.filter(c => c.bundleId === selectedBundleId).length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: isAnimating || containers.filter(c => c.bundleId === selectedBundleId).length === 0 ? 'none' : '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'all 0.2s',
              width: '100%'
            }}
          >
            Enter Animate Mode
          </button>
        ) : (
          <>
            <button
              onClick={exitAnimateMode}
              disabled={isAnimating}
              style={{
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                backgroundColor: isAnimating ? '#ccc' : '#ff9800',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isAnimating ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              Exit Animate Mode
            </button>
            {bundles.some(b => {
              const bundleContainers = containers.filter(c => c.bundleId === b.id)
              return bundleContainers.length >= 2
            }) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => animateDirection('up')}
                  disabled={isAnimating}
                  style={{
                    padding: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    backgroundColor: isAnimating ? '#ccc' : '#2196f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isAnimating ? 'not-allowed' : 'pointer',
                    boxShadow: isAnimating ? 'none' : '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isAnimating ? 'Animating...' : (
                    <>
                      <span>▲</span>
                      <span>Animate Up</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => animateDirection('down')}
                  disabled={isAnimating}
                  style={{
                    padding: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    backgroundColor: isAnimating ? '#ccc' : '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isAnimating ? 'not-allowed' : 'pointer',
                    boxShadow: isAnimating ? 'none' : '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isAnimating ? 'Animating...' : (
                    <>
                      <span>▼</span>
                      <span>Animate Down</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Multi-Letter Text Input (only in animate mode) - exactly like FaceMaker */}
        {isAnimateMode && (() => {
          // Find the content element for the selected container (check all elements, not just visible ones)
          let selectedContentElement = contentElements.find(ce => 
            ce.containerId === selectedContainerId
          )
          
          // If no element found for selected container, try to find by container ID pattern
          // (content elements have IDs like "content-{containerId}")
          if (!selectedContentElement) {
            selectedContentElement = contentElements.find(ce => 
              ce.id === `content-${selectedContainerId}`
            )
          }
          
          if (!selectedContentElement) return null
          
          return (
            <>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Type Text (Multiple Letters):
                </label>
                <input
                  type="text"
                  value={selectedContentElement.text}
                  onChange={(e) => updateContentElementText(selectedContentElement.id, e.target.value)}
                  placeholder="Type letters here..."
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    textTransform: 'uppercase'
                  }}
                />
                <div style={{
                  marginTop: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#666'
                }}>
                  Letters will be warped to fit the container shape
                </div>
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Upload Image:
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      const dataUrl = event.target?.result as string
                      updateContentElementImage(selectedContentElement.id, dataUrl)
                    }
                    reader.readAsDataURL(file)
                    
                    // Reset file input
                    e.target.value = ''
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                />
                {selectedContentElement.imageUrl && (
                  <div style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <img 
                      src={selectedContentElement.imageUrl} 
                      alt="Preview" 
                      style={{
                        maxWidth: '100px',
                        maxHeight: '100px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                    <button
                      onClick={() => updateContentElementImage(selectedContentElement.id, null)}
                      style={{
                        padding: '0.5rem',
                        fontSize: '0.85rem',
                        backgroundColor: '#ff6b6b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                )}
                <div style={{
                  marginTop: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#666'
                }}>
                  Image will be warped to fit the container shape. If both text and image are set, only image will be shown.
                </div>
              </div>
            </>
          )
        })()}

        {/* Container Properties (only when not in animate mode) */}
        {!isAnimateMode && selectedContainer && (
          <>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#333'
              }}>
                Container Name:
              </label>
              <input
                type="text"
                value={selectedContainer.name}
                onChange={(e) => updateContainerName(selectedContainer.id, e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#333'
              }}>
                Container Color:
              </label>
              <input
                type="color"
                value={selectedContainer.color}
                onChange={(e) => updateContainerColor(selectedContainer.id, e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#333'
              }}>
                Upload Image for Element:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    const dataUrl = event.target?.result as string
                    // Update container's imageUrl
                    setContainers(prev => prev.map(c => 
                      c.id === selectedContainer.id ? { ...c, imageUrl: dataUrl } : c
                    ))
                  }
                  reader.readAsDataURL(file)
                  
                  // Reset file input
                  e.target.value = ''
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              />
              {selectedContainer.imageUrl && (
                <div style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <img 
                    src={selectedContainer.imageUrl} 
                    alt="Preview" 
                    style={{
                      maxWidth: '100px',
                      maxHeight: '100px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                  <button
                    onClick={() => {
                      setContainers(prev => prev.map(c => 
                        c.id === selectedContainer.id ? { ...c, imageUrl: null } : c
                      ))
                    }}
                    style={{
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      backgroundColor: '#ff6b6b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
              <div style={{
                marginTop: '0.25rem',
                fontSize: '0.75rem',
                color: '#666'
              }}>
                Image will be warped to fit the container shape in animate mode. If both text and image are set, only image will be shown.
              </div>
            </div>
          </>
        )}

        {/* Viewport Box Controls */}
        {!isAnimateMode && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <label style={{
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#333'
              }}>
                Viewport Box:
              </label>
              {viewportBox ? (
                <button
                  onClick={() => setViewportBox(null)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#ff6b6b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => setViewportBox({ x: 200, y: 200, width: 800, height: 600 })}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create
                </button>
              )}
            </div>
            {viewportBox && (
              <div style={{
                fontSize: '0.75rem',
                color: '#666',
                marginTop: '0.25rem'
              }}>
                Drag to move, resize handles to adjust. Only visible area in animate mode.
              </div>
            )}
          </div>
        )}

        {/* Hitbox Controls */}
        {!isAnimateMode && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <label style={{
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#333'
              }}>
                Scroll Hitbox:
              </label>
              {hitbox ? (
                <button
                  onClick={() => setHitbox(null)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#ff6b6b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => setHitbox({ x: 200, y: 200, width: 800, height: 600 })}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create
                </button>
              )}
            </div>
            {hitbox && (
              <div style={{
                fontSize: '0.75rem',
                color: '#666',
                marginTop: '0.25rem'
              }}>
                Drag to move, resize handles to adjust. Scroll events only detected within this area in animate mode.
              </div>
            )}
          </div>
        )}

        {/* Default Color Picker */}
        {!isAnimateMode && (
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#333'
            }}>
              Default Color:
            </label>
            <input
              type="color"
              value={defaultColor}
              onChange={(e) => setDefaultColor(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
            <div style={{
              marginTop: '0.25rem',
              fontSize: '0.75rem',
              color: '#666'
            }}>
              This color will be used for new containers
            </div>
          </div>
        )}

        {/* Hover Color Picker (for topmost container / future hover state) */}
        {!isAnimateMode && (
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#333'
            }}>
              Hover/Override Color (Topmost Container):
            </label>
            <input
              type="color"
              value={hoverColor || '#ffffff'}
              onChange={(e) => setHoverColor(e.target.value || null)}
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            />
            <div style={{
              marginTop: '0.25rem',
              fontSize: '0.75rem',
              color: '#666'
            }}>
              Color used when hovering over elements. Also overrides font color for topmost container when not hovered.
            </div>
            {hoverColor && (
              <button
                onClick={() => setHoverColor(null)}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  backgroundColor: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Clear Override
              </button>
            )}
          </div>
        )}

        {/* Cascade Delay Slider (for initialization animation) */}
        {!isAnimateMode && (
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#333'
            }}>
              Initialization Cascade Delay: {cascadeDelay.toFixed(2)}s
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={cascadeDelay}
              onChange={(e) => setCascadeDelay(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.25rem',
              fontSize: '0.7rem',
              color: '#666'
            }}>
              <span>0s (Fast)</span>
              <span>2s (Slow)</span>
            </div>
            <div style={{
              marginTop: '0.25rem',
              fontSize: '0.75rem',
              color: '#666'
            }}>
              Delay between elements starting in initialization animation
            </div>
          </div>
        )}

        {/* Export/Import Container Configuration */}
        {!isAnimateMode && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <label style={{
                fontSize: '0.9rem',
                fontWeight: '500',
                color: '#333'
              }}>
                Container Configuration:
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  const config = {
                    bundles: bundles,
                    containers: containers,
                    viewportBox: viewportBox,
                    hitbox: hitbox,
                    defaultColor: defaultColor,
                    hoverColor: hoverColor,
                    cascadeDelay: cascadeDelay,
                    bundleItems: bundleItems,
                    visibleStartIndex: visibleStartIndex,
                    exportedAt: new Date().toISOString()
                  }
                  const dataStr = JSON.stringify(config, null, 2)
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = 'container-config.json'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)
                }}
                style={{
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  backgroundColor: '#2196f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Export Configuration
              </button>
              <label style={{
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                backgroundColor: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'block'
              }}>
                Import Configuration
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      try {
                        const config = JSON.parse(event.target?.result as string)
                        
                        if (config.bundles && Array.isArray(config.bundles)) {
                          setBundles(config.bundles)
                          if (config.bundles.length > 0) {
                            setSelectedBundleId(config.bundles[0].id)
                          }
                        }
                        
                        if (config.containers && Array.isArray(config.containers)) {
                          setContainers(config.containers)
                          if (config.containers.length > 0) {
                            const firstContainer = config.containers[0]
                            setSelectedContainerId(firstContainer.id)
                            // Set selected bundle to match first container's bundle
                            if (firstContainer.bundleId) {
                              setSelectedBundleId(firstContainer.bundleId)
                            }
                          }
                        }
                        
                        if (config.viewportBox) {
                          setViewportBox(config.viewportBox)
                        }
                        
                        if (config.hitbox) {
                          setHitbox(config.hitbox)
                        }
                        
                        if (config.defaultColor) {
                          setDefaultColor(config.defaultColor)
                        }
                        
                        if (config.hoverColor !== undefined) {
                          setHoverColor(config.hoverColor)
                        }
                        
                        if (config.cascadeDelay !== undefined) {
                          setCascadeDelay(config.cascadeDelay)
                        }
                        
                        // Handle bundle-specific items
                        if (config.bundleItems && typeof config.bundleItems === 'object') {
                          setBundleItems(config.bundleItems)
                        } else if (config.numberOfItems !== undefined && typeof config.numberOfItems === 'number') {
                          // Backward compatibility: if old numberOfItems exists, assign to first bundle
                          const loadedBundles = config.bundles && Array.isArray(config.bundles) ? config.bundles : bundles
                          if (loadedBundles.length > 0) {
                            const firstBundleId = loadedBundles[0].id
                            setBundleItemsForBundle(firstBundleId, config.numberOfItems)
                          }
                        } else if (config.items && Array.isArray(config.items)) {
                          // Backward compatibility: if items array exists, assign to first bundle
                          const loadedBundles = config.bundles && Array.isArray(config.bundles) ? config.bundles : bundles
                          if (loadedBundles.length > 0) {
                            const firstBundleId = loadedBundles[0].id
                            setBundleItemsForBundle(firstBundleId, config.items.length)
                          }
                        }
                        
                        if (config.visibleStartIndex && typeof config.visibleStartIndex === 'object') {
                          setVisibleStartIndex(config.visibleStartIndex)
                        }
                        
                        // Reset file input
                        e.target.value = ''
                      } catch (error) {
                        alert('Failed to import configuration. Please check the file format.')
                        console.error('Import error:', error)
                      }
                    }
                    reader.readAsText(file)
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <div style={{
              marginTop: '0.25rem',
              fontSize: '0.75rem',
              color: '#666'
            }}>
              Export saves all containers, relationships, teleport settings, viewport box, hitbox, and settings
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        flex: 1
      }}>
        {/* Image Upload Controls */}
        {!isAnimateMode && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '1200px'
          }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#333'
            }}>
              Upload Background Image:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            />
            {uploadedImage && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                color: '#666'
              }}>
                Image loaded. Drag the blue corner handles to resize.
              </div>
            )}
          </div>
        )}

        <div 
          ref={canvasContainerRef}
          style={{
            padding: '1rem',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              cursor: isResizingImage 
                ? 'nwse-resize' 
                : draggingIndex !== null 
                  ? 'grabbing' 
                  : hoveredResizeHandle !== null
                    ? 'nwse-resize'
                    : hoveredIndex !== null && !isAnimateMode
                      ? 'grab' 
                      : 'default',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '1200px',
          width: '100%'
        }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Instructions:</h3>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            {!isAnimateMode ? (
              <>
                <li>Add containers using the "+ Add" button</li>
                <li>Click on a container in the sidebar to select it</li>
                <li>Edit the container name and color</li>
                <li>Click and drag the blue vertex points (numbered 1-4) to reposition container corners</li>
                <li>Reorder containers by dragging them in the list to set animation order</li>
                <li>Click "Enter Animate Mode" to create content elements positioned over containers</li>
              </>
            ) : (
              <>
                <li>Content elements are automatically created and positioned over each container</li>
                <li>Click on a container in the sidebar to select it and edit its text</li>
                <li>Type text in the "Type Text (Multiple Letters)" input to warp letters onto the selected container</li>
                <li>Click "Animate Up" or scroll wheel UP to morph all content elements to their above containers</li>
                <li>Click "Animate Down" or scroll wheel DOWN to morph all content elements to their below containers</li>
                <li>Scroll speed determines animation speed: faster scroll = faster animation, slower scroll = slower animation</li>
                <li>Scroll wheel controls work when hovering over the canvas area</li>
                <li>Click "Exit Animate Mode" to return to container editing</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
