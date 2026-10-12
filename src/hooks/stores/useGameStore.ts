import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { combine } from 'zustand/middleware';
import { current, type WritableDraft } from 'immer';

import type { piece, grids, tar, camp, enPassant, coor, row, col, type } from '@/types/dataStruct';
import { gridsInit, getXY, getCoor, getTarGrids, getPiece, getTarCoor, findPieceListKey } from '@/types/dataStruct';
import { pieceMap, gridListInit  } from '@/types/dataStruct';
import { type FENBoard, generateFENFromState, generateStateFromFEN } from '@/types/FEN';
import { pieceFn2AnMap, INITBoard } from '@/types/FEN';
import { abbrPiece, LANStep } from '@/types/LAN';

export * from '@/types/dataStruct';

export interface State {
  pieceList: Record<piece['key'], piece>,
  gridList: grids,

  curTar: tar[];

  selected: piece['key'] | '',
  // 会导致映射里['']===undefined 以后可以用来存储元信息

  turn: camp,

  enPassant: enPassant,

  checkMate: camp | undefined,

  delKey: piece['key'] | '',

  halfMove: number,
  fullMove: number,

  isPromotion: boolean, // 妥协

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

| { type: 'MOVE', to: coor, isPromotion?: boolean}
| { type: 'CASTLING', to: coor }

| { type: 'CAPTURE', to: coor, selected: piece['key'], isPromotion?: boolean }
| { type: 'PROMOTE', promoteTo: type, from: 'MOVE'|'CAPTURE' }
| { type: 'ENPASSANT', to: coor }

| { type: 'LOAD', FEN: string | FENBoard }
| { type: 'SAVE' }
;
const dspcMove = (draft: WritableDraft<State>, action: Extract<ActionType, { to: coor, isPromotion?: boolean }>)=> {
  const { pieceList, gridList } = draft;
  const sel = pieceList[draft.selected]; // selected piece

  gridList[sel.coordinate] = gridsInit(sel.coordinate); // remove piece before move

  sel.coordinate = action.to; // move

  draft.curTar = [];

  ((action.type==='CAPTURE' || action.type==='MOVE' )
  && action.isPromotion)
  && draft.curTar.push({ coordinate: action.to, type: 'self' })

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
  draft.delKey!== '' && (delete draft.pieceList[draft.delKey]);
}
const nextRound = (draft: WritableDraft<State>, action: Extract<ActionType, { type: stepAction }>)=> {
  let type: ActionType['type'];

  const fromPromote = action.type==='PROMOTE';
  fromPromote
  ? type=action.from
  : type=action.type;

  const { isPromotion, selected, notation } = draft;

  if(!fromPromote && isPromotion) return;

  const { pieceList } = draft;
  const sel = pieceList[selected];
  switch(type) {
    case 'MOVE': {
      sel.type==='Pawn'? (draft.halfMove=0): draft.halfMove+=1;
      break;
    }
    case 'CASTLING': { // LAN.push 在dispatch switch中处理了
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
  notation.FEN.push(generateFENFromState(current(draft)));
  notation.curIdx+= 1;

  fromPromote && (()=> {
    draft.curTar = [];
    notation.LAN[notation.LAN.length-1]+= pieceFn2AnMap[action.promoteTo];
    draft.isPromotion&&= false;
  })();

  dspcNextRound(draft);
}

const useGameStore = create(immer(combine(
  {
    pieceList: pieceMap, // only update without changing the order
    gridList: gridListInit,
    curTar: [] as tar[],
    selected: '', // piece.key
    turn: 'white',
    enPassant: { round: 0, coordinate: undefined },
    checkMate: undefined,
    delKey: '',
    halfMove: 0, 
    fullMove: 1,

    isPromotion: false,

    notation: {
      FEN: [INITBoard],
      LAN: [''],
      curIdx: 0,
    }
  } as State,
  (set)=> ({
    dispatch: (action: ActionType)=> {      
      set(draft=> {
        console.log(current(draft).isPromotion);
        const { pieceList, gridList, notation } = draft;
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
            draft.isPromotion = action.isPromotion ?? false;

            const from = pieceList[draft.selected].coordinate;
            const sel = dspcMove(draft, action);
            const to = sel.coordinate;
            let piece = '' as abbrPiece;
            sel.type==='Pawn' || (piece = pieceFn2AnMap[sel.type] as abbrPiece);
            notation.LAN.push(`${piece}${from}-${to}`);
            // notation.LAN[notation.LAN.length-1]+= 'Q';

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
            draft.isPromotion = action.isPromotion ?? false;

            move(draft, action);

            pieceList[action.selected].isAlive = false; // 动画播放需要
            draft.delKey = action.selected; // 延时删除 保证动画放完

            nextRound(draft, action);
            break;
          }
          case 'PROMOTE': {
            const sel = pieceList[draft.selected];
            sel.type = action.promoteTo;
            nextRound(draft, action);
            

            break;
          }
          case 'ENPASSANT': {
            const sel = move(draft, action);
            
            const [x, y] = getXY(sel.coordinate);
            const dyf = sel.camp==='white'? 1: -1;
            const enTarCoor = getCoor([x, y+dyf]);

            const delKey = findPieceListKey(pieceList, enTarCoor);

            pieceList[delKey].isAlive = false; 
            draft.delKey = delKey; 

            gridList[enTarCoor] = gridsInit(enTarCoor);

            nextRound(draft, action);
            break;
          }
          case 'LOAD': {
            // 一会要改 idx重置
            generateStateFromFEN(action.FEN as FENBoard, draft);
            break;
          }
          // case 'SAVE': {
          //   const fen = generateFENFromState(current(draft));
          //   notation.FEN = fen;
          //   break;
          // }
        }
        console.log(current(draft).notation);
      })

      return 1;
    },
  })
)));

export default useGameStore;