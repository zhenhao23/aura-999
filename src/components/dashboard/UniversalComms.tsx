import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Message } from "@/types";
import { useState, useEffect, useRef } from "react";

interface UniversalCommsProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  callerLanguage?: string;
}

export function UniversalComms({
  messages,
  onSendMessage,
  callerLanguage = "Malay",
}: UniversalCommsProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <Card className="pointer-events-auto flex flex-col h-full pt-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs flex items-center justify-between">
          <span>Universal Communication</span>
          <span className="text-xs font-normal text-muted-foreground">
            Detect: {callerLanguage}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-3 min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No messages yet
            </p>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "dispatcher" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      message.sender === "dispatcher"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>{" "}
                    {message.translatedContent && (
                      <p className="text-xs opacity-70 mt-1 italic">
                        {message.translatedContent}
                      </p>
                    )}{" "}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type message in English..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleSend} size="sm">
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
