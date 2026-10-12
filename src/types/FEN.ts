import { type WritableDraft } from 'immer';

import type { State } from '@/hooks/stores/useGameStore';
import type { grids, piece } from '@/types/dataStruct';
import { colN, rowN, getTarCoor, getPiece } from './dataStruct';
import type { coor, col, row, camp, type, tar, enPassant} from './dataStruct'
import { gridsInit } from './dataStruct'

export const notationN = ['SAN','LAN','UCI','PGN','FEN','EPD','ICCF','Smith'] as const;
export type notation = typeof notationN[number];

export const bN = ['r','n' ,'b' ,'q' ,'k' ,'p'] as const;

type bP = typeof bN[number];

type wP = Uppercase<bP>;

type rowP = bP | wP | row;

type rowPs = string;

const rowPsRe = /^[rnbqkpRNBQKP12345678]{1,8}$/;
const rowPsCf = (test: string)=> (
  rowPsRe.test(test) && (()=> {
    let count = 0;
    for(const c of test) {
      const n = parseInt(c);
      n? (count+=n): (count+=1)
    }
    return count === 8;
  })()
);
const getPfromCoor = (ps: string, coor: coor|undefined)=> (
  coor && (()=> {
    const [col, row] = coor.split('') as [col, row];
    const r = ps.split('/')[rowN.indexOf(row)];
    return (rowPsRe.test(r) && (()=> {
      let count = 0;
      for(const c of r) {
        if(count===colN.indexOf(col)) return c as rowP;
        const n = parseInt(c);
        n? (count+=n): (count+=1)
      }
    })())
  })()
);
const isKatE = (test: string)=> (
  rowPsRe.test(test) && (()=> {
    let count = 0;
    for(const c of test) {
      if(c.toLowerCase()==='k') break;
      const n = parseInt(c);
      n? (count+=n): (count+=1)
    }
    return count === 4;
  })()
);

type ps = `${rowPs}/${rowPs}/${rowPs}/${rowPs}/${rowPs}/${rowPs}/${rowPs}/${rowPs}`;

const turnN = ['w', 'b'] as const;
type turn = typeof turnN[number];

const castlN = ['K', 'Q', 'k', 'q'] as const;
type castl = typeof castlN[number];
type castlingChance =
| '-'
| 'K' | 'Q' | 'k' | 'q'
| 'KQ' | 'Kk' | 'Kq' | 'Qk' | 'Qq' | 'kq'
| 'KQk' | 'KQq' | 'Kkq' | 'Qkq'
| 'KQkq'
;
const castlRegExp = /^(?!$)(-|K?Q?k?q?)$/;
type forCastlMap = {
  colIdx: number,
  rowIdx: number,
  rowP: rowP,
}
const castlMap = {
  K: {
    colIdx: -1,
    rowIdx: -1,
    rowP: 'R',
  },
  Q: {
    colIdx: 0,
    rowIdx: -1,
    rowP: 'R',
  },
  k: {
    colIdx: -1,
    rowIdx: 0,
    rowP: 'r',
  },
  q: {
    colIdx: 0,
    rowIdx: 0,
    rowP: 'r',
  },
} as Record<castl, forCastlMap>

type ePTar = coor | '-';
type forEPTarMap = {
  dy: number,
  rowP: rowP,
  turn: turn,
}
const ePTarMap = {
  '6': {
    dy: 1,
    rowP: 'p',
    turn: 'w',
  },
  '3': {
    dy: -1,
    rowP: 'P',
    turn: 'b',
  },
} as Record<row, forEPTarMap | undefined>

const num = /^[0-9]*$/;
type halfMove = number;
type fullMove = number;

export type FENBoard = `${ps} ${turn} ${castlingChance} ${ePTar} ${halfMove} ${fullMove}`;

