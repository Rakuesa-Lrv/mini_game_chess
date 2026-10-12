import { type WritableDraft } from 'immer';
import type { State } from '@/hooks/stores/useGameStore';

export { p2IMap, type pieceName } from '@/utils/p2IMap';
import type { FENkey } from './FEN';

const typeN = ['King', 'Queen', 'Rook', 'Bishop', 'Knight', 'Pawn'] as const;
export type type = typeof typeN[number];
const campN = ['white', 'black'] as const;
export type camp = typeof campN[number];


export const colN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export type col = typeof colN[number];
export const rowN = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;
export type row = typeof rowN[number];

export type coor = `${col}${row}`;

export type g = coor | col | row;

// type castCol = col & ('c' | 'g');

export const gArr: g[][] = 
  new Array<g[]>(8).fill(
    null as any as g[]
  ).map(()=> new Array<g>(8).fill('' as g));
;(()=> {
  for(let i=0; i<rowN.length; i++) {
    for(let j=0; j<colN.length; j++) {
      gArr[i][j] = `${colN[j]}${rowN[i]}`;
    }
  }
})();

export type BdiKey = `o_${coor}`;

export interface piece {
  camp: camp,
  type: type,
  key: BdiKey | FENkey | string,

  coordinate: coor,

  isFirstMove?: boolean | undefined, // for Pawn, king and knight

  isAlive: boolean,
}
type spPiece = Pick<piece, 'coordinate'> & Partial< Omit<piece, 'coordinate'> >;

const piecesTemp: (Omit<piece, 'key' | 'isAlive'> & Partial< Pick<piece, 'key'| 'isAlive'> >)[] = [];
;(()=> {
  const ori_order: type[] = ['Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Bishop', 'Knight', 'Rook'] as const;
  ori_order.forEach((piece,idx)=> {
    piecesTemp.push({
      camp: `black`,
      type: piece,
      coordinate: `${colN[idx]}8`
    })
  })

  for(let col of colN) {
    piecesTemp.push({
      camp: 'black',
      type: 'Pawn',
      coordinate: `${col}7`,
    })
  }
  for(let col of colN) {
    piecesTemp.push({
      camp: 'white',
      type: 'Pawn',
      coordinate: `${col}2`,
    })
  }

  ori_order.forEach((piece,idx)=> {
    piecesTemp.push({
      camp: `white`,
      type: piece,
      coordinate: `${colN[idx]}1`
    })
  })

  for(let piece of piecesTemp) {
    piece.key = `o_${piece.coordinate}` as BdiKey;
    (piece.type==='Pawn' || piece.type==='King' || piece.type==='Rook')
    ? (piece.isFirstMove = true)
    : (piece.isFirstMove = undefined);
    piece.isAlive = true;
  }
})();
const pieceList = piecesTemp as piece[];
export const pieceMap = {} as Record<piece['key'], piece>;
;(()=>{ pieceList.forEach(item=> (pieceMap[item.key] = item)) })();

/**
 * gridList: Record<coor, 
 *   | { camp: camp, type: type, key: pieceKey, coordinate: coor, isFirstMove?: boolean }
 *   | { coordinate: coor }
 * >
 */
export type grids = Record<coor, piece | spPiece>;
export const gridListInit = {} as grids;
export const gridsInit = (coor: coor)=> ({coordinate: coor} as piece);
;(()=> {
  for(let col of colN) {
    for(let row of rowN) {
      const coor = `${col}${row}` as coor;
      gridListInit[coor] = 
        pieceList.find(item=> (
          item.coordinate === coor
        ))
        || gridsInit(coor);
    }
  }
})();

export const getXY = (coordinate: coor)=> {
  const [xCol, yRow] = coordinate.split('') as [col, row];
  const x = colN.indexOf(xCol);
  const y = rowN.indexOf(yRow);
  return [x, y];
}
export const getCoor = ([x, y]: [number, number])=> (`${colN[x]}${rowN[y]}` as coor);

const isEmpty = (coordinate: coor, gridList: WritableDraft<grids>)=> (!gridList[coordinate]?.key);
export const getPiece = (coordinate: coor|undefined, gridList: WritableDraft<grids>)=> (coordinate && gridList[coordinate]);

