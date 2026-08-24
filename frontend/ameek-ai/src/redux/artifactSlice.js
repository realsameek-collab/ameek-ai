import { createSlice } from "@reduxjs/toolkit";

const artifactSlice = createSlice({

    name: "artifact",
    initialState: {
        artifact: null,     // { code, language, title }
        open: false,
        view: "preview",    // "preview" | "code"
        expanded: false
    },
    reducers: {

        // a freshly generated artifact always opens straight into preview
        setArtifact: (state, action) => {
            if (!action.payload) return
            state.artifact = action.payload
            state.open = true
            state.view = "preview"
        },
        openArtifact: (state) => {
            if (state.artifact) state.open = true
        },
        closeArtifact: (state) => {
            state.open = false
            state.expanded = false
        },
        setView: (state, action) => {
            state.view = action.payload === "code" ? "code" : "preview"
        },
        toggleExpanded: (state) => {
            state.expanded = !state.expanded
        },
        clearArtifact: (state) => {
            state.artifact = null
            state.open = false
            state.expanded = false
            state.view = "preview"
        }

    }
});

export const {
    setArtifact,
    openArtifact,
    closeArtifact,
    setView,
    toggleExpanded,
    clearArtifact
} = artifactSlice.actions

export default artifactSlice.reducer
