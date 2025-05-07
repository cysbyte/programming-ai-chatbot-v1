"use client";

import { Sidebar } from "@/components/Sidebar";
import { BsLayoutTextSidebarReverse } from "react-icons/bs";
import { toggleSidebarForConversation } from "@/store/sidebarSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import InputContainer from "@/components/InputContainer";
import { setConversationId, setPrompts } from "@/store/conversationSlice";
import { useEffect, useState } from "react";
import Solution from "@/components/Solution";

export default function Home() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOpenForConversation = useSelector(
    (state: RootState) => state.sidebar.isOpenForConversation
  );
  const { prompts, conversationId } = useSelector((state: RootState) => state.conversation);

  useEffect(() => {
    const fetchPrompts = async () => {
      debugger;
      try {
        const conversationId = localStorage.getItem("conversationId");
        if (!conversationId) {
          setIsLoading(false);
          return;
        }

        dispatch(setConversationId(conversationId));

        const response = await fetch(
          `/api/conversations/prompts/${conversationId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              "Refresh-Token": localStorage.getItem("refreshToken") || "",
            },
          }
        );

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
            window.location.href = "/";
            return;
          }
          throw new Error("Failed to fetch prompts");
        }

        const { prompts } = await response.json();
        console.log("Fetched prompts:", prompts);
        dispatch(setPrompts(prompts));
      } catch (err) {
        console.error("Error fetching prompts:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch prompts"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrompts();
  }, [conversationId, dispatch]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error: {error}
      </div>
    );

  console.log("prompts", prompts);

  return (
    <div className="flex min-h-screen w-screen">
      <Sidebar
        isOpen={isOpenForConversation}
        handleClick={() => dispatch(toggleSidebarForConversation())}
      />
      <div className="flex-1 flex flex-col justify-between items-center px-4 py-4 w-full h-screen overflow-y-auto relative pb-40 ">
        <main className="flex-1 flex flex-col justify-between items-center px-0 w-full pb-4 h-screen overflow-y-auto relative">
          <div className="flex items-center justify-start h-16 w-full">
            <BsLayoutTextSidebarReverse
              className={`fixed mt-4 text-xl cursor-pointer hover:text-gray-300 transition-all duration-300 ${
                isOpenForConversation ? "opacity-0" : "opacity-100"
              }`}
              onClick={() => dispatch(toggleSidebarForConversation())}
            />
          </div>
          <div className="flex flex-col items-center justify-start w-[700px] h-full mb-10">
            {prompts.map((prompt, index) => (
              <div key={index} className="flex items-center justify-end w-full">
                {prompt.role === "user" ? (
                  <div
                    className="text-sm text-gray-700 text-right bg-gray-200 rounded-full px-4 py-2"
                    style={{ marginTop: index === 0 ? "0rem" : "2rem" }}
                  >
                    {prompt.content}
                  </div>
                ) : (
                  <Solution solutions={[prompt.content]} />
                )}
              </div>
            ))}
          </div>
        </main>
        <div className="absolute bottom-4 left-0 w-full">
          <InputContainer />
        </div>
      </div>
    </div>
  );
}
