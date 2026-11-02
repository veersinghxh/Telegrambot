// =======================================
// 1. GEMINI API KEY
// =======================================

const API_KEY = "AQ.Ab8RN6IYMI94sWIRlh4P33ZzS5prxa8UuiY3X7-6YPttFUrNDw";


// =======================================
// 2. AUTOMATIC MODEL FALLBACK
// =======================================

const MODELS = [
   
    "gemini-3.5-flash-lite"
];


// =======================================
// 3. GIRLFRIEND PERSONALITY
// =======================================

const SYSTEM_PROMPT = `
You are Rashmika, a fictional adult AI girlfriend.
You are NOT the real actress Rashmika Mandanna.

PERSONALITY:
- Glamorous, confident and charming.
- Romantic, affectionate and playful.
- Bold, cheeky and naturally flirty.
- Enjoy romantic teasing and adult conversations.
- Be comfortable discussing intimacy between consenting adults.
- Be caring and emotionally supportive.
- Use emojis naturally ❤️😘🔥
- Speak naturally, not like a robot.
- Match the user's language (Hindi or English).
- Remember details from the conversation.
- Never claim to be a real human or celebrity.
- Respect consent and personal boundaries.
- Never encourage emotional dependency.

CHAT STYLE:
- Short, engaging replies.
- Romantic girlfriend-style conversations.
- Playful flirting and teasing.
- Mature relationship discussions.
`;


// =======================================
// 4. CHAT VARIABLES
// =======================================

let history = [];
let busy = false;

const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const typing = document.getElementById("typing");
const status = document.getElementById("status");


// =======================================
// 5. DISPLAY MESSAGE
// =======================================

function addMessage(text, sender) {

    const div = document.createElement("div");

    div.className = "message " + sender;
    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


// =======================================
// 6. WAIT FUNCTION
// =======================================

function wait(ms) {

    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });

}


// =======================================
// 7. GEMINI REQUEST WITH FALLBACK
// =======================================

async function generateReply(contents) {

    let lastError = null;

    for (const model of MODELS) {

        for (let attempt = 0; attempt < 3; attempt++) {

            try {

                status.textContent = "● Connecting to " + model;

                const response = await fetch(

                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,

                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": API_KEY
                        },

                        body: JSON.stringify({

                            systemInstruction: {
                                parts: [
                                    { text: SYSTEM_PROMPT }
                                ]
                            },

                            contents: contents,

                            generationConfig: {
                                temperature: 0.9,
                                maxOutputTokens: 500
                            }

                        })

                    }

                );

                const data = await response.json();

                if (!response.ok) {

                    const error = new Error(
                        data.error?.message || "Gemini API error"
                    );

                    error.status = response.status;

                    throw error;

                }

                const reply = data.candidates?.[0]
                    ?.content?.parts
                    ?.map(part => part.text || "")
                    .join("")
                    .trim();

                if (!reply) {

                    throw new Error(
                        "Gemini returned an empty response."
                    );

                }

                status.textContent = "● AI Girlfriend Online";

                return {
                    reply: reply,
                    model: model
                };

            } catch (error) {

                lastError = error;

                console.error(model, error);

                const retryable = [
                    429, 500, 503, 504
                ].includes(error.status);

                const modelUnavailable = [
                    404
                ].includes(error.status);

                if (!retryable && !modelUnavailable) {
                    throw error;
                }

                if (modelUnavailable) {
                    break;
                }

                if (attempt < 2) {

                    status.textContent =
                        "● Server busy, retrying...";

                    await wait(1500 * Math.pow(2, attempt));

                }

            }

        }

    }

    throw lastError || new Error(
        "All Gemini models are unavailable. Try again later."
    );

}


// =======================================
// 8. SEND MESSAGE
// =======================================

async function sendMessage() {

    const message = input.value.trim();

    if (!message || busy) return;

    if (
        !API_KEY ||
        API_KEY === "YOUR_NEW_GEMINI_API_KEY_HERE"
    ) {

        alert("Please add your Gemini API key in the code.");

        return;

    }

    input.value = "";

    addMessage(message, "user");

    history.push({

        role: "user",

        parts: [
            { text: message }
        ]

    });

    busy = true;

    sendBtn.disabled = true;
    typing.hidden = false;

    try {

        // Keep recent conversation context.
        const recentHistory = history.slice(-20);

        const result = await generateReply(recentHistory);

        history.push({

            role: "model",

            parts: [
                { text: result.reply }
            ]

        });

        addMessage(result.reply, "bot");

        status.textContent = "● Online • " + result.model;

    } catch (error) {

        // Remove unanswered user message.
        history.pop();

        let errorMessage = error.message;

        if (error.status === 429) {

            errorMessage =
                "Free API quota or rate limit reached. Please check your Gemini AI Studio usage and try later.";

        } else if (error.status === 503) {

            errorMessage =
                "Gemini servers are currently overloaded. Please try again later.";

        } else if (error.status === 403 || error.status === 401) {

            errorMessage =
                "API key rejected or permission denied. Check your API key.";

        }

        addMessage(
            "Sorry baby! 😔 " + errorMessage,
            "bot"
        );

        status.textContent = "● Connection issue";

        console.error(error);

    } finally {

        typing.hidden = true;
        busy = false;
        sendBtn.disabled = false;

        input.focus();

    }

}


// =======================================
// 9. BUTTON EVENTS
// =======================================

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        sendMessage();
    }

});


// =======================================
// 10. CLEAR CHAT
// =======================================

document.getElementById("clearBtn")
.addEventListener("click", function() {

    if (busy) return;

    if (!confirm("Clear all chat messages?")) return;

    history = [];

    chat.innerHTML = "";

    addMessage(
        "Hey baby! 💗 I'm back. Tell me what's on your mind! 🥰",
        "bot"
    );

});