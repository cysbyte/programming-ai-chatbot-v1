import { Context, Hono } from "hono";
import { supabase } from "@/lib/supabase";
import { User } from '@supabase/supabase-js';
import { callGptChat, Message } from "@/lib/ai-service";

type Variables = {
  user: User;
}

type AppType = {
  Variables: Variables;
}

// Middleware to check authentication
const authMiddleware = async (c: Context<AppType>, next: () => Promise<void>) => {
  console.log('Auth middleware started');
  const authHeader = c.req.header('Authorization');
  const refreshToken = c.req.header('Refresh-Token');

  console.log('Auth headers:', {
    hasAuthHeader: !!authHeader,
    hasRefreshToken: !!refreshToken,
    authHeaderPrefix: authHeader?.substring(0, 7)
  });
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth failed: No valid Bearer token');
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];
  console.log('Token extracted, length:', token.length);
  
  try {
    console.log('Attempting to get user with token');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('Token validation failed:', error);
      // Try to refresh the token if refresh token is provided
      if (refreshToken) {
        console.log('Attempting token refresh');
        try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken
        });

          if (refreshError) {
            console.log('Token refresh failed:', {
              error: refreshError,
              message: refreshError.message,
              status: refreshError.status,
              name: refreshError.name
            });

            // If refresh token is already used, return 401 to force client to re-authenticate
            if (refreshError.message.includes('Already Used')) {
              return c.json({
                error: 'Session expired - Please login again',
                code: 'REFRESH_TOKEN_USED'
              }, 401);
            }

            return c.json({ error: 'Unauthorized - Invalid refresh token' }, 401);
          }

          if (!refreshData.session) {
            console.log('No session data in refresh response');
          return c.json({ error: 'Unauthorized - Invalid refresh token' }, 401);
        }

          console.log('Token refresh successful, setting new tokens');
        // Set new tokens in response headers
        c.header('New-Access-Token', refreshData.session.access_token);
        c.header('New-Refresh-Token', refreshData.session.refresh_token);
        
        // Set user from refreshed session
        c.set('user', refreshData.session.user);
        await next();
        return;
        } catch (refreshError) {
          console.error('Unexpected error during token refresh:', refreshError);
          return c.json({
            error: 'Authentication error - Please try again',
            code: 'REFRESH_ERROR'
          }, 401);
        }
      }

      console.log('No refresh token provided, auth failed');
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    console.log('Auth successful, user:', {
      id: user.id,
      email: user.email,
      role: user.role
    });
    c.set('user', user);
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
};

interface Prompt {
  role: string;
  content: string;
  created_at: string;
}

