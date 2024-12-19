import { useState, useContext, useEffect } from 'react';
import { ConversationsContext } from '../providers/ConversationsProvider';
import ChatBot from './ChatBot';

interface ChatBotContainerProps {
  email: string;
}

export default function ChatBotContainer({ email }: ChatBotContainerProps) {
  const [selectedChatId, setSelectedChatId] = useState<{ chatid: string } | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const { 
    conversations, 
    createConversation, 
    deleteConversation, 
    getConversation, 
    isLoading: isLoadingConversations,
    loadConversations 
  } = useContext(ConversationsContext);

  useEffect(() => {
    const initializeChat = async () => {
      if (isLoadingConversations || !conversations) return;

      if (!isLoadingConversations && conversations) {
        const firstChatId = conversations[0]?.id;
       
        setSelectedChatId({
            chatid: firstChatId,
        });
      }
    };

    initializeChat();
  }, [conversations, isLoadingConversations]);

  const handleStartNewChat = async () => {
    const newChat = await createConversation();
    if (newChat) {
      setSelectedChatId({ chatid: newChat.id });
    }
  };

  const handleLoadConversations = () => {
    if (!conversations || !conversations.length && !isLoadingConversations) {
      loadConversations();
    }
  };

  if (selectedChatId) {
    return (
      <ChatBot
        key={selectedChatId.chatid}
        refreshKey={refreshKey}
        email={email}
        chatId={selectedChatId.chatid}
        onStartNewChat={()=>{
          setRefreshKey(prev => prev + 1);
          handleStartNewChat();
        }}
        onLoadConversations={handleLoadConversations}
        isLoading={isLoadingConversations} />
    );
  }

  return <></>;
} 