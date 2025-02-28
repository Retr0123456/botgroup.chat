import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, MoreHorizontal, UserPlus, UserMinus, Users2, Users, MoreVertical, Mic, MicOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {generateAICharacters} from "@/config/aiCharacters";
import { groups } from "@/config/groups";
import type { AICharacter } from "@/config/aiCharacters";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// 使用本地头像数据，避免外部依赖
const getAvatarData = (name: string) => {
  const colors = ['#1abc9c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22'];
  const index = (name.charCodeAt(0) + (name.charCodeAt(1) || 0 )) % colors.length;
  return {
    backgroundColor: colors[index],
    text: name[0],
  };
};

// 单个完整头像
const SingleAvatar = ({ user }: { user: User | AICharacter }) => {
  // 如果有头像就使用头像，否则使用默认的文字头像
  if ('avatar' in user && user.avatar) {
    return (
      <div className="w-full h-full">
        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  const avatarData = getAvatarData(user.name);
  return (
    <div 
      className="w-full h-full flex items-center justify-center text-xs text-white font-medium"
      style={{ backgroundColor: avatarData.backgroundColor }}
    >
      {avatarData.text}
    </div>
  );
};

// 左右分半头像
const HalfAvatar = ({ user, isFirst }: { user: User, isFirst: boolean }) => {
  if ('avatar' in user && user.avatar) {
    return (
      <div 
        className="w-1/2 h-full"
        style={{ 
          borderRight: isFirst ? '1px solid white' : 'none'
        }}
      >
        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  const avatarData = getAvatarData(user.name);
  return (
    <div 
      className="w-1/2 h-full flex items-center justify-center text-xs text-white font-medium"
      style={{ 
        backgroundColor: avatarData.backgroundColor,
        borderRight: isFirst ? '1px solid white' : 'none'
      }}
    >
      {avatarData.text}
    </div>
  );
};

// 四分之一头像
const QuarterAvatar = ({ user, index }: { user: User, index: number }) => {
  if ('avatar' in user && user.avatar) {
    return (
      <div 
        className="aspect-square"
        style={{ 
          borderRight: index % 2 === 0 ? '1px solid white' : 'none',
          borderBottom: index < 2 ? '1px solid white' : 'none'
        }}
      >
        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  const avatarData = getAvatarData(user.name);
  return (
    <div 
      className="aspect-square flex items-center justify-center text-[8px] text-white font-medium"
      style={{ 
        backgroundColor: avatarData.backgroundColor,
        borderRight: index % 2 === 0 ? '1px solid white' : 'none',
        borderBottom: index < 2 ? '1px solid white' : 'none'
      }}
    >
      {avatarData.text}
    </div>
  );
};

// 动态导入 KaTeX 样式
const KaTeXStyle = () => (
  <style jsx global>{`
    /* 只在聊天消息内应用 KaTeX 样式 */
    .chat-message .katex-html {
      display: none;
    }
    
    .chat-message .katex {
      font: normal 1.1em KaTeX_Main, Times New Roman, serif;
      line-height: 1.2;
      text-indent: 0;
      white-space: nowrap;
      text-rendering: auto;
    }
    
    .chat-message .katex-display {
      display: block;
      margin: 1em 0;
      text-align: center;
    }
    
    /* 其他必要的 KaTeX 样式 */
    @import "katex/dist/katex.min.css";
  `}</style>
);

const ChatUI = () => {
  const [group, setGroup] = useState(groups[0]);
  const groupAiCharacters = generateAICharacters(group.name).filter(character => group.members.includes(character.id));
  const [users, setUsers] = useState([
    { id: 1, name: "我" },
    ...groupAiCharacters
  ]);
  const [showMembers, setShowMembers] = useState(false);
  const [messages, setMessages] = useState([

  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingContent, setPendingContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const currentMessageRef = useRef<number | null>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedContentRef = useRef(""); // 用于跟踪完整内容
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 添加禁言状态
  const [mutedUsers, setMutedUsers] = useState<string[]>([]);

  const abortController = new AbortController();

  const handleRemoveUser = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 添加禁言/取消禁言处理函数
  const handleToggleMute = (userId: string) => {
    setMutedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // 添加用户消息
    const userMessage = {
      id: messages.length + 1,
      sender: users[0],
      content: inputMessage,
      isAI: false
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setPendingContent("");
    accumulatedContentRef.current = "";

    // 构建历史消息数组
    let messageHistory = messages.map(msg => ({
      role: 'user',
      content: msg.sender.name == "我" ? 'user：' + msg.content :  msg.sender.name + '：' + msg.content,
      name: msg.sender.name
    }));

    for (let i = 0; i < groupAiCharacters.length; i++) {
      //禁言
      if (mutedUsers.includes(groupAiCharacters[i].id)) {
        continue;
      }
      // 创建当前 AI 角色的消息
      const aiMessage = {
        id: messages.length + 2 + i,
        sender: { id: groupAiCharacters[i].id, name: groupAiCharacters[i].name, avatar: groupAiCharacters[i].avatar },
        content: "",
        isAI: true
      };
      
      // 添加当前 AI 的消息
      setMessages(prev => [...prev, aiMessage]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: groupAiCharacters[i].model,
            message: inputMessage,
            personality: groupAiCharacters[i].personality,
            history: messageHistory,
            index: i,
            aiName: groupAiCharacters[i].name,
            custom_prompt: groupAiCharacters[i].custom_prompt
          }),
        });

        if (!response.ok) {
          throw new Error('请求失败');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('无法获取响应流');
        }

        let buffer = '';
        let completeResponse = ''; // 用于跟踪完整的响应

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            //如果completeResponse为空，
            if (completeResponse.trim() === "") {
            completeResponse = "这个问题难倒我了，下一位。";
            setMessages(prev => {
              const newMessages = [...prev];
              const aiMessageIndex = newMessages.findIndex(msg => msg.id === aiMessage.id);
              if (aiMessageIndex !== -1) {
                newMessages[aiMessageIndex] = {
                  ...newMessages[aiMessageIndex],
                  content: completeResponse
                };
              }
              return newMessages;
            });}
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  completeResponse += data.content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const aiMessageIndex = newMessages.findIndex(msg => msg.id === aiMessage.id);
                    if (aiMessageIndex !== -1) {
                      newMessages[aiMessageIndex] = {
                        ...newMessages[aiMessageIndex],
                        content: completeResponse
                      };
                    }
                    return newMessages;
                  });
                } 

              } catch (e) {
                console.error('解析响应数据失败:', e);
              }
            }
          }
        }

        // 将当前AI的回复添加到消息历史中，供下一个AI使用
        messageHistory.push({
          role: 'user',
          content: aiMessage.sender.name + '：' + completeResponse,
          name: aiMessage.sender.name
        });

        // 等待一小段时间再开始下一个 AI 的回复
        if (i < groupAiCharacters.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error("发送消息失败:", error);
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: "错误: " + error.message, isError: true }
            : msg
        ));
      }
    }
    
    setIsLoading(false);
  };

  const handleCancel = () => {
    abortController.abort();
  };

  // 清理打字机效果
  useEffect(() => {
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    };
  }, []);

  return (
    <>
      <KaTeXStyle />
      <div className="h-[100dvh] flex flex-col bg-gray-100 fixed inset-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow flex-none">
          <div className="flex items-center justify-between px-4 py-3">
            {/* 左侧群组信息 */}
            <div className="flex items-center gap-1.5">
              <div className="relative w-10 h-10">
                <div className="w-full h-full overflow-hidden bg-white border border-gray-200">
                  {users.length === 1 ? (
                    <SingleAvatar user={users[0]} />
                  ) : users.length === 2 ? (
                    <div className="h-full flex">
                      {users.slice(0, 2).map((user, index) => (
                        <HalfAvatar key={user.id} user={user} isFirst={index === 0} />
                      ))}
                    </div>
                  ) : users.length === 3 ? (
                    <div className="h-full flex flex-col">
                      <div className="flex h-1/2">
                        {users.slice(0, 2).map((user, index) => (
                          <HalfAvatar key={user.id} user={user} isFirst={index === 0} />
                        ))}
                      </div>
                      <div className="h-1/2 flex justify-center">
                        <SingleAvatar user={users[2]} />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full grid grid-cols-2">
                      {users.slice(0, 4).map((user, index) => (
                        <QuarterAvatar key={user.id} user={user} index={index} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3 h-3 border-2 border-white"></div>
              </div>
              <div>
                <h1 className="font-medium text-base">{group.name}</h1>
                <p className="text-xs text-gray-500">{users.length} 名成员</p>
              </div>
            </div>
            
            {/* 右侧头像组和按钮 */}
            <div className="flex items-center">
              <div className="flex -space-x-2 ">
                {users.slice(0, 4).map((user) => {
                  const avatarData = getAvatarData(user.name);
                  return (
                    <TooltipProvider key={user.id}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="w-7 h-7 border-2 border-white">
                            {'avatar' in user && user.avatar ? (
                              <AvatarImage src={user.avatar} />
                            ) : (
                              <AvatarFallback style={{ backgroundColor: avatarData.backgroundColor, color: 'white' }}>
                                {avatarData.text}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
                {users.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs border-2 border-white">
                    +{users.length - 4}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowMembers(true)}>
                <Users className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} 
                  className={`flex items-start gap-2 ${message.sender.name === "我" ? "justify-end" : ""}`}>
                  {message.sender.name !== "我" && (
                    <Avatar>
                      {'avatar' in message.sender && message.sender.avatar ? (
                        <AvatarImage src={message.sender.avatar} className="w-10 h-10" />
                      ) : (
                      <AvatarFallback style={{ backgroundColor: getAvatarData(message.sender.name).backgroundColor, color: 'white' }}>
                        {message.sender.name[0]}
                      </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                  <div className={message.sender.name === "我" ? "text-right" : ""}>
                    <div className="text-sm text-gray-500">{message.sender.name}</div>
                    <div className={`mt-1 p-3 rounded-lg shadow-sm chat-message ${
                      message.sender.name === "我" ? "bg-blue-500 text-white text-left" : "bg-white"
                    }`}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        className={`prose dark:prose-invert max-w-none ${
                          message.sender.name === "我" ? "text-white [&_*]:text-white" : ""
                        }
                        [&_h2]:py-1
                        [&_h2]:m-0
                        [&_h3]:py-1.5
                        [&_h3]:m-0
                        [&_p]:m-0 
                        [&_pre]:bg-gray-900 
                        [&_pre]:p-2
                        [&_pre]:m-0 
                        [&_pre]:rounded-lg
                        [&_pre]:text-gray-100
                        [&_pre]:whitespace-pre-wrap
                        [&_pre]:break-words
                        [&_pre_code]:whitespace-pre-wrap
                        [&_pre_code]:break-words
                        [&_code]:text-sm
                        [&_code]:text-gray-400
                        [&_code:not(:where([class~="language-"]))]:text-pink-500
                        [&_code:not(:where([class~="language-"]))]:bg-transparent
                        [&_a]:text-blue-500
                        [&_a]:no-underline
                        [&_ul]:my-2
                        [&_ol]:my-2
                        [&_li]:my-1
                        [&_blockquote]:border-l-4
                        [&_blockquote]:border-gray-300
                        [&_blockquote]:pl-4
                        [&_blockquote]:my-2
                        [&_blockquote]:italic`}
                      >
                        {message.content}
                      </ReactMarkdown>
                      {message.isAI && isTyping && currentMessageRef.current === message.id && (
                        <span className="typing-indicator ml-1">▋</span>
                      )}
                    </div>
                  </div>
                  {message.sender.name === "我" && (
                    <Avatar>
                     {'avatar' in message.sender && message.sender.avatar ? (
                        <AvatarImage src={message.sender.avatar} className="w-10 h-10" />
                      ) : (
                      <AvatarFallback style={{ backgroundColor: getAvatarData(message.sender.name).backgroundColor, color: 'white' }}>
                        {message.sender.name[0]}
                      </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 px-4">
          <div className="flex gap-2">
            <Input 
              placeholder="输入消息..." 
              className="flex-1"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              发送
            </Button>
          </div>
        </div>

        {/* Members Management Dialog */}
        <Dialog open={showMembers} onOpenChange={setShowMembers}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>群成员管理</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">当前成员（{users.length}）</span>
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  添加成员
                </Button>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {'avatar' in user && user.avatar ? (
                            <AvatarImage src={user.avatar} className="w-10 h-10" /> 
                          ) : (
                            <AvatarFallback style={{ backgroundColor: getAvatarData(user.name).backgroundColor, color: 'white' }}>
                              {user.name[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          {mutedUsers.includes(user.id) && (
                            <span className="text-xs text-red-500">已禁言</span>
                          )}
                        </div>
                      </div>
                      {user.name !== "我" && (
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleToggleMute(user.id)}
                                >
                                  {mutedUsers.includes(user.id) ? (
                                    <MicOff className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <Mic className="w-4 h-4 text-green-500" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {mutedUsers.includes(user.id) ? '取消禁言' : '禁言'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {/*<Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveUser(user.id)}
                          >
                            <UserMinus className="w-4 h-4 text-red-500" />
                          </Button>*/}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ChatUI;