import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { combine } from 'zustand/middleware';
import { current, type WritableDraft } from 'immer';

import type { piece, grids, tar, camp, enPassant, coor, row, col, type } from '@/types/dataStruct';
import { gridsInit, getXY, getCoor, getTarGrids, getPiece, getTarCoor, findPieceListKey, getEnemy } from '@/types/dataStruct';
import { pieceMap, gridListInit  } from '@/types/dataStruct';
import { type FENBoard, generateFENFromState, generateStateFromFEN } from '@/types/FEN';
import { pieceFn2AnMap, INITBoard } from '@/types/FEN';
import { abbrPiece, LANStep } from '@/types/LAN';

export * from '@/types/dataStruct';

export interface State {
  pieceList: Record<piece['key'], piece>,
  gridList: grids,

  discardIdx: {
    white: number,
    black: number,
  },

  curTar: tar[];

  selected: piece['key'] | '',

  turn: camp,

  enPassant: enPassant,

  checkMate: camp | undefined,

  halfMove: number,
  fullMove: number,

  promotion: {
    isPromotion: boolean
    coor: coor | undefined,
    from: 'MOVE' | 'CAPTURE' | undefined
  },

  notation: {
    FEN: string[],
    LAN: Array<LANStep | ''>, // 初始化第一步为 '' 方便统一idx
    curIdx: number,
  }
}

const stepActionN = ['MOVE', 'CASTLING', 'CAPTURE', 'PROMOTE', 'ENPASSANT'] as const;
type stepAction = typeof stepActionN[number]

type ActionType = 
| { type: 'SELECTED', selected: piece['key'] }
| { type: 'DESELECTED', selected: piece['key'] }

| { type: 'MOVE', to: coor, promotion?: { isPromotion: boolean, from: 'MOVE' } }
| { type: 'CASTLING', to: coor }

| { type: 'CAPTURE', to: coor, selected: piece['key'], promotion?: { isPromotion: boolean, from: 'CAPTURE' } }
| { type: 'PROMOTE', promoteTo: type }
| { type: 'ENPASSANT', to: coor }

| { type: 'LOAD', FEN: string | FENBoard }
;
const dspcMove = (draft: WritableDraft<State>, action: Extract<ActionType, { to: coor, isPromotion?: { isPromotion: boolean, from: 'MOVE' | 'CAPTURE' } }>)=> {
  const { pieceList, gridList } = draft;
  const sel = pieceList[draft.selected]; // selected piece

  gridList[sel.coordinate] = gridsInit(sel.coordinate); // remove piece before move

  sel.coordinate = action.to; // move

  draft.curTar = [];

  ((action.type==='CAPTURE' || action.type==='MOVE' )
  && action.promotion?.isPromotion)
  && draft.curTar.push({ coordinate: action.to, type: 'self', isPromotion: action.promotion?.isPromotion })

  console.log(current(draft).curTar);
  

  gridList[action.to] = sel; // update piece after move

  return sel;
}
const move = (
  draft: WritableDraft<State>, 
  action: Extract<ActionType, { to: coor }>,
)=> (
  action.type==='CASTLING'
  ? (()=> { return dspcMove(draft, action) })()
  : (()=> {
    const hyphen = action.type==='MOVE'? '-': 'x';
    const { pieceList, notation } = draft;
    const from = pieceList[draft.selected].coordinate;
    const sel = dspcMove(draft, action);
    const to = sel.coordinate;
    let piece = '' as abbrPiece;
    sel.type==='Pawn' || (piece = pieceFn2AnMap[sel.type] as abbrPiece);
    notation.LAN.push(`${piece}${from}${hyphen}${to}`);

    return sel;
  })()
);

const dspcNextRound = (draft: WritableDraft<State>)=> {
  draft.selected = '';

  draft.turn==='white'? draft.turn='black': draft.turn='white';
  draft.enPassant.round && (draft.enPassant.round-=1);
  draft.enPassant.round || (draft.enPassant.coordinate = undefined);
  // draft.delKey!== '' && (draft.discardList[draft.turn].push(draft.pieceList[draft.delKey]));
}
const nextRound = (draft: WritableDraft<State>, action: Extract<ActionType, { type: stepAction }>)=> {
  let type: ActionType['type'];

  const fromPromote = action.type==='PROMOTE';
  (fromPromote && draft.promotion.from)
  ? type = draft.promotion.from
  : type = action.type;

  const { promotion, selected, pieceList, notation } = draft;
  if(!fromPromote && promotion.isPromotion) { // ([type='MOVE'] || [type='CAPTURE']) && [isPromotion=true] 不换回合
    notation.FEN.push(generateFENFromState(current(draft)));
    notation.curIdx+= 1; // push就+=1 升变的修改不变 保证正确记录长度 便于统一处理
    return;
  };

  const sel = pieceList[selected];
  switch(type) {
    case 'MOVE': {
      (sel.type==='Pawn' || fromPromote) // 移动是升变前发生的 halfMove清空
        ? (draft.halfMove=0): draft.halfMove+=1;
      break;
    }
    case 'CASTLING': {
      draft.halfMove+=1;
      break;
    }
    case 'CAPTURE': {
      draft.halfMove=0;
      break;
    }
    case 'ENPASSANT': {
      draft.halfMove=0;
      break;
    }
  }
  sel.camp==='black' && (draft.fullMove+=1);

  fromPromote? (()=> {
    draft.curTar = [];
    notation.LAN[notation.LAN.length-1]+= pieceFn2AnMap[action.promoteTo];
    draft.promotion.isPromotion&&= false;
    notation.FEN[notation.FEN.length-1] = generateFENFromState(current(draft));
  })()
  : (()=> {
    notation.FEN.push(generateFENFromState(current(draft)));
    notation.curIdx+= 1;
  })();


  dspcNextRound(draft);
}
// const discard = (draft: WritableDraft<State>)=> {
//   draft.discardList
// }

