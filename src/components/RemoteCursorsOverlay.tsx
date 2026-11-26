import type { RemoteCursor } from '../types';

interface RemoteCursorsOverlayProps {
  cursors: RemoteCursor[];
  activeView: string;
}

export function RemoteCursorsOverlay({ cursors, activeView }: RemoteCursorsOverlayProps) {
  const visible = cursors.filter((c) => c.view === activeView);
  if (visible.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden="true">
      {visible.map((cursor) => (
        <div
          key={cursor.clientId}
          className="absolute top-0 left-0 transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `translate3d(${cursor.x}%, ${cursor.y}%, 0)`,
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <div className="relative inline-flex items-start">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="drop-shadow-xs -mt-0.5 -ml-0.5"
            >
              <path
                d="M2 1.5L15.5 7.2L9.3 9.5L7.1 15.8L2 1.5Z"
                fill={cursor.cursorColor}
                stroke="#ffffff"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="ml-1 mt-3 px-2 py-0.5 text-[11px] font-medium text-white rounded-[4px] whitespace-nowrap shadow-xs"
              style={{ backgroundColor: cursor.cursorColor }}
            >
              {cursor.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
