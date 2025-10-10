/**
 * Floating chat widget - accessible from all pages
 */
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { socketClient } from '@/lib/socket';
import { useVisibility } from '@/hooks/useVisibility';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface Message {
  _id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
  read_by: string[];
}

interface Conversation {
  _id: string;
  participants: string[];
  participant_names: Record<string, string>;
  participant_roles: Record<string, string>;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: Record<string, number>;
}

export default function ChatWidget() {
  const { getToken, userId } = useAuth();
  const { visibleUserIds, canAccessConversation } = useVisibility();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      const token = await getToken();
      if (token) {
        socketClient.connect(token);
      }
    };

    initSocket();

    return () => {
      socketClient.disconnect();
    };
  }, [getToken]);

  // Load conversations
  useEffect(() => {
    if (isOpen) {
      loadConversations();
      loadUnreadCount();
    }
  }, [isOpen]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (selectedConversation && message.conversation_id === selectedConversation._id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
        
        // Mark as read if widget is open
        if (isOpen && !isMinimized) {
          markConversationAsRead(selectedConversation._id);
        }
      }
      
      // Update unread count
      loadUnreadCount();
      loadConversations();
    };

    const handleUserTyping = (data: any) => {
      if (selectedConversation && data.conversation_id === selectedConversation._id && data.user_id !== userId) {
        setIsTyping(data.typing);
      }
    };

    socketClient.onNewMessage(handleNewMessage);
    socketClient.onUserTyping(handleUserTyping);

    return () => {
      socketClient.offNewMessage(handleNewMessage);
      socketClient.offUserTyping(handleUserTyping);
    };
  }, [selectedConversation, isOpen, isMinimized, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      // Filter conversations based on visibility
      const allConversations = data.conversations || [];
      const visibleConversations = allConversations.filter((conv: Conversation) => {
        // Check if all participants are visible to current user
        return conv.participants.every(participantId =>
          participantId === userId || visibleUserIds.includes(participantId)
        );
      });

      setConversations(visibleConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/conversations/unread/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/messages/conversation/${conversationId}?page=1&page_size=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Join conversation room
      socketClient.joinConversation(conversationId);
      
      // Mark as read
      markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadUnreadCount();
      loadConversations();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    // Leave previous conversation
    if (selectedConversation) {
      socketClient.leaveConversation(selectedConversation._id);
    }
    
    setSelectedConversation(conversation);
    loadMessages(conversation._id);
    setIsMinimized(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    socketClient.sendMessage(selectedConversation._id, newMessage, 'text', (response) => {
      if (response.success) {
        setNewMessage('');
        socketClient.stopTyping(selectedConversation._id);
      }
    });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!selectedConversation) return;
    
    // Start typing indicator
    socketClient.startTyping(selectedConversation._id);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketClient.stopTyping(selectedConversation._id);
    }, 2000);
  };

  const getOtherParticipantName = (conversation: Conversation) => {
    const otherParticipant = conversation.participants.find((p) => p !== userId);
    return otherParticipant ? conversation.participant_names[otherParticipant] : 'Unknown';
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl flex flex-col z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-purple-600 dark:bg-purple-700 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">
            {selectedConversation ? getOtherParticipantName(selectedConversation) : 'Messages'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {selectedConversation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                socketClient.leaveConversation(selectedConversation._id);
                setSelectedConversation(null);
                setMessages([]);
              }}
              className="text-white hover:bg-purple-700 dark:hover:bg-purple-800 h-8 w-8 p-0"
            >
              ←
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-purple-700 dark:hover:bg-purple-800 h-8 w-8 p-0"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              if (selectedConversation) {
                socketClient.leaveConversation(selectedConversation._id);
              }
            }}
            className="text-white hover:bg-purple-700 dark:hover:bg-purple-800 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Conversation List or Messages */}
          {!selectedConversation ? (
            <ScrollArea className="flex-1 p-4">
              {conversations.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No conversations yet
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv._id}
                      onClick={() => handleSelectConversation(conv)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-purple-600 dark:bg-purple-700 text-white">
                            {getOtherParticipantName(conv).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900 dark:text-white truncate">
                              {getOtherParticipantName(conv)}
                            </p>
                            {conv.unread_count[userId || ''] > 0 && (
                              <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                                {conv.unread_count[userId || '']}
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                              {conv.last_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.sender_id === userId
                            ? 'bg-purple-600 dark:bg-purple-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Typing...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
}