export const getTarCoor = (coordinate: coor, [dx, dy]: [number, number]): coor | undefined => {
  const [x, y] = getXY(coordinate);
  const xCol: col | undefined = colN[x+dx];
  const yRow: row | undefined = rowN[y+dy];
  if(xCol && yRow) {
    return `${xCol}${yRow}` as coor;
  }
  return undefined;
}

export const findPieceListKey = (pieceList: WritableDraft<State['pieceList']>, coor: coor)=> {
  for(const [key, item] of Object.entries(pieceList)) {
    if(item.coordinate === coor) return key;
  }
  return '';
}

export type moveType = 
| 'self'
| 'allowed'
| 'forbidden'
| 'capture'
| 'enPassant'
| 'castling'
| 'promotion'
| 'NfP'
;
export type tar = { coordinate: coor, type: moveType, isPromotion?: boolean }

const addTar = (tar: tar[], coor: coor, camp: camp, [dx, dy]: [number, number], gridList: WritableDraft<grids>)=> {
  const tarCoor = getTarCoor(coor, [dx, dy]);

  return (tarCoor && (()=> {

    tar.push({
      coordinate: tarCoor, 
      type: 
        isEmpty(tarCoor, gridList)
        ? 'allowed'
        : (getPiece(tarCoor, gridList)?.camp === camp
          ? 'forbidden'
          : 'capture'),
    });
    return isEmpty(tarCoor, gridList);
  })());
}
const addTarPawn = (tar: tar[], coor: coor, camp: camp, [dx, dy]: [number, number], gridList: WritableDraft<grids>,
  option: { option: 'MOVE' | 'CAPTURE' | 'ENPASSANT' }
)=> {

  // type === 'Pawn'
  // 移动范围内的不能吃 直走绝对不触发CAPTURE
  // 斜向有敌方棋子 || 左右方有过路 => 可斜向吃

  const tarCoor = getTarCoor(coor, [dx, dy]);

  return (tarCoor && (()=> {
    const [_, row] = tarCoor.split('') as [col, row];
    const isPmt = row==='8' && camp==='white'
    || row==='1' && camp==='black';
    tar.push({
      coordinate: tarCoor, 
      type: (()=> {
        switch(option.option) {
          case 'MOVE': {
            return (
              isEmpty(tarCoor, gridList)
              ? 'allowed'
              : 'forbidden'
            )
          }
          case 'CAPTURE': {
            return (
              isEmpty(tarCoor, gridList)
              ? 'NfP'
              : (getPiece(tarCoor, gridList)?.camp === camp
                ? 'NfP'
                : 'capture')
            )
          }
          case 'ENPASSANT': {
            return (
              'enPassant'
            )
          }
        }
      })(),
      isPromotion: isPmt,
    });
    return isEmpty(tarCoor, gridList);
  })());
}

export type jumpAr = [number, number][];
export type slideAr = [number,number,number][];
export type pawnAr = { white: jumpAr, black: jumpAr }
export type attckRange = 
| jumpAr
| slideAr
| pawnAr
;
const p2AMap = (type: piece['type']): attckRange => {
  switch(type) {
    case 'King': {
      return [
        [-1,-1],
        [0,-1],
        [1,-1],
        [-1,0],
        [1,0],
        [-1,1],
        [0,1],
        [1,1],
      ]
    }
    case 'Queen': {
      return [
        [-1,-1, 7],
        [0,-1, 7],
        [1,-1, 7],
        [-1,0, 7],
        [1,0, 7],
        [-1,1, 7],
        [0,1, 7],
        [1,1, 7],
      ]
    }
    case 'Rook': {
      return [
        [0,-1, 7],
        [1, 0, 7],
        [0, 1, 7],
        [-1, 0, 7],
      ]
    }
    case 'Bishop': {
      return [
        [-1,-1, 7],
        [1,-1, 7],
        [1,1, 7],
        [-1,1, 7],
      ]
    }
    case 'Knight': {
      return [
        [-2,-1],
        [-1,-2],
        [1,-2],
        [2,-1],
        [2,1],
        [1,2],
        [-1,2],
        [-2,1],
      ]
    }
    case 'Pawn': {
      return {
        white: [
          [-1,-1],
          [1,-1],
        ],
        black: [
          [-1,1],
          [1,1],
        ]
      }
    }
  }
}

