import { Loader2, Bot, Plus } from "lucide-react";
import { toolMeta } from "@/constants/tools";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

const ChatMessageList = ({
  messages = [],
  loadingHistory,
  sending,
  agentName,
  selectedTool,
  messageEndRef,
}) => {
  const meta = toolMeta[selectedTool] || {
    name: selectedTool || "Tool",
    icon: Bot,
    description: "Automate workflows and tasks.",
  };
  const ToolIcon = meta?.icon || Bot;

  if (loadingHistory) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#949BA4]">
        <Loader2 className="w-5 h-5 animate-spin text-[#FFC93C]" />
        <span className="text-xs font-medium text-[#949BA4]">
          Loading conversation history...
        </span>
      </div>
    );
  }

  // When no agents are deployed yet
  if (!agentName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full select-none animate-fade-in">
        <div className="w-16 h-16 rounded-2xl border border-[#383A40] bg-gradient-to-b from-[#2B2D33] to-[#1E1F23] flex items-center justify-center text-[#FFC93C] mb-5 shadow-2xl animate-float-slow">
          <Bot className="w-8 h-8 stroke-[1.5]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC93C]/10 border border-[#FFC93C]/20 text-[#FFC93C] text-[11px] font-semibold tracking-wide mb-2">
          Workspace Ready
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Welcome to Agentra-AI
        </h2>
        <p className="text-xs sm:text-sm text-[#949BA4] mt-2 leading-relaxed">
          Create an agent to automate workflows across Gmail, Google Calendar,
          Google Sheets, and the web.
        </p>
        <Link
          to="/createAgent"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFC93C] hover:bg-[#e6b435] text-black font-semibold text-xs shadow-lg hover:shadow-[0_0_20px_rgba(255,201,60,0.3)] transition-all cursor-pointer group"
        >
          <Plus className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform" />
          <span>Create Your First Agent</span>
        </Link>
      </div>
    );
  }

  // Clean, single-line explanation when thread is empty (no boxes, no presets)
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full select-none animate-fade-in">
        <div className="w-14 h-14 rounded-2xl border border-[#383A40] bg-gradient-to-b from-[#2B2D33] to-[#1E1F23] flex items-center justify-center text-[#FFC93C] mb-4 shadow-lg">
          <ToolIcon className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <span>{agentName || "Agent"}</span>
          <span className="text-[#383A40]">/</span>
          <span className="text-[#FFC93C]">{meta.name}</span>
        </h2>

        <p className="text-xs text-[#949BA4] mt-2 max-w-sm leading-relaxed">
          {meta.description || `Automate workflows and tasks with ${meta.name}.`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl sm:max-w-4xl mx-auto flex flex-col gap-5">
        {messages.map((msg) => {
          if (!msg) return null;
          const isUser = msg.sender === "user";
          const messageContent =
            typeof msg.message === "string"
              ? msg.message
              : typeof msg.message === "object"
                ? JSON.stringify(msg.message, null, 2)
                : String(msg.message || "");

          return (
            <div
              key={msg._id || Math.random().toString()}
              className={`flex flex-col gap-1 ${
                isUser ? "items-end" : "items-start"
              }`}
            >
              {/* Sender Name + Timestamp Header */}
              <div
                className={`flex items-center gap-2 px-1 text-[11px] font-mono select-none ${
                  isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <span className="font-semibold text-white">
                  {isUser ? "You" : agentName || "Agent"}
                </span>
                <span className="text-[#949BA4]">
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#FFC93C] text-black font-medium rounded-tr-sm shadow-md"
                    : "bg-[#232428] text-white border border-[#383A40] rounded-tl-sm shadow-sm"
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap break-words">
                    {messageContent}
                  </p>
                ) : (
                  <div className="prose prose-invert prose-xs sm:prose-sm max-w-none break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p className="mb-2 last:mb-0" {...props} />
                        ),
                        a: ({ node, ...props }) => (
                          <a
                            className="text-[#FFC93C] underline hover:text-[#e6b435] transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          />
                        ),
                        code: ({ node, inline, ...props }) =>
                          inline ? (
                            <code
                              className="px-1.5 py-0.5 rounded bg-[#18191C] font-mono text-xs text-[#FFC93C]"
                              {...props}
                            />
                          ) : (
                            <pre className="p-3 rounded-xl bg-[#18191C] border border-[#383A40] overflow-x-auto my-2">
                              <code
                                className="font-mono text-xs text-white"
                                {...props}
                              />
                            </pre>
                          ),
                      }}
                    >
                      {messageContent}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Streaming/Generating Typing Indicator */}
        {sending && (
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-[#949BA4] select-none">
              <span className="font-semibold text-white">
                {agentName || "Agent"}
              </span>
              <span>Thinking...</span>
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#232428] border border-[#383A40] flex items-center gap-2 text-[#FFC93C]">
              <Loader2 className="w-4 h-4 animate-spin text-[#FFC93C]" />
              <span className="text-xs font-mono text-[#D9DADC]">
                Running agent tools...
              </span>
            </div>
          </div>
        )}

        <div ref={messageEndRef} />
      </div>
    </div>
  );
};

export default ChatMessageList;
