import streamlit as st
import datetime
import json
import matplotlib.pyplot as plt
import google.generativeai as genai

# ---------------------------
# Configure Gemini API
# ---------------------------
genai.configure(api_key="AIzaSyBQyyLD7P2N2ysssZgaf7tUVLMn7MXIPxY")  # 🔑 Replace with your real key

# ---------------------------
# Crisis keywords
CRISIS_KEYWORDS = ["suicide", "kill myself", "no reason to live"]

# ---------------------------
# Load/Save Mood Data
def load_moods():
    try:
        with open("moods.json", "r") as f:
            return json.load(f)
    except:
        return {}

def save_moods(moods):
    with open("moods.json", "w") as f:
        json.dump(moods, f)

# ---------------------------
# Onboarding
if "onboarding_done" not in st.session_state:
    st.title("🌱 Welcome to Your AI Companion")
    st.write("I am an AI companion, **not a medical professional.**")
    if st.button("Continue"):
        st.session_state.onboarding_done = True
    st.stop()

# ---------------------------
# Tabs for Features
tab1, tab2, tab3 = st.tabs(["💬 Chat", "📊 Mood Tracker", "🚨 Crisis Support"])

# ---------------------------
# Chatbot (Gemini-powered)
with tab1:
    st.header("💬 Talk to Your AI Companion")

    # Chat history
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    # Initialize Gemini chat session
    if "chat" not in st.session_state:
        model = genai.GenerativeModel("gemini-1.5-flash")
        st.session_state.chat = model.start_chat(history=[])

    user_input = st.text_input("You:", "")

    if st.button("Send") and user_input:
        # Crisis detection
        if any(word in user_input.lower() for word in CRISIS_KEYWORDS):
            st.error("⚠️ It seems you’re in crisis. Please call these hotlines immediately:")
            st.markdown("""
            - 📞 AASRA Helpline: **+91-9820466726**
            - 📞 Snehi: **+91-9582208181**
            - 📞 Vandrevala Foundation Helpline: **1860 2662 345**
            """)
        else:
            try:
                # Send to Gemini
                response = st.session_state.chat.send_message(user_input)

                # Save history
                st.session_state.chat_history.append(("You", user_input))
                st.session_state.chat_history.append(("AI", response.text))
            except Exception as e:
                st.session_state.chat_history.append(("AI", f"[Error: {e}]"))

    # Display chat history
    for sender, msg in st.session_state.chat_history:
        st.write(f"**{sender}:** {msg}")

# ---------------------------
# Mood Tracker
with tab2:
    st.header("📊 Daily Mood Check-In")
    moods = load_moods()
    today = str(datetime.date.today())
    mood = st.radio("How are you feeling today?", ["😊", "🙂", "😐", "😕", "😞"], horizontal=True)

    if st.button("Save Mood"):
        moods[today] = mood
        save_moods(moods)
        st.success("Mood saved!")

    # Show history chart
    if moods:
        dates = list(moods.keys())
        values = [list("😊🙂😐😕😞").index(m) + 1 for m in moods.values()]
        plt.plot(dates, values, marker="o")
        plt.title("Mood Tracker")
        plt.xticks(rotation=45)
        st.pyplot(plt)

# ---------------------------
# Crisis Support
with tab3:
    st.header("🚨 Crisis Helplines")
    st.warning("If you are in crisis, please reach out immediately:")
    st.markdown("""
    - 📞 AASRA Helpline: **+91-9820466726**
    - 📞 Snehi: **+91-9582208181**
    - 📞 Vandrevala Foundation Helpline: **1860 2662 345**
    """)
