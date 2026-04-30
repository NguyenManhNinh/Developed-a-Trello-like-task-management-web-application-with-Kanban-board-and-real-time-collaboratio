import { Box } from '@mui/material'
import ListColumns from './ListColumns/ListColumns'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  closestCorners,
  closestCenter,
  pointerWithin,
  getFirstCollision
}
  from '@dnd-kit/core';
import { MouseSensor, TouchSensor } from '~/customLibraries/DndKitSensors';
import { arrayMove } from '@dnd-kit/sortable';
import { useEffect, useState, useCallback, useRef } from 'react';
import { cloneDeep, isEmpty } from 'lodash';
import Column from './ListColumns/Column/Column';
import Card from './ListColumns/Column/ListCards/Card/Card';
import { generatePlaceholderCard } from '~/utilities/formatters';
import { useSelector, useDispatch } from 'react-redux'
import { selectBoardFilters } from '~/redux/board/boardFilterSlice'
import { moveColumn, moveCardSameColumn, moveCardDifferentColumn } from '~/redux/board/boardSlice'


const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({ board,
  createNewColumn,
  createNewCard,
  moveColumns,
  moveCardInTheSameColumn,
  moveCardToDifferentColumn,
  deleteColumnDetails,
  updateColumnDetails,
  moveColumnToPosition,
  backgroundColor
}) {
  const dispatch = useDispatch()
  // const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } })
  // Ưu tiên sử dụng Mouse và Touch sensor cho mobile tốt nhất
  const sensors = useSensors(mouseSensor, touchSensor)
  const [orderedColumns, setOrderedColumns] = useState([]);
  const filters = useSelector(selectBoardFilters)

  //Cùng một thời điểm chỉ có môt lần kéo column hoặc card
  const [activeDragItemId, setActiveDragItemId] = useState(null);
  const [activeDragItemType, setActiveDragItemType] = useState(null);
  const [activeDragItemData, setActiveDragItemData] = useState(null);
  const [oldColumnWhenDraggingCard, setOldColumnWhenDraggingCard] = useState(null);
  //Điểm và chạm cuối cunngf (xử lý thuật toán phát hiên va chậm)
  const lastOverId = useRef(null);

  useEffect(() => {
    if (!board?.columns) return

    let newColumns = cloneDeep(board.columns)

    // Apply filters
    if (filters.text || filters.labels.length > 0 || filters.members.length > 0 || filters.due !== 'all') {
      newColumns = newColumns.map(col => {
        col.cards = col.cards.filter(card => {
          if (card.FE_PlaceholderCard) return true

          // Text filter
          if (filters.text && !card.title.toLowerCase().includes(filters.text.toLowerCase())) return false

          // Label filter
          if (filters.labels.length > 0) {
            // Assuming card.labels is array of objects with _id
            const cardLabelIds = card.labels?.map(l => l._id) || []
            const hasLabel = filters.labels.some(id => cardLabelIds.includes(id))
            if (!hasLabel) return false
          }

          // Member filter
          if (filters.members.length > 0) {
            const cardMemberIds = card.memberIds || []
            const hasMember = filters.members.some(id => cardMemberIds.includes(id))
            if (!hasMember) return false
          }

          // Due date filter
          if (filters.due !== 'all') {
            if (filters.due === 'no-due' && card.due) return false
            if (filters.due !== 'no-due' && !card.due) return false

            const now = new Date()
            const due = new Date(card.due)

            if (filters.due === 'overdue' && due >= now) return false
            if (filters.due === 'today') {
              const isToday = due.getDate() === now.getDate() &&
                due.getMonth() === now.getMonth() &&
                due.getFullYear() === now.getFullYear()
              if (!isToday) return false
            }
            if (filters.due === 'week') {
              const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
              if (due < now || due > nextWeek) return false
            }
          }

          return true
        })
        return col
      })
    }

    setOrderedColumns(newColumns)
  }, [board, filters])
  //Tìm một cái column theo cardId
  const findColumnByCardId = (cardId) => {
    //Đoạn này lưu ý nên dùng c.cards thay vì c.cardOrderIds bởi vì ở bước handleDragOver chúng ta sẽ
    // làm dữ liệu cho cards,hoàn chỉnh trước rồi mới tạo lại cardOrderIds
    return orderedColumns.find(column => column?.cards?.map(card => card._id)?.includes(cardId))
  }
  //Function chung sử lý việc cập nhật lại state trong trường hợp di chuyển Card giữa các column khác nhau
  const moveCardBetweenDifferentColumns = (
    overColumn,
    overCardId,
    active,
    over,
    activeColumn,
    activeDraggingCardId,
    activeDraggingCardData,
    triggerFrom
  ) => {
    setOrderedColumns(prevColumns => {
      //Tìm vị trí (index)của cái overCard trong column đích
      const overCardIndex = overColumn?.cards?.findIndex(card => card._id === overCardId)
      let newCardIndex
      const isBelowOverItem = active.rect.current.translated &&
        active.rect.current.translated.top > over.rect.top + over.rect.height
      const modifier = isBelowOverItem ? 1 : 0
      newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.cards?.length + 1

      //clone mảng OrderedColumns cũ để ra cái mới xử lý data rồi return-cập nhật lại orderedColumnsState mới
      const nextColumns = cloneDeep(prevColumns)
      const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id)
      const nextOverColumn = nextColumns.find(column => column._id === overColumn._id)
      //Column cũ
      if (nextActiveColumn) {
        //Xóa card ở cột active (cũng có thể hiểu là cột cũ,cái lúc mà kéo card ra khỏi nó để sang cột khác)
        nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId)
        //Thêm placeholderCard nếu column rỗng:Bị kéo hết card đi,không còn cái nào nữa
        if (isEmpty(nextActiveColumn.cards)) {
          // console.log('Card cuối cùng bị kéo đi')
          nextActiveColumn.cards = [generatePlaceholderCard(nextActiveColumn)]

        }

        //câp nhật lại cardOrderIds
        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id)
      }
      //Column mới
      if (nextOverColumn) {
        //kiểm tra xem card đang kéo có tồn tại trong overColumn chưa,nếu có thì cần xóa nó trước
        nextOverColumn.cards = nextOverColumn.cards.filter(card => card._id !== activeDraggingCardId)
        //Tiếp theo là thêm cái card đang kéo vào vị trí index mới

        // phải cập nhật lại chuẩn dữ liệu columnId trong card sau khi kéo
        //card giữu 2 column khác nhau
        const rebuild_activeDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn._id
        }
        nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, rebuild_activeDraggingCardData)
        //Xóa cái PlaceholderCard nếu nó còn tồn tại
        nextOverColumn.cards = nextOverColumn.cards.filter(card => !card.FE_PlaceholderCard)
        //câp nhật lại cardOrderIds
        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card._id)
      }
      //Nếu Func này được goi từ handleDragend nghĩa là đã kéo xong,lúc này mới xử lý gọi Api 1 lần ở đây
      if (triggerFrom === 'handleDragend') {
        // Dispatch Redux action for DevTools visibility
        dispatch(moveCardDifferentColumn({
          fromColumnId: oldColumnWhenDraggingCard._id,
          toColumnId: nextOverColumn._id,
          cardId: activeDraggingCardId,
          newFromCardOrderIds: nextActiveColumn.cardOrderIds,
          newFromCards: nextActiveColumn.cards,
          newToCardOrderIds: nextOverColumn.cardOrderIds,
          newToCards: nextOverColumn.cards
        }))

        moveCardToDifferentColumn(
          activeDraggingCardId,
          oldColumnWhenDraggingCard._id,
          nextOverColumn._id,
          nextColumns
        )
      }
      return nextColumns
    })
  }
  //Trigger khi bắt đầu kéo thả
  const handleDragStart = (event) => {
    // console.log('handleDragStart:', event);
    // Haptic Feedback for mobile
    if (window.navigator?.vibrate) window.navigator.vibrate(50);

    setActiveDragItemId(event?.active?.id);
    setActiveDragItemType(event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN);
    setActiveDragItemData(event?.active?.data?.current);
    //Nếu là kéo card thì mới thực hiện những hành động set giá trị oldColumn
    if (event?.active?.data?.current?.columnId) {
      setOldColumnWhenDraggingCard(findColumnByCardId(event?.active?.id));
    }
  }
  const handleDragOver = (event) => {
    //Không làm gì nếu đang kéo cột
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return
    //Còn nếu kéo Card thì xử lý thêm để có thể kéo thả Card giữa các cột
    // console.log('handleDragOver:', event);
    const { active, over } = event;
    //Kiểm tra nếu không tồn tại over(Kéo thả linh tình ra ngoài thì return luôn tránh lỗi)
    if (!active || !over) return;
    //activeDraggingCard:là card đang được kéo
    const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active
    //overCardId:là card mà thằng activeDraggingCard đang nằm trên nó
    const { id: overCardId } = over
    //Tìm 2 cái column theo cardId
    const activeColumn = findColumnByCardId(activeDraggingCardId)
    const overColumn = findColumnByCardId(overCardId) || orderedColumns.find(c => c._id === overCardId)
    if (!activeColumn || !overColumn) return;//Nếu không tìm thấy cột thì return
    if (activeColumn._id !== overColumn._id) {
      moveCardBetweenDifferentColumns(
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData,
        'handleDragOver'
      )
    }
  }
  //Trigger khi kết thúc kéo thả
  const handleDragend = (event) => {
    const { active, over } = event;
    // console.log('handleDragEnd:', { active, over, activeDragItemType });

    if (!active || !over) return; //nếu thả ra ngoài vùng sortable thì không làm gì cả
    //Nếu với trị mới sau khi thả khác với vị trí cũ
    // console.log('handleDragend:', event);
    //Xử lý kéo thả card
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      //activeDraggingCard:là card đang được kéo
      const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active
      //overCardId:là card mà thằng activeDraggingCard đang nằm trên nó
      const { id: overCardId } = over
      //Tìm 2 cái column theo cardId
      const activeColumn = findColumnByCardId(activeDraggingCardId)
      const overColumn = findColumnByCardId(overCardId) || orderedColumns.find(c => c._id === overCardId)
      if (!activeColumn || !overColumn) return;//Nếu không tìm thấy cột thì return
      //Hành động kéo thả card giữa 2 cột khác nhau
      //Phải dùng tới activeDragItemData.columnId hoặc oldColumnWhenDraggingCard._id  (set vào state  từ handleDragStart)chứ không phải activeData '
      //Trong scope của handleDrangEnd này vì sau khi đi qua onDragOver tới đây là state của card đã bị cập nhật một lần rồi
      if (oldColumnWhenDraggingCard._id !== overColumn._id) {
        moveCardBetweenDifferentColumns(
          overColumn,
          overCardId,
          active,
          over,
          activeColumn,
          activeDraggingCardId,
          activeDraggingCardData,
          'handleDragend'
        )

        //
      } else {//Hành động
        //Hành động kéo thả card trong cùng một cột
        const oldCardIndex = oldColumnWhenDraggingCard?.cards?.findIndex(c => c._id === activeDragItemId);//lấy vị trí cũ từ thằng active
        const newCardIndex = overColumn?.cards?.findIndex(c => c._id === overCardId);//vị trí mới từ thằng over
        //dùng arrymove vì kéo card trong một cái cột thì tương tụ với logic kéo cột trong một cái board content
        const dndOrderedCards = arrayMove(oldColumnWhenDraggingCard?.cards || [], oldCardIndex, newCardIndex);
        const dndOrderCardIds = dndOrderedCards.map(card => card._id);
        setOrderedColumns(prevColumns => {
          // Clone array for immutability
          const nextColumns = cloneDeep(prevColumns);
          // Find and update the column
          const targetColumn = nextColumns.find(column => column._id === overColumn._id);
          if (targetColumn) {
            targetColumn.cards = dndOrderedCards;
            targetColumn.cardOrderIds = dndOrderCardIds
          }
          return nextColumns;
        });

        // Dispatch Redux action for DevTools visibility
        dispatch(moveCardSameColumn({
          columnId: oldColumnWhenDraggingCard._id,
          fromIndex: oldCardIndex,
          toIndex: newCardIndex,
          newCardOrderIds: dndOrderCardIds,
          newCards: dndOrderedCards
        }))

        moveCardInTheSameColumn(dndOrderedCards, dndOrderCardIds, oldColumnWhenDraggingCard._id);
      }
    }
    //Xử lý kéo thả cột
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      if (active.id !== over.id) {
        const oldColumnIndex = orderedColumns.findIndex(c => c._id === active.id);
        const newColumnIndex = orderedColumns.findIndex(c => c._id === over.id);
        const dndOrderedColumns = arrayMove(orderedColumns, oldColumnIndex, newColumnIndex);
        //Cập nhật lại thứ tự cột sau khi drag and drop
        setOrderedColumns(dndOrderedColumns);

        // Dispatch Redux action for DevTools visibility
        dispatch(moveColumn({
          fromIndex: oldColumnIndex,
          toIndex: newColumnIndex
        }))

        moveColumns(dndOrderedColumns);
      }
    }
    //Những dữ liệu sau khi kéo thả này luôn phải đưa về giá trị null mặc định ban đầu
    setActiveDragItemId(null);
    setActiveDragItemType(null);
    setActiveDragItemData(null);
    setOldColumnWhenDraggingCard(null);
  }
  // Animation khi thả phần tử -Test bằng cách kéo xong thả trực tiếp và nhìn phần giữ chỗ Overlay
  const CustomDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5', }, }, }),
  };
  //args các đối số,tham số
  const collisionDetectionStrategy = useCallback((args) => {
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(container => {
          return orderedColumns.map(c => c._id).includes(container.id)
        })
      });
    }
    //tìm các điểm giao nhua với các điểm va chậm của con trỏ chuột
    const poiterIntersections = pointerWithin(args);
    // console.log('poiterIntersections:',poiterIntersections)
    if (!poiterIntersections?.length) return lastOverId.current ? [{ id: lastOverId.current }] : [];
    // const intersections =!!poiterIntersections?.length
    // ?poiterIntersections:rectIntersection(args);
    //tìm overId đầu tiên trong đám intersections ở trên
    let overId = getFirstCollision(poiterIntersections, 'id')
    if (overId) {
      //Nếu cái over nó là column thì sẽ tìm tới cái cardId gần nhất bên trong khu vực va chạm đó dựa
      //vào thuật toán phát hiện va chạm closestCorners hoặc closestCorners đều được.Tuy nhiên ở đây cũng closestCenter mình thấy mượt mà hơn
      const checkColumn = orderedColumns.find(column => column._id === overId)
      if (checkColumn) {
        // console.log('overId before:',overId)
        const closestCardId = closestCorners({
          ...args,
          droppableContainers: args.droppableContainers.filter(container => {
            return (container.id !== overId) && (checkColumn?.cardOrderIds?.includes(container.id))
          })
        })[0]?.id
        if (closestCardId) {
          overId = closestCardId
        }
        // console.log('overId after:',overId)
      }
      lastOverId.current = overId
      return [{ id: overId }]
    }
    //Nếu overId là null thì trả về mảng rỗng - tránh bug crash trang
    return lastOverId.current = overId ? [{ id: lastOverId.current }] : [];
  }, [activeDragItemType, orderedColumns])
  return (
    <DndContext
      sensors={sensors}
      //Nêu chỉ dùng clodsestCorners sẽ có bug flickering + sai lệch dữ liệu
      // collisionDetection={closestCorners}

      //Tự custom nâng cao thuật toán phát hiện va chạm
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragend}
    >
      <Box sx={{
        bgcolor: backgroundColor || '#0c66e4',
        width: '100%',
        flex: 1,
        minHeight: '100vh',
        overflowY: 'auto',
        p: '10px 0',
      }}>
        <ListColumns
          columns={orderedColumns}
          createNewColumn={createNewColumn}
          createNewCard={createNewCard}
          deleteColumnDetails={deleteColumnDetails}
          updateColumnDetails={updateColumnDetails}
          moveColumnToPosition={moveColumnToPosition}
        />
        <DragOverlay dropAnimation={CustomDropAnimation}>
          {!activeDragItemType && null}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && (
            <div style={{ opacity: 0.5 }}>
              <Column column={activeDragItemData} />
            </div>
          )}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && (
            <div style={{ transform: 'rotate(5deg)', cursor: 'grabbing' }}>
              <Card card={activeDragItemData} />
            </div>
          )}
        </DragOverlay>
      </Box>
    </DndContext>
  )
}
export default BoardContent
