import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DescriptionState {
  [id: number]: string;
}

const initialState: DescriptionState = {};

const descriptionSlice = createSlice({
  name: 'descriptions',
  initialState,
  reducers: {
    setDescription: (state, action: PayloadAction<{ id: number; description: string }>) => {
      const { id, description } = action.payload;
      state[id] = description;
    },
  },
});

export const { setDescription } = descriptionSlice.actions;
export default descriptionSlice.reducer;
