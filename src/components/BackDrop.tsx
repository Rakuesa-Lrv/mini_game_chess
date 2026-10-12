import { createPortal } from 'react-dom';

import classes from './BackDrop.module.css';

const backdrop = document.querySelector('#backdrop')!;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  onClose: ()=>void;
}

const BackDrop = ({ children, onClose }: Props)=> {
  return (createPortal(
    (<div
      className={classes.backdrop}
      onMouseDown={(e)=> {
        (e.currentTarget === e.target) && (()=> {
          onClose();
        })();
      }}
    >
      {children}
    </div>),
    backdrop
  ))
}

export default BackDrop;