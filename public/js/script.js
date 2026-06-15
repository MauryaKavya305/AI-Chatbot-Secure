const chatBody = document.querySelector('.chat-body');
const fileUploadWrapper = document.querySelector('.file-upload-wrapper');

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
};

// Chat history stored in memory (not exposed to the user's browser storage)
const chatHistory = [];

// ─── Utility ─────────────────────────────────────────────────────────────────

const createMessageElement = (content, ...classes) => {
    const div = document.createElement('div');
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

// ─── Bot response (calls YOUR server, never Gemini directly) ─────────────────

const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector('.message-text');

    // Add user turn to history
    chatHistory.push({
        role: "user",
        parts: [
            { text: userData.message },
            ...(userData.file.data ? [{ inline_data: userData.file }] : [])
        ]
    });

    try {
        // ✅ POST to your own server — API key never leaves the backend
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: chatHistory })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        const apiResponseText = data.candidates[0].content.parts[0].text
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .trim();

        messageElement.innerText = apiResponseText;

        // Add bot turn to history
        chatHistory.push({
            role: "model",
            parts: [{ text: apiResponseText }]
        });

    } catch (error) {
        console.error(error);
        messageElement.innerText = error.message;
        messageElement.style.color = "red";
    } finally {
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking");
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    }
};

// ─── Outgoing message ─────────────────────────────────────────────────────────

const handleOutgoingMessage = (e) => {
    e.preventDefault();

    userData.message = messageInput.value.trim();
    if (!userData.message) return;

    messageInput.value = "";
    fileUploadWrapper.classList.remove('file-uploaded');
    messageInput.dispatchEvent(new Event('input'));

    const messageContent = `
        <div class="message-text"></div>
        ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment" />` : ''}
    `;

    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    // Set text via textContent to prevent XSS
    outgoingMessageDiv.querySelector('.message-text').textContent = userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });

    // Show thinking indicator, then fetch response
    setTimeout(() => {
        const thinkingContent = `
            <img class="bot-avatar"
                 src="https://media.istockphoto.com/id/1060696342/vector/robot-icon-chat-bot-sign-for-support-service-concept-chatbot-character-flat-style.jpg?s=612x612&w=0&k=20&c=t9PsSDLowOAhfL1v683JMtWRDdF8w5CFsICqQvEvfzY="
                 alt="chatbot logo" height="60px" width="60px">
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        const incomingMessageDiv = createMessageElement(thinkingContent, "bot-welcome", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
        generateBotResponse(incomingMessageDiv);
    }, 500);
};

// ─── Input / textarea ─────────────────────────────────────────────────────────

const messageInput = document.querySelector('.message-input');
const initialInputHeight = messageInput.scrollHeight;

messageInput.addEventListener('keydown', (e) => {
    const userMessage = e.target.value.trim();
    if (e.key === "Enter" && userMessage && !e.shiftKey && window.innerWidth > 770) {
        handleOutgoingMessage(e);
    }
});

messageInput.addEventListener('input', () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector('.chat-form').style.borderRadius =
        messageInput.scrollHeight > initialInputHeight ? "15px" : "35px";
});

// ─── Send button ──────────────────────────────────────────────────────────────

document.querySelector('#send-message').addEventListener('click', handleOutgoingMessage);

// ─── File upload ──────────────────────────────────────────────────────────────

const fileInput = document.querySelector('#file-input');
document.querySelector('#file-upload').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    const selectedFile = fileInput.files[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector('img').src = e.target.result;
        fileUploadWrapper.classList.add('file-uploaded');
        const base64String = e.target.result.split(',')[1];

        userData.file = {
            data: base64String,
            mime_type: selectedFile.type
        };
        fileInput.value = "";
    };
    reader.readAsDataURL(selectedFile);
});

document.querySelector('#file-cancel').addEventListener('click', () => {
    userData.file = {};
    fileUploadWrapper.classList.remove('file-uploaded');
});

// ─── Emoji picker ─────────────────────────────────────────────────────────────

const picker = new EmojiMart.Picker({
    theme: 'light',
    skinTonePosition: 'none',
    previewPosition: 'none',
    onClickOutside: (e) => {
        if (e.target.id === "emoji-picker") {
            document.body.classList.toggle("show-emoji-picker");
        } else {
            document.body.classList.remove("show-emoji-picker");
        }
    },
    onEmojiSelect: (emoji) => {
        const { selectionStart: start, selectionEnd: end } = messageInput;
        messageInput.setRangeText(emoji.native, start, end, 'end');
        messageInput.focus();
    }
});

document.querySelector('.chat-form').appendChild(picker);

// ─── Toggle chatbot open/close ────────────────────────────────────────────────

document.querySelector('#chatbot-toggler')
    .addEventListener('click', () => document.body.classList.toggle('show-chatbot'));

document.querySelector('#close-chatbot')
    .addEventListener('click', () => document.body.classList.remove('show-chatbot'));
