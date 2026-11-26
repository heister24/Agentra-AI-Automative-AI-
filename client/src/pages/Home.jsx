import ChatInput from "@/components/chat/ChatInput";
import ChatMessageList from "@/components/chat/ChatMessageList";
import Navbar from "@/components/Navbar";
import { clearChatHistory, sendChatMessage } from "@/features/chat";
import { fetchAgents, setSelectedAgentId } from "@/redux/agentSlice";
import {
  addMessageToThread,
  clearThreadCache,
  fetchThreadHistory,
  setSelectedTool,
  setSending,
} from "@/redux/chatSlice";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

const Home = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAgentId = searchParams.get("agentId");
  const urlPrompt = searchParams.get("prompt");

  // Redux centralized state
  const { agents, selectedAgentId, isFetched } = useSelector(
    (state) => state.agent,
  );
  const { selectedTool, chatCache, loadingHistory, sending } = useSelector(
    (state) => state.chat,
  );

  const [inputPrompt, setInputPrompt] = useState("");
  const messageEndRef = useRef(null);

  // Auto-fill prompt if passed via query param (e.g. from Agent Card quick actions)
  useEffect(() => {
    if (urlPrompt) {
      setInputPrompt(urlPrompt);
    }
  }, [urlPrompt]);

  // 1. Fetch agents if not already fetched in this session
  useEffect(() => {
    if (!isFetched) {
      dispatch(fetchAgents());
    }
  }, [dispatch, isFetched]);

  // 2. Synchronize selected agent with URL or default to first agent
  useEffect(() => {
    if (agents.length > 0) {
      if (urlAgentId && agents.some((a) => a._id === urlAgentId)) {
        if (selectedAgentId !== urlAgentId) {
          dispatch(setSelectedAgentId(urlAgentId));
        }
      } else if (
        !selectedAgentId ||
        !agents.some((a) => a._id === selectedAgentId)
      ) {
        dispatch(setSelectedAgentId(agents[0]._id));
      }
    }
  }, [agents, urlAgentId, selectedAgentId, dispatch]);

  // Active Agent Object
  const selectedAgent =
    agents.find((a) => a._id === selectedAgentId) || agents[0] || null;

  // 3. Auto-select Unified Workspace (or first tool) if no valid tool is selected
  useEffect(() => {
    if (selectedAgent?.tools?.length > 0) {
      if (!selectedTool) {
        dispatch(setSelectedTool("workspace"));
      } else if (
        selectedTool !== "workspace" &&
        !selectedAgent.tools.includes(selectedTool)
      ) {
        dispatch(setSelectedTool("workspace"));
      }
    } else if (
      selectedAgent &&
      (!selectedAgent.tools || selectedAgent.tools.length === 0)
    ) {
      dispatch(setSelectedTool(null));
    }
  }, [selectedAgent, selectedTool, dispatch]);

  // 4. Thread key and active messages from Redux cache
  const threadKey =
    selectedAgent?._id && selectedTool
      ? `${selectedAgent._id}_${selectedTool}`
      : null;

  const messages =
    threadKey && chatCache[threadKey] ? chatCache[threadKey] : [];

  // 5. Fetch history with 0ms cache check
  useEffect(() => {
    if (selectedAgent?._id && selectedTool) {
      dispatch(
        fetchThreadHistory({
          agentId: selectedAgent._id,
          toolId: selectedTool,
        }),
      );
    }
  }, [selectedAgent?._id, selectedTool, dispatch]);

  // 6. Smooth scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // 7. Send Message Handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const prompt = inputPrompt.trim();
    if (
      !prompt ||
      sending ||
      !selectedAgent?._id ||
      !selectedTool ||
      !threadKey
    )
      return;

    // Guard: Disallow execution if agent is inactive
    if (selectedAgent?.isActive === false) {
      dispatch(
        addMessageToThread({
          threadKey,
          message: {
            _id: (Date.now() + 1).toString(),
            sender: "ai",
            message: `⚠️Agent "${selectedAgent.name}" is currently inactive (OFF). Please activate it from "My Agents" to execute workflows.`,
            createdAt: new Date().toISOString(),
          },
        }),
      );
      return;
    }

    const userMessage = {
      _id: Date.now().toString(),
      sender: "user",
      message: prompt,
      createdAt: new Date().toISOString(),
    };

    // Instant optimistic render in Redux cache
    dispatch(addMessageToThread({ threadKey, message: userMessage }));
    setInputPrompt("");
    dispatch(setSending(true));

    try {
      const response = await sendChatMessage({
        agentId: selectedAgent._id,
        toolId: selectedTool,
        userPrompt: prompt,
      });

      if (response?.aiResponse) {
        const aiMessage = {
          _id: (Date.now() + 1).toString(),
          sender: "ai",
          message: response.aiResponse,
          createdAt: new Date().toISOString(),
          toolsUsed: response.toolsUsed || [],
        };
        dispatch(addMessageToThread({ threadKey, message: aiMessage }));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      const serverErrMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to process request. Please try again.";

      dispatch(
        addMessageToThread({
          threadKey,
          message: {
            _id: (Date.now() + 1).toString(),
            sender: "ai",
            message: `⚠️ ${serverErrMsg}`,
            createdAt: new Date().toISOString(),
          },
        }),
      );
    } finally {
      dispatch(setSending(false));
    }
  };

  // 8. Clear Chat Handler
  const handleClearChat = async () => {
    if (!selectedAgent?._id || !selectedTool || !threadKey) return;
    const confirmed = window.confirm("Clear this tool's conversation history?");
    if (!confirmed) return;

    // Instant cache reset
    dispatch(clearThreadCache(threadKey));
    try {
      await clearChatHistory(selectedAgent._id, selectedTool);
    } catch (err) {
      console.error("Error clearing chat history:", err);
    }
  };

  // Switch agent callback
  const handleSelectAgent = (ag) => {
    dispatch(setSelectedAgentId(ag?._id));
    setSearchParams({ agentId: ag?._id });
    dispatch(setSelectedTool(ag?.tools?.[0] || null));
  };

  // Switch tool callback
  const handleSelectTool = (toolId) => {
    dispatch(setSelectedTool(toolId));
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#131417] text-white selection:bg-[#FFC93C] selection:text-black overflow-hidden relative">
      {/* Left Sidebar / Mobile Navbar */}
      <Navbar />

      {/* Main Single-Column Chat Canvas */}
      <main className="flex-1 h-full flex flex-col overflow-hidden relative ambient-glow">
        <ChatMessageList
          messages={messages}
          loadingHistory={loadingHistory}
          sending={sending}
          agentName={selectedAgent?.name}
          selectedTool={selectedTool}
          messageEndRef={messageEndRef}
          onSelectPrompt={(promptText) => setInputPrompt(promptText)}
        />

        {/* Floating / Docked Bottom Input Bar */}
        <ChatInput
          inputPrompt={inputPrompt}
          setInputPrompt={setInputPrompt}
          onSendMessage={handleSendMessage}
          sending={sending}
          agents={agents}
          selectedAgent={selectedAgent}
          onSelectAgent={handleSelectAgent}
          selectedTool={selectedTool}
          onSelectTool={handleSelectTool}
          hasMessages={messages.length > 0}
          onClearChat={handleClearChat}
        />
      </main>
    </div>
  );
};

export default Home;
