/**
 * RadialMenuStandalone.jsx
 * 
 * Standalone, exportable menu component - renders ONLY the menu canvas
 * No windows, modals, or extra UI - just the menu itself
 * 
 * USAGE:
 * 1. Copy this file to your project
 * 2. Install: npm install gsap perspective-transform
 * 3. Import and use:
 *    import RadialMenuStandalone from './RadialMenuStandalone'
 *    <RadialMenuStandalone 
 *      dictionaryConfig={dictionaryJson} 
 *      containerConfig={containerJson} 
 *    />
 * 
 * PROPS:
 * - dictionaryConfig: Dictionary JSON object (or path to load from)
 * - containerConfig: Container configuration JSON object
 * - backgroundColor: Optional background color (default: transparent)
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import PerspectiveTransform from 'perspective-transform'

// ============================================================================
// TYPES
// ============================================================================

const RadialMenuStandalone = ({ 
  dictionaryConfig, 
  containerConfig,
  backgroundColor = 'transparent'
}) => {
  const canvasRef = useRef(null)
  const canvasContainerRef = useRef(null)
  
  // State
  const [containers, setContainers] = useState(containerConfig?.containers || [])
  const [bundles, setBundles] = useState(containerConfig?.bundles || [])
  const [contentElements, setContentElements] = useState([])
  const [dictionary, setDictionary] = useState({})
  const [isAnimating, setIsAnimating] = useState(false)
  const viewportBox = containerConfig?.viewportBox || null
  
  // Refs for animation management
  const animationRefs = useRef({})
  const contentElementsRef = useRef([])
  const scrollThrottleRef = useRef(null)
  
  // Calculate canvas size from viewport box OR container bounds
  const calculateCanvasSize = useCallback(() => {
    if (viewportBox) {
      // Use viewport box dimensions
      return {
        width: viewportBox.width,
        height: viewportBox.height
      }
    }
    
    // Otherwise, calculate from all container points
    if (containers.length === 0) {
      return { width: 800, height: 600 } // Default fallback
    }
    
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    containers.forEach(container => {
      container.points.forEach(point => {
        minX = Math.min(minX, point.x)
        minY = Math.min(minY, point.y)
        maxX = Math.max(maxX, point.x)
        maxY = Math.max(maxY, point.y)
      })
    })
    
    // Add padding
    const padding = 20
    return {
      width: Math.max(400, maxX - minX + padding * 2),
      height: Math.max(300, maxY - minY + padding * 2)
    }
  }, [containers, viewportBox])
  
  const canvasSize = calculateCanvasSize()
  const canvasWidth = canvasSize.width
  const canvasHeight = canvasSize.height
  
  // Calculate offset if using viewport box (to crop to viewport)
  const canvasOffset = viewportBox ? {
    x: -viewportBox.x,
    y: -viewportBox.y
  } : { x: 0, y: 0 }
  
  // Keep ref in sync with state
  useEffect(() => {
    contentElementsRef.current = contentElements
  }, [contentElements])

  // Load dictionary
  useEffect(() => {
    if (typeof dictionaryConfig === 'string') {
      // Load from URL
      fetch(dictionaryConfig)
        .then(res => res.json())
        .then(data => {
          const { description, unitSize, ...letters } = data
          setDictionary(letters)
        })
        .catch(err => console.error('Failed to load dictionary:', err))
    } else if (dictionaryConfig) {
      // Use provided object
      const { description, unitSize, ...letters } = dictionaryConfig
      setDictionary(letters)
    }
  }, [dictionaryConfig])

  // Initialize content elements from config
  useEffect(() => {
    if (containers.length === 0 || bundles.length === 0) return
    
    const allNewContentElements = []
    
    bundles.forEach(bundle => {
      const bundleContainers = containers.filter(c => c.bundleId === bundle.id)
      const normalContainers = bundleContainers.filter(c => c.teleportType === null)
      
      // Create one element per normal container
      normalContainers.forEach((container) => {
        allNewContentElements.push({
          id: `content-${container.id}`,
          bundleId: bundle.id,
          containerId: container.id,
          text: container.name.replace('Container', 'Item'),
          color: container.contentColor || container.color,
          fontColor: container.fontColor || '#ffffff',
          imageUrl: container.imageUrl || null,
          points: container.points.map(p => ({
            x: p.x + canvasOffset.x,
            y: p.y + canvasOffset.y
          })),
          opacity: 1
        })
      })
      
      // Create teleport duplicates for wrap-around (REVERSED system)
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
            points: topTeleportContainer.points.map(p => ({
              x: p.x + canvasOffset.x,
              y: p.y + canvasOffset.y
            })),
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
            points: bottomTeleportContainer.points.map(p => ({
              x: p.x + canvasOffset.x,
              y: p.y + canvasOffset.y
            })),
            opacity: 0
          })
        }
      }
    })
    
    setContentElements(allNewContentElements)
  }, [containers, bundles, canvasOffset.x, canvasOffset.y])

  // ============================================================================
  // ANIMATION FUNCTIONS
  // ============================================================================
  
  const animateContentMorph = useCallback((
    contentElementId,
    targetContainerId,
    duration = 1
  ) => {
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
      
      // Calculate target points with offset
      const targetPoints = targetContainer.points.map(p => ({
        x: p.x + canvasOffset.x,
        y: p.y + canvasOffset.y
      }))
      
      // Animate each point
      const tweens = []
      contentElement.points.forEach((point, index) => {
        const targetPoint = targetPoints[index]
        if (!targetPoint) return
        
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
      
      if (tweens.length === 0) resolve()
    })
  }, [containers, canvasOffset.x, canvasOffset.y])

  const teleportContentElement = useCallback((contentElementId, targetContainerId) => {
    const targetContainer = containers.find(c => c.id === targetContainerId)
    if (!targetContainer) return
    
    const targetPoints = targetContainer.points.map(p => ({
      x: p.x + canvasOffset.x,
      y: p.y + canvasOffset.y
    }))
    
    setContentElements(prev => prev.map(ce => {
      if (ce.id === contentElementId) {
        return {
          ...ce,
          containerId: targetContainerId,
          points: targetPoints
        }
      }
      return ce
    }))
  }, [containers, canvasOffset.x, canvasOffset.y])

  // Full animateDirection function with wrap-around support
  const animateDirection = useCallback((direction, scrollSpeed) => {
    if (isAnimating) return
    
    const minDuration = 0.2
    const maxDuration = 2
    const defaultDuration = 1
    let duration = defaultDuration
    
    if (scrollSpeed !== undefined) {
      const maxSpeed = 100
      const speedRatio = Math.min(scrollSpeed / maxSpeed, 1)
      duration = maxDuration / (1 + speedRatio * 4)
      duration = Math.max(minDuration, Math.min(maxDuration, duration))
    }
    
    const teleportKey = direction === 'up' ? 'aboveTeleportContainerId' : 'belowTeleportContainerId'
    const animations = []
    
    bundles.forEach(bundle => {
      const bundleContainers = containers.filter(c => c.bundleId === bundle.id)
      const bundleContentElements = contentElements.filter(ce => ce.bundleId === bundle.id)
      
      bundleContentElements.forEach(contentElement => {
        const currentContainer = bundleContainers.find(c => c.id === contentElement.containerId)
        if (!currentContainer) return
        
        // Check for teleport target first
        const teleportTargetId = currentContainer[teleportKey]
        if (teleportTargetId) {
          const targetContainer = bundleContainers.find(c => c.id === teleportTargetId)
          if (targetContainer && targetContainer.teleportType === null) {
            teleportContentElement(contentElement.id, teleportTargetId)
            return
          }
        }
        
        // Use menu order to determine target
        const normalContainers = bundleContainers.filter(c => c.teleportType === null)
        const currentIndex = normalContainers.findIndex(c => c.id === contentElement.containerId)
        if (currentIndex === -1) return
        
        let targetIndex
        if (direction === 'up') {
          targetIndex = currentIndex === 0 ? normalContainers.length - 1 : currentIndex - 1
        } else {
          targetIndex = currentIndex === normalContainers.length - 1 ? 0 : currentIndex + 1
        }
        
        const targetContainerId = normalContainers[targetIndex].id
        const isWrapAround = (direction === 'up' && currentIndex === 0) || 
                          (direction === 'down' && currentIndex === normalContainers.length - 1)
      
        if (isWrapAround) {
          // Wrap-around animation with fade effects
          const fadeOutTeleportType = direction === 'up' ? 'top' : 'bottom'
          const fadeOutTeleportContainer = bundleContainers.find(c => c.teleportType === fadeOutTeleportType)
          const fadeInTeleportType = direction === 'up' ? 'bottom' : 'top'
          const fadeInTeleportContainer = bundleContainers.find(c => c.teleportType === fadeInTeleportType)
          
          if (fadeOutTeleportContainer && fadeInTeleportContainer) {
            const duplicateElement = bundleContentElements.find(ce => 
              ce.containerId === fadeInTeleportContainer.id && ce.opacity === 0
            )
            
            if (duplicateElement) {
              // DUAL ANIMATION: fade out + fade in
              const fadeOutAndMorphToTeleport = animateContentMorph(contentElement.id, fadeOutTeleportContainer.id, duration).then(() => {
                setContentElements(prev => prev.map(ce => {
                  if (ce.id === contentElement.id) {
                    return { ...ce, containerId: fadeOutTeleportContainer.id, opacity: 0 }
                  }
                  return ce
                }))
              })
              
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
              
              const fadeInDelay = duration * 0.3
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
                  setContentElements(prev => prev.map(ce => {
                    if (ce.id === duplicateElement.id) {
                      return { ...ce, containerId: targetContainerId, opacity: 1 }
                    }
                    return ce
                  }))
                  
                  setContentElements(prev => prev.filter(ce => ce.id !== contentElement.id))
                  
                  setContentElements(prev => prev.map(ce => {
                    if (ce.id === duplicateElement.id) {
                      return { ...ce, id: contentElement.id }
                    }
                    return ce
                  }))
                  
                  // Update duplicates for next wrap-around
                  setContentElements(prev => {
                    const bundleNormalContainers = bundleContainers.filter(c => c.teleportType === null)
                    const topNormalContainer = bundleNormalContainers[0]
                    const bottomNormalContainer = bundleNormalContainers[bundleNormalContainers.length - 1]
                    const bundlePrevElements = prev.filter(ce => ce.bundleId === bundle.id)
                    const topElement = bundlePrevElements.find(ce => ce.containerId === topNormalContainer?.id && ce.opacity === 1)
                    const bottomElement = bundlePrevElements.find(ce => ce.containerId === bottomNormalContainer?.id && ce.opacity === 1)
                    const topTeleportContainer = bundleContainers.find(c => c.teleportType === 'top')
                    const bottomTeleportContainer = bundleContainers.find(c => c.teleportType === 'bottom')
                    
                    let updated = prev.map(ce => {
                      if (ce.bundleId !== bundle.id) return ce
                      const isTopDuplicate = ce.containerId === topTeleportContainer?.id && ce.opacity === 0
                      const isBottomDuplicate = ce.containerId === bottomTeleportContainer?.id && ce.opacity === 0
                      if (isTopDuplicate || isBottomDuplicate) return null
                      return ce
                    }).filter(ce => ce !== null)
                    
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
                        points: topTeleportContainer.points.map(p => ({
                          x: p.x + canvasOffset.x,
                          y: p.y + canvasOffset.y
                        })),
                        opacity: 0
                      })
                    }
                    
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
                        points: bottomTeleportContainer.points.map(p => ({
                          x: p.x + canvasOffset.x,
                          y: p.y + canvasOffset.y
                        })),
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
          
          // Fallback if no teleport containers
          teleportContentElement(contentElement.id, targetContainerId)
          return
        }
        
        // Normal morph animation
        animations.push(
          animateContentMorph(contentElement.id, targetContainerId, duration).then(() => {
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
    Promise.all(animations).then(() => {
      setIsAnimating(false)
    }).catch(() => {
      setIsAnimating(false)
    })
  }, [isAnimating, containers, contentElements, animateContentMorph, teleportContentElement, bundles, canvasOffset.x, canvasOffset.y])

  // ============================================================================
  // RENDERING FUNCTIONS
  // ============================================================================
  
  // Full drawTransformedPath function with complete SVG path parsing
  const drawTransformedPath = useCallback((
    ctx,
    svgPath,
    sourceQuad,
    destQuad
  ) => {
    const perspT = new PerspectiveTransform(sourceQuad, destQuad)
    
    const transformPoint = (x, y) => {
      const result = perspT.transform(x, y)
      if (Array.isArray(result) && result.length >= 2) {
        return [result[0], result[1]]
      }
      return [x, y]
    }

    // Helper to convert SVG arc to canvas arc points
    const arcToCanvas = (
      x1, y1,
      rx, ry,
      rotation,
      largeArc,
      sweep,
      x2, y2
    ) => {
      const numSegments = 40
      const points = []
      
      const dx = (x1 - x2) / 2
      const dy = (y1 - y2) / 2
      const cosPhi = Math.cos(rotation * Math.PI / 180)
      const sinPhi = Math.sin(rotation * Math.PI / 180)
      const x1p = cosPhi * dx + sinPhi * dy
      const y1p = -sinPhi * dx + cosPhi * dy
      
      const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
      let rxScaled = rx
      let ryScaled = ry
      if (lambda > 1) {
        rxScaled = Math.sqrt(lambda) * rx
        ryScaled = Math.sqrt(lambda) * ry
      }
      
      const sign = largeArc === sweep ? -1 : 1
      const denom = (rxScaled * rxScaled) * (ryScaled * ryScaled) - (rxScaled * rxScaled) * (y1p * y1p) - (ryScaled * ryScaled) * (x1p * x1p)
      const s = sign * Math.sqrt(Math.max(0, denom) / ((rxScaled * rxScaled) * (y1p * y1p) + (ryScaled * ryScaled) * (x1p * x1p)))
      const cxp = s * rxScaled * y1p / ryScaled
      const cyp = s * -ryScaled * x1p / rxScaled
      
      const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2
      const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2
      
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
      
      for (let i = 0; i <= numSegments; i++) {
        const angle = startAngle + (deltaAngle * i) / numSegments
        const x = cx + rxScaled * Math.cos(angle) * cosPhi - ryScaled * Math.sin(angle) * sinPhi
        const y = cy + rxScaled * Math.cos(angle) * sinPhi + ryScaled * Math.sin(angle) * cosPhi
        points.push([x, y])
      }
      
      return points
    }
    
    const commands = svgPath.match(/[MLZACQTHVmlzacthv][^MLZACQTHVmlzacthv]*/g) || []
    
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
        if (coords.length >= 2) {
          const x = isRelative ? currentX + coords[0] : coords[0]
          const y = isRelative ? currentY + coords[1] : coords[1]
          const [tx, ty] = transformPoint(x, y)
          currentX = x
          currentY = y
          startX = x
          startY = y
          if (pathStarted) {
            ctx.moveTo(tx, ty)
          } else {
            ctx.moveTo(tx, ty)
            pathStarted = true
          }
        }
      } else if (type === 'L') {
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
        const [tx, ty] = transformPoint(startX, startY)
        ctx.lineTo(tx, ty)
        ctx.closePath()
      } else if (type === 'A') {
        if (coords.length >= 7) {
          const [rx, ry, rotation, largeArc, sweep, x, y] = coords
          const endX = isRelative ? currentX + x : x
          const endY = isRelative ? currentY + y : y
          
          const arcPoints = arcToCanvas(
            currentX, currentY,
            rx, ry,
            rotation,
            largeArc,
            sweep,
            endX, endY
          )
          
          for (let i = 1; i < arcPoints.length; i++) {
            const [px, py] = arcPoints[i]
            const [tx, ty] = transformPoint(px, py)
            ctx.lineTo(tx, ty)
          }
          
          currentX = endX
          currentY = endY
        }
      } else if (type === 'C') {
        if (coords.length >= 6) {
          const [x1, y1, x2, y2, x, y] = coords
          const cp1X = isRelative ? currentX + x1 : x1
          const cp1Y = isRelative ? currentY + y1 : y1
          const cp2X = isRelative ? currentX + x2 : x2
          const cp2Y = isRelative ? currentY + y2 : y2
          const endX = isRelative ? currentX + x : x
          const endY = isRelative ? currentY + y : y
          
          const [tx1, ty1] = transformPoint(cp1X, cp1Y)
          const [tx2, ty2] = transformPoint(cp2X, cp2Y)
          const [tx, ty] = transformPoint(endX, endY)
          
          ctx.bezierCurveTo(tx1, ty1, tx2, ty2, tx, ty)
          currentX = endX
          currentY = endY
        }
      } else if (type === 'H') {
        for (let i = 0; i < coords.length; i++) {
          const x = isRelative ? currentX + coords[i] : coords[i]
          const [tx, ty] = transformPoint(x, currentY)
          currentX = x
          ctx.lineTo(tx, ty)
        }
      } else if (type === 'V') {
        for (let i = 0; i < coords.length; i++) {
          const y = isRelative ? currentY + coords[i] : coords[i]
          const [tx, ty] = transformPoint(currentX, y)
          currentY = y
          ctx.lineTo(tx, ty)
        }
      }
    }
    
    try {
      ctx.fill('evenodd')
    } catch {
      ctx.fill()
    }
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
    ctx.fillStyle = backgroundColor === 'transparent' ? 'rgba(0,0,0,0)' : backgroundColor
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw content elements
    contentElements.forEach(element => {
      if (element.opacity === 0) return
      
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
      if (element.text && element.text.length > 0 && dictionary[element.text[0]]) {
        const letterData = dictionary[element.text[0]]
        const sourceQuad = [0, 0, 100, 0, 100, 100, 0, 100]
        const destQuad = [
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
  }, [contentElements, canvasWidth, canvasHeight, backgroundColor, dictionary, drawTransformedPath])

  // ============================================================================
  // SCROLL WHEEL HANDLING
  // ============================================================================
  
  const handleWheel = useCallback((e) => {
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
  // RENDER - Just the canvas, nothing else
  // ============================================================================
  
  return (
    <div
      ref={canvasContainerRef}
      style={{
        position: 'relative',
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        cursor: 'default',
        display: 'inline-block'
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
    </div>
  )
}

export default RadialMenuStandalone

