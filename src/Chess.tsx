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
  const { pieceList, curTar, selected, turn, halfMove, fullMove, notation, dispatch } = useStoreField(useGameStore, [
    'pieceList', 'curTar', 'selected', 'turn', 'halfMove', 'fullMove', 'notation','dispatch'
  ]);
  const { config, load, save, promotion, changeDisplay } = useStoreField(useDspStore, [
    'config', 'load', 'save', 'promotion', 'changeDisplay'
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
                (<div
                  id={key}
                  key={key}
                  className={classes.piece}
                  data-selected={isSelected}
                  style={getPos(item.coordinate)}
                  data-hidden={!item.isAlive}
                  data-selectable={item.isAlive && !promotion.show && (turn===item.camp || isCapture )}

                  onMouseDown={()=> {
                    item.isAlive && !promotion.show && (()=> {
                      if(isCapture) {
                        dispatch({ type: 'CAPTURE', to: item.coordinate, selected: key, isPromotion: isPtm });
                        isPtm && changeDisplay({ type: 'MODAL', name: 'promotion', coor: item.coordinate });
                        return;
                      }
                      if(turn!==item.camp) return;
                      if(isSelected) {
                        dispatch({ type: 'DESELECTED', selected: key });
                      }else {
                        dispatch({ type: 'SELECTED', selected: key });

                      }
                    })();

                  }}
                >
                  <img draggable='false' src={p2IMap(name)} alt={name} />
                </div>)
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
                        dispatch({ type: 'MOVE', to: item.coordinate, isPromotion: item.isPromotion });
                        item.isPromotion && changeDisplay({ type: 'MODAL', name: 'promotion', coor: item.coordinate, from: 'MOVE' });

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

          {promotion.show &&
          (<div
            className={classes.promotion}
            data-camp={turn}
            style={{
              left: promotion.coor && getPos(promotion.coor).left
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
                      dispatch({ type: 'PROMOTE', promoteTo: p, from: promotion.from! })
                      changeDisplay({ type: 'CLOSE', name: 'promotion' });
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
      {save.show && <Save fen={notation.FEN} /> }

    </div>
  )
}

export default Chess;