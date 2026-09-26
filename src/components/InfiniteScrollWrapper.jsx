
import React, { useLayoutEffect, useRef, useEffect, useState } from 'react';

const InfiniteScrollWrapper = ({ children, scrollRef, bufferCount = 6 }) => {
    const elements = React.Children.toArray(children);
    const wrapperRef = useRef(null);

    // If not enough items to scroll meaningfully, just return children
    // (Screen width ~2000px, item ~500px => 4 items visible. buffer needs to cover this.)
    // If we have fewer items than buffer, duplicating them might look weird or be exactly what's needed.
    // Let's handle generic case:

    const shouldEnable = elements.length > 0;

    // We place the LAST bufferCount items at the BEGINNING (left).
    // We place the FIRST bufferCount items at the END (right).

    // Handle case where total elements < bufferCount: we repeat the whole list until we fill the buffer?
    // Simpler: just wrap whatever we have.
    // Note: if elements.length < bufferCount, slice(-bufferCount) returns the whole array.

    const endBuffer = shouldEnable
        ? elements.slice(-bufferCount).map(el =>
            React.cloneElement(el, { key: `buf-start-${el.key || Math.random()}` })
        )
        : [];

    const startBuffer = shouldEnable
        ? elements.slice(0, bufferCount).map(el =>
            React.cloneElement(el, { key: `buf-end-${el.key || Math.random()}` })
        )
        : [];

    const DisplayContent = [...endBuffer, ...elements, ...startBuffer];

    // We track initialization to avoid fighting with user scroll
    // We store the calculated startOffset in a Ref to be accessible by parent

    useLayoutEffect(() => {
        const container = scrollRef.current;
        if (!container || !wrapperRef.current) return;

        // Calculate startOfReal
        // The items are children of wrapperRef.current
        const actualBufferCount = endBuffer.length;

        if (wrapperRef.current.children.length > actualBufferCount) {
            const firstRealElement = wrapperRef.current.children[actualBufferCount];
            const startOfReal = firstRealElement.offsetLeft;
            const elementWidth = firstRealElement.offsetWidth;
            const containerWidth = container.clientWidth;

            // Calculate offset to center the first element
            // We want: scrollLeft + containerWidth/2 = startOfReal + elementWidth/2
            // scrollLeft = startOfReal + elementWidth/2 - containerWidth/2
            // If container is wider than element (usual case), we shift left (subtract padding)
            const centerPadding = (containerWidth - elementWidth) / 2;
            const centeredStart = startOfReal - centerPadding;

            // Store for parent access (scrollToTop will use this)
            container.dataset.startOffset = centeredStart;

            // Initial positioning: if scroll is 0 (default), jump to centeredStart
            // We use a small tolerance because browser restoration might put it at non-zero
            // But for infinite scroll, 0 is the "Buffer" zone, so we usually want to jump out of it.
            // Unless users *intentionally* scrolled there (unlikely on mount).
            if (container.scrollLeft === 0) {
                container.scrollLeft = centeredStart;
            }
        }
    });

    // Scroll Handler
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || !wrapperRef.current || !shouldEnable) return;

        const handleScroll = () => {
            const children = wrapperRef.current.children;
            const leftBufferCount = endBuffer.length;
            if (children.length <= leftBufferCount) return;

            const firstRealElement = children[leftBufferCount];
            const firstRightBufferElement = children[children.length - startBuffer.length];

            // We assume the layout is stable
            const startOfReal = firstRealElement.offsetLeft;
            // widthOfReal is distance from start of real content to start of right buffer
            // Note: this accounts for variable widths of items!
            const widthOfReal = firstRightBufferElement.offsetLeft - startOfReal;

            const currentScroll = container.scrollLeft;

            // Threshold of 10px to catch "hitting the wall"
            if (currentScroll < 10) {
                // Hitting left wall -> jump to right
                // Precise jump: maintain offset within the wrap
                // offset = currentScroll. Mapping: currentScroll -> currentScroll + widthOfReal
                container.scrollLeft = currentScroll + widthOfReal;
            }
            else if (currentScroll > startOfReal + widthOfReal - 10) {
                // Hitting right wall (start of right buffer) -> jump to left
                // offset = currentScroll - (startOfReal + widthOfReal)
                // target = startOfReal + offset = currentScroll - widthOfReal
                container.scrollLeft = currentScroll - widthOfReal;
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }); // Run on every render to ensure we have fresh refs/closures if needed

    return (
        <div className="flex gap-4" style={{ width: 'max-content' }} ref={wrapperRef}>
            {DisplayContent}
        </div>
    );
};

export default InfiniteScrollWrapper;
