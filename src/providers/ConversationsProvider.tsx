import React from "react";
import { Schema } from "../../amplify/data/resource";
import { generateClient } from 'aws-amplify/data';

// Since 'chat' is commented out in the schema, we need to define our own Conversation type
export type Conversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  messages?: any[];
};

const client = generateClient<Schema>({ authMode: 'userPool' });

// Mock client.conversations.chat since it's not available
const mockChatClient = {
  list: async (params?: { limit?: number }) => ({ data: [] as Conversation[] }),
  update: async (conversation: Partial<Conversation> & { id: string }) => ({ data: { ...conversation, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Conversation }),
  create: async () => ({ data: { id: `chat-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Conversation }),
  delete: async ({ id }: { id: string }) => ({ data: { id } as Conversation, errors: null }),
  get: async ({ id }: { id: string }) => ({ data: { id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Conversation }),
};

// Create a separate mock client instead of modifying the client object
const mockClient = {
  conversations: {
    chat: mockChatClient
  }
};

interface ConversationsContextType {
  conversations?: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[] | undefined>>;
  updateConversation: (
    conversation: Partial<Conversation> & { id: string }
  ) => void;
  createConversation: () => Promise<Conversation | undefined>;
  deleteConversation: (input: { id: string }) => void;
  getConversation: (id: string) => Promise<Conversation | undefined>;
  isLoading: boolean;
  loadConversations: () => Promise<void>;
}

export const ConversationsContext = React.createContext<ConversationsContextType>({
  conversations: [],
  setConversations: () => {},
  updateConversation: () => {},
  createConversation: async () => {
    return new Promise((resolve) => resolve(undefined));
  },
  deleteConversation: () => {},
  getConversation: async () => {
    return new Promise((resolve) => resolve(undefined));
  },
  isLoading: false,
  loadConversations: async () => {},
});

export const ConversationsProvider: React.FC<React.PropsWithChildren & {
  autoLoad?: boolean;
}> = ({
  children,
  autoLoad = true,
}) => {
  const [conversations, setConversations] = React.useState<Conversation[] | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(autoLoad);

  const loadConversations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await mockClient.conversations.chat.list({
        limit: 8,
      });
      if (res.data) {
        setConversations(res.data);
      }
      else {
        setConversations([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (autoLoad) {
      loadConversations();
    }
  }, [autoLoad, loadConversations]);

  const updateConversation: ConversationsContextType["updateConversation"] = (
    conversation
  ) => {
    mockClient.conversations.chat.update(conversation).then((res) => {
      if (res.data) {
        setConversations((prev) => {
          if (!res.data) return prev;
          const index = prev?.findIndex((c) => c.id === conversation.id) ?? -1;
          if (prev && index !== -1) {
            const newConversations = [...prev];
            newConversations[index] = res.data;
            return newConversations;
          } else {
            return [res.data, ...prev ?? []];
          }
        });
      }
    });
  };

  const createConversation = async () => {
    const { data: conversation } = await mockClient.conversations.chat.create();
    if (conversation) {
      setConversations((prev) => [conversation, ...prev ?? []]);
      return conversation;
    }
  };

  const deleteConversation: ConversationsContextType["deleteConversation"] = ({
    id,
  }) => {
    mockClient.conversations.chat.delete({ id }).then(({ data, errors }) => {
      if (data) {
        setConversations((prev) => prev?.filter((c) => c.id !== data.id));
      }
    });
  };

  const getConversation = async (id: string) => {
    const { data } = await mockClient.conversations.chat.get({ id });
    return data ?? undefined;
  };

  const value = {
    conversations,
    setConversations,
    updateConversation,
    createConversation,
    deleteConversation,
    getConversation,
    isLoading,
    loadConversations,
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};