const useGameStore = create(immer(combine(
  {
    pieceList: pieceMap, // only update without changing the order
    gridList: gridListInit,
    discardIdx: {
      white: 0,
      black: 0,
    },
    curTar: [] as tar[],
    selected: '', // piece.key
    turn: 'white',
    enPassant: { round: 0, coordinate: undefined },
    checkMate: undefined,
    delKey: '',
    halfMove: 0, 
    fullMove: 1,

    promotion: { isPromotion: false, coor: undefined, from: undefined},

    notation: {
      FEN: [INITBoard],
      LAN: [''],
      curIdx: 0,
    }
  } as State,
  (set)=> ({
    dispatch: (action: ActionType)=> {      
      set(draft=> {
        
        const { pieceList, gridList, notation, promotion } = draft;
        switch(action.type) {
          case 'SELECTED': {
            draft.selected = action.selected;
            const sel = pieceList[draft.selected];
            draft.curTar = getTarGrids(sel, gridList,
              sel.type==='Pawn'? draft.enPassant.coordinate: undefined
            );
            
            break;
          }
          case 'DESELECTED': {
            draft.curTar = [];
            draft.selected = '';
            break;
          }
          case 'MOVE': {
            promotion.isPromotion = action.promotion?.isPromotion ?? false;
            promotion.from = action.promotion?.from;
            const sel = move(draft, action);
            draft.promotion.isPromotion && (promotion.coor = sel.coordinate);

            sel.isFirstMove && (()=> {
              sel.isFirstMove&&= false;

              // 吃过路兵目标格判定
              sel.type==='Pawn' && (()=> {
                const n = sel.coordinate.split('')[1] as row;
                (parseInt(n)*5).toString()[0]==='2' && (()=> {
                  const dfy = sel.camp==='white'? 1: -1;

                  for(const [dx,dy] of [
                    [-1,0],
                    [1,0]
                  ]) {
                    const p = getPiece(getTarCoor(sel.coordinate, [dx, dy]), gridList);
                    (p?.camp!==sel.camp && p?.type==='Pawn') 
                      && (draft.enPassant.coordinate = getTarCoor(sel.coordinate, [0, dfy]));
                  }

                  draft.enPassant.coordinate && (draft.enPassant.round = 2); // 回合结束会立即减一 2存在时间很短
                })();
              })();
            })();

            nextRound(draft, action);
            break;
          }
          case 'CASTLING': {
            const sel = move(draft, action);
            sel.isFirstMove&&= false;
            const [colC, rowC] = action.to.split('') as [col, row];

            let colT = '' as col;
            let colR = '' as col;
            colC === 'c' 
            && (()=> {
              colT='d';
              colR='a';
              notation.LAN.push('O-O-O');
            })();
            colC === 'g' 
            && (()=> {
              colT='f';
              colR='h';
              notation.LAN.push('O-O');
            })();

            (colT&&colR) && (()=> {
              const Rook = getPiece(`${colR}${rowC}` as coor, gridList);
              Rook?.key && (()=> {
                draft.selected = Rook.key;
                const sel = move(draft, { type: 'MOVE', to: `${colT}${rowC}` as coor });
                sel.isFirstMove&&= false;
              })();
            })();

            nextRound(draft, action)
            break;
          }
          case 'CAPTURE': {
            draft.promotion.isPromotion = action.promotion?.isPromotion ?? false;
            promotion.from = action.promotion?.from;

            const sel = move(draft, action);
            draft.promotion.isPromotion && (promotion.coor = sel.coordinate);

            const dcP = pieceList[action.selected];
            dcP.discardIdx = draft.discardIdx[dcP.camp]; // 动画播放需要
            draft.discardIdx[dcP.camp]+=1;
            // draft.delKey = action.selected; // 延时删除 保证动画放完

            nextRound(draft, action);
            break;
          }
          case 'PROMOTE': {
            const sel = pieceList[draft.selected]; // sel并不能随便用 move返回的sel是已经交给gridList了的
            sel.type = sel.type.replace(sel.type, action.promoteTo) as type;
            gridList[sel.coordinate] = sel; 
            
            nextRound(draft, action);

            break;
          }
          case 'ENPASSANT': {
            const sel = move(draft, action);
            
            const [x, y] = getXY(sel.coordinate);
            const dyf = sel.camp==='white'? 1: -1;
            const enTarCoor = getCoor([x, y+dyf]);

            const delKey = findPieceListKey(pieceList, enTarCoor);

            const dcP = pieceList[delKey];
            dcP.discardIdx = draft.discardIdx[dcP.camp]; // 动画播放需要
            draft.discardIdx[dcP.camp]+=1;
            // draft.delKey = action.selected; // 延时删除 保证动画放完

            gridList[enTarCoor] = gridsInit(enTarCoor);

            nextRound(draft, action);
            break;
          }
          case 'LOAD': {
            generateStateFromFEN(action.FEN as FENBoard, draft);
            break;
          }
        }
        // console.log(current(draft).isPromotion);
        console.log(current(draft).notation);
      })

      return 1;
    },
  })
)));

export default useGameStore;