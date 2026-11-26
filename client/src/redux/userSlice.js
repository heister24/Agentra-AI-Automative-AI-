import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    loading: true,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
      state.loading = false;
    },
    updateUserPreferencesState: (state, action) => {
      if (state.userData) {
        state.userData.preferences = {
          ...state.userData.preferences,
          ...action.payload,
        };
      }
    },
  },
});

export const { setUserData, updateUserPreferencesState } = userSlice.actions;
export default userSlice.reducer;
