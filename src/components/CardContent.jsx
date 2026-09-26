import React from 'react';

/**
 * Clean Twitter-style titles by removing usernames, handles, and RT markers
 */
const cleanDisplayTitle = (title) => {
  if (!title) return '';

  let cleaned = title;

  // Remove "Name (@handle): " prefix pattern
  cleaned = cleaned.replace(/^.+?\s*\(@.+?\):\s*/, '');

  // Remove "RT @username: " pattern at the start
  cleaned = cleaned.replace(/^RT\s+@\w+:\s*/i, '');

  // Remove @mentions at the very start (replies)
  cleaned = cleaned.replace(/^@\w+\s+/g, '');

  // Remove multiple @mentions in a row at the start
  cleaned = cleaned.replace(/^(@\w+\s+)+/g, '');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned || title; // Fallback to original if cleaning results in empty string
};

/**
 * Card content area - for title, description, metadata, etc.
 */
const CardContent = ({
  children,
  title,
  subtitle,
  metadata,
  actions, // Action buttons/menus that go in bottom-right
  headerActions, // Actions that go next to the title
  className = '',
  padding = 'p-3',
}) => {
  const displayTitle = cleanDisplayTitle(title);

  return (
    <div className={`${padding} relative ${className}`}>
      <div className="flex items-start justify-between gap-2">
        {displayTitle && (
          <h3 className="font-medium text-sm truncate transition-colors flex-1"
            style={{ color: '#052F4A' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#052F4A'}>
            {displayTitle}
          </h3>
        )}
        {headerActions && (
          <div className="flex-shrink-0" data-card-action="true">
            {headerActions}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-slate-400 text-xs mt-1 line-clamp-2">
          {subtitle}
        </p>
      )}
      {metadata && (
        <div className="mt-1 text-slate-500 text-xs">
          {metadata}
        </div>
      )}
      {children}

      {/* Actions positioned in bottom-right */}
      {actions && (
        <div className="absolute bottom-2 right-2" data-card-action="true">
          {actions}
        </div>
      )}
    </div>
  );
};

export default CardContent;

