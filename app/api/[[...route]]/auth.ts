import { Hono } from "hono";
import { supabase } from "@/lib/supabase";

const app = new Hono()
    .get("/", (c) => c.json({ message: "Hello, world!" }))
    .post("/", (c) => c.json({ message: "Hello, world!" }))
    .post("/send-code", async (c) => {
        try {
            const { email } = await c.req.json();
            
            if (!email) {
                return c.json({ error: "Email is required" }, 400);
            }

            const { error } = await supabase.auth.signInWithOtp({
                email,
            });

            if (error) {
                console.error("Error sending OTP:", error);
                return c.json({ error: error.message }, 500);
            }

            return c.json({ success: true, message: "OTP code sent successfully" });
        } catch (error) {
            console.error("Error in send-code endpoint:", error);
            return c.json({ 
                success: false,
                error: "Failed to send OTP code",
                details: error instanceof Error ? error.message : "Unknown error"
            }, 500);
        }
    })
    .post("/verify-code", async (c) => {
        try {
            const { email, code } = await c.req.json();
            
            if (!email || !code) {
                return c.json({ 
                    success: false,
                    error: "Email and code are required" 
                }, 400);
            }

            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: "email"
            });

            if (error) {
                console.error("Error verifying OTP:", error);
                return c.json({ 
                    success: false,
                    error: error.message 
                }, 500);
            }

            if (!data?.user) {
                return c.json({ 
                    success: false,
                    error: "User data not found" 
                }, 500);
            }

            // Insert user data into users table
            const { error: insertError } = await supabase
                .from('users')
                .upsert({
                    id: data.user.id,
                    email: data.user.email,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });

            if (insertError) {
                console.error("Error inserting user data:", insertError);
                return c.json({ 
                    success: false,
                    error: "Failed to save user data",
                    details: insertError.message
                }, 500);
            }

            return c.json({ 
                success: true,
                message: "OTP verified successfully",
                data
            });
        } catch (error) {
            console.error("Error in verify-code endpoint:", error);
            return c.json({ 
                success: false,
                error: "Failed to verify OTP code",
                details: error instanceof Error ? error.message : "Unknown error"
            }, 500);
        }
    });

export default app;