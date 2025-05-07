'use client'

import { BsLayoutTextSidebarReverse } from "react-icons/bs";
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { VscAccount } from "react-icons/vsc";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setConversationId } from '@/store/conversationSlice';
import { useDispatch } from 'react-redux';

interface Conversation {
  id: string;
  userInput: string;
  imageUrls: string[];
  createdAt: string;
  prompts: {
    role: string;
    content: string;
    createdAt: string;
  }[];
}

export function Sidebar({ isOpen, handleClick }: { isOpen: boolean, handleClick: () => void }) {
  const { email } = useSelector((state: RootState) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();
  const dispatch = useDispatch();
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          router.push('/');
          return;
        }

        const response = await fetch(`/api/conversations/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Refresh-Token": localStorage.getItem("refreshToken") || "",
          }
        });

        // Check for new tokens in response headers
        const newAccessToken = response.headers.get("New-Access-Token");
        const newRefreshToken = response.headers.get("New-Refresh-Token");

        if (newAccessToken && newRefreshToken) {
          localStorage.setItem("accessToken", newAccessToken);
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized - clear tokens and redirect
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userId");
            router.push('/');
            return;
          }
          throw new Error('Failed to fetch conversations');
        }

        const { conversations } = await response.json();
        console.log('Fetched conversations:', conversations);
        setConversations(conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        // Handle error appropriately
      }
    };

    fetchConversations();
  }, [router]);

  return (
    <div className={`h-screen bg-gray-800 text-white transition-all duration-300 ease-in-out flex flex-col justify-between ${isOpen ? 'w-64 p-4' : 'w-0 overflow-hidden py-4'}`}>
      <div>
        <div className="mb-8">
          <BsLayoutTextSidebarReverse 
            className="text-xl cursor-pointer hover:text-gray-300 transition-colors" 
            onClick={handleClick} 
          />
        </div>
        <div className="w-full mb-8 flex justify-center items-center">
          <button className="bg-gray-700 text-white text-sm px-4 py-2 rounded-full w-[80%] cursor-pointer" onClick={() => {
            localStorage.removeItem("conversationId");
            router.push("/message");
          }}>New Conversation</button>
        </div>

        <nav className={`${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <ul className="space-y-2">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => {
                    localStorage.setItem("conversationId", conversation.id);
                    dispatch(setConversationId(conversation.id));
                    router.push("/conversation");
                  }}
                  className="w-full text-left text-sm text-gray-300 px-4 py-2 hover:bg-gray-700 rounded truncate cursor-pointer"
                >
                  {conversation.userInput}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className='flex items-center gap-2 mb-2'>
        <VscAccount className="text-xl cursor-pointer hover:text-gray-300 transition-colors" size={20}/>
        {mounted && email && (
          <p className="text-sm text-gray-300">{email}</p>
        )}
      </div>
    </div>
  );
} 