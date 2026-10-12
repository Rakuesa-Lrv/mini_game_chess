import type { coor, col } from "./dataStruct";

type endRow = '1' | '8';
type staRow = '2' | '7';

type staCoor = `${col}${staRow}`
type endCoor = `${col}${endRow}`

const abbrPieceN = ['R','N','B','Q','K',''] as const;

export type abbrPiece = typeof abbrPieceN[number];

export type castling = 'O-O' | 'O-O-O';

export type promote = 'Q' | 'R' | 'B' | 'N';

export type move = `${abbrPiece}${coor}-${coor}`;
export type capture = `${abbrPiece}${coor}x${coor}`;

export type isCapture = 'x' | '-';
export type promotion = `${staCoor}${isCapture}${endCoor}${promote}`;

export type LANStep = castling | move | capture | promotion;