const app = new Hono<AppType>()
  .get("/", authMiddleware, (c) => c.json("list of conversations"))
  .post("/", authMiddleware, async (c) => {
    try {
      console.log("Received POST request");
      const formData = await c.req.formData();
      const userInput = formData.get("userInput") as string;
      const images = formData.getAll("images") as string[];
      const prompt = JSON.parse(formData.get("prompt") as string) as Message[];
      let conversationId = formData.get("conversationId") as string;
      const user = c.get('user');
      
      console.log("Form data received:", {
        userInput,
        imageCount: images.length,
        firstImagePreview: images[0]?.substring(0, 50) + "...",
        userId: user.id,
        prompt
      });

      if (!userInput) {
        console.error("No user input provided");
        return c.json({ error: "User input is required" }, 400);
      }

      let imageUrls: string[] = [];

      // Only process images if they are provided
      if (images.length > 0) {
        // Upload images to Supabase and get URLs
        imageUrls = await Promise.all(
          images.map(async (base64Image, index) => {
            try {
              console.log(`Processing image ${index + 1}/${images.length}`);
              
              // Convert base64 to blob
              const base64Data = base64Image.split(",")[1];
              if (!base64Data) {
                throw new Error("Invalid base64 image data");
              }
              const binaryData = Buffer.from(base64Data, "base64");
              
              // Generate unique filename with user ID
              const filename = `images/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
              console.log(`Generated filename for image ${index + 1}:`, filename);
              
              // Upload to Supabase Storage
              console.log(`Uploading image ${index + 1} to Supabase...`);
              const { error } = await supabase.storage
                .from("images")
                .upload(filename, binaryData, {
                  contentType: "image/jpeg",
                });

              if (error) {
                console.error(`Error uploading image ${index + 1}:`, error);
                throw error;
              }
              console.log(`Successfully uploaded image ${index + 1}`);

              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from("images")
                .getPublicUrl(filename);
              console.log(`Public URL for image ${index + 1}:`, publicUrl);

              return publicUrl;
            } catch (error) {
              console.error(`Error processing image ${index + 1}:`, error);
              throw error;
            }
          })
        );

        console.log("All images processed successfully. Image URLs:", imageUrls);
      }

      // Save conversation with image URLs and user ID
      console.log("Saving conversation to database...");
      if (!conversationId) {
      const { data: conversation, error } = await supabase
        .from("conversations")
        .insert([
          {
            user_id: user.id,
            user_input: userInput,
            image_urls: imageUrls,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error saving conversation:", error);
        throw error;
      }
        conversationId = conversation.id;
      console.log("Conversation saved successfully:", conversation);
      }

      // Call AI service with the prompt

      const aiResponse = await callGptChat(prompt);
      console.log("AI response received:", aiResponse);

      // Insert both user and assistant messages into prompts table
      const { error: promptsError } = await supabase
        .from("prompts")
        .insert([
          {
            conversation_id: conversationId,
            role: 'user',
            content: userInput
          },
          {
            conversation_id: conversationId,
            role: 'assistant',
            content: aiResponse.response
          }
        ]);

      if (promptsError) {
        console.error("Error inserting prompts:", promptsError);
        throw promptsError;
      }

      const response = { prompt: [{ role: 'user', content: userInput }, { role: 'assistant', content: aiResponse.response }], conversationId: conversationId }
      console.log('response', response);
      return c.json(response, 201);
    } catch (error) {
      console.error("Error in POST /conversations:", error);
      return c.json({ 
        error: "Failed to create conversation",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  })
  .get("/:id", authMiddleware, (c) => c.json(`get ${c.req.param("id")}`))
  .get("/prompts/:conversationId", authMiddleware, async (c) => {
    try {
      const conversationId = c.req.param("conversationId");
      console.log("Getting prompts for conversation:", conversationId);

      const { data: prompts, error } = await supabase
        .from("prompts")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching prompts:", error);
        throw error;
      }

      console.log("Prompts fetched successfully:", prompts);
      return c.json({ prompts });
    } catch (error) {
      console.error("Error in GET /prompt/:conversationId:", error);
      return c.json({
        error: "Failed to fetch prompts",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  })
  .get("/recent-prompts/:userId", authMiddleware, async (c) => {
    try {
      const userId = c.req.param("userId");
      console.log("Getting recent prompts for user:", userId);

      // Calculate date 2 days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data: prompts, error } = await supabase
        .from("prompts")
        .select(`
          id,
          role,
          content,
          created_at,
          conversation_id,
          conversations (
            user_id
          )
        `)
        .eq('conversations.user_id', userId)
        .gte('created_at', twoDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching recent prompts:", error);
        throw error;
      }

      // Group prompts by conversation
      const groupedPrompts = prompts.reduce((acc, prompt) => {
        const conversationId = prompt.conversation_id;
        if (!acc[conversationId]) {
          acc[conversationId] = [];
        }
        acc[conversationId].push({
          role: prompt.role,
          content: prompt.content,
          created_at: prompt.created_at
        });
        return acc;
      }, {} as Record<string, Prompt[]>);

      console.log("Recent prompts fetched successfully");
      return c.json({ 
        prompts: Object.values(groupedPrompts),
        total: prompts.length
      });
    } catch (error) {
      console.error("Error in GET /recent-prompts:", error);
      return c.json({
        error: "Failed to fetch recent prompts",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  })
  .get("/user/:userId", authMiddleware, async (c) => {
    try {
      const userId = c.req.param("userId");
      console.log("Getting all conversations for user:", userId);

      const { data: conversations, error } = await supabase
        .from("conversations")
        .select(`
          id,
          user_input,
          image_urls,
          created_at,
          prompts (
            role,
            content,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        throw error;
      }

      // Format the response to include conversation details and prompts
      const formattedConversations = conversations.map(conversation => ({
        id: conversation.id,
        userInput: conversation.user_input,
        imageUrls: conversation.image_urls,
        createdAt: conversation.created_at,
        prompts: conversation.prompts || []
      }));

      console.log("Conversations fetched successfully");
      return c.json({ 
        conversations: formattedConversations,
        total: conversations.length
      });
    } catch (error) {
      console.error("Error in GET /user/:userId:", error);
      return c.json({
        error: "Failed to fetch conversations",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 500);
    }
  });

export default app;