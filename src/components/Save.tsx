import classes from './Save.module.css';

import BackDrop from './BackDrop';

import pasteIcon from '@/assets/paste.svg'

import { useStoreField } from '@/hooks/useStoreField';
import useGameStore from '@/hooks/stores/useGameStore';
import useDspStore from '@/hooks/stores/useDspStore';

import { writeText } from '@tauri-apps/plugin-clipboard-manager';

async function handleCopy(text: string) {
  try {
    await writeText(text);
  }catch(err) {
    console.log(err);
  }
}

const Save = ({fen}: {fen:string})=> {
  const { dispatch } = useStoreField(useGameStore, [
    'dispatch'
  ]);

  const { changeDisplay } = useStoreField(useDspStore, [
    'changeDisplay'
  ]);

  return (
    <BackDrop
      onClose={()=> {
        changeDisplay({ type: 'CLOSE', name: 'save' });
      }}
    >
      <div
        className={classes.save}
      >
        <p>FEN记谱法:</p>
        <input type='text' disabled value={fen} />
        <img 
          title='点击复制到粘贴板'
          draggable='false' 
          src={pasteIcon} 
          alt='config' 
          onClick={()=> {
            handleCopy(fen);
          }}
        />
      </div>
    </BackDrop>
  )
}

export default Save;