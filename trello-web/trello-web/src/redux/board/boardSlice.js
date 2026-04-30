import { createSlice } from '@reduxjs/toolkit'
import { getUserBoards } from '~/services/boardsService'

const boardSlice = createSlice({
  name: 'board',
  initialState: {
    currentBoard: null,
    myBoards: [],
    boardsLoading: false,
    boardsError: null
  },
  reducers: {
    setCurrentBoard: (state, action) => {
      state.currentBoard = action.payload
    },
    clearCurrentBoard: (state) => {
      state.currentBoard = null
    },
    setMyBoards: (state, action) => {
      state.myBoards = action.payload
    },
    setBoardsLoading: (state, action) => {
      state.boardsLoading = action.payload
    },
    setBoardsError: (state, action) => {
      state.boardsError = action.payload
    },
    addBoard: (state, action) => {
      state.myBoards.unshift(action.payload)
    },

    // =========================
    // DRAG & DROP REDUCERS
    // =========================

    // Di chuyển Column trong cùng Board
    moveColumn: (state, action) => {
      const { fromIndex, toIndex } = action.payload
      if (!state.currentBoard?.columns) return

      // Di chuyển column trong mảng columns
      const [movedColumn] = state.currentBoard.columns.splice(fromIndex, 1)
      state.currentBoard.columns.splice(toIndex, 0, movedColumn)

      // Cập nhật lại columnOrderIds
      state.currentBoard.columnOrderIds = state.currentBoard.columns.map(col => col._id)
    },

    // Di chuyển Card trong cùng một Column
    moveCardSameColumn: (state, action) => {
      const { columnId, fromIndex, toIndex, newCardOrderIds, newCards } = action.payload
      if (!state.currentBoard?.columns) return

      const targetColumn = state.currentBoard.columns.find(col => col._id === columnId)
      if (targetColumn) {
        targetColumn.cardOrderIds = newCardOrderIds
        targetColumn.cards = newCards
      }
    },

    // Di chuyển Card sang Column khác
    moveCardDifferentColumn: (state, action) => {
      const {
        fromColumnId,
        toColumnId,
        cardId,
        newFromCardOrderIds,
        newFromCards,
        newToCardOrderIds,
        newToCards
      } = action.payload

      if (!state.currentBoard?.columns) return

      // Cập nhật Column nguồn (xóa card đi)
      const fromColumn = state.currentBoard.columns.find(col => col._id === fromColumnId)
      if (fromColumn) {
        fromColumn.cardOrderIds = newFromCardOrderIds
        fromColumn.cards = newFromCards
      }

      // Cập nhật Column đích (thêm card vào)
      const toColumn = state.currentBoard.columns.find(col => col._id === toColumnId)
      if (toColumn) {
        toColumn.cardOrderIds = newToCardOrderIds
        toColumn.cards = newToCards
      }
    }
  }
})

export const {
  setCurrentBoard,
  clearCurrentBoard,
  setMyBoards,
  setBoardsLoading,
  setBoardsError,
  addBoard,
  // Drag & Drop actions
  moveColumn,
  moveCardSameColumn,
  moveCardDifferentColumn
} = boardSlice.actions

export const selectCurrentBoard = (state) => state.board.currentBoard
export const selectMyBoards = (state) => state.board.myBoards
export const selectBoardsLoading = (state) => state.board.boardsLoading
export const selectBoardsError = (state) => state.board.boardsError

// Thunk action to fetch boards
export const fetchMyBoards = () => async (dispatch) => {
  try {
    dispatch(setBoardsLoading(true))
    const response = await getUserBoards()
    dispatch(setMyBoards(response.data || []))
    dispatch(setBoardsError(null))
  } catch (error) {
    dispatch(setBoardsError(error.message))
  } finally {
    dispatch(setBoardsLoading(false))
  }
}

export default boardSlice.reducer
