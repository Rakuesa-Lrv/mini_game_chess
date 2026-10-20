import classes from './Chess.module.css';

import useGameStore, { colN, rowN, gArr, p2IMap, getXY, type coor, type pieceName, type } from './hooks/stores/useGameStore';
import useDspStore from './hooks/stores/useDspStore';
import { useStoreField } from './hooks/useStoreField';

import Menu from './components/Menu';
import Load from './components/Load';
import Save from './components/Save';

const getPos = (coordinate: coor)=> {
  const [x, y] = getXY(coordinate);
  return ({
    top: `calc(${y} * (var(--gridSize)))`,
    left: `calc(${x} * (var(--gridSize)))`,
  }) as React.CSSProperties
}

const Chess = ()=> {
  const { pieceList, curTar, selected, turn, halfMove, fullMove, notation, promotion: promote, dispatch } = useStoreField(useGameStore, [
    'pieceList', 'curTar', 'selected', 'turn', 'halfMove', 'fullMove', 'notation', 'promotion'
    ,'dispatch'
  ]);
  const { config, load, save, changeDisplay } = useStoreField(useDspStore, [
    'config', 'load', 'save', 'changeDisplay'
  ])

  return (
    <div
      className={classes.contain}
    >
      <div
        className={classes.board}
      >
        <div className={classes.colNameT}>
          {colN.map(item=> (<span key={`T_${item}`} >{item.toUpperCase()}</span>))}
        </div>
        <div className={classes.rowNameR}>
          {rowN.map(item=> (<span key={`R_${item}`} >{item}</span>))}
        </div>
        <div className={classes.colNameB}>
          {colN.map(item=> (<span key={`B_${item}`} >{item.toUpperCase()}</span>))}
        </div>
        <div className={classes.rowNameL}>
          {rowN.map(item=> (<span key={`L_${item}`} >{item}</span>))}
        </div>

        <div
          className={classes.grids}
        >
          {gArr.flatMap(item=> (
            item.map(coor=> (
              <div
                key={coor}
                className={classes.grid}
              >
              </div>
            ))
          ))}

          <div
            className={classes.pieces}
          >
            {Object.entries(pieceList).map(([key, item])=> {
              const isSelected = selected===key;
              const name = `${item.camp}${item.type}` as pieceName;

              const isCapture = curTar.findIndex(tar=> (
                tar.type === 'capture' 
                && tar.coordinate === item.coordinate
              ))>-1;
              const isPtm = curTar.findIndex(tar=> (
                tar.isPromotion
              ))>-1;

              return (
                <div
                  id={key}
                  key={key}
                  className={classes.piece}
                  data-selected={isSelected}
                  style={
                    item.discardIdx===-1? getPos(item.coordinate): {
                      top: `calc(${item.camp==='white'? '30%': '70%'}${Math.floor(item.discardIdx/8) ? '+ var(--gridSize) * .5': ''})`,
                      left: `calc(100% + var(--gridSize) * ${1.3 + item.discardIdx%8 *.5})`,
                      transform: `translateX(-50%) translateY(-50%)`
                    }
                  }
                  data-hidden={item.discardIdx}
                  data-selectable={item.discardIdx===-1 && !isPtm && (turn===item.camp || isCapture )}

                  onMouseDown={()=> {
                    item.discardIdx===-1 
                    && !isPtm && (()=> {
                      if(isCapture) {
                        dispatch({ type: 'CAPTURE', to: item.coordinate, selected: key, promotion: { isPromotion: isPtm, from: 'CAPTURE'} });
                        return;
                      }
                      if(turn!==item.camp) return;
                      if(isSelected) {
                        dispatch({ type: 'DESELECTED', selected: key });
                      }else {
                        dispatch({ type: 'SELECTED', selected: key });
                      }
                    })()
                  }}
                >
                  <img draggable='false' src={p2IMap(name)} alt={name} />
                </div>
              )
            })}

            {curTar?.map(item=> (
                item.type !== 'NfP' && 
                (<div
                  key={`t_${item.coordinate}`}
                  data-move={item.type}
                  style={getPos(item.coordinate)}
                  onMouseDown={()=> {
                    switch(item.type) {
                      case 'forbidden':
                        return;
                      case 'enPassant':
                        dispatch({ type: 'ENPASSANT', to: item.coordinate });
                        break;
                      case 'allowed':
                        dispatch({ type: 'MOVE', to: item.coordinate, promotion: { isPromotion: item.isPromotion ?? false, from: 'MOVE'} });
                        break;
                      case 'castling':
                        dispatch({ type: 'CASTLING', to: item.coordinate });
                        break;
                      default: 
                        return;
                    };
                  }}
                >
                </div>)
            ))}

          </div>

          {promote.isPromotion &&
          (<div
            className={classes.promotion}
            data-camp={turn}
            style={{
              left: promote.coor && getPos(promote.coor).left
            }}
          >
            {
              (['Queen', 'Rook', 'Bishop', 'Knight'] as type[]).map(p=> (
                <div
                  key={`promotion_${turn}${p}`}
                  className={classes.grid}
                >
                  <div
                    className={classes.piece}
                    onClick={()=> {
                      dispatch({ type: 'PROMOTE', promoteTo: p })
                    }}
                  >
                    <img draggable='false' src={p2IMap(`${turn}${p}`)} alt={`${turn}${p}`} />
                  </div>
                </div>
              ))
            }
            <div
              className={classes.arrow}
            >
            </div>
          </div>)
          }

        </div>
      </div>

      <div
        className={classes.info}
      >
        <div
          className={classes.turn}
        >
          <img draggable='false' src={p2IMap(`${turn}Knight`)} alt={`${turn}Knight`} />
          的回合
        </div>
        <div>
          半回合计数: {halfMove}
        </div>
        <div>
          全回合计数: {fullMove}
        </div>

      </div>

      <Menu />

      {load.show && <Load /> }
      {save.show && <Save fen={notation.FEN[notation.curIdx]} /> }

    </div>
  )
}

export default Chess;