"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FiCpu, FiSend, FiUser } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const defaultOptions = [
  "Tell me about the lastest AI advancements",
  "What is the capital of France?",
  "What is the meaning of life?",
  "What is the best way to learn React?",
  "What is the best way to learn Next.js?",
  "What is the best way to learn Tailwind CSS?",
];

const Markdown = ({ content }: any) => {
  if (!content || typeof content.getReader === "function") return;
  const processedContent = content
    .replace(/\\n/g, "\n")
    .replace(/\\\*/g, "*")
    .replace(/\\"/g, '"')
    .replace(/##""##/g, "")
    .replace(/""\s*([^:]+):\*\*/g, '**"$1:"**')
    .replace(/""([^"]+)""/g, '"$1"')
    .replace(/(\w+:)"/g, '$1"')
    .replace(/\*\*"([^"]+)"\*\*/g, '**"$1"**');

  return (
    <ReactMarkdown
      className="prose w-full break-words prose-p:leading-relaxed px-3 mark-down"
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ ...props }: any) => (
          <a {...props} style={{ color: "#27afcf", fontWeight: "bold" }} />
        ),
        code({ inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus as any}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }: any) => (
          <p className="whitespace-pre-line">{children}</p>
        ),
        strong: ({ children }: any) => (
          <strong className="font-bold">{children}</strong>
        ),
        blockquote: ({ children }: any) => (
          <blockquote className="border-l-4 border-gray-500 pl-4 py-2 my-2 italic bg-gray-800 rounded">
            {children}
          </blockquote>
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

const ChatStream = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([] as any);
  const [chatStarted, setChatStarted] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef?.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (question.trim() === "") return;

    startChat(question);
  };

  const startChat = async (initialQuestion: string) => {
    setChatStarted(true);
    setQuestion("");
    setMessages((prevMessages: any) => [
      ...prevMessages,
      { type: "user", content: initialQuestion },
      { type: "ai", content: "Loading..." },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: initialQuestion }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to fetch from the API");
      }

      const { result } = await response.json();
      if (!result || typeof result.getReader === "function") return;
      setMessages((prev: any) => {
        const allMessages = [...prev];
        const lastMessage = allMessages[allMessages.length - 1];
        if (lastMessage.type === "ai") {
          lastMessage.content = result;
        }
        return allMessages;
      });
    } catch (error) {
      setMessages((prevMessages: any) => [
        ...prevMessages,
        {
          type: "ai",
          content:
            "An error occurred while processing your request. Please try again later.",
        },
      ]);
    } finally {
      setChatStarted(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-950 text-gray-100">
      <div className="w-full md:w-4/5 lg:w-3/5 flex flex-col h-screen">
        <div
          ref={chatContainerRef}
          className="flex-grow p-6 overflow-y-auto space-y-6 custom-scrollbar"
        >
          <AnimatePresence>
            {messages?.map((message: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`max-w-[80%] rounded-2xl shadow-lg ${
                    message.type === "user"
                      ? "bg-indigo-600 p-4"
                      : "bg-gray-800 p-4"
                  } flex items-start`}
                >
                  <div className="mr-3">
                    {message.type === "user" ? (
                      <FiUser className="text-xl" />
                    ) : (
                      <FiCpu className="text-xl" />
                    )}
                  </div>

                  <div>
                    {message.type === "user" ? (
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    ) : (
                      !message.content?.isLocked && (
                        <Markdown content={message?.content} />
                      )
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Chat Input */}
        <motion.div
          initial={{ opacity: 50, y: 0 }}
          animate={{ opacity: 1, y: 1 }}
          transition={{ duration: 0.5 }}
          className="p-6 bg-gray-900 rounded-t-3xl shadow-lg"
        >
          {!chatStarted && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {defaultOptions.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setQuestion(option)}
                  className="p-4 bg-gray-800 hover:bg-gray-700 text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {option}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        <form
          id="chat-form"
          onSubmit={handleSubmit}
          className="flex items-center mt-4"
        >
          <motion.input
            whileFocus={{ scale: 1.02 }}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question"
            className="flex-grow p-4 rounded-l-xl bg-gray-800 text-gray-100 focus-outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700 shadow-inner"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.5 }}
            type="submit"
            className="p-5 rounded-r-xl bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors shadow-md"
          >
            <FiSend className="text-xl" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default ChatStream;