const addTarList = (piece: piece, tar: tar[], gridList: WritableDraft<grids>)=> {
  const { type, camp, coordinate: coor } = piece;
  type!=='Pawn' && (()=> {
    const a = p2AMap(type) as Exclude<attckRange, pawnAr>;
    for(const [x, y] of a) {
      for(let f = 1; f <= (a[0][2] ?? 1); f++) {
        if(!addTar( tar, coor, camp, [x*f,y*f], gridList )) break;
        
      }
    }
  })();
}

/**
 * true: 危险 送将 
 * 
 * false: 安全 王可经过
 */
const checkDgr = (camp: camp, oriCoor: coor, kCoor:coor, gridList: WritableDraft<grids>)=> {
  /*
    oriCoor 为王的下一个可能的位置 
    则 一个王!forbidden坐标测一次 一次测所有兵种

    oriCoor 为王 则 判定是否被将

    oriCoor 为王车易位目标格 检测是否可易位
  */
  for(const type of typeN) {
    let a: Exclude<attckRange, pawnAr>;
    type==='Pawn'
    ? (a = (p2AMap(type) as pawnAr)[camp])
    : (a = p2AMap(type) as Exclude<attckRange, pawnAr>);
    for(const [x, y] of a) {
      for(let f = 1; f <= (a[0][2] ?? 1); f++) {
        const tar = getTarCoor(oriCoor, [x*f, y*f]); // 要判定是否是危险位的格子
        if(tar && tar !== kCoor) {
          if(!isEmpty(tar, gridList)) {
            const sel = getPiece(tar, gridList);
            if(sel?.camp!==camp && sel?.type === type) return true; // 定性危险位

            break; // 查到第一个非空 非危险位 但形成阻挡 此方向无危险位 跳到同兵种下一方向 | 新兵种
          }
        }
      }
    }
  }

  return false;
}

export const getTarGrids = (piece: piece|undefined, gridList: WritableDraft<grids>, enPassantCoor?: enPassant['coordinate'])=> {
  if(!piece) return [];

  const { type, camp, coordinate: coor, isFirstMove } = piece;
  const tar: tar[] = [{
    coordinate: coor,
    type: 'self',
  }];

  addTarList(piece, tar, gridList);

  switch(type) {
    case 'King': {
      const coorK = coor;
      const castLR = [false,false];
      const B = isEmpty(getTarCoor(coorK,[-3,0])!, gridList);
      for(const t of tar.slice(1)) {
        
        if(t.type !== 'forbidden') {
          const ori = t.coordinate;
          if(checkDgr(camp, ori, coorK, gridList)) {
            t.type = 'forbidden';
            continue;
          };
          // !forbidden
          const [cC, rC] = t.coordinate.split('') as [col, row];
          parseInt(rC)%7===1 && (()=> {
            castLR[0] ||= 
              cC === 'd' && B; // B isEpt
            castLR[1] ||= cC === 'f';
          })();
        }
      }

      // 王车易位
      isFirstMove && (()=> {
        const rooks: [coor, coor] = camp==='white'? ['a1','h1']: ['a8','h8'];        
        for(const i of [0,1]) { // 0(1) => (Right)
          const dir = i? 1: -1;
          castLR[i] // D(F) safe
          && getPiece(rooks[i], gridList)?.isFirstMove // A(H) isFM
          && (()=> { 
            const Ct = getTarCoor(coorK,[2*dir,0])!;
            isEmpty(Ct, gridList) && (()=> { // C(G) isEpt
              checkDgr(camp, Ct, coorK, gridList) || (()=> { // C(G) safe
                tar.push({ coordinate: Ct, type: 'castling' });
              })();
            })();
          })();
        }
      })();

      break;
    }
    case 'Pawn': {
      const dyF = camp==='white'? -1: 1;
      const isEmpty = addTarPawn(tar, coor, camp, [0, 1*dyF], gridList, { option: 'MOVE' });
      isEmpty && isFirstMove && addTarPawn(tar, coor, camp, [0, 2*dyF], gridList, { option: 'MOVE' });

      const attRng = ( p2AMap('Pawn') as pawnAr )[camp];
      for(const a of attRng) {
        const cr = getTarCoor(coor, a);
        enPassantCoor === cr
        ? addTarPawn(tar, coor, camp, a, gridList, { option: 'ENPASSANT' })
        : addTarPawn(tar, coor, camp, a, gridList, { option: 'CAPTURE' });
      }

      break;
    }
    default: {
      break;
    }
  }

  return tar;
}

export interface enPassant {
  round: 0 | 1 | 2,
  coordinate: coor|undefined,
}