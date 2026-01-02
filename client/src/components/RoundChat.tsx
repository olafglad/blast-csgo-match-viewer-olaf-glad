import type { ChatMessage } from '@shared';
import { CT_COLOR, T_COLOR } from '@shared';

interface Props {
  messages: ChatMessage[];
}

export function RoundChat({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <div className="bg-gray-900/80 rounded-lg p-4 mt-4 border border-gray-700">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Round Chat</h4>
        <p className="text-gray-500 text-sm italic">No chat messages this round</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 rounded-lg p-4 mt-4 border border-gray-700">
      <h4 className="text-sm font-semibold text-gray-400 mb-3">Round Chat</h4>
      <div className="space-y-1 font-mono text-sm max-h-48 overflow-y-auto">
        {messages.map((msg, idx) => {
          const teamColor = msg.side === 'CT' ? CT_COLOR : T_COLOR;

          return (
            <div
              key={idx}
              className={`flex items-start gap-2 ${msg.isFreezeTime ? 'opacity-60' : ''}`}
              style={{ opacity: msg.isTeamChat && !msg.isFreezeTime ? 0.85 : undefined }}
            >
              {/* Timestamp */}
              <span className={`shrink-0 w-12 ${msg.isFreezeTime ? 'text-blue-400' : 'text-gray-500'}`}>
                [{msg.relativeTime}]
              </span>

              {/* Freeze time indicator */}
              {msg.isFreezeTime && (
                <span className="text-xs px-1 rounded shrink-0 bg-blue-500/20 text-blue-300">
                  BUY
                </span>
              )}

              {/* Team chat indicator */}
              {msg.isTeamChat && (
                <span
                  className="text-xs px-1 rounded shrink-0"
                  style={{
                    backgroundColor: `${teamColor}30`,
                    color: teamColor,
                  }}
                >
                  TEAM
                </span>
              )}

              {/* Player name */}
              <span
                className="font-semibold shrink-0"
                style={{ color: teamColor }}
              >
                {msg.player}
              </span>

              <span className="text-gray-500">:</span>

              {/* Message */}
              <span className="text-gray-200 break-words">
                {msg.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