export const INITBoard: FENBoard = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`;

type Err = { 
  type: string,
  msg: string[],
};
const fieldNameN = ['root', 'ps', 'turn', 'castlCac', 'ePTar', 'halfMove', 'fullMove'] as const;
type fieldName = typeof fieldNameN[number];

type errors = Record<fieldName, Err>;

export const isFENValid = (fen: string)=> {
  const errors: errors = {} as errors;
  ;(()=> {
    fieldNameN.forEach(field=> {
      errors[field] = {
        type: '',
        msg: [],
      }
    })
  })();
  
  const piece = fen.split(' ');

  if(piece.length!==6) {
    errors.root.type = 'syntax';
    errors.root.msg.push('字段数量应为6');
  }else {
    const [
      ps, 
      turn, 
      castlCac, 
      ePTar, 
      halfMove, 
      fullMove,
    ] = piece;

    ;(()=> {
      errors.ps.type = 'layout';
      errors.turn.type = 'turn';
      errors.castlCac.type = 'castling';
      errors.ePTar.type = 'enPassant';
      errors.halfMove.type = 'halfMove';
      errors.fullMove.type = 'fullMove';
    })();

    const psSlice = ps.split('/');
    /**
     * false: 棋盘行数无误
     * 
     * number: 棋盘行数有误
     */
    let rowsErr
      = psSlice.length<8 && (errors.ps.msg.push(`棋盘行数不足`))
      || psSlice.length>8 && (errors.ps.msg.push(`棋盘行数过多`));
    ;

    psSlice.forEach((row, idx)=> {
      (idx===0 && row.includes('p') || idx===7 && row.includes('P')) 
        && ((errors.ps.msg.push(`${rowN[idx]}处的兵不应位于同色阵地的最内行`)));
      rowPsCf(row) || (errors.ps.msg.push('棋盘布局不合法'));
    })

    turnN.includes(turn as turn) || ((errors.turn.msg.push(`回合字段${turn}应为'w'或'b'`)));

    castlRegExp.test(castlCac) || ((errors.castlCac.msg.push('易位权非法')));

    castlCac==='-' || (()=> {
      const castList = {
        K: 0,
        Q: 0,
        k: 0,
        q: 0,
      } as Record<typeof castlN[number], number>
      const castL = castlCac.split('');
      const total = castL.length;
      let sum = 0;
      castL.forEach(castl => {
        const cas = castl as castl;
        const {colIdx, rowIdx, rowP} = castlMap[cas];

        rowsErr || (
          (psSlice.at(rowIdx)?.toString().toLowerCase().includes('k') 
          && 
          isKatE(psSlice.at(rowIdx) ?? ''))
          ? (psSlice.at(rowIdx)?.at(colIdx) === rowP
          || (errors.castlCac.msg.push(`${cas}易位权不存在: 无可易位车`)))
          : (errors.castlCac.msg.push(`${cas}易位权不存在: 无可易位王`))
        );

        castlN.includes(cas) && (castList[cas]+=1);
      });
      for(const [key, casN] of Object.entries(castList)) {
        casN <= 1
        ? sum+=casN
        : ((errors.castlCac.msg.push(`${key}有重复易位权`)));
      }
      sum===total || ((errors.castlCac.msg.push('有非法字符')));
    })();

    (ePTar!== '-' ) && (()=> {
      const [col, row] = ePTar.split('') as [col, row];
      const em = ePTarMap[row]; // em===undefined => 吃过路兵目标格不为6|3
      em && (()=> {
        ((colN.includes(col) && ePTarMap[row]) // col合法 且
          ? (()=> {
            em.turn===turn || (errors.ePTar.msg.push(`无法在${turn}回合内产生${ePTar}的过路兵目标格子`));
            
            (getPfromCoor(ps, getTarCoor(ePTar as coor, [0, em.dy]))===em.rowP) || (errors.ePTar.msg.push(`${ePTar}处无法吃过路兵`));

          })()
          : ((errors.ePTar.msg.push('吃过路兵非合法坐标')))
        );
      })();
    })();

    num.test(halfMove) || ((errors.halfMove.msg.push('半回合数应为整数')));
    num.test(fullMove) || ((errors.fullMove.msg.push('全回合数应为整数')));
  }

  for(const value of Object.values(errors)) {
    if(value.msg.length!==0) return { isValid: false, errors: errors};
  }

  return { isValid: true, errors: errors};
}

const lowerCase = /^[rnbqkp]$/;
const FENP2StP = (p: rowP)=> {
  if(parseInt(p)) return;
  const isLow = lowerCase.test(p);
  const camp: camp = isLow? 'black': 'white';
  const lp = p.toLowerCase() as bP;
  let type: type;
  switch(lp) {
    case 'r':
      type= 'Rook';
      break;
    case 'n':
      type= 'Knight';
      break;
    case 'b':
      type= 'Bishop'
      break;
    case 'q':
      type= 'Queen';
      break;
    case 'k':
      type= 'King';
      break;
    case 'p':
      type= 'Pawn';
      break;
  }

  return { camp, type };
}

const castl2Coor = (p: castl): coor=> {
  switch(p) {
    case 'K':
      return 'h1'
    case 'Q':
      return 'a1'
    case 'k':
      return 'h8'
    case 'q':
      return 'a8'
  }
}

export type FENkey = `im_f_FEN_s_${col}${row}`;

export const generateStateFromFEN = (fen: FENBoard, draft: WritableDraft<State>)=> {
  const [
    ps, 
    turn, 
    castlCas, 
    ePTar, 
    halfMove, 
    fullMove,
  ] = fen.split(' ') as [ps, turn, castlingChance, ePTar, `${halfMove}`, `${fullMove}`];

  const pieceList: piece[] = [];
  const pieceMap = {} as Record<piece['key'], piece>;
  const gridList = {} as grids;

  ps.split('/').forEach((row, idx)=> {
    if(!rowPsCf(row)) throw TypeError;

    const rC = rowN[idx] as row;
    let cIdx = 0;
    for(const p of row) { 
      const c = parseInt(p);
      if(c) { // number
        cIdx+= c;
      }else { // NaN
        const pieceCT = FENP2StP(p as rowP);
        const cC = colN[cIdx] as col;
        pieceCT && 
        (pieceList.push({
          ...pieceCT,
          key: `im_f_FEN_s_${cC}${rC}` as FENkey,
          coordinate: `${cC}${rC}`,
          isAlive: true,
        }))
        cIdx+= 1;
      }
    }

    pieceList.forEach(item=> {
      pieceMap[item.key] = item;
    });

    for(const p of 'KQkq') {
      castlCas.includes(p) // 有说明 车存活 且 车和王 isFM(处于init位置)
      && (()=> {
        const [c, r] = castl2Coor(p as castl).split('');
        const rook = pieceMap[`im_f_FEN_s_${c}${r}`]
        rook?.type === 'Rook' && (rook.isFirstMove= true);
        const king = pieceMap[`im_f_FEN_s_e${r}`];
        king?.type === 'King' && (king.isFirstMove= true);
      })();
    }

    for(const r of [7,2]) {
      for(const c of colN) {
        const p = pieceMap[`im_f_FEN_s_${c}${r}`];
        p?.type === 'Pawn' && (p.isFirstMove= true);
      }
    }

    ;(()=> {
      for(let col of colN) {
        for(let row of rowN) {
          const coor = `${col}${row}` as coor;
          gridList[coor] = 
            pieceList.find(item=> (
              item.coordinate === coor
            ))
            || gridsInit(coor);
        }
      }
    })();
  });

  let camp: camp;
  switch(turn) {
    case 'w':
      camp = 'white';
      break;
    case 'b':
      camp = 'black';
  }

  const enP = {} as enPassant;
  if(ePTar==='-') {
    enP.coordinate = undefined;
    enP.round = 0;
  }else {
    enP.coordinate = (ePTar as coor);
    enP.round = 1; // 有ePTar说明已经走完了首次2格 直接到了对手回合 round: 1即可
  }

  draft.pieceList = pieceMap;
  
  draft.gridList = gridList;
  draft.curTar = [] as tar[];
  draft.selected = '';
  draft.turn = camp;
  draft.enPassant = enP;
  draft.checkMate = undefined;
  draft.delKey = '';

  draft.halfMove = parseInt(halfMove);
  draft.fullMove = parseInt(fullMove);
};

export const pieceFn2AnMap = {
  Rook: 'R',
  Knight: 'N',
  Bishop: 'B',
  Queen: 'Q',
  King: 'K',
  Pawn: 'P',
} as Record<type, rowP>

export const generateFENFromState = (state: State)=> {
  let ps = '';
  let turn = '';
  let castlCac = '';
  let ePTar = '';
  let halfMove = '';
  let fullMove = '';

  const gridList = state.gridList;

  const pL = [];

  for(const row of rowN) {
    let p = ''
    let count = 0;
    for(const col of colN) {
      const coor = `${col}${row}` as coor;
      const piece = gridList[coor];
      
      (piece.type && piece.camp) 
      ? (()=> {
        count && (p+= `${count}`)
        count=0;
        const pt = pieceFn2AnMap[piece.type]
        p += piece.camp==='white' ? pt: pt.toLowerCase();
      })()
      : (count+=1);
    }
    count && (p+= `${count}`)
    pL.push(p);
  };
  ps = pL.join('/');


  turn = state.turn[0];

  ;(()=> {
    const whiteKing = getPiece('e1', gridList);
    const blackKing = getPiece('e8', gridList);

    for(const [king, camp, shortCoor, shortCas, longCoor, longCas,] of [
      [whiteKing, 'white', 'h1', 'K', 'a1', 'Q'] as const,
      [blackKing, 'black', 'h8', 'k', 'a8', 'q'] as const,
    ]) {
      (king?.camp===camp && king.type==='King' && king.isFirstMove) 
      &&(()=> {
        for(const [coor, cas] of [
          [shortCoor, shortCas] as const,
          [longCoor, longCas] as const,
        ]) {
          const rook = getPiece(coor, gridList);
          (rook?.camp===camp && rook.type==='Rook' && rook.isFirstMove)
          && (castlCac+= cas);
        };
      })();
    }
    castlCac || (castlCac='-');
  })();

  ePTar = state.enPassant.coordinate ?? '-';
  halfMove = `${state.halfMove}`;
  fullMove = `${state.fullMove}`;

  const fen = `${ps} ${turn} ${castlCac} ${ePTar} ${halfMove} ${fullMove}`;
  return fen;
}