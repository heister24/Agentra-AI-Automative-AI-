import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import agentReducer from "./agentSlice";
import chatReducer from "./chatSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    agent: agentReducer,
    chat: chatReducer,
  },
});

export default store;
