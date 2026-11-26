import { Button } from "@/components/ui/button";
import { Trash2, Bot } from "lucide-react";
import { toolMeta } from "@/constants/tools";

const ChatHeader = ({ selectedAgent, selectedTool, hasMessages, onClearChat }) => {
  const meta = toolMeta[selectedTool] || { name: selectedTool, icon: Bot };
  const ToolIcon = meta.icon || Bot;

  return (
    <div className="h-14 px-4 sm:px-6 border-b border-[#2B2D31] flex items-center justify-between bg-[#18191C] shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#2B2D31] border border-[#383A40] flex items-center justify-center text-[#FFC93C] shrink-0 shadow-sm">
          <ToolIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase text-white truncate tracking-tight">
            {selectedAgent?.name} // <span className="text-[#FFC93C]">{meta.name}</span>
          </h2>
        </div>
      </div>

      {hasMessages && (
        <Button
          type="button"
          variant="outline"
          onClick={onClearChat}
          title="Clear channel history"
          className="h-8 px-2.5 bg-[#232428] hover:bg-[#2B2D31] border border-[#383A40] text-[#D9DADC] hover:text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </Button>
      )}
    </div>
  );
};

export default ChatHeader;
