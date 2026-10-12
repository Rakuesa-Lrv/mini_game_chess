// import { useForm } from 'react-hook-form';

import classes from './Menu.module.css';

import saveIcon from '@/assets/chessPiece/save.svg';
import loadIcon from '@/assets/chessPiece/load.svg';
import configIcon from '@/assets/chessPiece/config.svg';

import useGameStore from '../hooks/stores/useGameStore';
import { useStoreField } from '../hooks/useStoreField';
import useDspStore from '../hooks/stores/useDspStore';


const Menu = ()=> {

  const { dispatch } = useStoreField(useGameStore, [
    'dispatch'
  ])

  const { changeDisplay } = useStoreField(useDspStore, [
    'changeDisplay'
  ])
  
  return (
    <div 
      className={classes.menu}
    >
      <div
        className={classes.load}
        onClick={()=> {
          // dispatch({type: 'LOAD', FEN: 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'})
          changeDisplay({ type: 'MODAL', name: 'load' })

        }}
      >
        <img draggable='false' src={loadIcon} alt='load' />
        <span>加载棋局</span>
      </div>

      <div
        className={classes.export}
        onClick={()=> {
          changeDisplay({ type: 'MODAL', name: 'save' })
          dispatch({ type: 'SAVE' });
        }}
      >
        <img draggable='false' src={saveIcon} alt='save' />
        <span>保存棋局</span>
      </div>

      <div
        className={classes.config}
        onClick={()=> {
          changeDisplay({ type: 'MODAL', name: 'config' })
        }}
      >
        <img draggable='false' src={configIcon} alt='config' />
        <span>设置</span>
      </div>
    </div>
  )
}

export default Menu;