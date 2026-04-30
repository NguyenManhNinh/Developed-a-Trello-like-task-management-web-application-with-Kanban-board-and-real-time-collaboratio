  import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Container, Typography, Button } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress';
import AppBar from '../../components/AppBar/AppBar'
import BoardBar from './BoardBar/BoardBar'
import BoardContent from './BoardContent'
import ActiveCardModal from '~/components/Modal/ActiveCard/ActiveCardModal'
import { mapOrder } from '~/utilities/sorts'
import { toast } from 'react-toastify'
import {
  fetchBoardDetailsApi,
  createNewColumnApi,
  createNewCardApi,
  updateBoardDetailsApi,
  updateColumnDetailsApi,
  moveCardToDifferentColumnAPI,
  deleteColumnDetailsApi
} from '~/apis'
import { generatePlaceholderCard } from '~/utilities/formatters'
import { isEmpty } from 'lodash'
import { addRecentBoard, removeRecentBoard } from '~/utilities/recentBoards'
import { useDispatch } from 'react-redux'
import { setCurrentBoard } from '~/redux/board/boardSlice'
import { addNotification } from '~/redux/notifications/notificationsSlice'

function Board() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { boardId } = useParams() // Get boardId from URL
  const [board, setBoard] = useState(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const board = await fetchBoardDetailsApi(boardId)
        // Filter out archived columns
        board.columns = board.columns.filter(c => !c._destroy)

        board.columns = mapOrder(board.columns, board.columnOrderIds, '_id')
        board.columns.forEach(column => {
          if (isEmpty(column.cards)) {
            column.cards = [generatePlaceholderCard(column)]
            column.cardOrderIds = [generatePlaceholderCard(column)._id]
          } else {
            column.cards = mapOrder(column.cards, column.cardOrderIds, '_id')
          }
        })
        setBoard(board)

        // Track this board visit
        addRecentBoard({
          _id: board._id,
          title: board.title
        })

        // Sync to Redux for global access (search, etc)
        dispatch(setCurrentBoard(board))
      } catch (error) {
        console.error('Failed to load board:', error)
        toast.error('Board không tồn tại hoặc đã bị xóa')

        // Remove deleted board from recent boards
        removeRecentBoard(boardId)

        // Redirect to profile or boards list after error
        setTimeout(() => {
          navigate('/profile')
        }, 2000)
      }
    }

    if (boardId) {
      loadBoard()
    }
  }, [dispatch, boardId, navigate])

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);


  const createNewColumn = async (newColumnData) => {
    const createdColumn = await createNewColumnApi({
      ...newColumnData,
      boardId: board._id
    })
    createdColumn.cards = [generatePlaceholderCard(createdColumn)]
    createdColumn.cardOrderIds = [generatePlaceholderCard(createdColumn)._id]

    // Properly clone board with new arrays (avoid immutable error)
    const newBoard = {
      ...board,
      columns: [...board.columns, createdColumn],
      columnOrderIds: [...board.columnOrderIds, createdColumn._id]
    }
    setBoard(newBoard)

    // Add notification
    dispatch(addNotification({
      type: 'CREATE_COLUMN',
      message: `Đã tạo cột "${createdColumn.title}"`
    }))
  }

  const createNewCard = async (newCardData) => {
    const createdCard = await createNewCardApi({
      ...newCardData,
      boardId: board._id
    })

    // Properly clone board with new arrays (avoid immutable error)
    const newBoard = {
      ...board,
      columns: board.columns.map(column => {
        if (column._id === createdCard.columnId) {
          return {
            ...column,
            cards: [...column.cards, createdCard],
            cardOrderIds: [...column.cardOrderIds, createdCard._id]
          }
        }
        return column
      })
    }
    setBoard(newBoard)

    // Add notification
    const columnToUpdate = newBoard.columns.find(c => c._id === createdCard.columnId)
    if (columnToUpdate) {
      dispatch(addNotification({
        type: 'CREATE_CARD',
        message: `Đã tạo thẻ "${createdCard.title}"  trong cột "${columnToUpdate.title}"`
      }))
    }
  }

  const moveColumns = (dndOrderedColumns) => {
    const dndColumnOrderIds = dndOrderedColumns.map(c => c._id);
    const newBoard = { ...board }
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndColumnOrderIds
    setBoard(newBoard)
    updateBoardDetailsApi(newBoard._id, { columnOrderIds: newBoard.columnOrderIds })
  }

  const moveCardInTheSameColumn = (dndOrderedCards, dndOrderCardIds, columnId) => {
    // Clone board and columns to avoid mutating read-only state
    const newBoard = { ...board }
    newBoard.columns = [...newBoard.columns]

    const columnToUpdateIndex = newBoard.columns.findIndex(column => column._id === columnId)
    if (columnToUpdateIndex !== -1) {
      newBoard.columns[columnToUpdateIndex] = {
        ...newBoard.columns[columnToUpdateIndex],
        cards: dndOrderedCards,
        cardOrderIds: dndOrderCardIds
      }
    }
    setBoard(newBoard)
    updateColumnDetailsApi(columnId, { cardOrderIds: dndOrderCardIds })
  }

  const moveCardToDifferentColumn = (currentCardId, prevColumnId, nextColumnId, dndOrderedColumns) => {
    const dndColumnOrderIds = dndOrderedColumns.map(c => c._id);
    const newBoard = { ...board }
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndColumnOrderIds
    setBoard(newBoard)
    let prevCardOrderIds = dndOrderedColumns.find(c => c._id === prevColumnId)?.cardOrderIds
    if (prevCardOrderIds[0].includes('placeholder-card')) prevCardOrderIds = []
    let nextCardOrderIds = dndOrderedColumns.find(c => c._id === nextColumnId)?.cardOrderIds
    if (nextCardOrderIds[0].includes('placeholder-card')) nextCardOrderIds = []
    moveCardToDifferentColumnAPI({
      currentCardId,
      prevColumnId,
      prevCardOrderIds,
      nextColumnId,
      nextCardOrderIds
    })
  }

  const moveColumnToPosition = (columnId, newIndex) => {
    const newColumns = [...board.columns]
    const oldIndex = newColumns.findIndex(c => c._id === columnId)
    const [removed] = newColumns.splice(oldIndex, 1)
    newColumns.splice(newIndex, 0, removed)
    moveColumns(newColumns)
  }

  const deleteColumnDetails = (columnId) => {
    const newBoard = { ...board }
    newBoard.columns = newBoard.columns.filter(c => c._id !== columnId)
    newBoard.columnOrderIds = newBoard.columnOrderIds.filter(_id => _id !== columnId)
    setBoard(newBoard)
    deleteColumnDetailsApi(columnId).then(res => {
      toast.success(res?.deleteResult)
    })
  }

  // Update column details (title, etc)
  const updateColumnDetails = (columnId, updateData) => {
    const newBoard = { ...board }
    const columnToUpdate = newBoard.columns.find(c => c._id === columnId)
    if (columnToUpdate) {
      // Optimistic update
      if (updateData._destroy) {
        // If archiving/deleting, remove from columns
        newBoard.columns = newBoard.columns.filter(c => c._id !== columnId)
        newBoard.columnOrderIds = newBoard.columnOrderIds.filter(_id => _id !== columnId)
      } else if (updateData.title) {
        columnToUpdate.title = updateData.title
      }
      setBoard(newBoard)

      // Call API
      updateColumnDetailsApi(columnId, updateData).then(res => {
        toast.success(res?.updateResult)
      }).catch(() => {
        toast.error('Update failed')
      })
    }
  }

  const updateCardInBoard = useCallback((cardId, updatedFields) => {
    setBoard(prevBoard => {
      const newColumns = prevBoard.columns.map(column => {
        const cardIndex = column.cards.findIndex(card => card._id === cardId);
        if (cardIndex !== -1) {
          const newCards = column.cards.map((card, idx) =>
            idx === cardIndex ? { ...card, ...updatedFields } : card
          );
          return { ...column, cards: newCards };
        }
        return column;
      });
      return {
        ...prevBoard,
        columns: newColumns
      };
    });
    setTick(prev => prev + 1);
  }, []);

  if (!board) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        width: '100vh',
        height: '100vh',
      }}>
        <CircularProgress />
        <Typography>Loading Board...</Typography>
      </Box>
    )
  }

  const onAutoMoveCard = (cardId, targetColumnId) => {
    const newBoard = cloneDeep(board)
    const currentColumn = newBoard.columns.find(c => c.cardOrderIds.includes(cardId))
    const targetColumn = newBoard.columns.find(c => c._id === targetColumnId)

    if (currentColumn && targetColumn && currentColumn._id !== targetColumnId) {
      // Remove from current column
      const cardIndex = currentColumn.cards.findIndex(c => c._id === cardId)
      const [cardToMove] = currentColumn.cards.splice(cardIndex, 1)
      currentColumn.cardOrderIds = currentColumn.cards.map(c => c._id)
      if (isEmpty(currentColumn.cards)) {
        currentColumn.cards = [generatePlaceholderCard(currentColumn)]
        currentColumn.cardOrderIds = [generatePlaceholderCard(currentColumn)._id]
      }

      // Add to target column
      cardToMove.columnId = targetColumnId
      targetColumn.cards.unshift(cardToMove) // Add to top
      targetColumn.cardOrderIds = targetColumn.cards.map(c => c._id)
      targetColumn.cards = targetColumn.cards.filter(c => !c.FE_PlaceholderCard)

      setBoard(newBoard)

      // Call API
      moveCardToDifferentColumn(
        cardId,
        currentColumn._id,
        targetColumnId,
        newBoard.columns
      )

      toast.success('Đã tự động chuyển thẻ sang cột mới! ⚡')
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
    }}>
      <AppBar />
      <BoardBar board={board} setBoard={setBoard} />
      <BoardContent
        createNewColumn={createNewColumn}
        createNewCard={createNewCard}
        moveColumns={moveColumns}
        moveCardInTheSameColumn={moveCardInTheSameColumn}
        moveCardToDifferentColumn={moveCardToDifferentColumn}
        deleteColumnDetails={deleteColumnDetails}
        updateColumnDetails={updateColumnDetails}
        moveColumnToPosition={moveColumnToPosition}
        board={board}
        backgroundColor={board?.background || '#0c66e4'}
      />
      <ActiveCardModal
        updateCardInBoard={updateCardInBoard}
        onAutoMoveCard={onAutoMoveCard}
      />
    </Box>
  )
}

export default Board
