import type { camp, type } from '@/types/dataStruct';


import blackBishop from '@/assets/chessPiece/blackBishop.svg';
import blackKing from '@/assets/chessPiece/blackKing.svg';
import blackKnight from '@/assets/chessPiece/blackKnight.svg';
import blackPawn from '@/assets/chessPiece/blackPawn.svg';
import blackQueen from '@/assets/chessPiece/blackQueen.svg';
import blackRook from '@/assets/chessPiece/blackRook.svg';

import whiteBishop from '@/assets/chessPiece/whiteBishop.svg';
import whiteKing from '@/assets/chessPiece/whiteKing.svg';
import whiteKnight from '@/assets/chessPiece/whiteKnight.svg';
import whitePawn from '@/assets/chessPiece/whitePawn.svg';
import whiteQueen from '@/assets/chessPiece/whiteQueen.svg';
import whiteRook from '@/assets/chessPiece/whiteRook.svg';

export type pieceName = `${camp}${type}` | '';

export const p2IMap = (piece?: pieceName)=> {
  switch(piece) {
    case 'whiteKing':
      return whiteKing;
    case 'whiteQueen':
      return whiteQueen;
    case 'whiteRook':
      return whiteRook;
    case 'whiteBishop':
      return whiteBishop;
    case 'whiteKnight':
      return whiteKnight;
    case 'whitePawn':
      return whitePawn;

    case 'blackKing':
      return blackKing;
    case 'blackQueen':
      return blackQueen;
    case 'blackRook':
      return blackRook;
    case 'blackBishop':
      return blackBishop;
    case 'blackKnight':
      return blackKnight;
    case 'blackPawn':
      return blackPawn;
    default:
      return '';
  }
}